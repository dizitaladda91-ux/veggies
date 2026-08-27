const PayoutService = require("../services/payout.service");
const asyncHandler = require("../utils/asyncHandler");
const logRepository = require('../repositories/logRepository');

class PayoutController {
    async recordTransition(req, payout, action) {
        await logRepository.createAuditLog({
            actorId: req.user.id,
            targetUserId: payout.user_id,
            action,
            changesJson: { payoutId: payout.id, payoutNumber: payout.payout_number, status: payout.status, remarks: payout.remarks || null },
            ipAddress: req.ip,
        });
    }

    /**
     * Create Payout
     * POST /payouts
     */
    createPayout = asyncHandler(async (req, res) => {

        const payout =
            await PayoutService.createPayout({

                withdrawRequestId: req.body.withdrawRequestId,

                gateway: req.body.gateway,

                remarks: req.body.remarks,

                initiatedBy: req.user.id

            });

        await this.recordTransition(req, payout, 'PAYOUT_CREATED');

        return res.status(201).json({

            success: true,

            message: "Payout created successfully.",

            data: payout

        });

    });

    /**
     * Get Payout By ID
     * GET /payouts/:id
     */
    getPayoutById = asyncHandler(async (req, res) => {

        const payout =
            await PayoutService.getPayoutById(
                req.params.id
            );

        return res.status(200).json({

            success: true,

            data: payout

        });

    });

    /**
     * Get All Payouts
     * GET /payouts
     */
    getAllPayouts = asyncHandler(async (req, res) => {

        const payouts = await PayoutService.getAllPayouts({
            page: req.query.page,
            limit: req.query.limit,
            status: req.query.status,
            gateway: req.query.gateway,
            userId: req.query.userId,
            withdrawRequestId: req.query.withdrawRequestId,
            bankAccountId: req.query.bankAccountId,
            fromDate: req.query.fromDate,
            toDate: req.query.toDate,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder,
        });

        return res.status(200).json({

            success: true,

            data: payouts

        });

    });

        /**
     * Process Payout
     * PATCH /payouts/:id/process
     */
    processPayout = asyncHandler(async (req, res) => {

        const payout =
            await PayoutService.processPayout(
                req.params.id,
                { gatewayReference: req.body.gatewayReference, transactionReference: req.body.transactionReference },
                req.user.id
            );

        await this.recordTransition(req, payout, 'PAYOUT_PROCESSING');

        return res.status(200).json({

            success: true,

            message: "Payout moved to processing successfully.",

            data: payout

        });

    });

    approvePayout = asyncHandler(async (req, res) => {
        const payout = await PayoutService.approvePayout(req.params.id, req.user.id, req.body.notes || null);
        await this.recordTransition(req, payout, 'PAYOUT_APPROVED');
        return res.status(200).json({ success: true, message: 'Payout approved successfully.', data: payout });
    });

    /**
     * Complete Payout
     * PATCH /payouts/:id/complete
     */
    completePayout = asyncHandler(async (req, res) => {

        const payout =
            await PayoutService.completePayout(
                req.params.id,
                { gatewayReference: req.body.gatewayReference, transactionReference: req.body.transactionReference }
            );

        await this.recordTransition(req, payout, 'PAYOUT_COMPLETED');

        return res.status(200).json({

            success: true,

            message: "Payout completed successfully.",

            data: payout

        });

    });

    /**
     * Fail Payout
     * PATCH /payouts/:id/fail
     */
    failPayout = asyncHandler(async (req, res) => {

        const payout =
            await PayoutService.failPayout(
                req.params.id,
                { failureReason: req.body.failureReason, processedBy: req.user.id }
            );

        await this.recordTransition(req, payout, 'PAYOUT_FAILED');

        return res.status(200).json({

            success: true,

            message: "Payout marked as failed.",

            data: payout

        });

    });

        /**
     * Retry Failed Payout
     * PATCH /payouts/:id/retry
     */
    retryPayout = asyncHandler(async (req, res) => {

        const payout =
            await PayoutService.retryPayout(
                req.params.id,
                req.user.id
            );

        await this.recordTransition(req, payout, 'PAYOUT_RETRY_INITIATED');

        return res.status(200).json({

            success: true,

            message: "Payout retry initiated successfully.",

            data: payout

        });

    });

    /**
     * Cancel Payout
     * PATCH /payouts/:id/cancel
     */
    cancelPayout = asyncHandler(async (req, res) => {

        const payout =
            await PayoutService.cancelPayout(
                req.params.id,
                req.body.remarks
            );

        await this.recordTransition(req, payout, 'PAYOUT_CANCELLED');

        return res.status(200).json({

            success: true,

            message: "Payout cancelled successfully.",

            success: true,

            message: "Payout cancelled successfully.",

            data: payout

        });

    });

    /**
     * Get Payout Statistics
     * GET /admin/payouts/statistics
     */
    getStatistics = asyncHandler(async (req, res) => {

        const statistics =
            await PayoutService.getStatistics();

        return res.status(200).json({

            success: true,

            data: statistics

        });

    });

    exportCsv = asyncHandler(async (req, res) => {
        const result = await PayoutService.getAllPayouts({}, 1000, 0);
        const items = result.items || [];
        const header = ['ID', 'Payout Number', 'Amount', 'Currency', 'Gateway', 'Status', 'Transaction Ref', 'Created At'];
        const csvRows = [header.join(',')];

        for (const item of items) {
            const row = [
                `"${item.id}"`,
                `"${item.payout_number || ''}"`,
                `"${item.amount || 0}"`,
                `"${item.currency || 'INR'}"`,
                `"${item.gateway || ''}"`,
                `"${item.status || ''}"`,
                `"${item.transaction_reference || ''}"`,
                `"${item.created_at || ''}"`
            ];
            csvRows.push(row.join(','));
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="payouts_export_${Date.now()}.csv"`);
        return res.status(200).send(csvRows.join('\n'));
    });

}

module.exports = new PayoutController();
