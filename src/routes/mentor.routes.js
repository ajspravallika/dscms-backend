const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');

const { protect } = require('../middlewares/auth.middleware');
const { allow } = require('../middlewares/rbac.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  createSessionValidator,
  updateSessionValidator,
  markAttendanceValidator,
} = require('../validators/session.validator');
const mentorController = require('../controllers/mentor.controller');

// Every route in this file is mentor-only.
router.use(protect, allow('mentor'));

// Students
router.get('/students', mentorController.listMyStudents);
router.get('/students/:id', param('id').isMongoId(), validate, mentorController.getMyStudentById);

// Counseling sessions
router.post('/sessions', createSessionValidator, validate, mentorController.createSession);
router.get('/sessions', mentorController.listSessions);
router.get(
  '/sessions/:studentId',
  param('studentId').isMongoId(),
  validate,
  mentorController.getSessionHistory
);
router.patch('/sessions/:id', updateSessionValidator, validate, mentorController.updateSession);

// Attendance
router.post('/attendance', markAttendanceValidator, validate, mentorController.markAttendance);
router.get(
  '/attendance/:studentId',
  param('studentId').isMongoId(),
  validate,
  mentorController.getAttendance
);

// Messaging
router.post(
  '/messages',
  [body('studentId').isMongoId(), body('content').trim().notEmpty()],
  validate,
  mentorController.sendMessageToStudent
);
router.get(
  '/messages/:studentId',
  param('studentId').isMongoId(),
  validate,
  mentorController.getConversationWithStudent
);

// Concerns
router.get('/concerns', mentorController.listConcerns);
router.patch(
  '/concerns/:id',
  [
    param('id').isMongoId(),
    body('mentorResponse').optional().trim(),
    body('status').optional().isIn(['open', 'in-progress', 'resolved']),
  ],
  validate,
  mentorController.respondToConcern
);

// Weekly reports (manually triggered — no cron in V1)
router.post('/reports/weekly', mentorController.generateWeeklyReport);
router.get('/reports', mentorController.listMyReports);

module.exports = router;
