const express = require('express');
const router = express.Router();
const marketingAssetController = require('../controllers/marketingAssetController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/rbacMiddleware');
const { ROLES } = require('../constants/roles');

router.use(authenticate);

router.get('/', marketingAssetController.getAssets);
router.post('/', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN), marketingAssetController.createAsset);
router.delete('/:id', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN), marketingAssetController.deleteAsset);

module.exports = router;
