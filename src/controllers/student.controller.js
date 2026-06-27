const asyncHandler = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');
const Student = require('../models/Student.model');
const Mentor = require('../models/Mentor.model');
const CounselingSession = require('../models/CounselingSession.model');
const Attendance = require('../models/Attendance.model');
const Concern = require('../models/Concern.model');
const Notification = require('../models/Notification.model');
const messageService = require('../services/message.service');

/**
 * GET /api/v1/student/mentor
 * Returns the currently assigned mentor's profile. Looks up via the
 * denormalized mentorId on the Student document (kept in sync by
 * assignment.service.js on every assignment change).
 */
const getMyMentor = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user.id);

  if (!student || !student.mentorId) {
    return error(res, 404, 'No mentor has been assigned to you yet. Contact the administrator.');
  }

  const mentor = await Mentor.findById(student.mentorId).select('name email phone department designation');

  return success(res, 200, { mentor }, 'Assigned mentor fetched successfully');
});

/**
 * GET /api/v1/student/sessions
 * Own counseling history — student-visible sessions only. Mentor-only
 * (private) notes are deliberately excluded from this response; a
 * student should never see a session their mentor marked as internal.
 */
const getMySessions = asyncHandler(async (req, res) => {
  const sessions = await CounselingSession.find({
    studentId: req.user.id,
    visibility: 'student-visible',
  }).sort({ sessionDate: -1 });

  return success(res, 200, { sessions }, 'Counseling history fetched successfully');
});

/** GET /api/v1/student/attendance */
const getMyAttendance = asyncHandler(async (req, res) => {
  const attendance = await Attendance.find({ studentId: req.user.id }).sort({ date: -1 });
  return success(res, 200, { attendance }, 'Attendance fetched successfully');
});

/**
 * POST /api/v1/student/concerns
 * mentorId is derived server-side from the student's current assignment —
 * never trusted from the request body, so a student cannot direct a
 * concern at a mentor they aren't assigned to.
 */
const submitConcern = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user.id);

  if (!student || !student.mentorId) {
    return error(res, 400, 'You do not have an assigned mentor yet. Contact the administrator.');
  }

  const concern = await Concern.create({
    studentId: req.user.id,
    mentorId: student.mentorId,
    title: req.body.title,
    description: req.body.description,
    category: req.body.category,
  });

  await Notification.create({
    userId: student.mentorId,
    type: 'concern',
    title: 'New concern submitted',
    body: `${student.name} submitted a new concern.`,
    relatedEntityId: concern._id,
  });

  return success(res, 201, { concern }, 'Concern submitted successfully');
});

/** GET /api/v1/student/concerns */
const getMyConcerns = asyncHandler(async (req, res) => {
  const concerns = await Concern.find({ studentId: req.user.id }).sort({ createdAt: -1 });
  return success(res, 200, { concerns }, 'Your concerns fetched successfully');
});

/**
 * GET /api/v1/student/messages
 * Conversation with the assigned mentor. messageService.getConversation
 * re-verifies the active assignment, so even if mentorId were stale on
 * the Student doc, the underlying authorization check still holds.
 */
const getConversationWithMentor = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user.id);
  if (!student || !student.mentorId) {
    return error(res, 404, 'No mentor assigned yet.');
  }

  const messages = await messageService.getConversation(req.user.id, student.mentorId);
  return success(res, 200, { messages }, 'Conversation fetched successfully');
});

/** POST /api/v1/student/messages */
const sendMessageToMentor = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user.id);
  if (!student || !student.mentorId) {
    return error(res, 400, 'No mentor assigned yet.');
  }

  const message = await messageService.sendMessage(req.user.id, student.mentorId, req.body.content);
  return success(res, 201, { message }, 'Message sent successfully');
});

/** GET /api/v1/student/notifications */
const listMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
  return success(res, 200, { notifications }, 'Notifications fetched successfully');
});

/** PATCH /api/v1/student/notifications/:id/read */
const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    return error(res, 404, 'Notification not found');
  }

  return success(res, 200, { notification }, 'Notification marked as read');
});

module.exports = {
  getMyMentor,
  getMySessions,
  getMyAttendance,
  submitConcern,
  getMyConcerns,
  getConversationWithMentor,
  sendMessageToMentor,
  listMyNotifications,
  markNotificationRead,
};
