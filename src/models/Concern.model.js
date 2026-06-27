const mongoose = require('mongoose');
const { CONCERN_CATEGORIES, CONCERN_STATUS } = require('../config/constants');

const concernSchema = new mongoose.Schema(
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
    title: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: CONCERN_CATEGORIES,
      default: 'other',
    },
    status: {
      type: String,
      enum: CONCERN_STATUS,
      default: 'open',
    },
    mentorResponse: {
      type: String,
      trim: true,
      default: '',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Concern', concernSchema);
