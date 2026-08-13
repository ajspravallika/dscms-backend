const mongoose = require('mongoose');
const { SESSION_TOPICS } = require('../config/constants');

const counselingSessionSchema = new mongoose.Schema({
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sessionDate: { type: Date, required: true },
  year: { type: Number, required: true, min: 1, max: 4 },
  topic: { type: String, enum: SESSION_TOPICS, default: 'other' },
  generalNotes: { type: String, trim: true },
  submittedToAdmin: { type: Boolean, default: false },
  submittedAt: { type: Date, default: null },
}, { timestamps: true });

counselingSessionSchema.index({ mentorId: 1, sessionDate: -1 });
counselingSessionSchema.index({ mentorId: 1, year: 1, sessionDate: -1 });
module.exports = mongoose.model('CounselingSession', counselingSessionSchema);
