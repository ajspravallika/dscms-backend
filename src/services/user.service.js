const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const Mentor = require('../models/Mentor.model');
const Student = require('../models/Student.model');
const Assignment = require('../models/Assignment.model');
const CounselingSession = require('../models/CounselingSession.model');
const Message = require('../models/Message.model');
const Concern = require('../models/Concern.model');
const Notification = require('../models/Notification.model');
const Report = require('../models/Report.model');
const generateTempPassword = require('../utils/generatePassword');
const { ROLES } = require('../config/constants');
async function hashPassword(plain) { const salt = await bcrypt.genSalt(12); return bcrypt.hash(plain, salt); }
async function createMentor(payload, adminId) {
  const tempPassword = payload.initialPassword || generateTempPassword();
  const mentor = await Mentor.create({ name: payload.name, email: payload.email.toLowerCase().trim(), password: await hashPassword(tempPassword), department: payload.department, designation: payload.designation, employeeId: payload.employeeId || undefined, phone: payload.phone, createdBy: adminId, mustResetPassword: !payload.initialPassword });
  const safe = mentor.toObject(); delete safe.password; return { mentor: safe, tempPassword };
}
async function createStudent(payload, adminId) {
  const tempPassword = payload.initialPassword || generateTempPassword();
  const student = await Student.create({ name: payload.name, email: payload.email.toLowerCase().trim(), password: await hashPassword(tempPassword), rollNumber: payload.rollNumber, department: payload.department, year: payload.year ? Number(payload.year) : null, section: payload.section, parentContact: payload.parentContact, phone: payload.phone, createdBy: adminId, mustResetPassword: !payload.initialPassword });
  const safe = student.toObject(); delete safe.password; return { student: safe, tempPassword };
}
async function bulkCreateMentors(rows, adminId) {
  const created = [], failed = [], duplicates = [];
  for (const row of rows) {
    try {
      if (!row.Name || !row.Email) throw new Error('Name and Email required');
      const existing = await User.findOne({ email: row.Email.toLowerCase().trim() });
      if (existing) { duplicates.push({ email: row.Email, reason: 'Already exists' }); continue; }
      const r = await createMentor({ name: row.Name, email: row.Email, department: row.Department, designation: row.Designation, employeeId: row.EmployeeId, phone: row.Phone, initialPassword: row.InitialPassword }, adminId);
      created.push({ email: r.mentor.email, tempPassword: r.tempPassword });
    } catch(err) { failed.push({ email: row.Email || '?', reason: err.message }); }
  }
  return { created, duplicates, failed, total: rows.length };
}
async function bulkCreateStudents(rows, adminId) {
  const created = [], failed = [], duplicates = [];
  for (const row of rows) {
    try {
      if (!row.Name || !row.Email || !row.RollNumber) throw new Error('Name, Email and RollNumber required');
      const existing = await User.findOne({ $or: [{ email: row.Email.toLowerCase().trim() }, { rollNumber: row.RollNumber }] });
      if (existing) { duplicates.push({ email: row.Email, rollNumber: row.RollNumber, reason: 'Already exists' }); continue; }
      const r = await createStudent({ name: row.Name, email: row.Email, rollNumber: row.RollNumber, department: row.Department, year: row.Year, section: row.Section, parentContact: row.ParentContact, phone: row.Phone, initialPassword: row.InitialPassword }, adminId);
      created.push({ email: r.student.email, rollNumber: row.RollNumber, tempPassword: r.tempPassword });
    } catch(err) { failed.push({ email: row.Email || '?', rollNumber: row.RollNumber || '?', reason: err.message }); }
  }
  return { created, duplicates, failed, total: rows.length };
}
async function listMentors(filters = {}) {
  const q = { role: 'mentor' };
  if (filters.isActive !== undefined) q.isActive = filters.isActive === 'true' || filters.isActive === true;
  if (filters.department) q.department = filters.department;
  if (filters.search) q.$or = [{ name: new RegExp(filters.search,'i') }, { email: new RegExp(filters.search,'i') }];
  return Mentor.find(q).sort({ name: 1 });
}
async function listStudents(filters = {}) {
  const q = { role: 'student' };
  if (filters.isActive !== undefined) q.isActive = filters.isActive === 'true' || filters.isActive === true;
  if (filters.year) q.year = Number(filters.year);
  if (filters.department) q.department = filters.department;
  if (filters.section) q.section = filters.section;
  if (filters.mentorId) q.mentorId = filters.mentorId;
  if (filters.isPassout !== undefined) q.isPassout = filters.isPassout === 'true' || filters.isPassout === true;
  if (filters.passoutBatch) q.passoutBatch = filters.passoutBatch;
  if (filters.search) q.$or = [{ name: new RegExp(filters.search,'i') }, { email: new RegExp(filters.search,'i') }, { rollNumber: new RegExp(filters.search,'i') }];
  return Student.find(q).sort({ year: 1, name: 1 });
}
async function updateUser(id, updates) {
  const allowed = ['name','phone','isActive','department','designation','employeeId','maxStudentLoad','year','section','parentContact','batchYear'];
  const sanitized = {}; for (const f of allowed) { if (updates[f] !== undefined) sanitized[f] = updates[f]; }
  const user = await User.findByIdAndUpdate(id, sanitized, { new: true, runValidators: true });
  if (!user) { const e = new Error('User not found'); e.statusCode = 404; throw e; } return user;
}
async function deactivateUser(id) {
  const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!user) { const e = new Error('User not found'); e.statusCode = 404; throw e; } return user;
}
async function permanentlyDeleteUser(id) {
  const user = await User.findById(id);
  if (!user) { const e = new Error('User not found'); e.statusCode = 404; throw e; }
  if (user.role === ROLES.MENTOR) {
    const active = await Assignment.countDocuments({ mentorId: id, status: 'active' });
    if (active > 0) { const e = new Error('Mentor has ' + active + ' active student(s). Reassign first.'); e.statusCode = 409; throw e; }
    await CounselingSession.updateMany({ mentorId: id }, { $set: { mentorId: null } });
    await Report.deleteMany({ mentorId: id }); await Message.deleteMany({ $or: [{ senderId: id }, { receiverId: id }] });
    await Assignment.deleteMany({ mentorId: id }); await Notification.deleteMany({ userId: id });
  }
  if (user.role === ROLES.STUDENT) {
    await Assignment.deleteMany({ studentId: id });
    await CounselingSession.updateMany({ 'studentRecords.studentId': id }, { $set: { 'studentRecords.$[elem].studentId': null } }, { arrayFilters: [{ 'elem.studentId': id }] });
    await Concern.deleteMany({ studentId: id }); await Message.deleteMany({ $or: [{ senderId: id }, { receiverId: id }] }); await Notification.deleteMany({ userId: id });
  }
  await User.findByIdAndDelete(id); return { deleted: true };
}
async function promoteStudents(passoutBatchLabel) {
  const batchLabel = passoutBatchLabel || (new Date().getFullYear() + ' Passed Out');
  const year4 = await Student.find({ year: 4, isActive: true, isPassout: false });
  await Student.updateMany({ year: 4, isActive: true, isPassout: false }, { isPassout: true, passoutBatch: batchLabel, batchYear: new Date().getFullYear(), isActive: false, mentorId: null });
  await Assignment.updateMany({ studentId: { $in: year4.map(s => s._id) }, status: 'active' }, { status: 'ended', unassignedAt: new Date() });
  await Student.updateMany({ year: 3, isActive: true, isPassout: false }, { year: 4 });
  await Student.updateMany({ year: 2, isActive: true, isPassout: false }, { year: 3 });
  await Student.updateMany({ year: 1, isActive: true, isPassout: false }, { year: 2 });
  return { promoted: true, passoutBatch: batchLabel, passoutCount: year4.length };
}
async function listPassoutBatches() {
  const batches = await Student.distinct('passoutBatch', { isPassout: true });
  return Promise.all(batches.filter(Boolean).map(async batch => ({ batch, count: await Student.countDocuments({ passoutBatch: batch, isPassout: true }) })));
}
async function deletePassoutBatch(batchLabel) {
  const students = await Student.find({ passoutBatch: batchLabel, isPassout: true });
  const ids = students.map(s => s._id);
  await CounselingSession.updateMany({ 'studentRecords.studentId': { $in: ids } }, { $set: { 'studentRecords.$[elem].studentId': null } }, { arrayFilters: [{ 'elem.studentId': { $in: ids } }] });
  await Concern.deleteMany({ studentId: { $in: ids } }); await Message.deleteMany({ $or: [{ senderId: { $in: ids } }, { receiverId: { $in: ids } }] });
  await Notification.deleteMany({ userId: { $in: ids } }); await Assignment.deleteMany({ studentId: { $in: ids } }); await Student.deleteMany({ passoutBatch: batchLabel, isPassout: true });
  return { deleted: true, count: students.length, batch: batchLabel };
}
module.exports = { createMentor, createStudent, bulkCreateMentors, bulkCreateStudents, listMentors, listStudents, updateUser, deactivateUser, permanentlyDeleteUser, promoteStudents, listPassoutBatches, deletePassoutBatch };