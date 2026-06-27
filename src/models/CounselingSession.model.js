const mongoose = require('mongoose');
const { SESSION_TOPICS, SESSION_VISIBILITY } = require('../config/constants');

const counselingSessionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sessionDate: {
      type: Date,
      required: [true, 'Session date is required'],
    },
    mode: {
      type: String,
      enum: ['in-person'], // V1 deliberately preserves face-to-face counseling only
      default: 'in-person',
    },
    topic: {
      type: String,
      enum: SESSION_TOPICS,
      default: 'other',
    },
    remarks: {
      type: String,
      required: [true, 'Counseling remarks are required'],
      trim: true,
    },
    actionItems: {
      type: String,
      trim: true,
    },
    nextFollowUpDate: {
      type: Date,
      default: null,
    },
    visibility: {
      type: String,
      enum: SESSION_VISIBILITY,
      default: 'student-visible',
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

counselingSessionSchema.index({ mentorId: 1, sessionDate: -1 });
counselingSessionSchema.index({ studentId: 1, sessionDate: -1 });

module.exports = mongoose.model('CounselingSession', counselingSessionSchema);
