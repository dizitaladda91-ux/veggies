const profileService = require('../services/profileService');
const { sendSuccess } = require('../helpers/responseHelper');
const asyncHandler = require('../utils/asyncHandler');

class ProfileController {
  getProfile = asyncHandler(async (req, res) => {
    const user = await profileService.getProfile(req.user.id);
    return sendSuccess(res, 'User profile retrieved', user);
  });

  updateProfile = asyncHandler(async (req, res) => {
    const updated = await profileService.updateProfile(req.user.id, req.body);
    return sendSuccess(res, 'Profile updated successfully', updated);
  });
}

module.exports = new ProfileController();
