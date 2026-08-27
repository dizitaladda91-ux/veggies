const dashboardService = require('../services/dashboardService');
const { sendSuccess } = require('../helpers/responseHelper');
const asyncHandler = require('../utils/asyncHandler');

class DashboardController {
  getDashboard = asyncHandler(async (req, res) => {
    const data = await dashboardService.getDashboardData(req.user);
    return sendSuccess(res, 'Dashboard overview data fetched', data);
  });
}

module.exports = new DashboardController();
