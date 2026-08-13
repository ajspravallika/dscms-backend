const mongoose = require('mongoose');
const { ATTENDANCE_STATUS } = require('../config/constants');

const sessionStudentSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'CounselingSession', required: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  attendance: { type: String, enum: ATTENDANCE_STATUS, default: 'absent' },
  remarks: { type: String, trim: true, default: '' },
  actionItems: { type: String, trim: true, default: '' },
  nextFollowUpDate: { type: Date, default: null },
  visibility: { type: String, enum: ['student-visible', 'mentor-only'], default: 'student-visible' },
}, { timestamps: true });

sessionStudentSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });
sessionStudentSchema.index({ studentId: 1, mentorId: 1 });
module.exports = mongoose.model('SessionStudent', sessionStudentSchema);
