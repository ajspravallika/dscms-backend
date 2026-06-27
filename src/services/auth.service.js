const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User.model');

/**
 * Signs a single JWT access token. V1 deliberately uses one token
 * (no refresh-token rotation) with a moderate expiry suitable for an
 * 8-hour academic working day.
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

/**
 * Validates credentials and returns the user + token.
 * Throws an Error with a `.statusCode` property on failure so the
 * controller/error middleware can respond appropriately without
 * leaking which part of the check failed (email vs password).
 */
async function login(email, password) {
  const normalizedEmail = email.toLowerCase().trim();

  // select('+password') because the schema excludes password by default
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  if (!user.isActive) {
    const err = new Error('This account has been deactivated. Contact the administrator.');
    err.statusCode = 403;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = generateToken(user);

  // Strip password before returning
  const safeUser = user.toObject();
  delete safeUser.password;

  return { user: safeUser, token };
}

/**
 * Changes a user's password (used for both forced first-login reset
 * and voluntary self-service change). Verifies the current password
 * before allowing the change.
 */
async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    const err = new Error('Current password is incorrect');
    err.statusCode = 401;
    throw err;
  }

  const salt = await bcrypt.genSalt(12);
  user.password = await bcrypt.hash(newPassword, salt);
  user.mustResetPassword = false;
  await user.save();

  return true;
}

module.exports = { generateToken, login, changePassword };
