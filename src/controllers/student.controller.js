const asyncHandler = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');
const Student = require('../models/Student.model');
const Mentor = require('../models/Mentor.model');
const Concern = require('../models/Concern.model');
const Notification = require('../models/Notification.model');
const Message = require('../models/Message.model');
const sessionService = require('../services/session.service');
const getMyMentor = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user.id);
  if (!student || !student.mentorId) return error(res, 404, 'No mentor assigned yet.');
  return success(res, 200, { mentor: await Mentor.findById(student.mentorId).select('name email phone department designation') });
});
const getMyCounselingHistory = asyncHandler(async (req, res) => success(res, 200, { records: await sessionService.getStudentCounselingHistory(req.user.id) }));
const submitConcern = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user.id);
  if (!student || !student.mentorId) return error(res, 400, 'No mentor assigned yet.');
  const concern = await Concern.create({ studentId: req.user.id, mentorId: student.mentorId, title: req.body.title, description: req.body.description, category: req.body.category });
  await Notification.create({ userId: student.mentorId, type: 'concern', title: 'New concern submitted', body: student.name + ' submitted a concern.', relatedEntityId: concern._id });
  return success(res, 201, { concern });
});
const getMyConcerns = asyncHandler(async (req, res) => success(res, 200, { concerns: await Concern.find({ studentId: req.user.id }).sort({ createdAt: -1 }) }));
const getConversation = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user.id);
  if (!student || !student.mentorId) return error(res, 404, 'No mentor assigned yet.');
  const conversationId = Message.buildConversationId(req.user.id, student.mentorId);
  const messages = await Message.find({ conversationId }).sort({ sentAt: 1 });
  await Message.updateMany({ conversationId, receiverId: req.user.id, isRead: false }, { isRead: true });
  return success(res, 200, { messages });
});
const sendMessage = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user.id);
  if (!student || !student.mentorId) return error(res, 400, 'No mentor assigned yet.');
  const conversationId = Message.buildConversationId(req.user.id, student.mentorId);
  const message = await Message.create({ senderId: req.user.id, receiverId: student.mentorId, conversationId, content: req.body.content });
  await Notification.create({ userId: student.mentorId, type: 'message', title: 'New message from ' + student.name, body: req.body.content.slice(0,80) });
  return success(res, 201, { message });
});
const getNotifications = asyncHandler(async (req, res) => success(res, 200, { notifications: await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }) }));
const markNotificationRead = asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, { isRead: true }, { new: true });
  if (!n) return error(res, 404, 'Notification not found');
  return success(res, 200, { notification: n });
});
const getDashboard = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user.id);
  const mentor = student?.mentorId ? await Mentor.findById(student.mentorId).select('name email phone department') : null;
  const recentHistory = await sessionService.getStudentCounselingHistory(req.user.id);
  const unreadNotifications = await Notification.countDocuments({ userId: req.user.id, isRead: false });
  const openConcerns = await Concern.countDocuments({ studentId: req.user.id, status: { $ne: 'resolved' } });
  return success(res, 200, { student, mentor, recentHistory: recentHistory.slice(0,5), unreadNotifications, openConcerns });
});
module.exports = { getMyMentor, getMyCounselingHistory, submitConcern, getMyConcerns, getConversation, sendMessage, getNotifications, markNotificationRead, getDashboard };