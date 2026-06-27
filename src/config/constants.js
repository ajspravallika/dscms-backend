module.exports = {
  ROLES: {
    ADMIN: 'admin',
    MENTOR: 'mentor',
    STUDENT: 'student',
  },

  ALLOWED_EMAIL_DOMAIN: process.env.ALLOWED_EMAIL_DOMAIN || 'svecw.edu.in',

  SESSION_TOPICS: ['academic', 'personal', 'behavioral', 'career', 'other'],
  SESSION_VISIBILITY: ['student-visible', 'mentor-only'],

  ATTENDANCE_STATUS: ['present', 'absent', 'excused'],

  CONCERN_CATEGORIES: ['academic', 'personal', 'health', 'financial', 'other'],
  CONCERN_STATUS: ['open', 'in-progress', 'resolved'],

  NOTIFICATION_TYPES: ['message', 'session', 'concern', 'report', 'system'],

  ASSIGNMENT_STATUS: ['active', 'ended'],
};
