const express = require('express');
const router = express.Router();
const commissionController = require('../controllers/commissionController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/rbacMiddleware');
const { ROLES } = require('../constants/roles');
const { createRuleValidator } = require('../validators/commissionValidator');
const validate = require('../middlewares/validationMiddleware');

router.use(authenticate);

router.get('/rules', commissionController.getRules);
router.post('/rules', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN), createRuleValidator, validate, commissionController.createRule);
router.get('/admin/all', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN), commissionController.getAllCommissionsForAdmin);
router.patch('/:commissionId/status', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN), commissionController.updateStatus);
router.post('/auto-settle', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN), commissionController.autoSettle);

module.exports = router;
