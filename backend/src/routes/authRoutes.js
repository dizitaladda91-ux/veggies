const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { registerValidator, loginValidator, refreshTokenValidator } = require('../validators/authValidator');
const validate = require('../middlewares/validationMiddleware');
const { authenticate } = require('../middlewares/authMiddleware');
const { authRateLimiter } = require('../middlewares/rateLimiter');
const { body } = require('express-validator');

router.post('/send-registration-otp', authRateLimiter, [body('email').isEmail().withMessage('Please enter a valid official email address').normalizeEmail()], validate, authController.sendRegistrationOtp);
router.post('/verify-registration-otp', authRateLimiter, [body('email').isEmail().normalizeEmail(), body('otpCode').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')], validate, authController.verifyRegistrationOtp);
router.post('/register', authRateLimiter, registerValidator, validate, authController.register);
router.post('/login', authRateLimiter, loginValidator, validate, authController.login);
router.post('/mfa/setup', authRateLimiter, [body('mfaToken').isString().notEmpty()], validate, authController.beginMfaSetup);
router.post('/mfa/enable', authRateLimiter, [body('mfaToken').isString().notEmpty(), body('secret').isString().notEmpty(), body('code').isLength({ min: 6, max: 6 })], validate, authController.enableMfa);
router.post('/mfa/verify-login', authRateLimiter, [body('mfaToken').isString().notEmpty(), body('code').isLength({ min: 6, max: 6 })], validate, authController.verifyMfaLogin);
router.post('/refresh-token', refreshTokenValidator, validate, authController.refreshToken);
router.post('/forgot-password', authRateLimiter, [body('email').isEmail()], validate, authController.forgotPassword);
router.post('/reset-password', authRateLimiter, [body('token').notEmpty(), body('password').isLength({ min: 8 })], validate, authController.resetPassword);
router.post('/email-verification', authenticate, authRateLimiter, authController.sendEmailVerification);
router.post('/verify-email', authRateLimiter, [body('token').isString().notEmpty()], validate, authController.verifyEmail);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router;
