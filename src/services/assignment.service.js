const Assignment = require('../models/Assignment.model');
const Student = require('../models/Student.model');
const Mentor = require('../models/Mentor.model');
async function assignStudents(mentorId, studentIds, adminId) {
  const mentor = await Mentor.findOne({ _id: mentorId, isActive: true });
  if (!mentor) { const e = new Error('Mentor not found'); e.statusCode = 404; throw e; }
  const results = { assigned: [], failed: [] };
  for (const studentId of studentIds) {
    try {
      const student = await Student.findOne({ _id: studentId, isActive: true });
      if (!student) throw new Error('Student not found');
      await Assignment.updateMany({ studentId, status: 'active' }, { status: 'ended', unassignedAt: new Date() });
      await Assignment.create({ mentorId, studentId, assignedBy: adminId, status: 'active' });
      student.mentorId = mentorId; await student.save();
      results.assigned.push(studentId);
    } catch(err) { results.failed.push({ studentId, reason: err.message }); }
  }
  return results;
}
async function unassignStudents(studentIds) {
  for (const studentId of studentIds) {
    await Assignment.updateMany({ studentId, status: 'active' }, { status: 'ended', unassignedAt: new Date() });
    await Student.findByIdAndUpdate(studentId, { mentorId: null });
  }
  return { unassigned: studentIds.length };
}
async function listAssignments(filters = {}) {
  const query = { status: 'active' };
  if (filters.mentorId) query.mentorId = filters.mentorId;
  return Assignment.find(query).populate('mentorId', 'name email department').populate('studentId', 'name email rollNumber department year section').sort({ assignedAt: -1 });
}
async function getMentorWorkload(mentorId) {
  const students = await Student.find({ mentorId, isActive: true, isPassout: false });
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, total: 0 };
  students.forEach(s => { if (s.year >= 1 && s.year <= 4) { counts[s.year]++; counts.total++; } });
  return counts;
}
async function verifyMentorOwnsStudent(mentorId, studentId) {
  const a = await Assignment.findOne({ mentorId, studentId, status: 'active' });
  if (!a) { const e = new Error('Student not assigned to you.'); e.statusCode = 403; throw e; }
  return a;
}
module.exports = { assignStudents, unassignStudents, listAssignments, getMentorWorkload, verifyMentorOwnsStudent };