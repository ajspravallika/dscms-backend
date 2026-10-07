const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const settingsService = require('../services/settings.service');

const getSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.getSettings();
  return success(res, 200, { settings });
});

const updateSetting = asyncHandler(async (req, res) => {
  const setting = await settingsService.updateSetting(req.params.key, req.body.value, req.user.id);
  return success(res, 200, { setting }, 'Setting updated');
});

module.exports = { getSettings, updateSetting };
