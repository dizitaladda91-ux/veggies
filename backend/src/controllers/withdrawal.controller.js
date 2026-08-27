const HTTP_STATUS = require("../constants/httpStatusCodes");

const PayoutService = require("../services/payout.service");

class PayoutController {

    /**
     * Create Payout
     */
    async createPayout(req, res, next) {

        try {

            const payout =
                await PayoutService.createPayout(
                    req.body,
                    req.user.id
                );

            return res.status(
                HTTP_STATUS.CREATED
            ).json({

                success: true,

                message:
                    "Payout created successfully.",

                data: payout

            });

        } catch (error) {

            next(error);

        }

    }

    /**
     * Get Payout By ID
     */
    async getPayout(req, res, next) {

        try {

            const payout =
                await PayoutService.getPayoutById(
                    req.params.id
                );

            return res.status(
                HTTP_STATUS.OK
            ).json({

                success: true,

                message:
                    "Payout fetched successfully.",

                data: payout

            });

        } catch (error) {

            next(error);

        }

    }

        /**
     * Process Payout
     */
    async processPayout(req, res, next) {

        try {

            const payout =
                await PayoutService.processPayout(
                    req.params.id,
                    {
                        gatewayReference: req.body.gatewayReference,
                        transactionReference: req.body.transactionReference,
                        processedBy: req.user.id
                    }
                );

            return res.status(
                HTTP_STATUS.OK
            ).json({

                success: true,

                message:
                    "Payout moved to processing successfully.",

                data: payout

            });

        } catch (error) {

            next(error);

        }

    }

    /**
     * Complete Payout
     */
    async completePayout(req, res, next) {

        try {

            const payout =
                await PayoutService.completePayout(
                    req.params.id,
                    {
                        gatewayReference: req.body.gatewayReference,
                        transactionReference: req.body.transactionReference,
                        processedBy: req.user.id
                    }
                );

            return res.status(
                HTTP_STATUS.OK
            ).json({

                success: true,

                message:
                    "Payout completed successfully.",

                data: payout

            });

        } catch (error) {

            next(error);

        }

    }

        /**
     * Fail Payout
     */
    async failPayout(req, res, next) {

        try {

            const payout =
                await PayoutService.failPayout(
                    req.params.id,
                    {
                        failureReason: req.body.failureReason,
                        processedBy: req.user.id
                    }
                );

            return res.status(
                HTTP_STATUS.OK
            ).json({

                success: true,

                message:
                    "Payout marked as failed successfully.",

                data: payout

            });

        } catch (error) {

            next(error);

        }

    }

    /**
     * Cancel Payout
     */
    async cancelPayout(req, res, next) {

        try {

            const payout =
                await PayoutService.cancelPayout(
                    req.params.id,
                    req.body.remarks,
                    req.user.id
                );

            return res.status(
                HTTP_STATUS.OK
            ).json({

                success: true,

                message:
                    "Payout cancelled successfully.",

                data: payout

            });

        } catch (error) {

            next(error);

        }

    }

        /**
     * Get All Payouts
     */
    async getAllPayouts(req, res, next) {

        try {

            const result =
                await PayoutService.getAllPayouts(
                    req.query
                );

            return res.status(
                HTTP_STATUS.OK
            ).json({

                success: true,

                message:
                    "Payouts fetched successfully.",

                data: result.items,

                pagination:
                    result.pagination

            });

        } catch (error) {

            next(error);

        }

    }

    /**
     * Get Payout Statistics
     */
    async getStatistics(req, res, next) {

        try {

            const statistics =
                await PayoutService.getStatistics();

            return res.status(
                HTTP_STATUS.OK
            ).json({

                success: true,

                message:
                    "Payout statistics fetched successfully.",

                data: statistics

            });

        } catch (error) {

            next(error);

        }

    }
    

}

module.exports = new PayoutController();