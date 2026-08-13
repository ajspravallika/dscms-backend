const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const { success, error } = require('../utils/apiResponse');
const Student = require('../models/Student.model');
const Concern = require('../models/Concern.model');
const Notification = require('../models/Notification.model');
const sessionService = require('../services/session.service');
const reportService = require('../services/report.service');
const messageService = require('../services/message.service');
const assignmentService = require('../services/assignment.service');

const listMyStudents = asyncHandler(async (req, res) => {
  const filter = { mentorId: req.user.id, isActive: true, isPassout: false };
  if (req.query.year) filter.year = Number(req.query.year);
  return success(res, 200, { students: await Student.find(filter).sort({ year: 1, name: 1 }) });
});

const getMyStudentById = asyncHandler(async (req, res) => {
  await assignmentService.verifyMentorOwnsStudent(req.user.id, req.params.id);
  const student = await Student.findById(req.params.id);
  if (!student) return error(res, 404, 'Student not found');
  return success(res, 200, { student });
});

const getStudentsForSession = asyncHandler(async (req, res) => {
  const students = await Student.find({ mentorId: req.user.id, year: Number(req.params.year), isActive: true, isPassout: false }).sort({ name: 1 });
  return success(res, 200, { students });
});

const createSession = asyncHandler(async (req, res) => {
  const result = await sessionService.createSession(req.user.id, req.body);
  return success(res, 201, result, 'Session recorded');
});

const listSessions = asyncHandler(async (req, res) => {
  return success(res, 200, { sessions: await sessionService.listSessionsForMentor(req.user.id, req.query.year) });
});

const getSessionDetail = asyncHandler(async (req, res) => {
  return success(res, 200, await sessionService.getSessionDetail(req.user.id, req.params.id));
});

const submitSession = asyncHandler(async (req, res) => {
  return success(res, 200, { session: await sessionService.submitSessionToAdmin(req.user.id, req.params.id) }, 'Submitted to admin');
});

const sendMessageToStudent = asyncHandler(async (req, res) => {
  return success(res, 201, { message: await messageService.sendMessage(req.user.id, req.body.studentId, req.body.content) });
});

const getConversationWithStudent = asyncHandler(async (req, res) => {
  return success(res, 200, { messages: await messageService.getConversation(req.user.id, req.params.studentId) });
});

const listConcerns = asyncHandler(async (req, res) => {
  const filter = { mentorId: req.user.id };
  if (req.query.status) filter.status = req.query.status;
  return success(res, 200, { concerns: await Concern.find(filter).populate('studentId', 'name email rollNumber').sort({ createdAt: -1 }) });
});

const respondToConcern = asyncHandler(async (req, res) => {
  const concern = await Concern.findOne({ _id: req.params.id, mentorId: req.user.id });
  if (!concern) return error(res, 404, 'Concern not found');
  if (req.body.mentorResponse !== undefined) concern.mentorResponse = req.body.mentorResponse;
  if (req.body.status !== undefined) { concern.status = req.body.status; if (req.body.status === 'resolved') concern.resolvedAt = new Date(); }
  await concern.save();
  await Notification.create({ userId: concern.studentId, type: 'concern', title: 'Update on your concern', body: req.body.mentorResponse || `Status: ${req.body.status}`, relatedEntityId: concern._id });
  return success(res, 200, { concern });
});

const generateWeeklyReport = asyncHandler(async (req, res) => {
  const end = req.body.weekEndDate ? new Date(req.body.weekEndDate) : new Date();
  const start = req.body.weekStartDate ? new Date(req.body.weekStartDate) : new Date(end - 7*24*60*60*1000);
  return success(res, 201, { report: await reportService.generateWeeklyReport(req.user.id, start, end, req.body.highlights) });
});

const listMyReports = asyncHandler(async (req, res) => {
  return success(res, 200, { reports: await reportService.listReportsForMentor(req.user.id) });
});

module.exports = { listMyStudents, getMyStudentById, getStudentsForSession, createSession, listSessions, getSessionDetail, submitSession, sendMessageToStudent, getConversationWithStudent, listConcerns, respondToConcern, generateWeeklyReport, listMyReports };
