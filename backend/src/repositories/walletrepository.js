const db = require("../database");

class WalletRepository {
    /**
     * Create wallet for a user
     */
    async create(userId, client = db) {
        const query = `
            INSERT INTO wallets (
                user_id
            )
            VALUES (
                $1
            )
            RETURNING *;
        `;

        const { rows } = await client.query(query, [userId]);

        return rows[0];
    }

    /**
     * Return a user's wallet, creating it when older accounts do not yet have
     * one. The unique user_id constraint makes this safe for concurrent calls.
     */
    async findOrCreateByUserId(userId, client = db) {
        const query = `
            INSERT INTO wallets (user_id)
            VALUES ($1)
            ON CONFLICT (user_id)
            DO UPDATE SET
                deleted_at = NULL,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *;
        `;

        const { rows } = await client.query(query, [userId]);
        return rows[0];
    }

    /**
     * Find wallet by wallet ID
     */
    async findById(walletId, client = db) {
        const query = `
            SELECT *
            FROM wallets
            WHERE id = $1
              AND deleted_at IS NULL
            LIMIT 1;
        `;

        const { rows } = await client.query(query, [walletId]);

        return rows[0];
    }

    /**
     * Find wallet by user ID
     */
    async findByUserId(userId, client = db) {
        const query = `
            SELECT *
            FROM wallets
            WHERE user_id = $1
              AND deleted_at IS NULL
            LIMIT 1;
        `;

        const { rows } = await client.query(query, [userId]);

        return rows[0];
    }

    /**
     * Lock wallet row
     * Used inside SQL transactions
     */
    async lockWallet(walletId, client = db) {
        const query = `
            SELECT *
            FROM wallets
            WHERE id = $1
              AND deleted_at IS NULL
            FOR UPDATE;
        `;

        const { rows } = await client.query(query, [walletId]);

        return rows[0];
    }

    /**
     * Check whether wallet exists
     */
    async exists(userId, client = db) {
        const query = `
            SELECT EXISTS (
                SELECT 1
                FROM wallets
                WHERE user_id = $1
                  AND deleted_at IS NULL
            ) AS exists;
        `;

        const { rows } = await client.query(query, [userId]);

        return rows[0].exists;
    }

        /**
     * Update wallet balances
     */
    async updateBalances(walletId, data, client = db) {
        const query = `
            UPDATE wallets
            SET
                available_balance = $2,
                pending_balance = $3,
                lifetime_earnings = $4,
                total_withdrawn = $5,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
              AND deleted_at IS NULL
            RETURNING *;
        `;

        const values = [
            walletId,
            data.availableBalance,
            data.pendingBalance,
            data.lifetimeEarnings,
            data.totalWithdrawn
        ];

        const { rows } = await client.query(query, values);

        return rows[0];
    }

    /**
     * Update wallet status
     */
    async updateStatus(walletId, status, client = db) {
        const query = `
            UPDATE wallets
            SET
                status = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
              AND deleted_at IS NULL
            RETURNING *;
        `;

        const { rows } = await client.query(query, [
            walletId,
            status
        ]);

        return rows[0];
    }

    /**
     * Increase total withdrawn amount
     */
    async increaseWithdrawn(walletId, amount, client = db) {
        const query = `
            UPDATE wallets
            SET
                total_withdrawn = total_withdrawn + $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
              AND deleted_at IS NULL
            RETURNING *;
        `;

        const { rows } = await client.query(query, [
            walletId,
            amount
        ]);

        return rows[0];
    }

    /**
     * Soft delete wallet
     */
    async softDelete(walletId, client = db) {
        const query = `
            UPDATE wallets
            SET
                deleted_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
              AND deleted_at IS NULL
            RETURNING *;
        `;

        const { rows } = await client.query(query, [walletId]);

        return rows[0];
    }

    /**
     * Restore deleted wallet
     */
    async restore(walletId, client = db) {
        const query = `
            UPDATE wallets
            SET
                deleted_at = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *;
        `;

        const { rows } = await client.query(query, [walletId]);

        return rows[0];
    }

        /**
     * Create wallet transaction
     */
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
            data.status || "SUCCESS",
            data.createdBy || null
        ];

        const { rows } = await client.query(query, values);

        return rows[0];
    }

    /**
     * Find transaction by ID
     */
    async findTransactionById(transactionId, client = db) {
        const query = `
            SELECT *
            FROM wallet_transactions
            WHERE id = $1
            LIMIT 1;
        `;

        const { rows } = await client.query(query, [transactionId]);

        return rows[0];
    }

    /**
     * Get wallet transactions
     */
    async getTransactions(
        walletId,
        limit = 20,
        offset = 0,
        client = db
    ) {
        const query = `
            SELECT *
            FROM wallet_transactions
            WHERE wallet_id = $1
            ORDER BY created_at DESC
            LIMIT $2
            OFFSET $3;
        `;

        const { rows } = await client.query(query, [
            walletId,
            limit,
            offset
        ]);

        return rows;
    }

    /**
     * Count wallet transactions
     */
    async countTransactions(walletId, client = db) {
        const query = `
            SELECT COUNT(*)::INT AS total
            FROM wallet_transactions
            WHERE wallet_id = $1;
        `;

        const { rows } = await client.query(query, [walletId]);

        return rows[0].total;
    }

    /**
     * Get transactions by type
     */
    async getTransactionsByType(
        walletId,
        type,
        limit = 20,
        offset = 0,
        client = db
    ) {
        const query = `
            SELECT *
            FROM wallet_transactions
            WHERE wallet_id = $1
              AND type = $2
            ORDER BY created_at DESC
            LIMIT $3
            OFFSET $4;
        `;

        const { rows } = await client.query(query, [
            walletId,
            type,
            limit,
            offset
        ]);

        return rows;
    }

    /**
     * Get transaction using reference
     */
    async findByReference(
        referenceType,
        referenceId,
        client = db
    ) {
        const query = `
            SELECT *
            FROM wallet_transactions
            WHERE reference_type = $1
              AND reference_id = $2
            LIMIT 1;
        `;

        const { rows } = await client.query(query, [
            referenceType,
            referenceId
        ]);

        return rows[0];
    }

        /**
     * Get wallet summary
     */
    async getWalletSummary(walletId, client = db) {
        const query = `
            SELECT
                available_balance,
                pending_balance,
                lifetime_earnings,
                total_withdrawn,
                currency,
                status,
                created_at,
                updated_at
            FROM wallets
            WHERE id = $1
              AND deleted_at IS NULL
            LIMIT 1;
        `;

        const { rows } = await client.query(query, [walletId]);

        return rows[0];
    }

    /**
     * Get transactions between dates
     */
    async getTransactionsByDateRange(
        walletId,
        startDate,
        endDate,
        client = db
    ) {
        const query = `
            SELECT *
            FROM wallet_transactions
            WHERE wallet_id = $1
              AND created_at BETWEEN $2 AND $3
            ORDER BY created_at DESC;
        `;

        const { rows } = await client.query(query, [
            walletId,
            startDate,
            endDate
        ]);

        return rows;
    }

    /**
     * Get latest transaction
     */
    async getLatestTransaction(walletId, client = db) {
        const query = `
            SELECT *
            FROM wallet_transactions
            WHERE wallet_id = $1
            ORDER BY created_at DESC
            LIMIT 1;
        `;

        const { rows } = await client.query(query, [walletId]);

        return rows[0];
    }

    /**
     * Get transaction statistics
     */
    async getTransactionStats(walletId, client = db) {
        const query = `
            SELECT
                COUNT(*)::INT AS total_transactions,
                COALESCE(SUM(amount),0) AS total_amount
            FROM wallet_transactions
            WHERE wallet_id = $1;
        `;

        const { rows } = await client.query(query, [walletId]);

        return rows[0];
    }

    /**
 * Credit available balance
 */
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

    const { rows } = await client.query(query, [
        walletId,
        amount
    ]);

    return rows[0];
}

/**
 * Debit available balance
 */
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

    const { rows } = await client.query(query, [
        walletId,
        amount
    ]);

    return rows[0];
}

/**
 * Move available balance to pending balance
 */
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

    const { rows } = await client.query(query, [
        walletId,
        amount
    ]);

    return rows[0];
}

/**
 * Release pending balance back to available
 */
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

    const { rows } = await client.query(query, [
        walletId,
        amount
    ]);

    return rows[0];
}

/**
 * Complete withdrawal
 */
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

    const { rows } = await client.query(query, [
        walletId,
        amount
    ]);

    return rows[0];
}

}

module.exports = new WalletRepository();
