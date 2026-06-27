const CounselingSession = require('../models/CounselingSession.model');
const Attendance = require('../models/Attendance.model');
const assignmentService = require('./assignment.service');

/**
 * Creates a counseling session record. Verifies the mentor actually
 * owns (is assigned to) this student before writing — this is the
 * authorization boundary, independent of anything the client sends.
 */
async function createSession(mentorId, payload) {
  await assignmentService.verifyMentorOwnsStudent(mentorId, payload.studentId);

  const session = await CounselingSession.create({
    studentId: payload.studentId,
    mentorId,
    sessionDate: payload.sessionDate,
    topic: payload.topic,
    remarks: payload.remarks,
    actionItems: payload.actionItems,
    nextFollowUpDate: payload.nextFollowUpDate,
    visibility: payload.visibility || 'student-visible',
  });

  return session;
}

/**
 * Lists sessions for the mentor's own students only. Optional
 * studentId filter is still re-validated against ownership.
 */
async function listSessionsForMentor(mentorId, studentId) {
  const filter = { mentorId };
  if (studentId) {
    await assignmentService.verifyMentorOwnsStudent(mentorId, studentId);
    filter.studentId = studentId;
  }

  return CounselingSession.find(filter)
    .populate('studentId', 'name email rollNumber')
    .sort({ sessionDate: -1 });
}

/**
 * Edits an existing session. Sessions are versioned rather than silently
 * overwritten — version increments on every edit so a history of changes
 * is implicit in the document (full diff history is a V2 enhancement;
 * V1 keeps it simple with a version counter + updatedAt timestamp).
 * Only the owning mentor may edit; admin-level override is not exposed
 * in V1 to keep mentor notes attributable to the mentor who wrote them.
 */
async function updateSession(mentorId, sessionId, updates) {
  const session = await CounselingSession.findOne({ _id: sessionId, mentorId });

  if (!session) {
    const err = new Error('Session not found or you do not have access to it.');
    err.statusCode = 404;
    throw err;
  }

  const allowedFields = ['remarks', 'topic', 'actionItems', 'nextFollowUpDate', 'visibility'];
  for (const field of allowedFields) {
    if (updates[field] !== undefined) session[field] = updates[field];
  }
  session.version += 1;

  await session.save();
  return session;
}

/**
 * Counseling history for one student — used both by the mentor's own
 * "student profile" view and indirectly validated for the student's
 * self-view (student.controller.js filters to student-visible only).
 */
async function getSessionHistoryForStudent(mentorId, studentId) {
  await assignmentService.verifyMentorOwnsStudent(mentorId, studentId);

  return CounselingSession.find({ mentorId, studentId }).sort({ sessionDate: -1 });
}

/**
 * Marks attendance for a session. Verifies ownership the same way as
 * createSession.
 */
async function markAttendance(mentorId, payload) {
  await assignmentService.verifyMentorOwnsStudent(mentorId, payload.studentId);

  const attendance = await Attendance.create({
    sessionId: payload.sessionId,
    studentId: payload.studentId,
    mentorId,
    date: payload.date,
    status: payload.status,
    remarks: payload.remarks,
  });

  return attendance;
}

async function getAttendanceForStudent(mentorId, studentId) {
  await assignmentService.verifyMentorOwnsStudent(mentorId, studentId);
  return Attendance.find({ mentorId, studentId }).sort({ date: -1 });
}

module.exports = {
  createSession,
  listSessionsForMentor,
  updateSession,
  getSessionHistoryForStudent,
  markAttendance,
  getAttendanceForStudent,
};
