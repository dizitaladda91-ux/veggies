const { body } = require('express-validator');

const accountFields = [
  body('accountHolderName')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Account holder name must be 3 to 100 characters.'),

  body('bankName')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Bank name must be 2 to 100 characters.'),

  body('accountNumber')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .custom((val, { req }) => {
      const upi = req.body.upiId || req.body.upi_id;
      if (!val && upi) return true;
      if (!val) throw new Error('Account number or UPI ID is required.');
      if (!/^[0-9]{9,18}$/.test(val)) throw new Error('Account number must contain 9 to 18 digits.');
      return true;
    }),

  body(['ifscCode', 'ifsc_code'])
    .optional({ nullable: true, checkFalsy: true })
    .customSanitizer((val) => (val ? String(val).trim().toUpperCase() : ''))
    .custom((val, { req }) => {
      const ifsc = val || req.body.ifscCode || req.body.ifsc_code || '';
      const upi = req.body.upiId || req.body.upi_id;
      if (!ifsc && upi) return true;
      if (!ifsc) throw new Error('IFSC code or UPI ID is required.');
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
    .custom((val) => {
      if (!val) return true;
      const isStandardUpi = /^[\w.-]+@[\w.-]+$/i.test(val);
      const isMobile = /^[6-9]\d{9}$/.test(val);
      if (!isStandardUpi && !isMobile) {
        throw new Error('Invalid UPI ID or Mobile Number. (e.g. name@ybl or 9876543210)');
      }
      return true;
    }),

  body(['documentUrl', 'document_url'])
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage('Document URL must be a string.'),

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
