const db = require("../database");
const { PAYOUT_STATUS } = require("../constants/payout.constants");
const {
    PAYOUT_SORT_FIELDS
} = require("../constants/payout.constants");

class PayoutRepository {



    /**
     * Create Payout
     */
    async create(data, client = db) {

        const query = `
            INSERT INTO payouts (
                payout_number,
                withdraw_request_id,
                user_id,
                bank_account_id,
                amount,
                gateway,
                gateway_reference,
                transaction_reference,
                status,
                remarks,
                processed_by
            )
            VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
            )
            RETURNING *;
        `;

        const values = [
            data.payoutNumber,
            data.withdrawRequestId,
            data.userId,
            data.bankAccountId,
            data.amount,
            data.gateway,
            data.gatewayReference || null,
            data.transactionReference || null,
            data.status,
            data.remarks || null,
            data.processedBy || null
        ];

        const { rows } = await client.query(query, values);

        return rows[0];

    }

    /**
     * Find Payout By ID
     */
    async findById(id, client = db) {

        const query = `
            SELECT *
            FROM payouts
            WHERE id = $1
              AND deleted_at IS NULL
            LIMIT 1;
        `;

        const { rows } = await client.query(query, [id]);

        return rows[0];

    }

    /**
     * Find Payout By Number
     */
    async findByPayoutNumber(payoutNumber, client = db) {

        const query = `
            SELECT *
            FROM payouts
            WHERE payout_number = $1
              AND deleted_at IS NULL
            LIMIT 1;
        `;

        const { rows } = await client.query(query, [payoutNumber]);

        return rows[0];

    }

    /**
     * Find Payout By Withdraw Request ID
     */
    async findByWithdrawRequestId(withdrawRequestId, client = db) {

        const query = `
            SELECT *
            FROM payouts
            WHERE withdraw_request_id = $1
              AND deleted_at IS NULL
            LIMIT 1;
        `;

        const { rows } = await client.query(query, [withdrawRequestId]);

        return rows[0];

    }

    /**
     * Lock Payout Row
     */
    async lockPayout(id, client) {

        const query = `
            SELECT *
            FROM payouts
            WHERE id = $1
              AND deleted_at IS NULL
            FOR UPDATE;
        `;

        const { rows } = await client.query(query, [id]);

        return rows[0];

    }

    /**
     * Update Payout Status
     */
    async updateStatus(
        id,
        status,
        remarks = null,
        client = db
    ) {

        const query = `
            UPDATE payouts
            SET
                status = $2,
                remarks = COALESCE($3, remarks),
                updated_at = NOW()
            WHERE id = $1
              AND deleted_at IS NULL
            RETURNING *;
        `;

        const values = [
            id,
            status,
            remarks
        ];

        const { rows } = await client.query(query, values);

        return rows[0];

    }

    /**
     * Mark Payout As Processing
     */
    async processing(
        id,
        gatewayReference,
        transactionReference,
        processedBy,
        client = db
    ) {

        const query = `
            UPDATE payouts
            SET
                status = $2,
                gateway_reference = $3,
                transaction_reference = $4,
                processed_by = $5,
                processed_at = NOW(),
                updated_at = NOW()
            WHERE id = $1
              AND deleted_at IS NULL
            RETURNING *;
        `;

        const values = [
            id,
            PAYOUT_STATUS.PROCESSING,
            gatewayReference || null,
            transactionReference || null,
            processedBy
        ];

        const { rows } = await client.query(query, values);

        return rows[0];

    }

    async approve(id, approvedBy, approvalNotes = null, client = db) {
        const { rows } = await client.query(
            `UPDATE payouts SET approval_status='APPROVED', approved_by=$2, approved_at=NOW(),
             approval_notes=$3, updated_at=NOW()
             WHERE id=$1 AND deleted_at IS NULL AND approval_status='PENDING' RETURNING *`,
            [id, approvedBy, approvalNotes]
        );
        return rows[0];
    }

    /**
     * Mark Payout As Success
     */
    async success(
        id,
        gatewayReference = null,
        transactionReference = null,
        client = db
    ) {

        const query = `
            UPDATE payouts
            SET
                status = $2,
                gateway_reference = COALESCE($3, gateway_reference),
                transaction_reference = COALESCE($4, transaction_reference),
                completed_at = NOW(),
                updated_at = NOW()
            WHERE id = $1
              AND deleted_at IS NULL
            RETURNING *;
        `;

        const values = [
            id,
            PAYOUT_STATUS.SUCCESS,
            gatewayReference,
            transactionReference
        ];

        const { rows } = await client.query(query, values);

        return rows[0];

    }

    /**
     * Mark Payout As Failed
     */
    async failed(
        id,
        failureReason,
        client = db
    ) {

        const query = `
            UPDATE payouts
            SET
                status = $2,
                failure_reason = $3,
                failed_at = NOW(),
                updated_at = NOW()
            WHERE id = $1
              AND deleted_at IS NULL
            RETURNING *;
        `;

        const values = [
            id,
            PAYOUT_STATUS.FAILED,
            failureReason
        ];

        const { rows } = await client.query(query, values);

        return rows[0];

    }

    /**
     * Cancel Payout
     */
    async cancel(
        id,
        remarks = null,
        client = db
    ) {

        const query = `
            UPDATE payouts
            SET
                status = $2,
                remarks = COALESCE($3, remarks),
                updated_at = NOW()
            WHERE id = $1
              AND deleted_at IS NULL
            RETURNING *;
        `;

        const values = [
            id,
            PAYOUT_STATUS.CANCELLED,
            remarks
        ];

        const { rows } = await client.query(query, values);

        return rows[0];

    }
    /**
     * Get All Payouts
     */
    async findAll(
        filters = {},
        limit = 10,
        offset = 0,
        sortBy = "created_at",
        sortOrder = "DESC",
        client = db
    ) {

        // Allow only valid sortable fields
        const orderBy = PAYOUT_SORT_FIELDS.includes(sortBy)
            ? sortBy
            : "created_at";

        const direction =
            String(sortOrder).toUpperCase() === "ASC"
                ? "ASC"
                : "DESC";

        let query = `
            SELECT
                *
            FROM payouts
            WHERE deleted_at IS NULL
        `;

        const values = [];
        let index = 1;

        if (filters.status) {
            query += ` AND status = $${index++}`;
            values.push(filters.status);
        }

        if (filters.gateway) {
            query += ` AND gateway = $${index++}`;
            values.push(filters.gateway);
        }

        if (filters.userId) {
            query += ` AND user_id = $${index++}`;
            values.push(filters.userId);
        }

        if (filters.withdrawRequestId) {
            query += ` AND withdraw_request_id = $${index++}`;
            values.push(filters.withdrawRequestId);
        }

        if (filters.bankAccountId) {
            query += ` AND bank_account_id = $${index++}`;
            values.push(filters.bankAccountId);
        }

        if (filters.fromDate) {
            query += ` AND created_at >= $${index++}`;
            values.push(filters.fromDate);
        }

        if (filters.toDate) {
            query += ` AND created_at <= $${index++}`;
            values.push(filters.toDate);
        }

        query += `
            ORDER BY ${orderBy} ${direction}
            LIMIT $${index++}
            OFFSET $${index++};
        `;

        values.push(limit);
        values.push(offset);

        const { rows } = await client.query(query, values);

        return rows;

    }
    /**
     * Count Payouts
     */
    async count(
        filters = {},
        client = db
    ) {

        let query = `
            SELECT COUNT(*)::INTEGER AS total
            FROM payouts
            WHERE deleted_at IS NULL
        `;

        const values = [];
        let index = 1;

        if (filters.status) {
            query += ` AND status = $${index++}`;
            values.push(filters.status);
        }

        if (filters.gateway) {
            query += ` AND gateway = $${index++}`;
            values.push(filters.gateway);
        }

        if (filters.userId) {
            query += ` AND user_id = $${index++}`;
            values.push(filters.userId);
        }

        if (filters.withdrawRequestId) {
            query += ` AND withdraw_request_id = $${index++}`;
            values.push(filters.withdrawRequestId);
        }

        if (filters.bankAccountId) {
            query += ` AND bank_account_id = $${index++}`;
            values.push(filters.bankAccountId);
        }

        if (filters.fromDate) {
            query += ` AND created_at >= $${index++}`;
            values.push(filters.fromDate);
        }

        if (filters.toDate) {
            query += ` AND created_at <= $${index++}`;
            values.push(filters.toDate);
        }

        const { rows } = await client.query(query, values);

        return rows[0].total;

    }

    /**
     * Get Payout Statistics
     */
    async getStatistics(client = db) {

        const query = `
            SELECT

                COUNT(*)::INTEGER AS total_payouts,

                COUNT(*) FILTER (
                    WHERE status = 'PENDING'
                )::INTEGER AS pending,

                COUNT(*) FILTER (
                    WHERE status = 'PROCESSING'
                )::INTEGER AS processing,

                COUNT(*) FILTER (
                    WHERE status = 'SUCCESS'
                )::INTEGER AS success,

                COUNT(*) FILTER (
                    WHERE status = 'FAILED'
                )::INTEGER AS failed,

                COUNT(*) FILTER (
                    WHERE status = 'CANCELLED'
                )::INTEGER AS cancelled,

                COALESCE(
                    SUM(amount),
                    0
                ) AS total_amount,

                COALESCE(
                    SUM(amount) FILTER (
                        WHERE status = 'SUCCESS'
                    ),
                    0
                ) AS total_paid,

                COALESCE(
                    SUM(amount) FILTER (
                        WHERE status = 'PENDING'
                    ),
                    0
                ) AS pending_amount,

                COALESCE(
                    SUM(amount) FILTER (
                        WHERE status = 'PROCESSING'
                    ),
                    0
                ) AS processing_amount,

                COALESCE(
                    SUM(amount) FILTER (
                        WHERE status = 'FAILED'
                    ),
                    0
                ) AS failed_amount

            FROM payouts
            WHERE deleted_at IS NULL;
        `;

        const { rows } = await client.query(query);

        return rows[0];

    }
    /**
     * Soft Delete Payout
     */
    async softDelete(
        id,
        client = db
    ) {

        const query = `
            UPDATE payouts
            SET
                deleted_at = NOW(),
                updated_at = NOW()
            WHERE id = $1
              AND deleted_at IS NULL
            RETURNING *;
        `;

        const { rows } = await client.query(query, [id]);

        return rows[0];

    }

}

module.exports = new PayoutRepository();
