const db = require("../database");
const bankAccountRepository = require("../repositories/bankAccount.repository");

class BankAccountService {
  /**
   * Mask account number before sending response
   * Example: 123456789012 -> XXXXXXXX9012
   */
  maskAccountNumber(accountNumber) {
    if (!accountNumber) return null;
    const account = accountNumber.toString();
    if (account.length <= 4) {
      return account;
    }
    return `${"X".repeat(account.length - 4)}${account.slice(-4)}`;
  }

  async createBankAccount(userId, data) {
    const client = await db.getClient();

    try {
      await client.query("BEGIN");

      // Fill UPI Payout System Fallbacks if bank details are omitted
      const upiId = data.upiId || data.upi_id || null;
      const bankName = data.bankName || (upiId ? 'UPI / PhonePe / GPay Payout' : 'Bank');
      const accountNumber = data.accountNumber || upiId || 'UPI_PAYOUT';
      const ifscCode = data.ifscCode || data.ifsc_code || 'UPI0000000';

      // Check duplicate account number / upiId
      const existingAccounts = await bankAccountRepository.findByUserId(userId);
      const duplicate = existingAccounts.find(
        (account) =>
          (account.account_number === accountNumber && accountNumber !== 'UPI_PAYOUT') ||
          (upiId && account.upi_id === upiId)
      );

      if (duplicate) {
        throw new Error("Payout account or UPI ID already registered.");
      }

      // First account becomes default automatically
      let isDefault = false;

      if (existingAccounts.length === 0) {
        isDefault = true;
      } else if (data.isDefault) {
        isDefault = true;

        await client.query(
          `
          UPDATE affiliate_bank_accounts
          SET
            is_default = FALSE,
            updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $1
            AND deleted_at IS NULL
          `,
          [userId]
        );
      }

      const documentUrl = data.documentUrl || data.document_url || null;

      // Create account (Auto-Verified for instant withdrawal)
      const bankAccount = await client.query(
        `
        INSERT INTO affiliate_bank_accounts (
          user_id,
          account_holder_name,
          bank_name,
          account_number,
          ifsc_code,
          branch_name,
          upi_id,
          account_type,
          document_url,
          verification_status,
          is_default
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,'VERIFIED',$10
        )
        RETURNING *;
        `,
        [
          userId,
          data.accountHolderName,
          bankName,
          accountNumber,
          ifscCode,
          data.branchName || null,
          upiId,
          data.accountType || 'SAVINGS',
          documentUrl,
          isDefault,
        ]
      );

      await client.query("COMMIT");

      return {
        ...bankAccount.rows[0],
        account_number: this.maskAccountNumber(
          bankAccount.rows[0].account_number
        ),
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getMyAccounts(userId) {
    const accounts = await bankAccountRepository.findByUserId(userId);

    return accounts.map((account) => ({
      ...account,
      account_number: this.maskAccountNumber(account.account_number),
    }));
  }

  async getAccountById(userId, accountId) {
    const account = await bankAccountRepository.findById(accountId);

    if (!account) {
      throw new Error("Bank account not found.");
    }

    if (account.user_id !== userId) {
      throw new Error("You are not authorized to access this bank account.");
    }

    return {
      ...account,
      account_number: this.maskAccountNumber(account.account_number),
    };
  }

  async updateBankAccount(userId, accountId, data) {
    const account = await bankAccountRepository.findById(accountId);

    if (!account) {
      throw new Error("Bank account not found.");
    }

    if (account.user_id !== userId) {
      throw new Error("You are not authorized to update this bank account.");
    }

    const accounts = await bankAccountRepository.findByUserId(userId);

    const duplicate = accounts.find(
      (item) =>
        item.id !== accountId &&
        item.account_number === data.accountNumber
    );

    if (duplicate) {
      throw new Error("Bank account already exists.");
    }

    const updatedAccount = await bankAccountRepository.update(
      accountId,
      data
    );

    return {
      ...updatedAccount,
      account_number: this.maskAccountNumber(
        updatedAccount.account_number
      ),
    };
  }

  async setDefaultAccount(userId, accountId) {
    const client = await db.getClient();

    try {
      await client.query("BEGIN");

      const account = await bankAccountRepository.findById(accountId);

      if (!account) {
        throw new Error("Bank account not found.");
      }

      if (account.user_id !== userId) {
        throw new Error("You are not authorized to update this bank account.");
      }

      await bankAccountRepository.clearDefault(userId, client);

      const defaultAccount = await bankAccountRepository.setDefault(
        userId,
        accountId,
        client
      );

      await client.query("COMMIT");

      return {
        success: true,
        message: "Default bank account updated successfully.",
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteBankAccount(userId, accountId) {
    const account = await bankAccountRepository.findById(accountId);

    if (!account) {
      throw new Error("Bank account not found.");
    }

    if (account.user_id !== userId) {
      throw new Error("You are not authorized to delete this bank account.");
    }

    if (account.is_default) {
      throw new Error(
        "Default bank account cannot be deleted. Please set another account as default first."
      );
    }

    const hasPendingWithdrawals = await bankAccountRepository.hasPendingWithdrawal(accountId);

    if (hasPendingWithdrawals) {
      throw new Error(
        "Cannot delete bank account while a withdrawal request is pending."
      );
    }

    await bankAccountRepository.softDelete(accountId);

    return {
      success: true,
      message: "Bank account deleted successfully.",
    };
  }

  async verifyAccount(accountId, adminId) {
    const account = await bankAccountRepository.findById(accountId);

    if (!account) {
      throw new Error("Bank account not found.");
    }

    const verifiedAccount = await bankAccountRepository.verify(
      accountId,
      adminId
    );

    return {
      ...verifiedAccount,
      account_number: this.maskAccountNumber(
        verifiedAccount.account_number
      ),
    };
  }

  async rejectAccount(accountId, adminId) {
    const account = await bankAccountRepository.findById(accountId);

    if (!account) {
      throw new Error("Bank account not found.");
    }

    const rejectedAccount = await bankAccountRepository.reject(
      accountId,
      adminId
    );

    return {
      ...rejectedAccount,
      account_number: this.maskAccountNumber(
        rejectedAccount.account_number
      ),
    };
  }
}

module.exports = new BankAccountService();
