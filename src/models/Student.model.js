const mongoose = require('mongoose');
const User = require('./User.model');
const { ROLES } = require('../config/constants');
const studentSchema = new mongoose.Schema({
  rollNumber: { type: String, required: true, unique: true, trim: true },
  department: { type: String, trim: true },
  year: { type: Number, min: 1, max: 4, default: null },
  section: { type: String, trim: true },
  parentContact: { type: String, trim: true },
  batchYear: { type: Number, default: null },
  isPassout: { type: Boolean, default: false },
  passoutBatch: { type: String, default: null },
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
});
studentSchema.index({ year: 1, department: 1 });
studentSchema.index({ isPassout: 1, passoutBatch: 1 });
module.exports = User.discriminator(ROLES.STUDENT, studentSchema);