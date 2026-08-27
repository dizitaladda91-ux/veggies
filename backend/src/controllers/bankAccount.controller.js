const bankAccountService = require("../services/bankAccount.service");
const bankAccountRepository = require('../repositories/bankAccount.repository');
const logRepository = require('../repositories/logRepository');
const notificationRepository = require('../repositories/notification.repository');

class BankAccountController {
  async getAllAccounts(req, res, next) {
    try {
      const accounts = await bankAccountRepository.findAll({ status: req.query.status, limit: Number(req.query.limit || 50) });
      return res.status(200).json({ success: true, data: accounts });
    } catch (error) {
      next(error);
    }
  }

  async createBankAccount(req, res, next) {
    try {
      const userId = req.user.id;
      const bankAccount = await bankAccountService.createBankAccount(
        userId,
        req.body
      );

      try {
        notificationRepository.createForAdmins({
          title: 'Bank Account Verification Request 🏦',
          message: `A new bank account (${bankAccount.bank_name || 'Bank'}) has been submitted for verification.`,
          type: 'bank_verification',
        }).catch(() => {});

        notificationRepository.create({
          userId,
          title: 'Bank Details Submitted 🏦',
          message: 'Your bank account details have been submitted and are pending verification.',
          type: 'bank_verification',
        }).catch(() => {});
      } catch (err) {}

      return res.status(201).json({
        success: true,
        message: "Bank account added successfully.",
        data: bankAccount,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyAccounts(req, res, next) {
    try {
      const userId = req.user.id;
      const accounts = await bankAccountService.getMyAccounts(userId);

      return res.status(200).json({
        success: true,
        message: "Bank accounts fetched successfully.",
        data: accounts,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAccountById(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const account = await bankAccountService.getAccountById(
        userId,
        id
      );

      return res.status(200).json({
        success: true,
        message: "Bank account fetched successfully.",
        data: account,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateBankAccount(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const updatedAccount = await bankAccountService.updateBankAccount(
        userId,
        id,
        req.body
      );

      return res.status(200).json({
        success: true,
        message: "Bank account updated successfully.",
        data: updatedAccount,
      });
    } catch (error) {
      next(error);
    }
  }

  async setDefaultAccount(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const result = await bankAccountService.setDefaultAccount(
        userId,
        id
      );

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteBankAccount(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const result = await bankAccountService.deleteBankAccount(
        userId,
        id
      );

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyAccount(req, res, next) {
    try {
      const adminId = req.user.id;
      const { id } = req.params;

      const verifiedAccount = await bankAccountService.verifyAccount(
        id,
        adminId
      );
      await logRepository.createAuditLog({ actorId: adminId, targetUserId: verifiedAccount.user_id, action: 'BANK_ACCOUNT_VERIFIED', changesJson: { bankAccountId: id }, ipAddress: req.ip });

      try {
        notificationRepository.create({
          userId: verifiedAccount.user_id,
          title: 'Bank Account Verified ✅',
          message: `Your bank account (${verifiedAccount.bank_name || 'Bank'}) has been verified successfully.`,
          type: 'bank_verification',
        }).catch(() => {});
      } catch (err) {}

      return res.status(200).json({
        success: true,
        message: "Bank account verified successfully.",
        data: verifiedAccount,
      });
    } catch (error) {
      next(error);
    }
  }

  async rejectAccount(req, res, next) {
    try {
      const adminId = req.user.id;
      const { id } = req.params;

      const rejectedAccount = await bankAccountService.rejectAccount(
        id,
        adminId
      );
      await logRepository.createAuditLog({ actorId: adminId, targetUserId: rejectedAccount.user_id, action: 'BANK_ACCOUNT_REJECTED', changesJson: { bankAccountId: id }, ipAddress: req.ip });

      try {
        notificationRepository.create({
          userId: rejectedAccount.user_id,
          title: 'Bank Account Rejected ❌',
          message: `Your bank account (${rejectedAccount.bank_name || 'Bank'}) verification was rejected. Please re-check details.`,
          type: 'bank_verification',
        }).catch(() => {});
      } catch (err) {}

      return res.status(200).json({
        success: true,
        message: "Bank account rejected successfully.",
        data: rejectedAccount,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BankAccountController();
