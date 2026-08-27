const express = require('express');
const router = express.Router();
const affiliateController = require('../controllers/affiliateController');
const { authenticate } = require('../middlewares/authMiddleware');
const { body } = require('express-validator');
const validate = require('../middlewares/validationMiddleware');

router.use(authenticate);

router.get('/links', affiliateController.getLinks);
router.post('/links', [body('referralCode').optional({ values: 'falsy' }).isString().trim().isLength({ max: 50 }).withMessage('Referral name must be 50 characters or less')], validate, affiliateController.createLink);
router.get('/earnings', affiliateController.getEarnings);

module.exports = router;
