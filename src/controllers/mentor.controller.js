const asyncHandler = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');
const Student = require('../models/Student.model');
const Concern = require('../models/Concern.model');
const Notification = require('../models/Notification.model');
const Message = require('../models/Message.model');
const CounselingSession = require('../models/CounselingSession.model');
const Report = require('../models/Report.model');
const sessionService = require('../services/session.service');
const assignmentService = require('../services/assignment.service');
const listMyStudents = asyncHandler(async (req, res) => {
  const filter = { mentorId: req.user.id, isActive: true, isPassout: false };
  if (req.query.year) filter.year = Number(req.query.year);
  const students = await Student.find(filter).sort({ year: 1, name: 1 });
  const grouped = { 1: [], 2: [], 3: [], 4: [] };
  students.forEach(s => { if (s.year && grouped[s.year]) grouped[s.year].push(s); });
  return success(res, 200, { students, grouped });
});
const getStudentsForSession = asyncHandler(async (req, res) => success(res, 200, { records: await sessionService.loadStudentsForSession(req.user.id, req.params.year) }));
const createOrUpdateSession = asyncHandler(async (req, res) => success(res, 201, { session: await sessionService.createOrUpdateSession(req.user.id, req.user.name, req.body) }, 'Session saved'));
const listSessions = asyncHandler(async (req, res) => success(res, 200, { sessions: await sessionService.getSessionsForMentor(req.user.id, req.query) }));
const getSessionById = asyncHandler(async (req, res) => success(res, 200, { session: await sessionService.getSessionById(req.params.id, req.user.id) }));
const submitSession = asyncHandler(async (req, res) => success(res, 200, { session: await sessionService.submitSession(req.params.id, req.user.id) }, 'Submitted to admin'));
const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, content } = req.body;
  await assignmentService.verifyMentorOwnsStudent(req.user.id, receiverId);
  const conversationId = Message.buildConversationId(req.user.id, receiverId);
  const message = await Message.create({ senderId: req.user.id, receiverId, conversationId, content });
  await Notification.create({ userId: receiverId, type: 'message', title: 'New message from your mentor', body: content.slice(0,80) });
  return success(res, 201, { message });
});
const sendGroupMessage = asyncHandler(async (req, res) => {
  const { year, content } = req.body;
  const students = await Student.find({ mentorId: req.user.id, year: Number(year), isActive: true });
  let sent = 0;
  for (const s of students) {
    const conversationId = Message.buildConversationId(req.user.id, s._id);
    await Message.create({ senderId: req.user.id, receiverId: s._id, conversationId, content });
    await Notification.create({ userId: s._id, type: 'message', title: 'New message from your mentor', body: content.slice(0,80) });
    sent++;
  }
  return success(res, 201, { sent }, 'Message sent to ' + sent + ' students');
});
const getConversation = asyncHandler(async (req, res) => {
  await assignmentService.verifyMentorOwnsStudent(req.user.id, req.params.studentId);
  const conversationId = Message.buildConversationId(req.user.id, req.params.studentId);
  const messages = await Message.find({ conversationId }).sort({ sentAt: 1 });
  await Message.updateMany({ conversationId, receiverId: req.user.id, isRead: false }, { isRead: true });
  return success(res, 200, { messages });
});
const listConcerns = asyncHandler(async (req, res) => {
  const filter = { mentorId: req.user.id }; if (req.query.status) filter.status = req.query.status;
  return success(res, 200, { concerns: await Concern.find(filter).populate('studentId', 'name email rollNumber').sort({ createdAt: -1 }) });
});
const respondToConcern = asyncHandler(async (req, res) => {
  const concern = await Concern.findOne({ _id: req.params.id, mentorId: req.user.id });
  if (!concern) return error(res, 404, 'Concern not found');
  if (req.body.mentorResponse !== undefined) concern.mentorResponse = req.body.mentorResponse;
  if (req.body.status !== undefined) { concern.status = req.body.status; if (req.body.status === 'resolved') concern.resolvedAt = new Date(); }
  await concern.save();
  await Notification.create({ userId: concern.studentId, type: 'concern', title: 'Update on your concern', body: req.body.mentorResponse || ('Status: ' + req.body.status), relatedEntityId: concern._id });
  return success(res, 200, { concern });
});
const getDashboard = asyncHandler(async (req, res) => {
  const students = await Student.find({ mentorId: req.user.id, isActive: true, isPassout: false });
  const grouped = { 1: 0, 2: 0, 3: 0, 4: 0 };
  students.forEach(s => { if (s.year && grouped[s.year] !== undefined) grouped[s.year]++; });
  const recentSessions = await CounselingSession.find({ mentorId: req.user.id }).sort({ scheduledDate: -1 }).limit(5);
  const draftCount = await CounselingSession.countDocuments({ mentorId: req.user.id, status: 'draft' });
  const submittedCount = await CounselingSession.countDocuments({ mentorId: req.user.id, status: 'submitted' });
  const openConcerns = await Concern.countDocuments({ mentorId: req.user.id, status: { $in: ['open', 'in-progress'] } });
  return success(res, 200, { totalStudents: students.length, studentsByYear: grouped, recentSessions, draftCount, submittedCount, openConcerns });
});
const generateWeeklyReport = asyncHandler(async (req, res) => {
  const end = req.body.weekEndDate ? new Date(req.body.weekEndDate) : new Date();
  const start = req.body.weekStartDate ? new Date(req.body.weekStartDate) : new Date(end - 7*24*60*60*1000);
  end.setHours(23,59,59,999);
  const sessions = await CounselingSession.find({ mentorId: req.user.id, scheduledDate: { $gte: start, $lte: end }, status: 'submitted' });
  let present=0, absent=0, excused=0; const studentMap = {};
  sessions.forEach(s => { s.studentRecords.forEach(r => { if(r.attendance==='present') present++; else if(r.attendance==='absent') absent++; else excused++; const sid = r.studentId ? r.studentId.toString() : r.studentName; if(!studentMap[sid]) studentMap[sid] = { studentId: r.studentId, name: r.studentName, rollNumber: r.studentRollNumber, present: 0, absent: 0, excused: 0 }; studentMap[sid][r.attendance]++; }); });
  const openConcerns = await Concern.countDocuments({ mentorId: req.user.id, status: { $in: ['open', 'in-progress'] } });
  const report = await Report.findOneAndUpdate({ mentorId: req.user.id, weekStartDate: start }, { mentorId: req.user.id, weekStartDate: start, weekEndDate: end, totalSessionsHeld: sessions.length, totalStudentsCounseled: Object.keys(studentMap).length, attendanceSummary: { present, absent, excused }, studentBreakdown: Object.values(studentMap), openConcerns, highlights: req.body.highlights || '' }, { upsert: true, new: true });
  return success(res, 200, { report });
});
const listReports = asyncHandler(async (req, res) => success(res, 200, { reports: await Report.find({ mentorId: req.user.id }).sort({ weekStartDate: -1 }) }));
module.exports = { listMyStudents, getStudentsForSession, createOrUpdateSession, listSessions, getSessionById, submitSession, sendMessage, sendGroupMessage, getConversation, listConcerns, respondToConcern, getDashboard, generateWeeklyReport, listReports };