const profileRepository = require('../repositories/profileRepository');
const userRepository = require('../repositories/userRepository');
const ApiError = require('../utils/apiError');
const passwordUtils = require('../utils/passwordUtils');
const authService = require('./authService');

class ProfileService {
  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  }

  async updateProfile(userId, data) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const email = data.email?.trim().toLowerCase();
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      throw ApiError.badRequest('Please provide a valid email address');
    }
    let emailChanged = false;
    if (email && email !== user.email) {
      const existingUser = await userRepository.findByEmail(email);
      if (existingUser) {
        throw ApiError.conflict('Email address is already registered');
      }
      await userRepository.updateEmail(userId, email);
      emailChanged = true;
    }

    if (data.newPassword) {
      if (!data.currentPassword) {
        throw ApiError.badRequest('Enter your current password to create a new password');
      }
      if (data.newPassword.length < 8) {
        throw ApiError.badRequest('New password must be at least 8 characters long');
      }
      const userWithPassword = await userRepository.findByEmail(user.email);
      const passwordMatches = await passwordUtils.comparePassword(data.currentPassword, userWithPassword.password_hash);
      if (!passwordMatches) {
        throw ApiError.badRequest('Current password is incorrect');
      }
      await userRepository.updatePassword(userId, await passwordUtils.hashPassword(data.newPassword));
    }

    await profileRepository.update(userId, data);
    if (emailChanged) {
      await authService.sendEmailVerification(userId);
    }
    return this.getProfile(userId);
  }
}

module.exports = new ProfileService();
