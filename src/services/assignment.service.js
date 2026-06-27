const Assignment = require('../models/Assignment.model');
const Student = require('../models/Student.model');
const Mentor = require('../models/Mentor.model');

/**
 * Assigns a student to a mentor. If the student already has an active
 * assignment, it is ended first (status -> 'ended') before the new one
 * is created — this preserves assignment HISTORY rather than overwriting it,
 * while the partial unique index on Assignment guarantees only one
 * active assignment can exist per student at any time.
 */
async function assignStudentToMentor(mentorId, studentId, adminId) {
  const mentor = await Mentor.findOne({ _id: mentorId, role: 'mentor' });
  if (!mentor) {
    const err = new Error('Mentor not found');
    err.statusCode = 404;
    throw err;
  }

  const student = await Student.findOne({ _id: studentId, role: 'student' });
  if (!student) {
    const err = new Error('Student not found');
    err.statusCode = 404;
    throw err;
  }

  // End any existing active assignment for this student
  await Assignment.updateMany(
    { studentId, status: 'active' },
    { status: 'ended', unassignedAt: new Date() }
  );

  const assignment = await Assignment.create({
    mentorId,
    studentId,
    assignedBy: adminId,
    status: 'active',
  });

  // Keep the denormalized pointer on Student in sync
  student.mentorId = mentorId;
  await student.save();

  return assignment;
}

async function listAssignments() {
  return Assignment.find({ status: 'active' })
    .populate('mentorId', 'name email department')
    .populate('studentId', 'name email rollNumber department year section')
    .sort({ assignedAt: -1 });
}

/**
 * Verifies that a given studentId is currently assigned to the given
 * mentorId. Used by every mentor-write endpoint (session, attendance,
 * messages, concern responses) as the core authorization check —
 * this is what actually enforces "mentors cannot see/act on students
 * assigned to other mentors", not just UI filtering.
 */
async function verifyMentorOwnsStudent(mentorId, studentId) {
  const assignment = await Assignment.findOne({
    mentorId,
    studentId,
    status: 'active',
  });

  if (!assignment) {
    const err = new Error('This student is not assigned to you.');
    err.statusCode = 403;
    throw err;
  }

  return assignment;
}

module.exports = {
  assignStudentToMentor,
  listAssignments,
  verifyMentorOwnsStudent,
};
