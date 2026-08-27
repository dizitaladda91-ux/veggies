const express = require("express");

const bankAccountController = require("../controllers/bankAccount.controller");

const { authenticate } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/rbacMiddleware");
const { ROLES } = require('../constants/roles');
const validate = require("../middlewares/validationMiddleware");

const {
  createBankAccountSchema,
  updateBankAccountSchema,
} = require("../validators/bankAccount.validator");

const router = express.Router();

router.get('/admin/all', authenticate, authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN), bankAccountController.getAllAccounts);

/*
|--------------------------------------------------------------------------
| Affiliate Bank Account Routes
|--------------------------------------------------------------------------
*/

// Create Bank Account
router.post(
  "/",
  authenticate,
  authorizeRoles(ROLES.AFFILIATE, ROLES.SUPER_AFFILIATE),
  createBankAccountSchema,
  validate,
  bankAccountController.createBankAccount
);

// Get My Bank Accounts
router.get(
  "/",
  authenticate,
  authorizeRoles(ROLES.AFFILIATE, ROLES.SUPER_AFFILIATE),
  bankAccountController.getMyAccounts
);

// Get Bank Account By ID
router.get(
  "/:id",
  authenticate,
  authorizeRoles(ROLES.AFFILIATE, ROLES.SUPER_AFFILIATE),
  bankAccountController.getAccountById
);

// Update Bank Account
router.put(
  "/:id",
  authenticate,
  authorizeRoles(ROLES.AFFILIATE, ROLES.SUPER_AFFILIATE),
  updateBankAccountSchema,
  validate,
  bankAccountController.updateBankAccount
);

// Set Default Bank Account
router.patch(
  "/:id/default",
  authenticate,
  authorizeRoles(ROLES.AFFILIATE, ROLES.SUPER_AFFILIATE),
  bankAccountController.setDefaultAccount
);

// Delete Bank Account
router.delete(
  "/:id",
  authenticate,
  authorizeRoles(ROLES.AFFILIATE, ROLES.SUPER_AFFILIATE),
  bankAccountController.deleteBankAccount
);

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
*/

// Verify Bank Account
router.patch(
  "/:id/verify",
  authenticate,
  authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  bankAccountController.verifyAccount
);

// Reject Bank Account
router.patch(
  "/:id/reject",
  authenticate,
  authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  bankAccountController.rejectAccount
);

module.exports = router;
