const mongoose = require('mongoose');
const User = require('./User.model');
const { ROLES } = require('../config/constants');

const studentSchema = new mongoose.Schema({
  rollNumber: {
    type: String,
    required: [true, 'Roll number is required'],
    unique: true,
    trim: true,
  },
  department: {
    type: String,
    trim: true,
  },
  year: {
    type: Number,
    min: 1,
    max: 4,
  },
  section: {
    type: String,
    trim: true,
  },
  parentContact: {
    type: String,
    trim: true,
  },
  // Denormalized for fast "who is my mentor" / "give me this mentor's students"
  // lookups. Source of truth for assignment HISTORY remains the Assignment
  // collection; this field always mirrors the current active assignment.
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
});

const Student = User.discriminator(ROLES.STUDENT, studentSchema);

module.exports = Student;
