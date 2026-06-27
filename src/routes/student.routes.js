const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');

const { protect } = require('../middlewares/auth.middleware');
const { allow } = require('../middlewares/rbac.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { CONCERN_CATEGORIES } = require('../config/constants');
const studentController = require('../controllers/student.controller');

// Every route in this file is student-only.
router.use(protect, allow('student'));

router.get('/mentor', studentController.getMyMentor);

router.get('/sessions', studentController.getMySessions);
router.get('/attendance', studentController.getMyAttendance);

router.post(
  '/concerns',
  [
    body('title').optional().trim(),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category').optional().isIn(CONCERN_CATEGORIES).withMessage('Invalid category'),
  ],
  validate,
  studentController.submitConcern
);
router.get('/concerns', studentController.getMyConcerns);

router.get('/messages', studentController.getConversationWithMentor);
router.post(
  '/messages',
  body('content').trim().notEmpty().withMessage('Message content is required'),
  validate,
  studentController.sendMessageToMentor
);

router.get('/notifications', studentController.listMyNotifications);
router.patch(
  '/notifications/:id/read',
  param('id').isMongoId(),
  validate,
  studentController.markNotificationRead
);

module.exports = router;
