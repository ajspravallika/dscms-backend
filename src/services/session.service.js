const CounselingSession = require('../models/CounselingSession.model');
const SessionStudent = require('../models/SessionStudent.model');
const Student = require('../models/Student.model');
const Notification = require('../models/Notification.model');

async function createSession(mentorId, payload) {
  const { sessionDate, year, topic, generalNotes, studentRecords } = payload;

  const session = await CounselingSession.create({
    mentorId, sessionDate, year, topic: topic || 'other', generalNotes: generalNotes || '',
  });

  const assignedStudents = await Student.find({ mentorId, year: Number(year), isActive: true, isPassout: false });

  if (assignedStudents.length === 0) {
    await CounselingSession.findByIdAndDelete(session._id);
    const err = new Error(`No active Year ${year} students assigned to you.`);
    err.statusCode = 400; throw err;
  }

  const recordMap = {};
  if (studentRecords && Array.isArray(studentRecords)) {
    for (const r of studentRecords) recordMap[r.studentId] = r;
  }

  const docs = assignedStudents.map((student) => {
    const record = recordMap[student._id.toString()];
    const isPresent = record && record.attendance === 'present';
    return {
      sessionId: session._id, studentId: student._id, mentorId,
      attendance: record ? record.attendance : 'absent',
      remarks: isPresent ? (record.remarks || '') : '',
      actionItems: isPresent ? (record.actionItems || '') : '',
      nextFollowUpDate: isPresent ? (record.nextFollowUpDate || null) : null,
    };
  });

  await SessionStudent.insertMany(docs);
  return { session, totalStudents: assignedStudents.length };
}

async function listSessionsForMentor(mentorId, year) {
  const filter = { mentorId };
  if (year) filter.year = Number(year);
  const sessions = await CounselingSession.find(filter).sort({ sessionDate: -1 });

  return Promise.all(sessions.map(async (session) => {
    const total = await SessionStudent.countDocuments({ sessionId: session._id });
    const present = await SessionStudent.countDocuments({ sessionId: session._id, attendance: 'present' });
    return { ...session.toObject(), totalStudents: total, presentCount: present, absentCount: total - present };
  }));
}

async function getSessionDetail(mentorId, sessionId) {
  const session = await CounselingSession.findOne({ _id: sessionId, mentorId });
  if (!session) { const err = new Error('Session not found.'); err.statusCode = 404; throw err; }
  const studentRecords = await SessionStudent.find({ sessionId })
    .populate('studentId', 'name rollNumber department section').sort({ attendance: 1 });
  return { session, studentRecords };
}

async function submitSessionToAdmin(mentorId, sessionId) {
  const session = await CounselingSession.findOne({ _id: sessionId, mentorId });
  if (!session) { const err = new Error('Session not found.'); err.statusCode = 404; throw err; }
  session.submittedToAdmin = true; session.submittedAt = new Date();
  await session.save(); return session;
}

async function getStudentOwnHistory(studentId) {
  return SessionStudent.find({ studentId, visibility: 'student-visible' })
    .populate('sessionId', 'sessionDate topic year generalNotes')
    .populate('mentorId', 'name').sort({ createdAt: -1 });
}

async function getSubmittedSessions(year) {
  const filter = { submittedToAdmin: true };
  if (year) filter.year = Number(year);
  const sessions = await CounselingSession.find(filter)
    .populate('mentorId', 'name email department').sort({ submittedAt: -1 });

  return Promise.all(sessions.map(async (session) => {
    const studentRecords = await SessionStudent.find({ sessionId: session._id })
      .populate('studentId', 'name rollNumber');
    const present = studentRecords.filter(r => r.attendance === 'present').length;
    return { ...session.toObject(), totalStudents: studentRecords.length, presentCount: present, absentCount: studentRecords.length - present, studentRecords };
  }));
}

async function getAllSessionsForAdmin(filters = {}) {
  const filter = {};
  if (filters.mentorId) filter.mentorId = filters.mentorId;
  if (filters.year) filter.year = Number(filters.year);
  if (filters.topic) filter.topic = filters.topic;
  return CounselingSession.find(filter).populate('mentorId', 'name email').sort({ sessionDate: -1 });
}

module.exports = { createSession, listSessionsForMentor, getSessionDetail, submitSessionToAdmin, getStudentOwnHistory, getSubmittedSessions, getAllSessionsForAdmin };
