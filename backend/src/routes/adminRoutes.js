const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/rbacMiddleware');
const { ROLES } = require('../constants/roles');

router.use(authenticate);
router.use(authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN));

router.get('/users', adminController.getUsers);
router.patch('/users/:userId/status', adminController.updateUserStatus);
router.delete('/users/:userId', authorizeRoles(ROLES.SUPER_ADMIN), adminController.deleteUser);
router.get('/audit-logs', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN), adminController.getAuditLogs);

module.exports = router;
