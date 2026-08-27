const express = require('express');
const paymentController = require('../controllers/paymentController');
const validate = require('../middlewares/validationMiddleware');
const { paymentRateLimiter } = require('../middlewares/rateLimiter');
const { createOrderValidator, verifyPaymentValidator } = require('../validators/paymentValidator');
const { requireStorefrontApiKey } = require('../middlewares/storefrontAuthMiddleware');

const router = express.Router();
router.post('/create-order', paymentRateLimiter, requireStorefrontApiKey, createOrderValidator, validate, paymentController.createOrder);
router.post('/verify', paymentRateLimiter, requireStorefrontApiKey, verifyPaymentValidator, validate, paymentController.verifyPayment);
router.post('/webhook', paymentController.webhook);
module.exports = router;
