const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    weekStartDate: {
      type: Date,
      required: true,
    },
    weekEndDate: {
      type: Date,
      required: true,
    },
    totalStudentsCounseled: {
      type: Number,
      default: 0,
    },
    totalSessionsHeld: {
      type: Number,
      default: 0,
    },
    attendanceSummary: {
      present: { type: Number, default: 0 },
      absent: { type: Number, default: 0 },
      excused: { type: Number, default: 0 },
    },
    openConcerns: {
      type: Number,
      default: 0,
    },
    highlights: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// One report per mentor per week
reportSchema.index({ mentorId: 1, weekStartDate: 1 }, { unique: true });

module.exports = mongoose.model('Report', reportSchema);
