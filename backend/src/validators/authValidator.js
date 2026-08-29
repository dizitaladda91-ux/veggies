const { body } = require('express-validator');

const registerValidator = [
  body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('officialEmail').optional({ checkFalsy: true }).isEmail().withMessage('Please provide a valid official email address').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('firstName').notEmpty().withMessage('First name is required').trim(),
  body('lastName').notEmpty().withMessage('Last name is required').trim(),
  body('company').optional().trim(),
  body('role').optional().isIn(['super_affiliate', 'affiliate']).withMessage('Only affiliate roles can be registered publicly'),
  body('recruitmentCode').optional().isString().trim().isLength({ max: 50 }),
];

const loginValidator = [
  body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const refreshTokenValidator = [
  body('refreshToken').optional({ values: 'null' }).isString().notEmpty(),
];

module.exports = {
  registerValidator,
  loginValidator,
  refreshTokenValidator,
};
