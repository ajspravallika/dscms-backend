const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const userService = require('../services/user.service');
const assignmentService = require('../services/assignment.service');
const CounselingSession = require('../models/CounselingSession.model');
const Report = require('../models/Report.model');

// ---------- Mentor management ----------

/** POST /api/v1/admin/mentors */
const createMentor = asyncHandler(async (req, res) => {
  const { mentor, tempPassword } = await userService.createMentor(req.body, req.user.id);
  // tempPassword is returned ONCE here so the admin can communicate it manually.
  return success(res, 201, { mentor, tempPassword }, 'Mentor account created successfully');
});

/** GET /api/v1/admin/mentors */
const listMentors = asyncHandler(async (req, res) => {
  const mentors = await userService.listMentors();
  return success(res, 200, { mentors }, 'Mentors fetched successfully');
});

/** PATCH /api/v1/admin/mentors/:id */
const updateMentor = asyncHandler(async (req, res) => {
  const mentor = await userService.updateUser(req.params.id, req.body);
  return success(res, 200, { mentor }, 'Mentor updated successfully');
});

/** DELETE /api/v1/admin/mentors/:id  (soft delete — deactivate, no hard delete in V1) */
const deactivateMentor = asyncHandler(async (req, res) => {
  const mentor = await userService.deactivateUser(req.params.id);
  return success(res, 200, { mentor }, 'Mentor deactivated successfully');
});

// ---------- Student management ----------

/** POST /api/v1/admin/students */
const createStudent = asyncHandler(async (req, res) => {
  const { student, tempPassword } = await userService.createStudent(req.body, req.user.id);
  return success(res, 201, { student, tempPassword }, 'Student account created successfully');
});

/** GET /api/v1/admin/students */
const listStudents = asyncHandler(async (req, res) => {
  const students = await userService.listStudents();
  return success(res, 200, { students }, 'Students fetched successfully');
});

/** PATCH /api/v1/admin/students/:id */
const updateStudent = asyncHandler(async (req, res) => {
  const student = await userService.updateUser(req.params.id, req.body);
  return success(res, 200, { student }, 'Student updated successfully');
});

/** DELETE /api/v1/admin/students/:id  (soft delete) */
const deactivateStudent = asyncHandler(async (req, res) => {
  const student = await userService.deactivateUser(req.params.id);
  return success(res, 200, { student }, 'Student deactivated successfully');
});

// ---------- Assignments ----------

/** POST /api/v1/admin/assignments */
const assignStudent = asyncHandler(async (req, res) => {
  const { mentorId, studentId } = req.body;
  const assignment = await assignmentService.assignStudentToMentor(mentorId, studentId, req.user.id);
  return success(res, 201, { assignment }, 'Student assigned to mentor successfully');
});

/** GET /api/v1/admin/assignments */
const listAssignments = asyncHandler(async (req, res) => {
  const assignments = await assignmentService.listAssignments();
  return success(res, 200, { assignments }, 'Assignments fetched successfully');
});

// ---------- System-wide visibility (admin sees everything) ----------

/** GET /api/v1/admin/sessions — ALL counseling records, across all mentors */
const listAllSessions = asyncHandler(async (req, res) => {
  const { mentorId, studentId, topic } = req.query;
  const filter = {};
  if (mentorId) filter.mentorId = mentorId;
  if (studentId) filter.studentId = studentId;
  if (topic) filter.topic = topic;

  const sessions = await CounselingSession.find(filter)
    .populate('mentorId', 'name email')
    .populate('studentId', 'name email rollNumber')
    .sort({ sessionDate: -1 });

  return success(res, 200, { sessions }, 'All counseling sessions fetched successfully');
});

/** GET /api/v1/admin/reports — ALL mentors' weekly reports */
const listAllReports = asyncHandler(async (req, res) => {
  const reports = await Report.find({})
    .populate('mentorId', 'name email department')
    .sort({ weekStartDate: -1 });

  return success(res, 200, { reports }, 'All reports fetched successfully');
});

module.exports = {
  createMentor,
  listMentors,
  updateMentor,
  deactivateMentor,
  createStudent,
  listStudents,
  updateStudent,
  deactivateStudent,
  assignStudent,
  listAssignments,
  listAllSessions,
  listAllReports,
};
