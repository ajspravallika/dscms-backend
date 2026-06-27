/**
 * Generates a random temporary password for accounts created by the Admin.
 * The user is required to change this on first login (see User.model.js
 * `mustResetPassword` flag and auth.controller.js `changePassword`).
 *
 * Format: 10 characters, mix of upper/lower/digits/symbol — readable enough
 * to type/communicate manually since there is no email service in V1.
 */
function generateTempPassword(length = 10) {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I/O to avoid confusion
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789'; // no 0/1 to avoid confusion with O/l
  const symbols = '@#$%';

  const all = upper + lower + digits + symbols;
  let password = '';

  // Guarantee at least one of each character class
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle so the guaranteed chars aren't always in the first 4 positions
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

module.exports = generateTempPassword;
