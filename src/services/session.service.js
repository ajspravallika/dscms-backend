const CounselingSession = require('../models/CounselingSession.model');
const Student = require('../models/Student.model');
const Notification = require('../models/Notification.model');
async function createOrUpdateSession(mentorId, mentorName, payload) {
  const { year, scheduledDate, actualDate, rescheduleNote, topic, generalNotes, studentRecords } = payload;
  const schedDate = new Date(scheduledDate);
  const dayStart = new Date(schedDate.toDateString());
  const dayEnd = new Date(dayStart.getTime() + 86400000);
  let session = await CounselingSession.findOne({ mentorId, year, scheduledDate: { $gte: dayStart, $lt: dayEnd }, status: 'draft' });
  let records = studentRecords;
  if (!records || !records.length) {
    const students = await Student.find({ mentorId, year: Number(year), isActive: true, isPassout: false });
    records = students.map(s => ({ studentId: s._id, studentName: s.name, studentRollNumber: s.rollNumber, studentDepartment: s.department || '', studentSection: s.section || '', attendance: 'absent' }));
  }
  const presentCount = records.filter(r => r.attendance === 'present').length;
  const absentCount = records.length - presentCount;
  if (session) {
    session.actualDate = actualDate || null; session.rescheduleNote = rescheduleNote || '';
    session.topic = topic || 'academic'; session.generalNotes = generalNotes || '';
    session.studentRecords = records; session.totalStudents = records.length;
    session.presentCount = presentCount; session.absentCount = absentCount;
    await session.save();
  } else {
    session = await CounselingSession.create({ mentorId, mentorName, year, scheduledDate: schedDate, actualDate: actualDate || null, rescheduleNote: rescheduleNote || '', topic: topic || 'academic', generalNotes: generalNotes || '', studentRecords: records, status: 'draft', totalStudents: records.length, presentCount, absentCount });
  }
  return session;
}
async function getSessionsForMentor(mentorId, filters = {}) {
  const q = { mentorId };
  if (filters.year) q.year = Number(filters.year);
  if (filters.status) q.status = filters.status;
  return CounselingSession.find(q).sort({ scheduledDate: -1 });
}
async function getSessionById(sessionId, mentorId) {
  const q = { _id: sessionId };
  if (mentorId) q.mentorId = mentorId;
  const session = await CounselingSession.findOne(q);
  if (!session) { const e = new Error('Session not found'); e.statusCode = 404; throw e; }
  return session;
}
async function submitSession(sessionId, mentorId) {
  const session = await CounselingSession.findOne({ _id: sessionId, mentorId });
  if (!session) { const e = new Error('Session not found'); e.statusCode = 404; throw e; }
  if (session.status === 'submitted') { const e = new Error('Already submitted'); e.statusCode = 400; throw e; }
  session.status = 'submitted'; session.submittedAt = new Date(); await session.save(); return session;
}
async function loadStudentsForSession(mentorId, year) {
  const students = await Student.find({ mentorId, year: Number(year), isActive: true, isPassout: false }).sort({ name: 1 });
  return students.map(s => ({ studentId: s._id, studentName: s.name, studentRollNumber: s.rollNumber, studentDepartment: s.department || '', studentSection: s.section || '', attendance: 'absent', purpose: '', remarks: '', outcome: '', actionItems: '' }));
}
async function getStudentCounselingHistory(studentId) {
  const sessions = await CounselingSession.find({ 'studentRecords.studentId': studentId, status: 'submitted' }).sort({ scheduledDate: -1 });
  return sessions.map(session => {
    const record = session.studentRecords.find(r => r.studentId && r.studentId.toString() === studentId.toString());
    return { sessionId: session._id, scheduledDate: session.scheduledDate, year: session.year, mentorName: session.mentorName, topic: session.topic, record };
  }).filter(s => s.record && s.record.visibleToStudent);
}
async function getAllSessionsForAdmin(filters = {}) {
  const q = { status: 'submitted' };
  if (filters.year) q.year = Number(filters.year);
  if (filters.mentorId) q.mentorId = filters.mentorId;
  if (filters.topic) q.topic = filters.topic;
  if (filters.dateFrom || filters.dateTo) { q.scheduledDate = {}; if (filters.dateFrom) q.scheduledDate.$gte = new Date(filters.dateFrom); if (filters.dateTo) q.scheduledDate.$lte = new Date(filters.dateTo); }
  return CounselingSession.find(q).populate('mentorId', 'name email department').sort({ scheduledDate: -1 });
}
module.exports = { createOrUpdateSession, getSessionsForMentor, getSessionById, submitSession, loadStudentsForSession, getStudentCounselingHistory, getAllSessionsForAdmin };