const express = require("express");

const walletController = require("../controllers/walletcontroller");

const { authenticate } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/rbacMiddleware");
const { ROLES } = require('../constants/roles');
const validate = require("../middlewares/validationMiddleware");

const {
    walletTransactionValidation,
    withdrawValidation,
    transactionHistoryValidation,
    transactionIdValidation
} = require("../validators/walletvalidator");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Affiliate Wallet Routes
|--------------------------------------------------------------------------
*/

// Get My Wallet
router.get(
    "/",
    authenticate,
    authorizeRoles(ROLES.AFFILIATE, ROLES.SUPER_AFFILIATE),
    walletController.getWallet
);

// Wallet Summary
router.get(
    "/summary",
    authenticate,
    authorizeRoles(ROLES.AFFILIATE, ROLES.SUPER_AFFILIATE),
    walletController.getWalletSummary
);

// Transaction History
router.get(
    "/transactions",
    authenticate,
    authorizeRoles(ROLES.AFFILIATE, ROLES.SUPER_AFFILIATE),
    transactionHistoryValidation,
    validate,
    walletController.getTransactions
);

// Transaction Details
router.get(
    "/transactions/:id",
    authenticate,
    authorizeRoles(ROLES.AFFILIATE, ROLES.SUPER_AFFILIATE),
    transactionIdValidation,
    validate,
    walletController.getTransactionById
);

// Wallet Statistics
router.get(
    "/stats",
    authenticate,
    authorizeRoles(ROLES.AFFILIATE, ROLES.SUPER_AFFILIATE),
    walletController.getWalletStats
);

// Withdraw Request
router.post(
    "/withdraw",
    authenticate,
    authorizeRoles(ROLES.AFFILIATE, ROLES.SUPER_AFFILIATE),
    withdrawValidation,
    validate,
    walletController.withdraw
);

/*
|--------------------------------------------------------------------------
| Admin Wallet Routes
|--------------------------------------------------------------------------
*/

// Manual Credit
router.post(
    "/credit",
    authenticate,
    authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN),
    walletTransactionValidation,
    validate,
    walletController.credit
);

// Manual Debit
router.post(
    "/debit",
    authenticate,
    authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN),
    walletTransactionValidation,
    validate,
    walletController.debit
);

// Freeze Balance
router.post(
    "/freeze",
    authenticate,
    authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN),
    walletTransactionValidation,
    validate,
    walletController.freezeBalance
);

// Release Balance
router.post(
    "/release",
    authenticate,
    authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN),
    walletTransactionValidation,
    validate,
    walletController.releaseBalance
);

module.exports = router;
