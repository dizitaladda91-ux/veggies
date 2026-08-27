const db = require("../database");

const ApiError = require("../utils/apiError");
const config = require('../config/env');

const PayoutRepository = require("../repositories/payout.repository");
const WithdrawalRepository = require("../repositories/withdrawal.repository");

const {
    PAYOUT_STATUS,
    PAYOUT_DEFAULTS
} = require("../constants/payout.constants");

const {
    WITHDRAWAL_STATUS
} = require("../constants/withdrawal.constants");

class PayoutService {

    /**
     * Generate Unique Payout Number
     */
    generatePayoutNumber() {

    const now = new Date();

    const date =
        now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, "0") +
        String(now.getDate()).padStart(2, "0");

    const random =
        Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();

    return `PAY-${date}-${random}`;

}

    /**
     * Validate Payout Status
     */
    validateStatus(status) {

        if (!Object.values(PAYOUT_STATUS).includes(status)) {
            throw ApiError.badRequest("Invalid payout status.");
        }

    }

    /**
     * Get Payout By ID
     */
    async getPayoutById(id) {

        const payout = await PayoutRepository.findById(id);

        if (!payout) {
            throw ApiError.notFound("Payout not found.");
        }

        return payout;

    }

    /**
     * Get Payout By Number
     */
    async getPayoutByNumber(payoutNumber) {

        const payout =
            await PayoutRepository.findByPayoutNumber(
                payoutNumber
            );

        if (!payout) {
            throw ApiError.notFound("Payout not found.");
        }

        return payout;

    }

    /**
     * Validate Withdrawal Before Payout
     */
    async validateWithdrawal(withdrawRequestId) {

        const withdrawal =
            await WithdrawalRepository.findById(
                withdrawRequestId
            );

        if (!withdrawal) {
            throw ApiError.notFound(
                "Withdrawal request not found."
            );
        }

        if (
            withdrawal.status !==
            WITHDRAWAL_STATUS.APPROVED
        ) {
            throw ApiError.badRequest(
                "Only approved withdrawals can be processed."
            );
        }

        const existingPayout =
            await PayoutRepository.findByWithdrawRequestId(
                withdrawRequestId
            );

        if (existingPayout) {
            throw ApiError.conflict(
                "Payout already exists for this withdrawal request."
            );
        }

        return withdrawal;

    }

        /**
     * Create Payout
     */
    async createPayout(data, adminUserId) {

        const client = await db.getClient();

        try {

            await client.query("BEGIN");

            // Lock withdrawal request
            const withdrawal =
                await WithdrawalRepository.lockWithdrawal(
                    data.withdrawRequestId,
                    client
                );

            if (!withdrawal) {
                throw ApiError.notFound(
                    "Withdrawal request not found."
                );
            }

            if (
                withdrawal.status !==
                WITHDRAWAL_STATUS.APPROVED
            ) {
                throw ApiError.badRequest(
                    "Only approved withdrawals can be processed."
                );
            }

            // Prevent duplicate payout
            const existingPayout =
                await PayoutRepository.findByWithdrawRequestId(
                    data.withdrawRequestId,
                    client
                );

            if (existingPayout) {
                throw ApiError.conflict(
                    "Payout already exists for this withdrawal."
                );
            }

            // Generate payout number
            const payoutNumber =
                this.generatePayoutNumber();

            // Create payout
            const payout =
                await PayoutRepository.create(
                    {
                        payoutNumber,
                        withdrawRequestId:
                            withdrawal.id,
                        userId:
                            withdrawal.user_id,
                        bankAccountId:
                            withdrawal.bank_account_id,
                        amount:
                            withdrawal.amount,
                        gateway:
                            data.gateway,
                        gatewayReference:
                            data.gatewayReference || null,
                        transactionReference:
                            data.transactionReference || null,
                        status:
                            PAYOUT_STATUS.PENDING,
                        remarks:
                            data.remarks || null,
                        processedBy:
                            adminUserId
                    },
                    client
                );

            // Update withdrawal status
            await WithdrawalRepository.updateStatus(
                withdrawal.id,
                WITHDRAWAL_STATUS.PROCESSING,
                "Payout initiated.",
                client
            );

            await client.query("COMMIT");

            return payout;

        } catch (error) {

            await client.query("ROLLBACK");

            throw error;

        } finally {

            client.release();

        }

    }

        /**
     * Process Payout
     */
    async processPayout(
        payoutId,
        data = {},
        adminUserId
    ) {

        const client = await db.getClient();

        try {

            await client.query("BEGIN");

            const payout =
                await PayoutRepository.lockPayout(
                    payoutId,
                    client
                );

            if (!payout) {
                throw ApiError.notFound(
                    "Payout not found."
                );
            }

            if (Number(payout.amount) >= config.payoutMakerCheckerMinimum && payout.approval_status !== 'APPROVED') {
                throw ApiError.forbidden('This payout requires approval from a different administrator before processing.');
            }

            if (
                payout.status !==
                PAYOUT_STATUS.PENDING
            ) {
                throw ApiError.badRequest(
                    "Only pending payouts can be processed."
                );
            }

            const updatedPayout =
                await PayoutRepository.processing(
                    payout.id,
                    data.gatewayReference || null,
                    data.transactionReference || null,
                    adminUserId,
                    client
                );

            await client.query("COMMIT");

            return updatedPayout;

        } catch (error) {

            await client.query("ROLLBACK");

            throw error;

        } finally {

            client.release();

        }

    }

    /**
     * Complete Payout
     */
    async completePayout(
        payoutId,
        data
    ) {

        const client = await db.getClient();

        try {

            await client.query("BEGIN");

            const payout =
                await PayoutRepository.lockPayout(
                    payoutId,
                    client
                );

            if (!payout) {
                throw ApiError.notFound(
                    "Payout not found."
                );
            }

            if (payout.status === PAYOUT_STATUS.SUCCESS) {
                throw ApiError.conflict("Payout already completed.");
            }

            if (payout.status !== PAYOUT_STATUS.PROCESSING) {
                throw ApiError.badRequest(
                    "Only processing payouts can be completed."
                );
            }

            const completedPayout =
                await PayoutRepository.success(
                    payout.id,
                    data.gatewayReference || null,
                    data.transactionReference || null,
                    client
                );

            await WithdrawalRepository.markAsPaid(
                payout.withdraw_request_id,
                data.transactionReference || null,
                client
            );

            await client.query("COMMIT");

            return completedPayout;

        } catch (error) {

            await client.query("ROLLBACK");

            throw error;

        } finally {

            client.release();

        }

    }

    async approvePayout(payoutId, approvedBy, notes = null) {
        const payout = await PayoutRepository.findById(payoutId);
        if (!payout) throw ApiError.notFound('Payout not found.');
        if (payout.status !== PAYOUT_STATUS.PENDING) throw ApiError.badRequest('Only pending payouts can be approved.');
        if (String(payout.processed_by) === String(approvedBy)) throw ApiError.forbidden('A payout creator cannot approve their own payout.');
        if (Number(payout.amount) < config.payoutMakerCheckerMinimum) return payout;
        const approved = await PayoutRepository.approve(payoutId, approvedBy, notes);
        if (!approved) throw ApiError.conflict('Payout has already been approved.');
        return approved;
    }

        /**
     * Fail Payout
     */
    async failPayout(
        payoutId,
        data
    ) {

        const client = await db.getClient();

        try {

            await client.query("BEGIN");

            const payout =
                await PayoutRepository.lockPayout(
                    payoutId,
                    client
                );

            if (!payout) {
                throw ApiError.notFound(
                    "Payout not found."
                );
            }

            if (
                payout.status !== PAYOUT_STATUS.PROCESSING
            ) {
                throw ApiError.badRequest(
                    "Only processing payouts can be marked as failed."
                );
            }

            const failedPayout =
                await PayoutRepository.failed(
                    payout.id,
                    data.failureReason,
                    client
                );

            await WithdrawalRepository.failed(
                payout.withdraw_request_id,
                data.failureReason,
                client
            );

            await client.query("COMMIT");

            return failedPayout;

        } catch (error) {

            await client.query("ROLLBACK");

            throw error;

        } finally {

            client.release();

        }

    }

    /**
     * Cancel Payout
     */
    async cancelPayout(
        payoutId,
        remarks = null
    ) {

        const client = await db.getClient();

        try {

            await client.query("BEGIN");

            const payout =
                await PayoutRepository.lockPayout(
                    payoutId,
                    client
                );

            if (!payout) {
                throw ApiError.notFound(
                    "Payout not found."
                );
            }

            if (
                payout.status !== PAYOUT_STATUS.PENDING
            ) {
                throw ApiError.badRequest(
                    "Only pending payouts can be cancelled."
                );
            }

            const cancelledPayout =
                await PayoutRepository.cancel(
                    payout.id,
                    remarks,
                    client
                );

            await WithdrawalRepository.updateStatus(
                payout.withdraw_request_id,
                WITHDRAWAL_STATUS.APPROVED,
                "Payout cancelled.",
                client
            );

            await client.query("COMMIT");

            return cancelledPayout;

        } catch (error) {

            await client.query("ROLLBACK");

            throw error;

        } finally {

            client.release();

        }

    }

        /**
     * Get All Payouts
     */
    async getAllPayouts(query = {}) {

        const page =
            Number(query.page) || PAYOUT_DEFAULTS.PAGE;

        const limit = Math.min(
            Number(query.limit) || PAYOUT_DEFAULTS.LIMIT,
            PAYOUT_DEFAULTS.MAX_LIMIT
        );

        const offset = (page - 1) * limit;

        const filters = {
            status: query.status,
            gateway: query.gateway,
            userId: query.userId,
            withdrawRequestId: query.withdrawRequestId,
            bankAccountId: query.bankAccountId,
            fromDate: query.fromDate,
            toDate: query.toDate
        };

        const sortBy = query.sortBy || "created_at";
        const sortOrder = query.sortOrder || "DESC";

        const [items, total] = await Promise.all([

            PayoutRepository.findAll(
                filters,
                limit,
                offset,
                sortBy,
                sortOrder
            ),

            PayoutRepository.count(filters)

        ]);

        return {

            items,

            pagination: {

                page,

                limit,

                total,

                totalPages: Math.ceil(total / limit),

                hasNextPage:
                    page < Math.ceil(total / limit),

                hasPreviousPage:
                    page > 1

            }

        };

    }

    /**
     * Get Payout Statistics
     */
    async getStatistics() {

        return await PayoutRepository.getStatistics();

    }

}

module.exports = new PayoutService();


