const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/rbacMiddleware');
const { ROLES } = require('../constants/roles');

router.use(authenticate);

router.get('/', settingsController.getSettings);
router.post('/', authorizeRoles(ROLES.SUPER_ADMIN), settingsController.updateSetting);

module.exports = router;
