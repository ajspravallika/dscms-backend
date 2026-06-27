const { body, param } = require('express-validator');
const { ALLOWED_EMAIL_DOMAIN } = require('../config/constants');

const emailValidator = body('email')
  .trim()
  .notEmpty()
  .withMessage('Email is required')
  .isEmail()
  .withMessage('Must be a valid email address')
  .custom((value) => value.toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`))
  .withMessage(`Email must be a @${ALLOWED_EMAIL_DOMAIN} address`);

const createMentorValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  emailValidator,
  body('department').optional().trim(),
  body('designation').optional().trim(),
  body('employeeId').optional().trim(),
  body('phone').optional().trim(),
];

const createStudentValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  emailValidator,
  body('rollNumber').trim().notEmpty().withMessage('Roll number is required'),
  body('department').optional().trim(),
  body('year').optional().isInt({ min: 1, max: 4 }).withMessage('Year must be between 1 and 4'),
  body('section').optional().trim(),
  body('parentContact').optional().trim(),
  body('phone').optional().trim(),
];

const updateUserValidator = [
  param('id').isMongoId().withMessage('Invalid user id'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false'),
];

const assignStudentValidator = [
  body('mentorId').isMongoId().withMessage('Valid mentorId is required'),
  body('studentId').isMongoId().withMessage('Valid studentId is required'),
];

module.exports = {
  createMentorValidator,
  createStudentValidator,
  updateUserValidator,
  assignStudentValidator,
};
