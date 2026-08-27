const systemRepository = require('../repositories/systemRepository');

class SettingsService {
  async getSettings() {
    const settingsList = await systemRepository.getAllSettings();
    const formatted = {};
    settingsList.forEach((s) => {
      formatted[s.key] = s.value;
    });
    return formatted;
  }

  async updateSetting(key, value, description = null, userId = null) {
    return systemRepository.setSetting(key, value, description, userId);
  }
}

module.exports = new SettingsService();
