const adminService = require('../services/adminService');
const { sendSuccess } = require('../helpers/responseHelper');
const asyncHandler = require('../utils/asyncHandler');

class AdminController {
  getUsers = asyncHandler(async (req, res) => {
    const { page, limit, role, status, search } = req.query;
    const result = await adminService.getUsers({
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '10', 10),
      role,
      status,
      search,
    });
    return sendSuccess(res, 'Users fetched successfully', result.users, HTTP_STATUS.OK, {
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    });
  });

  updateUserStatus = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { status } = req.body;
    const result = await adminService.updateUserStatus({
      adminId: req.user.id,
      userId,
      status,
      ipAddress: req.ip,
    });
    return sendSuccess(res, `User status updated to ${status}`, result);
  });

  deleteUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const result = await adminService.deleteUser({
      adminId: req.user.id,
      userId,
      ipAddress: req.ip,
    });
    return sendSuccess(res, 'User deleted successfully', result);
  });

  getAuditLogs = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const logs = await adminService.getAuditLogs({
      limit: parseInt(limit, 10),
      offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
    });
    return sendSuccess(res, 'Audit logs fetched successfully', logs);
  });
}

const HTTP_STATUS = require('../constants/httpStatusCodes');
module.exports = new AdminController();
