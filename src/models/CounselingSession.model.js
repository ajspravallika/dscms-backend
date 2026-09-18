const mongoose = require('mongoose');
const { SESSION_TOPICS, REPORT_STATUS } = require('../config/constants');
const studentRecordSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  studentName: { type: String, required: true },
  studentRollNumber: { type: String, required: true },
  studentDepartment: { type: String, default: '' },
  studentSection: { type: String, default: '' },
  attendance: { type: String, enum: ['present', 'absent', 'excused'], default: 'absent' },
  purpose: { type: String, trim: true, default: '' },
  remarks: { type: String, trim: true, default: '' },
  outcome: { type: String, trim: true, default: '' },
  actionItems: { type: String, trim: true, default: '' },
  absenceRemark: { type: String, trim: true, default: '' },
  nextFollowUpDate: { type: Date, default: null },
  visibleToStudent: { type: Boolean, default: true },
}, { _id: true });
const counselingSessionSchema = new mongoose.Schema({
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  mentorName: { type: String, required: true },
  year: { type: Number, required: true, min: 1, max: 4, index: true },
  department: { type: String, trim: true },
  scheduledDate: { type: Date, required: true },
  actualDate: { type: Date, default: null },
  rescheduleNote: { type: String, trim: true, default: '' },
  topic: { type: String, enum: SESSION_TOPICS, default: 'academic' },
  generalNotes: { type: String, trim: true, default: '' },
  studentRecords: [studentRecordSchema],
  status: { type: String, enum: REPORT_STATUS, default: 'draft', index: true },
  submittedAt: { type: Date, default: null },
  totalStudents: { type: Number, default: 0 },
  presentCount: { type: Number, default: 0 },
  absentCount: { type: Number, default: 0 },
}, { timestamps: true });
counselingSessionSchema.index({ mentorId: 1, scheduledDate: -1 });
counselingSessionSchema.index({ mentorId: 1, year: 1, scheduledDate: -1 });
module.exports = mongoose.model('CounselingSession', counselingSessionSchema);