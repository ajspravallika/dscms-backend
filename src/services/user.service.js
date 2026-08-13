const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const Mentor = require('../models/Mentor.model');
const Student = require('../models/Student.model');
const Assignment = require('../models/Assignment.model');
const CounselingSession = require('../models/CounselingSession.model');
const SessionStudent = require('../models/SessionStudent.model');
const Message = require('../models/Message.model');
const Concern = require('../models/Concern.model');
const Notification = require('../models/Notification.model');
const Report = require('../models/Report.model');
const { ROLES } = require('../config/constants');

function generateTempPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#';
  let pwd = '';
  for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  return pwd;
}

async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plain, salt);
}

async function createMentor(payload, adminId) {
  const tempPassword = payload.initialPassword || generateTempPassword();
  const mentor = await Mentor.create({
    name: payload.name, email: payload.email.toLowerCase().trim(),
    password: await hashPassword(tempPassword),
    department: payload.department, designation: payload.designation,
    employeeId: payload.employeeId, phone: payload.phone,
    createdBy: adminId, mustResetPassword: false,
  });
  const safe = mentor.toObject(); delete safe.password;
  return { mentor: safe, tempPassword };
}

async function createStudent(payload, adminId) {
  const tempPassword = payload.initialPassword || generateTempPassword();
  const student = await Student.create({
    name: payload.name, email: payload.email.toLowerCase().trim(),
    password: await hashPassword(tempPassword),
    rollNumber: payload.rollNumber, department: payload.department,
    year: payload.year ? Number(payload.year) : null,
    section: payload.section, parentContact: payload.parentContact,
    phone: payload.phone, createdBy: adminId, mustResetPassword: false,
  });
  const safe = student.toObject(); delete safe.password;
  return { student: safe, tempPassword };
}

async function bulkCreateMentors(rows, adminId) {
  const created = [], failed = [];
  for (const row of rows) {
    try {
      if (!row.Name || !row.Email) throw new Error('Name and Email required');
      const r = await createMentor({ name: row.Name, email: row.Email, department: row.Department, designation: row.Designation, employeeId: row.EmployeeId, phone: row.Phone, initialPassword: row.InitialPassword }, adminId);
      created.push({ email: r.mentor.email, tempPassword: r.tempPassword });
    } catch(err) { failed.push({ email: row.Email || '?', reason: err.message }); }
  }
  return { created, failed };
}

async function bulkCreateStudents(rows, adminId) {
  const created = [], failed = [];
  for (const row of rows) {
    try {
      if (!row.Name || !row.Email || !row.RollNumber) throw new Error('Name, Email and RollNumber required');
      const r = await createStudent({ name: row.Name, email: row.Email, rollNumber: row.RollNumber, department: row.Department, year: row.Year, section: row.Section, parentContact: row.ParentContact, phone: row.Phone, initialPassword: row.InitialPassword }, adminId);
      created.push({ email: r.student.email, tempPassword: r.tempPassword });
    } catch(err) { failed.push({ email: row.Email || '?', rollNumber: row.RollNumber || '?', reason: err.message }); }
  }
  return { created, failed };
}

async function listMentors() { return Mentor.find({}).sort({ createdAt: -1 }); }

async function listStudents(filters = {}) {
  const query = {};
  if (filters.year) query.year = Number(filters.year);
  if (filters.isPassout !== undefined) query.isPassout = filters.isPassout;
  if (filters.passoutBatch) query.passoutBatch = filters.passoutBatch;
  return Student.find(query).sort({ year: 1, name: 1 });
}

async function updateUser(id, updates) {
  const allowed = ['name','phone','isActive','department','designation','employeeId','maxStudentLoad','year','section','parentContact'];
  const sanitized = {};
  for (const f of allowed) { if (updates[f] !== undefined) sanitized[f] = updates[f]; }
  const user = await User.findByIdAndUpdate(id, sanitized, { new: true, runValidators: true });
  if (!user) { const err = new Error('User not found'); err.statusCode = 404; throw err; }
  return user;
}

async function deactivateUser(id) {
  const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!user) { const err = new Error('User not found'); err.statusCode = 404; throw err; }
  return user;
}

async function permanentlyDeleteUser(id) {
  const user = await User.findById(id);
  if (!user) { const err = new Error('User not found'); err.statusCode = 404; throw err; }

  if (user.role === ROLES.MENTOR) {
    const active = await Assignment.countDocuments({ mentorId: id, status: 'active' });
    if (active > 0) { const err = new Error(`This mentor has ${active} active student(s). Reassign them first.`); err.statusCode = 409; throw err; }
    const sessions = await CounselingSession.find({ mentorId: id });
    await SessionStudent.deleteMany({ sessionId: { $in: sessions.map(s => s._id) } });
    await CounselingSession.deleteMany({ mentorId: id });
    await Report.deleteMany({ mentorId: id });
    await Message.deleteMany({ $or: [{ senderId: id }, { receiverId: id }] });
    await Assignment.deleteMany({ mentorId: id });
    await Notification.deleteMany({ userId: id });
  }

  if (user.role === ROLES.STUDENT) {
    await Assignment.deleteMany({ studentId: id });
    await SessionStudent.deleteMany({ studentId: id });
    await Concern.deleteMany({ studentId: id });
    await Message.deleteMany({ $or: [{ senderId: id }, { receiverId: id }] });
    await Notification.deleteMany({ userId: id });
  }

  await User.findByIdAndDelete(id);
  return { deleted: true };
}

async function promoteStudents(passoutBatchLabel) {
  const year4 = await Student.find({ year: 4, isActive: true, isPassout: false });
  const batchLabel = passoutBatchLabel || `Batch of ${new Date().getFullYear()}`;

  await Student.updateMany({ year: 4, isActive: true, isPassout: false }, { isPassout: true, passoutBatch: batchLabel, passoutYear: new Date().getFullYear(), isActive: false, mentorId: null });
  await Assignment.updateMany({ studentId: { $in: year4.map(s => s._id) }, status: 'active' }, { status: 'ended', unassignedAt: new Date() });
  await Student.updateMany({ year: 3, isActive: true, isPassout: false }, { year: 4 });
  await Student.updateMany({ year: 2, isActive: true, isPassout: false }, { year: 3 });
  await Student.updateMany({ year: 1, isActive: true, isPassout: false }, { year: 2 });

  return { promoted: true, passoutBatch: batchLabel, passoutCount: year4.length };
}

async function deletePassoutBatch(batchLabel) {
  const students = await Student.find({ passoutBatch: batchLabel, isPassout: true });
  const ids = students.map(s => s._id);
  await SessionStudent.deleteMany({ studentId: { $in: ids } });
  await Concern.deleteMany({ studentId: { $in: ids } });
  await Message.deleteMany({ $or: [{ senderId: { $in: ids } }, { receiverId: { $in: ids } }] });
  await Notification.deleteMany({ userId: { $in: ids } });
  await Assignment.deleteMany({ studentId: { $in: ids } });
  await Student.deleteMany({ passoutBatch: batchLabel, isPassout: true });
  return { deleted: true, count: students.length, batch: batchLabel };
}

async function listPassoutBatches() {
  const batches = await Student.distinct('passoutBatch', { isPassout: true });
  return Promise.all(batches.filter(Boolean).map(async batch => ({
    batch, count: await Student.countDocuments({ passoutBatch: batch, isPassout: true })
  })));
}

async function reassignMentorStudents(fromId, toId) {
  const toMentor = await Mentor.findOne({ _id: toId, role: 'mentor', isActive: true });
  if (!toMentor) { const err = new Error('Target mentor not found'); err.statusCode = 404; throw err; }
  await Assignment.updateMany({ mentorId: fromId, status: 'active' }, { mentorId: toId });
  await Student.updateMany({ mentorId: fromId }, { mentorId: toId });
  return { reassigned: true };
}

module.exports = { createMentor, createStudent, bulkCreateMentors, bulkCreateStudents, listMentors, listStudents, updateUser, deactivateUser, permanentlyDeleteUser, promoteStudents, deletePassoutBatch, listPassoutBatches, reassignMentorStudents };
