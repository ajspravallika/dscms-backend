const mongoose = require('mongoose');
const { ASSIGNMENT_STATUS } = require('../config/constants');

const assignmentSchema = new mongoose.Schema(
  {
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    unassignedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ASSIGNMENT_STATUS,
      default: 'active',
    },
  },
  { timestamps: true }
);

// A student can have at most ONE active assignment at a time.
// Partial unique index: only enforced among documents where status === 'active'.
assignmentSchema.index(
  { studentId: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } }
);

module.exports = mongoose.model('Assignment', assignmentSchema);