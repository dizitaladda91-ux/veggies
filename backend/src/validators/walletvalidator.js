const { body, query, param } = require("express-validator");

const {
    WALLET_TRANSACTION_TYPES
} = require("../constants/wallet.constants");

/* -------------------------------------------------------------------------- */
/*                             CREDIT / DEBIT                                 */
/* -------------------------------------------------------------------------- */

const walletTransactionValidation = [

    body("userId")
        .isUUID()
        .withMessage("A valid target user ID is required."),

    body("amount")
        .notEmpty()
        .withMessage("Amount is required.")
        .isFloat({ gt: 0 })
        .withMessage("Amount must be greater than 0."),

    body("type")
        .notEmpty()
        .withMessage("Transaction type is required.")
        .isIn(Object.values(WALLET_TRANSACTION_TYPES))
        .withMessage("Invalid transaction type."),

    body("referenceType")
        .optional()
        .isString()
        .isLength({ max: 50 })
        .withMessage("Reference type must be at most 50 characters."),

    body("referenceId")
        .optional()
        .isString()
        .withMessage("Reference ID must be a string."),

    body("description")
        .optional()
        .isLength({ max: 255 })
        .withMessage(
            "Description cannot exceed 255 characters."
        )

];

/* -------------------------------------------------------------------------- */
/*                                WITHDRAW                                    */
/* -------------------------------------------------------------------------- */

const withdrawValidation = [

    body("amount")
        .notEmpty()
        .withMessage("Amount is required.")
        .isFloat({ gt: 0 })
        .withMessage("Amount must be greater than 0."),

    body("description")
        .optional()
        .isLength({ max: 255 })
        .withMessage(
            "Description cannot exceed 255 characters."
        )

];

/* -------------------------------------------------------------------------- */
/*                          TRANSACTION HISTORY                               */
/* -------------------------------------------------------------------------- */

const transactionHistoryValidation = [

    query("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be greater than 0."),

    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage(
            "Limit must be between 1 and 100."
        )

];

/* -------------------------------------------------------------------------- */
/*                           TRANSACTION ID                                   */
/* -------------------------------------------------------------------------- */

const transactionIdValidation = [

    param("id")
        .isUUID()
        .withMessage("Invalid transaction ID.")

];

module.exports = {

    walletTransactionValidation,

    withdrawValidation,

    transactionHistoryValidation,

    transactionIdValidation

};
