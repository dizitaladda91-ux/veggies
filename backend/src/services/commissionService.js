const commissionRepository = require('../repositories/commissionRepository');
const ApiError = require('../utils/apiError');
const db = require('../database');
const logger = require('../utils/logger');
const walletRepository = require('../repositories/walletrepository');

class CommissionService {
  async getRules() {
    return commissionRepository.findAllRules();
  }

  async createRule({ name, type, value, eventType, minimumAmount, maximumAmount, createdBy }) {
    if (maximumAmount !== null && maximumAmount !== undefined && Number(maximumAmount) < Number(minimumAmount || 0)) {
      throw ApiError.badRequest('Maximum amount must be greater than minimum amount');
    }
    return commissionRepository.createRule({ name, type, value, eventType, minimumAmount, maximumAmount, createdBy });
  }

  async updateCommissionStatus(commissionId, status) {
    const validStatuses = ['pending', 'approved', 'rejected', 'paid'];
    if (!validStatuses.includes(status)) {
      throw ApiError.badRequest(`Status must be one of: ${validStatuses.join(', ')}`);
    }

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Lock existing commission
      const commRes = await client.query(
        `SELECT * FROM commissions WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`,
        [commissionId]
      );
      const comm = commRes.rows[0];
      if (!comm) {
        throw ApiError.notFound('Commission record not found');
      }

      const previousStatus = comm.status;

      // Update commission status
      const updated = await commissionRepository.updateCommissionStatus(commissionId, status, client);

      // If transitioning to 'approved' or 'paid' from 'pending' or 'rejected', credit affiliate wallet
      if ((status === 'approved' || status === 'paid') && (previousStatus === 'pending' || previousStatus === 'rejected')) {
        const wallet = await walletRepository.findOrCreateByUserId(comm.affiliate_id, client);
        const lockedWallet = await walletRepository.lockWallet(wallet.id, client);
        const openingBalance = Number(lockedWallet.available_balance || 0);

        const walletUpdate = await client.query(
          `UPDATE wallets 
           SET available_balance = available_balance + $1,
               lifetime_earnings = lifetime_earnings + $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2
           RETURNING available_balance`,
          [comm.amount, lockedWallet.id]
        );

        await client.query(
          `INSERT INTO wallet_transactions (wallet_id, user_id, type, reference_type, reference_id, amount, opening_balance, closing_balance, description, status)
           VALUES ($1, $2, 'COMMISSION_SETTLEMENT', 'COMMISSION', $3, $4, $5, $6, $7, 'SUCCESS')`,
          [
            lockedWallet.id,
            comm.affiliate_id,
            comm.id,
            comm.amount,
            openingBalance,
            Number(walletUpdate.rows[0].available_balance),
            `Commission ${status.toUpperCase()} by Admin`
          ]
        );
      }

      await client.query('COMMIT');
      return updated;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Automatically transition pending commissions created past 7 days
   * to approved status and credit the affiliate's available wallet balance.
   */
  async autoSettleMaturedCommissions(holdDays = 7) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      const matured = await commissionRepository.findMaturedPendingCommissions(holdDays);
      let settledCount = 0;
      let totalSettledAmount = 0;

      for (const comm of matured) {
        // Covers old affiliates created before wallets were introduced.
        const wallet = comm.wallet_id
          ? await walletRepository.lockWallet(comm.wallet_id, client)
          : await walletRepository.findOrCreateByUserId(comm.affiliate_id, client);
        const openingBalance = Number(wallet.available_balance || 0);

        // 1. Mark commission as approved
        await client.query(
          `UPDATE commissions SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [comm.id]
        );

        // 2. Add to available balance in wallet
        const walletUpdate = await client.query(
          `UPDATE wallets 
           SET available_balance = available_balance + $1,
               lifetime_earnings = lifetime_earnings + $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2
           RETURNING available_balance`,
          [comm.amount, wallet.id]
        );

        // 3. Record wallet transaction log
        await client.query(
          `INSERT INTO wallet_transactions (wallet_id, user_id, type, reference_type, reference_id, amount, opening_balance, closing_balance, description, status)
           VALUES ($1, $2, 'COMMISSION_SETTLEMENT', 'COMMISSION', $3, $4, $5, $6, 'Automated Commission Settlement after 7-Day Hold Window', 'SUCCESS')`,
          [wallet.id, comm.affiliate_id, comm.id, comm.amount, openingBalance, Number(walletUpdate.rows[0].available_balance)]
        );

        settledCount++;
        totalSettledAmount += Number(comm.amount);
      }

      await client.query('COMMIT');
      if (settledCount > 0) {
        logger.info(`Auto-settlement completed: ${settledCount} commissions auto-approved after 7 days (₹${totalSettledAmount.toFixed(2)})`);
      }
      return { settledCount, totalSettledAmount };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Auto-settlement failed', { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new CommissionService();
