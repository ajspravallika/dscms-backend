const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const { success, error } = require('../utils/apiResponse');
const Student = require('../models/Student.model');
const Mentor = require('../models/Mentor.model');
const Concern = require('../models/Concern.model');
const Notification = require('../models/Notification.model');
const messageService = require('../services/message.service');
const sessionService = require('../services/session.service');

const getMyMentor = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user.id);
  if (!student || !student.mentorId) return error(res, 404, 'No mentor assigned yet.');
  return success(res, 200, { mentor: await Mentor.findById(student.mentorId).select('name email phone department designation') });
});

const getMySessions = asyncHandler(async (req, res) => {
  return success(res, 200, { records: await sessionService.getStudentOwnHistory(req.user.id) });
});

const submitConcern = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user.id);
  if (!student || !student.mentorId) return error(res, 400, 'No mentor assigned yet.');
  const concern = await Concern.create({ studentId: req.user.id, mentorId: student.mentorId, title: req.body.title, description: req.body.description, category: req.body.category });
  await Notification.create({ userId: student.mentorId, type: 'concern', title: 'New concern submitted', body: `${student.name} submitted a concern.`, relatedEntityId: concern._id });
  return success(res, 201, { concern });
});

const getMyConcerns = asyncHandler(async (req, res) => {
  return success(res, 200, { concerns: await Concern.find({ studentId: req.user.id }).sort({ createdAt: -1 }) });
});

const getConversationWithMentor = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user.id);
  if (!student || !student.mentorId) return error(res, 404, 'No mentor assigned yet.');
  return success(res, 200, { messages: await messageService.getConversation(req.user.id, student.mentorId) });
});

const sendMessageToMentor = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user.id);
  if (!student || !student.mentorId) return error(res, 400, 'No mentor assigned yet.');
  return success(res, 201, { message: await messageService.sendMessage(req.user.id, student.mentorId, req.body.content) });
});

const listMyNotifications = asyncHandler(async (req, res) => {
  return success(res, 200, { notifications: await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }) });
});

const markNotificationRead = asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, { isRead: true }, { new: true });
  if (!n) return error(res, 404, 'Notification not found');
  return success(res, 200, { notification: n });
});

module.exports = { getMyMentor, getMySessions, submitConcern, getMyConcerns, getConversationWithMentor, sendMessageToMentor, listMyNotifications, markNotificationRead };
