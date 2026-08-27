const db = require("../database");

const maskAccountNumber = (accountNumber) => {
  if (!accountNumber) return null;
  const account = accountNumber.toString();
  if (account.length <= 4) return account;
  return `${"X".repeat(account.length - 4)}${account.slice(-4)}`;
};

class BankAccountRepository {
  async create({
    userId,
    accountHolderName,
    bankName,
    accountNumber,
    ifscCode,
    branchName,
    upiId,
    accountType,
    documentUrl = null,
    isDefault = false,
  }) {
    const query = `
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
        is_default
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
      )
      RETURNING *;
    `;

    const values = [
      userId,
      accountHolderName,
      bankName,
      accountNumber,
      ifscCode,
      branchName,
      upiId,
      accountType,
      documentUrl,
      isDefault,
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  async findByUserId(userId) {
    const result = await db.query(
      `
      SELECT *
      FROM affiliate_bank_accounts
      WHERE user_id = $1
        AND deleted_at IS NULL
      ORDER BY
        is_default DESC,
        created_at DESC
      `,
      [userId]
    );

    return result.rows;
  }

  async findById(id) {
    const result = await db.query(
      `
      SELECT *
      FROM affiliate_bank_accounts
      WHERE id = $1
        AND deleted_at IS NULL
      LIMIT 1
      `,
      [id]
    );

    return result.rows[0] || null;
  }

  async findAll({ status = null, limit = 100, offset = 0 } = {}) {
    const values = [];
    let query = `
      SELECT ba.*, u.email, p.first_name, p.last_name, p.company
      FROM affiliate_bank_accounts ba 
      JOIN users u ON u.id = ba.user_id 
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE ba.deleted_at IS NULL
    `;
    if (status && status !== 'ALL') {
      values.push(status);
      query += ` AND ba.verification_status = $${values.length}`;
    }
    values.push(limit, offset);
    query += ` ORDER BY ba.created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`;
    const result = await db.query(query, values);
    return result.rows;
  }

  async exists(id) {
    const result = await db.query(
      `
      SELECT EXISTS (
        SELECT 1
        FROM affiliate_bank_accounts
        WHERE id = $1
          AND deleted_at IS NULL
      ) AS exists;
      `,
      [id]
    );

    return result.rows[0].exists;
  }

  async getDefault(userId) {
    const result = await db.query(
      `
      SELECT *
      FROM affiliate_bank_accounts
      WHERE user_id = $1
        AND is_default = TRUE
        AND deleted_at IS NULL
      LIMIT 1
      `,
      [userId]
    );

    return result.rows[0] || null;
  }

  async update(
    id,
    {
      accountHolderName,
      bankName,
      accountNumber,
      ifscCode,
      branchName,
      upiId,
      accountType,
      documentUrl,
    }
  ) {
    const result = await db.query(
      `
      UPDATE affiliate_bank_accounts
      SET
        account_holder_name = $1,
        bank_name = $2,
        account_number = $3,
        ifsc_code = $4,
        branch_name = $5,
        upi_id = $6,
        account_type = $7,
        document_url = COALESCE($8, document_url),
        verification_status = 'PENDING',
        verified_by = NULL,
        verified_at = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
        AND deleted_at IS NULL
      RETURNING *;
      `,
      [
        accountHolderName,
        bankName,
        accountNumber,
        ifscCode,
        branchName,
        upiId,
        accountType,
        documentUrl || null,
        id,
      ]
    );

    return result.rows[0] || null;
  }

  async clearDefault(userId, client = db) {
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

  async setDefault(userId, accountId, client = db) {
    const result = await client.query(
      `
      UPDATE affiliate_bank_accounts
      SET
        is_default = TRUE,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND user_id = $2
        AND deleted_at IS NULL
      RETURNING *;
      `,
      [accountId, userId]
    );

    return result.rows[0];
  }

  async softDelete(id) {
    const result = await db.query(
      `
      UPDATE affiliate_bank_accounts
      SET
        deleted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND deleted_at IS NULL
      RETURNING *;
      `,
      [id]
    );

    return result.rows[0] || null;
  }

  async verify(id, adminId) {
    const result = await db.query(
      `
      UPDATE affiliate_bank_accounts
      SET
        verification_status = 'VERIFIED',
        verified_by = $1,
        verified_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
        AND deleted_at IS NULL
      RETURNING *;
      `,
      [adminId, id]
    );

    return result.rows[0] || null;
  }

  async reject(id, adminId) {
    const result = await db.query(
      `
      UPDATE affiliate_bank_accounts
      SET
        verification_status = 'REJECTED',
        verified_by = $1,
        verified_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
        AND deleted_at IS NULL
      RETURNING *;
      `,
      [adminId, id]
    );

    return result.rows[0] || null;
  }

  async hasPendingWithdrawal(bankAccountId) {
    const result = await db.query(
      `
      SELECT EXISTS (
        SELECT 1
        FROM withdraw_requests
        WHERE bank_account_id = $1
          AND status IN ('PENDING', 'PROCESSING')
          AND deleted_at IS NULL
      ) AS exists;
      `,
      [bankAccountId]
    );

    return result.rows[0].exists;
  }
}

module.exports = new BankAccountRepository();
