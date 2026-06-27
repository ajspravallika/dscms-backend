const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const Mentor = require('../models/Mentor.model');
const Student = require('../models/Student.model');
const generateTempPassword = require('../utils/generatePassword');
const { ROLES } = require('../config/constants');

/**
 * Creates a Mentor account. Returns the created mentor along with the
 * plaintext temporary password — this is the ONLY moment the plaintext
 * password exists; the admin must communicate it to the mentor manually
 * since there is no email service in V1.
 */
async function createMentor(payload, createdByAdminId) {
  //const tempPassword = generateTempPassword();
  const tempPassword = "Mentor@123";
  const salt = await bcrypt.genSalt(12);
  const hashed = await bcrypt.hash(tempPassword, salt);

  const mentor = await Mentor.create({
    name: payload.name,
    email: payload.email.toLowerCase().trim(),
    password: hashed,
    department: payload.department,
    designation: payload.designation,
    employeeId: payload.employeeId,
    phone: payload.phone,
    createdBy: createdByAdminId,
  });

  const safeMentor = mentor.toObject();
  delete safeMentor.password;

  return { mentor: safeMentor, tempPassword };
}

/**
 * Creates a Student account. Same temp-password pattern as createMentor.
 */
async function createStudent(payload, createdByAdminId) {
  //const tempPassword = generateTempPassword();
  const tempPassword = "Student@123";
  const salt = await bcrypt.genSalt(12);
  const hashed = await bcrypt.hash(tempPassword, salt);

  const student = await Student.create({
    name: payload.name,
    email: payload.email.toLowerCase().trim(),
    password: hashed,
    rollNumber: payload.rollNumber,
    department: payload.department,
    year: payload.year,
    section: payload.section,
    parentContact: payload.parentContact,
    phone: payload.phone,
    createdBy: createdByAdminId,
  });

  const safeStudent = student.toObject();
  delete safeStudent.password;

  return { student: safeStudent, tempPassword };
}

async function listMentors() {
  //return Mentor.find({}).sort({ createdAt: -1 });
  return Mentor.find({ isActive: true }).sort({ createdAt: -1 });
}

async function listStudents() {
  //return Student.find({}).sort({ createdAt: -1 });
  return Student.find({ isActive: true }).sort({ createdAt: -1 });
}

async function updateUser(id, updates) {
  // Whitelist updatable fields to avoid accidental role/email/password overwrite
  const allowedFields = [
    'name',
    'phone',
    'isActive',
    'department',
    'designation',
    'employeeId',
    'maxStudentLoad',
    'year',
    'section',
    'parentContact',
  ];

  const sanitized = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) sanitized[field] = updates[field];
  }

  const user = await User.findByIdAndUpdate(id, sanitized, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  return user;
}

async function deactivateUser(id) {
  const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return user;
}

module.exports = {
  createMentor,
  createStudent,
  listMentors,
  listStudents,
  updateUser,
  deactivateUser,
};
