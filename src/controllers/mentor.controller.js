const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const Student = require('../models/Student.model');
const Concern = require('../models/Concern.model');
const Notification = require('../models/Notification.model');
const sessionService = require('../services/session.service');
const reportService = require('../services/report.service');
const messageService = require('../services/message.service');
const assignmentService = require('../services/assignment.service');

// ---------- Students (scoped to this mentor only) ----------

/** GET /api/v1/mentor/students */
const listMyStudents = asyncHandler(async (req, res) => {
  // mentorId always comes from the verified JWT (req.user.id), never from
  // a client-supplied param — this is what makes "mentor sees only their
  // assigned students" an enforced rule rather than a UI convention.
  const students = await Student.find({ mentorId: req.user.id }).sort({ name: 1 });
  return success(res, 200, { students }, 'Assigned students fetched successfully');
});

/** GET /api/v1/mentor/students/:id */
const getMyStudentById = asyncHandler(async (req, res) => {
  await assignmentService.verifyMentorOwnsStudent(req.user.id, req.params.id);

  const student = await Student.findById(req.params.id);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  return success(res, 200, { student }, 'Student profile fetched successfully');
});

// ---------- Counseling sessions ----------

/** POST /api/v1/mentor/sessions */
const createSession = asyncHandler(async (req, res) => {
  const session = await sessionService.createSession(req.user.id, req.body);
  return success(res, 201, { session }, 'Counseling session recorded successfully');
});

/** GET /api/v1/mentor/sessions */
const listSessions = asyncHandler(async (req, res) => {
  const sessions = await sessionService.listSessionsForMentor(req.user.id, req.query.studentId);
  return success(res, 200, { sessions }, 'Sessions fetched successfully');
});

/** GET /api/v1/mentor/sessions/:studentId */
const getSessionHistory = asyncHandler(async (req, res) => {
  const sessions = await sessionService.getSessionHistoryForStudent(req.user.id, req.params.studentId);
  return success(res, 200, { sessions }, 'Counseling history fetched successfully');
});

/** PATCH /api/v1/mentor/sessions/:id */
const updateSession = asyncHandler(async (req, res) => {
  const session = await sessionService.updateSession(req.user.id, req.params.id, req.body);
  return success(res, 200, { session }, 'Session updated successfully');
});

// ---------- Attendance ----------

/** POST /api/v1/mentor/attendance */
const markAttendance = asyncHandler(async (req, res) => {
  const attendance = await sessionService.markAttendance(req.user.id, req.body);
  return success(res, 201, { attendance }, 'Attendance marked successfully');
});

/** GET /api/v1/mentor/attendance/:studentId */
const getAttendance = asyncHandler(async (req, res) => {
  const attendance = await sessionService.getAttendanceForStudent(req.user.id, req.params.studentId);
  return success(res, 200, { attendance }, 'Attendance history fetched successfully');
});

// ---------- Messaging ----------

/** POST /api/v1/mentor/messages */
const sendMessageToStudent = asyncHandler(async (req, res) => {
  const { studentId, content } = req.body;
  const message = await messageService.sendMessage(req.user.id, studentId, content);
  return success(res, 201, { message }, 'Message sent successfully');
});

/** GET /api/v1/mentor/messages/:studentId */
const getConversationWithStudent = asyncHandler(async (req, res) => {
  const messages = await messageService.getConversation(req.user.id, req.params.studentId);
  return success(res, 200, { messages }, 'Conversation fetched successfully');
});

// ---------- Concerns ----------

/** GET /api/v1/mentor/concerns */
const listConcerns = asyncHandler(async (req, res) => {
  const filter = { mentorId: req.user.id };
  if (req.query.status) filter.status = req.query.status;

  const concerns = await Concern.find(filter)
    .populate('studentId', 'name email rollNumber')
    .sort({ createdAt: -1 });

  return success(res, 200, { concerns }, 'Concerns fetched successfully');
});

/** PATCH /api/v1/mentor/concerns/:id */
const respondToConcern = asyncHandler(async (req, res) => {
  const { mentorResponse, status } = req.body;

  const concern = await Concern.findOne({ _id: req.params.id, mentorId: req.user.id });
  if (!concern) {
    return res.status(404).json({ success: false, message: 'Concern not found' });
  }

  if (mentorResponse !== undefined) concern.mentorResponse = mentorResponse;
  if (status !== undefined) {
    concern.status = status;
    if (status === 'resolved') concern.resolvedAt = new Date();
  }
  await concern.save();

  await Notification.create({
    userId: concern.studentId,
    type: 'concern',
    title: 'Update on your submitted concern',
    body: mentorResponse || `Status updated to: ${status}`,
    relatedEntityId: concern._id,
  });

  return success(res, 200, { concern }, 'Concern updated successfully');
});

// ---------- Reports ----------

/** POST /api/v1/mentor/reports/weekly */
const generateWeeklyReport = asyncHandler(async (req, res) => {
  const { weekStartDate, weekEndDate, highlights } = req.body;

  // Default to "the last 7 days" if no range supplied
  const end = weekEndDate ? new Date(weekEndDate) : new Date();
  const start = weekStartDate ? new Date(weekStartDate) : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

  const report = await reportService.generateWeeklyReport(req.user.id, start, end, highlights);
  return success(res, 201, { report }, 'Weekly report generated successfully');
});

/** GET /api/v1/mentor/reports */
const listMyReports = asyncHandler(async (req, res) => {
  const reports = await reportService.listReportsForMentor(req.user.id);
  return success(res, 200, { reports }, 'Reports fetched successfully');
});

module.exports = {
  listMyStudents,
  getMyStudentById,
  createSession,
  listSessions,
  getSessionHistory,
  updateSession,
  markAttendance,
  getAttendance,
  sendMessageToStudent,
  getConversationWithStudent,
  listConcerns,
  respondToConcern,
  generateWeeklyReport,
  listMyReports,
};
