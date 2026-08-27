const { body, param, query } = require("express-validator");

const {
    PAYOUT_STATUS,
    PAYOUT_GATEWAYS
} = require("../constants/payout.constants");

/**
 * Create Payout Validation
 */
const createPayoutValidation = [

    body("withdrawRequestId")
        .isUUID()
        .withMessage("Valid withdraw request ID is required."),

    body("gateway")
        .isIn(Object.values(PAYOUT_GATEWAYS))
        .withMessage("Invalid payout gateway."),

    body("gatewayReference")
        .optional()
        .isString()
        .trim()
        .isLength({ max: 255 })
        .withMessage("Gateway reference is invalid."),

    body("transactionReference")
        .optional()
        .isString()
        .trim()
        .isLength({ max: 255 })
        .withMessage("Transaction reference is invalid."),

    body("remarks")
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Remarks cannot exceed 500 characters.")

];

/**
 * Get Payout Validation
 */
const getPayoutValidation = [

    param("id")
        .isUUID()
        .withMessage("Valid payout ID is required.")

];

/**
 * Process Payout Validation
 */
const processPayoutValidation = [

    param("id")
        .isUUID()
        .withMessage("Valid payout ID is required."),

    body("gatewayReference")
        .optional()
        .isString()
        .trim()
        .isLength({ max: 255 })
        .withMessage("Gateway reference is invalid."),

    body("transactionReference")
        .optional()
        .isString()
        .trim()
        .isLength({ max: 255 })
        .withMessage("Transaction reference is invalid.")

];

const approvePayoutValidation = [
    param('id').isUUID().withMessage('Valid payout ID is required.'),
    body('notes').optional().trim().isLength({ max: 500 }).withMessage('Approval notes cannot exceed 500 characters.')
];

/**
 * Complete Payout Validation
 */
const completePayoutValidation = [

    param("id")
        .isUUID()
        .withMessage("Valid payout ID is required."),

    body("gatewayReference")
        .optional()
        .isString()
        .trim()
        .isLength({ max: 255 })
        .withMessage("Gateway reference is invalid."),

    body("transactionReference")
        .optional()
        .isString()
        .trim()
        .isLength({ max: 255 })
        .withMessage("Transaction reference is invalid.")

];

/**
 * Fail Payout Validation
 */
const failPayoutValidation = [

    param("id")
        .isUUID()
        .withMessage("Valid payout ID is required."),

    body("failureReason")
        .trim()
        .notEmpty()
        .withMessage("Failure reason is required.")
        .isLength({ max: 500 })
        .withMessage("Failure reason cannot exceed 500 characters.")

];

/**
 * Cancel Payout Validation
 */
const cancelPayoutValidation = [

    param("id")
        .isUUID()
        .withMessage("Valid payout ID is required."),

    body("remarks")
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Remarks cannot exceed 500 characters.")

];

/**
 * Get All Payouts Validation
 */
const getAllPayoutsValidation = [

    query("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be greater than 0."),

    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be between 1 and 100."),

    query("status")
        .optional()
        .isIn(Object.values(PAYOUT_STATUS))
        .withMessage("Invalid payout status."),

    query("gateway")
        .optional()
        .isIn(Object.values(PAYOUT_GATEWAYS))
        .withMessage("Invalid payout gateway."),

    query("userId")
        .optional()
        .isUUID()
        .withMessage("Invalid user ID."),

    query("withdrawRequestId")
        .optional()
        .isUUID()
        .withMessage("Invalid withdraw request ID."),

    query("bankAccountId")
        .optional()
        .isUUID()
        .withMessage("Invalid bank account ID."),

    query("fromDate")
        .optional()
        .isISO8601()
        .withMessage("Invalid from date."),

    query("toDate")
        .optional()
        .isISO8601()
        .withMessage("Invalid to date."),

    query("sortBy")
        .optional()
        .isIn([
            "created_at",
            "amount",
            "status",
            "processed_at",
            "completed_at"
        ])
        .withMessage("Invalid sort field."),

    query("sortOrder")
        .optional()
        .isIn(["ASC", "DESC", "asc", "desc"])
        .withMessage("Sort order must be ASC or DESC.")

];

/**
 * Get Statistics Validation
 */
const getStatisticsValidation = [];

/**
 * Exports
 */
module.exports = {

    createPayoutValidation,

    getPayoutValidation,

    processPayoutValidation,
    approvePayoutValidation,

    completePayoutValidation,

    failPayoutValidation,

    cancelPayoutValidation,

    getAllPayoutsValidation,

    getStatisticsValidation

};
