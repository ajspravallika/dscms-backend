const mongoose = require('mongoose');
const User = require('./User.model');
const { ROLES } = require('../config/constants');

const studentSchema = new mongoose.Schema({
  rollNumber: { type: String, required: true, unique: true, trim: true },
  department: { type: String, trim: true },
  year: { type: Number, min: 1, max: 4, default: null },
  section: { type: String, trim: true },
  parentContact: { type: String, trim: true },
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  isPassout: { type: Boolean, default: false },
  passoutBatch: { type: String, default: null },
  passoutYear: { type: Number, default: null },
});

const Student = User.discriminator(ROLES.STUDENT, studentSchema);
module.exports = Student;
