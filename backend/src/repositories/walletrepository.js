const db = require('../database');

class WalletRepository {
  async findByUserId(userId, client = db) {
    const query = `
      SELECT *
      FROM wallets
      WHERE user_id = $1
        AND deleted_at IS NULL
      LIMIT 1;
    `;
    const { rows } = await client.query(query, [userId]);
    return rows[0] || null;
  }

  async create(userId, client = db) {
    const query = `
      INSERT INTO wallets (user_id, available_balance, pending_balance, lifetime_earnings, total_withdrawn, currency)
      VALUES ($1, 0, 0, 0, 0, 'INR')
      RETURNING *;
    `;
    const { rows } = await client.query(query, [userId]);
    return rows[0];
  }

  async findOrCreateByUserId(userId, client = db) {
    let wallet = await this.findByUserId(userId, client);
    if (!wallet) {
      wallet = await this.create(userId, client);
    }
    return wallet;
  }

  async findById(walletId, client = db) {
    const query = `
      SELECT *
      FROM wallets
      WHERE id = $1
        AND deleted_at IS NULL
      LIMIT 1;
    `;
    const { rows } = await client.query(query, [walletId]);
    return rows[0] || null;
  }

  async lockWallet(walletId, client = db) {
    const query = `
      SELECT *
      FROM wallets
      WHERE id = $1
        AND deleted_at IS NULL
      FOR UPDATE;
    `;
    const { rows } = await client.query(query, [walletId]);
    return rows[0] || null;
  }

  async getWalletSummary(walletId, client = db) {
    const query = `
      SELECT
        available_balance,
        pending_balance,
        lifetime_earnings,
        total_withdrawn,
        'INR' AS currency,
        status,
        created_at,
        updated_at
      FROM wallets
      WHERE id = $1
        AND deleted_at IS NULL
      LIMIT 1;
    `;
    const { rows } = await client.query(query, [walletId]);
    return rows[0] || null;
  }

  async createTransaction(data, client = db) {
    const query = `
      INSERT INTO wallet_transactions (
        wallet_id,
        user_id,
        type,
        reference_type,
        reference_id,
        amount,
        opening_balance,
        closing_balance,
        description,
        status,
        created_by
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
      )
      RETURNING *;
    `;
    const values = [
      data.walletId,
      data.userId,
      data.type,
      data.referenceType,
      data.referenceId,
      data.amount,
      data.openingBalance,
      data.closingBalance,
      data.description,
      data.status || 'SUCCESS',
      data.createdBy || null
    ];
    const { rows } = await client.query(query, values);
    return rows[0];
  }

  async findTransactionById(transactionId, client = db) {
    const query = `
      SELECT *
      FROM wallet_transactions
      WHERE id = $1
      LIMIT 1;
    `;
    const { rows } = await client.query(query, [transactionId]);
    return rows[0] || null;
  }

  async getTransactions(walletId, limit = 20, offset = 0, client = db) {
    const query = `
      SELECT *
      FROM wallet_transactions
      WHERE wallet_id = $1
      ORDER BY created_at DESC
      LIMIT $2
      OFFSET $3;
    `;
    const { rows } = await client.query(query, [walletId, limit, offset]);
    return rows;
  }

  async countTransactions(walletId, client = db) {
    const query = `
      SELECT COUNT(*)::INT AS total
      FROM wallet_transactions
      WHERE wallet_id = $1;
    `;
    const { rows } = await client.query(query, [walletId]);
    return rows[0]?.total || 0;
  }

  async getTransactionsByType(walletId, type, limit = 20, offset = 0, client = db) {
    const query = `
      SELECT *
      FROM wallet_transactions
      WHERE wallet_id = $1
        AND type = $2
      ORDER BY created_at DESC
      LIMIT $3
      OFFSET $4;
    `;
    const { rows } = await client.query(query, [walletId, type, limit, offset]);
    return rows;
  }

  async findByReference(referenceType, referenceId, client = db) {
    const query = `
      SELECT *
      FROM wallet_transactions
      WHERE reference_type = $1
        AND reference_id = $2
      LIMIT 1;
    `;
    const { rows } = await client.query(query, [referenceType, referenceId]);
    return rows[0] || null;
  }

  async getTransactionsByDateRange(walletId, startDate, endDate, client = db) {
    const query = `
      SELECT *
      FROM wallet_transactions
      WHERE wallet_id = $1
        AND created_at BETWEEN $2 AND $3
      ORDER BY created_at DESC;
    `;
    const { rows } = await client.query(query, [walletId, startDate, endDate]);
    return rows;
  }

  async getLatestTransaction(walletId, client = db) {
    const query = `
      SELECT *
      FROM wallet_transactions
      WHERE wallet_id = $1
      ORDER BY created_at DESC
      LIMIT 1;
    `;
    const { rows } = await client.query(query, [walletId]);
    return rows[0] || null;
  }

  async getTransactionStats(walletId, client = db) {
    const query = `
      SELECT
        COUNT(*)::INT AS total_transactions,
        COALESCE(SUM(amount), 0) AS total_amount
      FROM wallet_transactions
      WHERE wallet_id = $1;
    `;
    const { rows } = await client.query(query, [walletId]);
    return rows[0] || { total_transactions: 0, total_amount: 0 };
  }

  async credit(walletId, amount, client = db) {
    const query = `
      UPDATE wallets
      SET
        available_balance = available_balance + $2,
        lifetime_earnings = lifetime_earnings + $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND deleted_at IS NULL
      RETURNING *;
    `;
    const { rows } = await client.query(query, [walletId, amount]);
    return rows[0];
  }

  async debit(walletId, amount, client = db) {
    const query = `
      UPDATE wallets
      SET
        available_balance = available_balance - $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND deleted_at IS NULL
      RETURNING *;
    `;
    const { rows } = await client.query(query, [walletId, amount]);
    return rows[0];
  }

  async freezeBalance(walletId, amount, client = db) {
    const query = `
      UPDATE wallets
      SET
        available_balance = available_balance - $2,
        pending_balance = pending_balance + $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND available_balance >= $2
        AND deleted_at IS NULL
      RETURNING *;
    `;
    const { rows } = await client.query(query, [walletId, amount]);
    return rows[0];
  }

  async releaseBalance(walletId, amount, client = db) {
    const query = `
      UPDATE wallets
      SET
        pending_balance = pending_balance - $2,
        available_balance = available_balance + $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND pending_balance >= $2
        AND deleted_at IS NULL
      RETURNING *;
    `;
    const { rows } = await client.query(query, [walletId, amount]);
    return rows[0];
  }

  async completeWithdrawal(walletId, amount, client = db) {
    const query = `
      UPDATE wallets
      SET
        pending_balance = pending_balance - $2,
        total_withdrawn = total_withdrawn + $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND pending_balance >= $2
        AND deleted_at IS NULL
      RETURNING *;
    `;
    const { rows } = await client.query(query, [walletId, amount]);
    return rows[0];
  }
}

module.exports = new WalletRepository();
