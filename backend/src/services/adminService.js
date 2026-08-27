const userRepository = require('../repositories/userRepository');
const logRepository = require('../repositories/logRepository');
const ApiError = require('../utils/apiError');

class AdminService {
  async getUsers(params) {
    return userRepository.findAll(params);
  }

  async updateUserStatus({ adminId, userId, status, ipAddress }) {
    const validStatuses = ['active', 'pending', 'suspended', 'rejected'];
    if (!validStatuses.includes(status)) {
      throw ApiError.badRequest(`Invalid status value. Must be one of: ${validStatuses.join(', ')}`);
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (user.role_name === 'super_admin' && status === 'suspended') {
      throw ApiError.forbidden('Super Admin accounts cannot be suspended');
    }

    const updatedUser = await userRepository.updateStatus(userId, status);

    // Audit log
    await logRepository.createAuditLog({
      actorId: adminId,
      targetUserId: userId,
      action: `USER_STATUS_CHANGE_TO_${status.toUpperCase()}`,
      changesJson: { previousStatus: user.status, newStatus: status },
      ipAddress,
    });

    return updatedUser;
  }

  async deleteUser({ adminId, userId, ipAddress }) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (user.role_name === 'super_admin') {
      throw ApiError.forbidden('Super Admin accounts cannot be deleted');
    }

    await userRepository.softDelete(userId);

    await logRepository.createAuditLog({
      actorId: adminId,
      targetUserId: userId,
      action: 'USER_DELETED',
      changesJson: { deletedEmail: user.email },
      ipAddress,
    });

    return { message: 'User successfully deleted' };
  }

  async getAuditLogs(params) {
    return logRepository.getAuditLogs(params);
  }
}

module.exports = new AdminService();
