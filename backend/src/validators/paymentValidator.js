const { body } = require('express-validator');

const createOrderValidator = [
  body('amount').isFloat({ gt: 0, max: 10000000 }).withMessage('A valid amount is required'),
  body('currency').optional().isLength({ min: 3, max: 3 }).toUpperCase(),
  body('customer').isObject().withMessage('Customer details are required'),
  body('customer.email').isEmail().normalizeEmail().withMessage('A customer email is required for one-time coupon validation'),
  body('referralCode').notEmpty().trim().isLength({ max: 50 }),
  body('clickId').isUUID().withMessage('A valid click ID is required'),
];
const verifyPaymentValidator = [
  body('razorpay_order_id').notEmpty().trim(),
  body('razorpay_payment_id').notEmpty().trim(),
  body('razorpay_signature').notEmpty().trim(),
];
module.exports = { createOrderValidator, verifyPaymentValidator };
