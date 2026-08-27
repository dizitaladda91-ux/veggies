const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');
const { authenticate } = require('../middlewares/authMiddleware');
const { conversionValidator } = require('../validators/commissionValidator');
const validate = require('../middlewares/validationMiddleware');
const { requireStorefrontApiKey } = require('../middlewares/storefrontAuthMiddleware');
const { storefrontRateLimiter } = require('../middlewares/rateLimiter');
const { query } = require('express-validator');

// Public route to record click events when visiting referral links
router.get('/click/:code', referralController.trackClick);

// Storefront checkout uses this to validate the referral before applying the
// customer-facing affiliate discount.
router.get('/discount/:code', referralController.getDiscount);

// The ecommerce backend checks this before applying a referral discount at
// checkout. It is server-to-server because it contains customer identity.
router.get('/coupon-status/:code', storefrontRateLimiter, requireStorefrontApiKey, [query('customerEmail').isEmail().normalizeEmail()], validate, referralController.getCouponEligibility);

// Endpoint for e-commerce or conversion webhooks to record a sale
router.post('/conversion', storefrontRateLimiter, requireStorefrontApiKey, conversionValidator, validate, referralController.recordConversion);

// Team tracking for super affiliates
router.get('/team', authenticate, [query('page').optional().isInt({ min: 1 }), query('limit').optional().isInt({ min: 1, max: 100 })], validate, referralController.getTeam);

module.exports = router;
