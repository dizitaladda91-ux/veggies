const db = require("../database");

class WithdrawalRepository {

    /**
     * Create Withdrawal Request
     */
    async create(data, client = db) {

        const query = `
            INSERT INTO withdraw_requests (
                user_id,
                amount,
                payment_method,
                payment_details,
                status,
                notes,
                withdrawal_number,
                bank_account_id
            )
            VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8
            )
            RETURNING *;
        `;

        const values = [
            data.userId,
            data.amount,
            data.paymentMethod,
            data.paymentDetails || null,
            data.status || "pending",
            data.notes || null,
            data.withdrawalNumber,
            data.bankAccountId || null
        ];

        const { rows } = await client.query(query, values);

        return rows[0];

    }

    /**
     * Find Withdrawal By ID
     */
    async findById(id, client = db) {

        const query = `
            SELECT *
            FROM withdraw_requests
            WHERE id = $1
            AND deleted_at IS NULL
            LIMIT 1;
        `;

        const { rows } = await client.query(query, [id]);

        return rows[0];

    }

    /**
     * Find By Withdrawal Number
     */
    async findByWithdrawalNumber(
        withdrawalNumber,
        client = db
    ) {

        const query = `
            SELECT *
            FROM withdraw_requests
            WHERE withdrawal_number = $1
            AND deleted_at IS NULL
            LIMIT 1;
        `;

        const { rows } = await client.query(
            query,
            [withdrawalNumber]
        );

        return rows[0];

    }

    /**
     * Lock Withdrawal Row
     */
    async lockWithdrawal(
        id,
        client
    ) {

        const query = `
            SELECT *
            FROM withdraw_requests
            WHERE id = $1
            FOR UPDATE;
        `;

        const { rows } = await client.query(
            query,
            [id]
        );

        return rows[0];

    }

        /**
     * Find User Withdrawals
     */
    async findByUser(
        userId,
        limit = 10,
        offset = 0,
        client = db
    ) {

        const query = `
            SELECT *
            FROM withdraw_requests
            WHERE user_id = $1
            AND deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT $2
            OFFSET $3;
        `;

        const values = [
            userId,
            limit,
            offset
        ];

        const { rows } = await client.query(
            query,
            values
        );

        return rows;

    }

    /**
     * Count User Withdrawals
     */
    async countByUser(
        userId,
        client = db
    ) {

        const query = `
            SELECT COUNT(*)::INTEGER AS total
            FROM withdraw_requests
            WHERE user_id = $1
            AND deleted_at IS NULL;
        `;

        const { rows } = await client.query(
            query,
            [userId]
        );

        return rows[0].total;

    }

    /**
     * Update Withdrawal Status
     */
    async updateStatus(
        id,
        status,
        notes = null,
        client = db
    ) {

        const query = `
            UPDATE withdraw_requests
            SET
                status = $2,
                notes = COALESCE($3, notes),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *;
        `;

        const values = [
            id,
            status,
            notes
        ];

        const { rows } = await client.query(
            query,
            values
        );

        return rows[0];

    }

        /**
     * Approve Withdrawal
     */
    async approve(
        id,
        approvedBy,
        notes = null,
        client = db
    ) {

        const query = `
            UPDATE withdraw_requests
            SET
                status = 'approved',
                approved_by = $2,
                approved_at = CURRENT_TIMESTAMP,
                notes = COALESCE($3, notes),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *;
        `;

        const { rows } = await client.query(
            query,
            [
                id,
                approvedBy,
                notes
            ]
        );

        return rows[0];

    }

    /**
     * Mark Processing
     */
    async processing(
        id,
        transactionReference = null,
        client = db
    ) {

        const query = `
            UPDATE withdraw_requests
            SET
                status = 'processing',
                transaction_reference = COALESCE($2, transaction_reference),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *;
        `;

        const { rows } = await client.query(
            query,
            [
                id,
                transactionReference
            ]
        );

        return rows[0];

    }

    /**
     * Mark As Paid
     */
    async markAsPaid(
        id,
        transactionReference,
        client = db
    ) {

        const query = `
            UPDATE withdraw_requests
            SET
                status = 'paid',
                paid_at = CURRENT_TIMESTAMP,
                transaction_reference = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *;
        `;

        const { rows } = await client.query(
            query,
            [
                id,
                transactionReference
            ]
        );

        return rows[0];

    }

    /**
     * Reject Withdrawal
     */
    async reject(
        id,
        notes,
        approvedBy,
        client = db
    ) {

        const query = `
            UPDATE withdraw_requests
            SET
                status = 'rejected',
                approved_by = $3,
                approved_at = CURRENT_TIMESTAMP,
                notes = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *;
        `;

        const { rows } = await client.query(
            query,
            [
                id,
                notes,
                approvedBy
            ]
        );

        return rows[0];

    }

    /**
     * Mark Failed
     */
    async failed(
        id,
        reason,
        client = db
    ) {

        const query = `
            UPDATE withdraw_requests
            SET
                status = 'failed',
                failure_reason = $2,
            WHERE user_id = $1
            AND deleted_at IS NULL;
        `;

        const { rows } = await client.query(
            query,
            [userId]
        );

        return rows[0].total;

    }

    /**
     * Update Withdrawal Status
     */
    async updateStatus(
        id,
        status,
        notes = null,
        client = db
    ) {

        const query = `
            UPDATE withdraw_requests
            SET
                status = $2,
                notes = COALESCE($3, notes),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *;
        `;

        const values = [
            id,
            status,
            notes
        ];

        const { rows } = await client.query(
            query,
            values
        );

        return rows[0];

    }

        /**
     * Approve Withdrawal
     */
    async approve(
        id,
        approvedBy,
        notes = null,
        client = db
    ) {

        const query = `
            UPDATE withdraw_requests
            SET
                status = 'approved',
                approved_by = $2,
                approved_at = CURRENT_TIMESTAMP,
                notes = COALESCE($3, notes),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *;
        `;

        const { rows } = await client.query(
            query,
            [
                id,
                approvedBy,
                notes
            ]
        );

        return rows[0];

    }

    /**
     * Mark Processing
     */
    async processing(
        id,
        transactionReference = null,
        client = db
    ) {

        const query = `
            UPDATE withdraw_requests
            SET
                status = 'processing',
                transaction_reference = COALESCE($2, transaction_reference),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *;
        `;

        const { rows } = await client.query(
            query,
            [
                id,
                transactionReference
            ]
        );

        return rows[0];

    }

    /**
     * Mark As Paid
     */
    async markAsPaid(
        id,
        transactionReference,
        client = db
    ) {

        const query = `
            UPDATE withdraw_requests
            SET
                status = 'paid',
                paid_at = CURRENT_TIMESTAMP,
                transaction_reference = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *;
        `;

        const { rows } = await client.query(
            query,
            [
                id,
                transactionReference
            ]
        );

        return rows[0];

    }

    /**
     * Reject Withdrawal
     */
    async reject(
        id,
        notes,
        approvedBy,
        client = db
    ) {

        const query = `
            UPDATE withdraw_requests
            SET
                status = 'rejected',
                approved_by = $3,
                approved_at = CURRENT_TIMESTAMP,
                notes = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *;
        `;

        const { rows } = await client.query(
            query,
            [
                id,
                notes,
                approvedBy
            ]
        );

        return rows[0];

    }

    /**
     * Mark Failed
     */
    async failed(
        id,
        reason,
        client = db
    ) {

        const query = `
            UPDATE withdraw_requests
            SET
                status = 'failed',
                failure_reason = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *;
        `;

        const { rows } = await client.query(
            query,
            [
                id,
                reason
            ]
        );
        return rows[0];
    }

    async cancel(id, notes = null, client = db) {
        const query = `
            UPDATE withdraw_requests
            SET status = 'cancelled', notes = COALESCE($2, notes), updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 RETURNING *;
        `;
        const { rows } = await client.query(query, [id, notes]);
        return rows[0];
    }

    async findAll(filters = {}, limit = 10, offset = 0, client = db) {
        let query = `
            SELECT wr.*, 
                   u.email as user_email, 
                   aba.account_number, aba.ifsc_code, aba.account_holder_name as account_name, aba.account_type, aba.upi_id, aba.bank_name
            FROM withdraw_requests wr
            LEFT JOIN users u ON wr.user_id = u.id
            LEFT JOIN affiliate_bank_accounts aba ON wr.bank_account_id = aba.id
            WHERE wr.deleted_at IS NULL
        `;

        const values = [];
        let index = 1;

        if (filters.status) {
            query += ` AND wr.status = $${index++}`;
            values.push(filters.status);
        }

        if (filters.userId) {
            query += ` AND wr.user_id = $${index++}`;
            values.push(filters.userId);
        }

        query += `
            ORDER BY wr.created_at DESC
            LIMIT $${index++}
            OFFSET $${index++};
        `;

        values.push(limit);
        values.push(offset);

        const { rows } = await client.query(query, values);
        return rows;
    }

    async count(filters = {}, client = db) {
        let query = `
            SELECT COUNT(*)::INTEGER AS total
            FROM withdraw_requests wr
            WHERE wr.deleted_at IS NULL
        `;

        const values = [];
        let index = 1;

        if (filters.status) {
            query += ` AND wr.status = $${index++}`;
            values.push(filters.status);
        }

        const { rows } = await client.query(query, values);
        return rows[0]?.total || 0;
    }

    async getStatistics(client = db) {
        const query = `
            SELECT
                COUNT(*)::INTEGER AS total_withdrawals,
                COUNT(*) FILTER (WHERE status = 'pending')::INTEGER AS pending,
                COUNT(*) FILTER (WHERE status = 'approved')::INTEGER AS approved,
                COUNT(*) FILTER (WHERE status = 'paid')::INTEGER AS paid,
                COALESCE(SUM(amount), 0)::NUMERIC(12, 2) AS total_amount
            FROM withdraw_requests
            WHERE deleted_at IS NULL;
        `;
        const { rows } = await client.query(query);
        return rows[0];
    }

    async softDelete(id, client = db) {
        const query = `
            UPDATE withdraw_requests
            SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 RETURNING *;
        `;
        const { rows } = await client.query(query, [id]);
        return rows[0];
    }
}

module.exports = new WithdrawalRepository();
