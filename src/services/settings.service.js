const SystemSettings = require('../models/SystemSettings.model');

const DEFAULTS = [
  { key: 'defaultMentorPassword', value: 'Mentor@dscms', label: 'Default Mentor Password' },
  { key: 'defaultStudentPassword', value: 'Student@dscms', label: 'Default Student Password' },
];

async function seedSettings() {
  for (const s of DEFAULTS) {
    const exists = await SystemSettings.findOne({ key: s.key });
    if (!exists) await SystemSettings.create(s);
  }
}

async function getSettings() {
  await seedSettings();
  return SystemSettings.find().sort({ key: 1 });
}

async function getSetting(key) {
  await seedSettings();
  const s = await SystemSettings.findOne({ key });
  return s ? s.value : null;
}

async function updateSetting(key, value, adminId) {
  const s = await SystemSettings.findOneAndUpdate(
    { key },
    { value, updatedBy: adminId },
    { new: true, upsert: true }
  );
  return s;
}

module.exports = { getSettings, getSetting, updateSetting, seedSettings };
