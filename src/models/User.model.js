const mongoose = require('mongoose');
const { ROLES, ALLOWED_EMAIL_DOMAIN } = require('../config/constants');

const options = { discriminatorKey: 'role', collection: 'users', timestamps: true };

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (value) {
          const domainRegex = new RegExp(`@${ALLOWED_EMAIL_DOMAIN}$`, 'i');
          return domainRegex.test(value);
        },
        message: (props) => `${props.value} is not a valid @${ALLOWED_EMAIL_DOMAIN} email address`,
      },
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // never returned by default in queries
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    mustResetPassword: {
      type: Boolean,
      default: true, // forces password change on first login
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  options
);

userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
