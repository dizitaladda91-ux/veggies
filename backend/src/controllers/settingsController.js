const settingsService = require('../services/settingsService');
const { sendSuccess } = require('../helpers/responseHelper');
const asyncHandler = require('../utils/asyncHandler');

class SettingsController {
  getSettings = asyncHandler(async (req, res) => {
    const settings = await settingsService.getSettings();
    return sendSuccess(res, 'System settings retrieved', settings);
  });

  updateSetting = asyncHandler(async (req, res) => {
    const { key, value, description } = req.body;
    const updated = await settingsService.updateSetting(key, value, description, req.user.id);
    return sendSuccess(res, `Setting '${key}' updated`, updated);
  });
}

module.exports = new SettingsController();
