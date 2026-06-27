const mongoose = require('mongoose');
const User = require('./User.model');
const { ROLES } = require('../config/constants');

const mentorSchema = new mongoose.Schema({
  department: {
    type: String,
    trim: true,
  },
  designation: {
    type: String,
    trim: true,
  },
  employeeId: {
    type: String,
    unique: true,
    sparse: true, // allows multiple docs with no employeeId without violating uniqueness
    trim: true,
  },
  maxStudentLoad: {
    type: Number,
    default: 30,
  },
});

const Mentor = User.discriminator(ROLES.MENTOR, mentorSchema);

module.exports = Mentor;
