const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/overview', dashboardController.getDashboard);

module.exports = router;
