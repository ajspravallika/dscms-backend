const { body } = require('express-validator');
const { ALLOWED_EMAIL_DOMAIN } = require('../config/constants');

const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Must be a valid email address')
    .custom((value) => value.toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`))
    .withMessage(`Email must be a @${ALLOWED_EMAIL_DOMAIN} address`),
  body('password').notEmpty().withMessage('Password is required'),
];

const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('New password must contain at least one number'),
];

module.exports = { loginValidator, changePasswordValidator };
