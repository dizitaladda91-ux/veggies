const { body } = require('express-validator');

const accountFields = [
  body('accountHolderName')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Account holder name must be 3 to 100 characters.'),

  body('bankName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Bank name must be 2 to 100 characters.'),

  body('accountNumber')
    .trim()
    .matches(/^[0-9]{9,18}$/)
    .withMessage('Account number must contain 9 to 18 digits.'),

  body(['ifscCode', 'ifsc_code'])
    .customSanitizer((val) => (val ? String(val).trim().toUpperCase() : ''))
    .custom((val, { req }) => {
      // If user provided an IFSC code, validate format
      const ifsc = val || req.body.ifscCode || req.body.ifsc_code || '';
      if (!ifsc) {
        // If no IFSC provided but UPI ID is present, allow it
        if (req.body.upiId || req.body.upi_id) return true;
        throw new Error('IFSC code is required (e.g. SBIN0001234).');
      }
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
        throw new Error('Invalid IFSC code format (e.g. SBIN0001234).');
      }
      return true;
    }),

  body('branchName')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Branch name must be at most 100 characters.'),

  body(['upiId', 'upi_id'])
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('UPI ID must be at most 100 characters.'),

  body('accountType')
    .optional({ checkFalsy: true })
    .customSanitizer((val) => (val ? String(val).toUpperCase() : 'SAVINGS'))
    .isIn(['SAVINGS', 'CURRENT'])
    .withMessage('Account type must be SAVINGS or CURRENT.'),
];

module.exports = {
  createBankAccountSchema: [...accountFields, body('isDefault').optional().isBoolean().withMessage('isDefault must be boolean.')],
  updateBankAccountSchema: accountFields,
};
