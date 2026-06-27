const { body, param } = require('express-validator');
const { SESSION_TOPICS, SESSION_VISIBILITY, ATTENDANCE_STATUS } = require('../config/constants');

const createSessionValidator = [
  body('studentId').isMongoId().withMessage('Valid studentId is required'),
  body('sessionDate').isISO8601().withMessage('sessionDate must be a valid date'),
  body('topic').optional().isIn(SESSION_TOPICS).withMessage('Invalid topic'),
  body('remarks').trim().notEmpty().withMessage('Remarks are required'),
  body('actionItems').optional().trim(),
  body('nextFollowUpDate').optional().isISO8601().withMessage('nextFollowUpDate must be a valid date'),
  body('visibility').optional().isIn(SESSION_VISIBILITY).withMessage('Invalid visibility value'),
];

const updateSessionValidator = [
  param('id').isMongoId().withMessage('Invalid session id'),
  body('remarks').optional().trim().notEmpty().withMessage('Remarks cannot be empty'),
  body('topic').optional().isIn(SESSION_TOPICS).withMessage('Invalid topic'),
  body('actionItems').optional().trim(),
  body('nextFollowUpDate').optional().isISO8601().withMessage('nextFollowUpDate must be a valid date'),
];

const markAttendanceValidator = [
  body('sessionId').isMongoId().withMessage('Valid sessionId is required'),
  body('studentId').isMongoId().withMessage('Valid studentId is required'),
  body('date').isISO8601().withMessage('date must be a valid date'),
  body('status').isIn(ATTENDANCE_STATUS).withMessage('Invalid attendance status'),
  body('remarks').optional().trim(),
];

module.exports = {
  createSessionValidator,
  updateSessionValidator,
  markAttendanceValidator,
};
