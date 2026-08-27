const express = require('express');
const { body, param, query } = require('express-validator');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/rbacMiddleware');
const { ROLES } = require('../constants/roles');
const validate = require('../middlewares/validationMiddleware');
const controller = require('../controllers/withdrawalRequest.controller');

const router = express.Router();
router.use(authenticate, authorizeRoles(ROLES.AFFILIATE, ROLES.SUPER_AFFILIATE));
router.post('/', [body('amount').isFloat({ gt: 0 }), body('bankAccountId').isUUID(), body('notes').optional().trim().isLength({ max: 500 })], validate, controller.create);
router.get('/my', [query('page').optional().isInt({ min: 1 }), query('limit').optional().isInt({ min: 1, max: 100 })], validate, controller.listMine);
router.patch('/:id/cancel', [param('id').isString().notEmpty(), body('notes').optional().trim().isLength({ max: 500 })], validate, controller.cancel);
module.exports = router;
