const db = require('../database');
const ApiError = require('../utils/apiError');
const walletRepository = require('../repositories/walletrepository');
const withdrawalRepository = require('../repositories/withdrawal.repository');
const bankAccountRepository = require('../repositories/bankAccount.repository');
const userRepository = require('../repositories/userRepository');
const emailService = require('./emailService');
const logger = require('../logs/logger');

class WithdrawalRequestService {
  async request(userId, { amount, bankAccountId, notes }) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      const account = await bankAccountRepository.findById(bankAccountId);
      if (!account || account.user_id !== userId || account.verification_status !== 'VERIFIED') {
        throw ApiError.badRequest('Select one of your verified bank accounts.');
      }
      const wallet = await walletRepository.findOrCreateByUserId(userId, client);
      const lockedWallet = await walletRepository.lockWallet(wallet.id, client);
      const value = Number(amount);
      if (!Number.isFinite(value) || value <= 0 || Number(lockedWallet.available_balance) < value) {
        throw ApiError.badRequest('Insufficient available balance.');
      }
      const updatedWallet = await walletRepository.freezeBalance(lockedWallet.id, value, client);
      const withdrawalNumber = `WD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const withdrawal = await withdrawalRepository.create({
        userId, amount: value, paymentMethod: 'bank_transfer', bankAccountId,
        notes, withdrawalNumber, status: 'pending',
      }, client);
      await walletRepository.createTransaction({
        walletId: lockedWallet.id, userId, type: 'WITHDRAWAL_HOLD', referenceType: 'withdrawal',
        referenceId: withdrawal.id, amount: value, openingBalance: lockedWallet.available_balance,
        closingBalance: updatedWallet.available_balance, description: `Withdrawal request ${withdrawalNumber}`,
        status: 'SUCCESS', createdBy: userId,
      }, client);
      await client.query('COMMIT');
      // Send withdrawal request confirmation email asynchronously
      try {
        const user = await userRepository.findById(userId);
        if (user && user.email) {
          const bankAccount = await bankAccountRepository.findById(bankAccountId);
          emailService.sendWithdrawalRequestEmail(user, {
            amount: value,
            status: 'pending',
            requested_at: new Date(),
            bank_account_number: bankAccount?.account_number || 'N/A',
          }).catch(err => logger.error('Failed to send withdrawal email:', err));
        }
      } catch (emailError) {
        logger.error('Error sending withdrawal confirmation email:', emailError);
        // Don't throw - email is non-critical
      }
      return withdrawal;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  }

  async list(userId, page = 1, limit = 20) {
    const offset = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      withdrawalRepository.findByUser(userId, Number(limit), offset),
      withdrawalRepository.countByUser(userId),
    ]);
    return { items, pagination: { page: Number(page), limit: Number(limit), total: Number(total) } };
  }

  async cancel(userId, id, notes) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      const withdrawal = await withdrawalRepository.lockWithdrawal(id, client);
      if (!withdrawal || withdrawal.user_id !== userId) throw ApiError.notFound('Withdrawal request not found.');
      if (withdrawal.status !== 'pending') throw ApiError.badRequest('Only pending withdrawal requests can be cancelled.');
      const wallet = await walletRepository.findOrCreateByUserId(userId, client);
      const lockedWallet = await walletRepository.lockWallet(wallet.id, client);
      const updatedWallet = await walletRepository.releaseBalance(lockedWallet.id, Number(withdrawal.amount), client);
      const result = await withdrawalRepository.cancel(id, notes, client);
      await walletRepository.createTransaction({
        walletId: lockedWallet.id, userId, type: 'WITHDRAWAL_RELEASE', referenceType: 'withdrawal',
        referenceId: id, amount: withdrawal.amount, openingBalance: lockedWallet.available_balance,
        closingBalance: updatedWallet.available_balance, description: `Withdrawal request ${withdrawal.withdrawal_number} cancelled`,
        status: 'SUCCESS', createdBy: userId,
      }, client);
      await client.query('COMMIT');
      return result;
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }
}

module.exports = new WithdrawalRequestService();
