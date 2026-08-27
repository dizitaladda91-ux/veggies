const express = require("express");

const router = express.Router();

const PayoutController = require("../controllers/payout.controller");

const {
    authorizeRoles
} = require("../middlewares/rbacMiddleware");

const validate =
    require("../middlewares/validationMiddleware");

const {

    createPayoutValidation,

    getPayoutValidation,

    processPayoutValidation,

    approvePayoutValidation,

    completePayoutValidation,

    failPayoutValidation,

    cancelPayoutValidation,

    getAllPayoutsValidation,

    getStatisticsValidation

} = require("../validators/payout.validator");

const {
    authenticate
} = require("../middlewares/authMiddleware");
const { ROLES } = require('../constants/roles');

/**
 * Create Payout
 * POST /api/v1/payouts
 */
router.post(
    "/",
    authenticate,
    authorizeRoles(
        ROLES.SUPER_ADMIN,
        ROLES.ADMIN
    ),
    createPayoutValidation,
    validate,
    PayoutController.createPayout
);

/**
 * Get All Payouts
 * GET /api/v1/payouts
 */
router.get(
    "/export",
    authenticate,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
    PayoutController.exportCsv
);

router.get(
    "/",
    authenticate,
    authorizeRoles(
        ROLES.SUPER_ADMIN,
        ROLES.ADMIN
    ),
    getAllPayoutsValidation,
    validate,
    PayoutController.getAllPayouts
);

/**
 * Get Payout Statistics
 * GET /api/v1/payouts/statistics
 */
router.get(
    "/statistics",
    authenticate,
    authorizeRoles(
        ROLES.SUPER_ADMIN,
        ROLES.ADMIN
    ),
    getStatisticsValidation,
    validate,
    PayoutController.getStatistics
);

/**
 * Get Payout By ID
 * GET /api/v1/payouts/:id
 */
router.get(
    "/:id",
    authenticate,
    authorizeRoles(
        ROLES.SUPER_ADMIN,
        ROLES.ADMIN
    ),
    getPayoutValidation,
    validate,
    PayoutController.getPayoutById
);

/**
 * Process Payout
 * PATCH /api/v1/payouts/:id/process
 */
router.patch(
    "/:id/approve",
    authenticate,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
    approvePayoutValidation,
    validate,
    PayoutController.approvePayout
);

router.patch(
    "/:id/process",
    authenticate,
    authorizeRoles(
        ROLES.SUPER_ADMIN,
        ROLES.ADMIN
    ),
    processPayoutValidation,
    validate,
    PayoutController.processPayout
);

/**
 * Complete Payout
 * PATCH /api/v1/payouts/:id/complete
 */
router.patch(
    "/:id/complete",
    authenticate,
    authorizeRoles(
        ROLES.SUPER_ADMIN,
        ROLES.ADMIN
    ),
    completePayoutValidation,
    validate,
    PayoutController.completePayout
);

/**
 * Fail Payout
 * PATCH /api/v1/payouts/:id/fail
 */
router.patch(
    "/:id/fail",
    authenticate,
    authorizeRoles(
        ROLES.SUPER_ADMIN,
        ROLES.ADMIN
    ),
    failPayoutValidation,
    validate,
    PayoutController.failPayout
);

/**
 * Cancel Payout
 * PATCH /api/v1/payouts/:id/cancel
 */
router.patch(
    "/:id/cancel",
    authenticate,
    authorizeRoles(
        ROLES.SUPER_ADMIN,
        ROLES.ADMIN
    ),
    cancelPayoutValidation,
    validate,
    PayoutController.cancelPayout
);

module.exports = router;
