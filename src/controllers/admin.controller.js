const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const { success, error } = require('../utils/apiResponse');
const userService = require('../services/user.service');
const sessionService = require('../services/session.service');
const assignmentService = require('../services/assignment.service');
const Report = require('../models/Report.model');
const XLSX = require('xlsx');

const createMentor = asyncHandler(async (req, res) => { const r = await userService.createMentor(req.body, req.user.id); return success(res, 201, r, 'Mentor created'); });
const listMentors = asyncHandler(async (req, res) => { return success(res, 200, { mentors: await userService.listMentors() }); });
const updateMentor = asyncHandler(async (req, res) => { return success(res, 200, { mentor: await userService.updateUser(req.params.id, req.body) }); });
const deactivateMentor = asyncHandler(async (req, res) => { return success(res, 200, { mentor: await userService.deactivateUser(req.params.id) }, 'Mentor deactivated'); });
const deleteMentor = asyncHandler(async (req, res) => { return success(res, 200, await userService.permanentlyDeleteUser(req.params.id), 'Mentor deleted'); });
const reassignMentorStudents = asyncHandler(async (req, res) => { return success(res, 200, await userService.reassignMentorStudents(req.params.id, req.body.toMentorId), 'Students reassigned'); });

const bulkUploadMentors = asyncHandler(async (req, res) => {
  if (!req.file) return error(res, 400, 'No file uploaded');
  const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  if (!rows.length) return error(res, 400, 'Excel file is empty');
  const result = await userService.bulkCreateMentors(rows, req.user.id);
  return success(res, 201, result, `${result.created.length} created, ${result.failed.length} failed`);
});

const createStudent = asyncHandler(async (req, res) => { const r = await userService.createStudent(req.body, req.user.id); return success(res, 201, r, 'Student created'); });
const listStudents = asyncHandler(async (req, res) => { return success(res, 200, { students: await userService.listStudents(req.query) }); });
const updateStudent = asyncHandler(async (req, res) => { return success(res, 200, { student: await userService.updateUser(req.params.id, req.body) }); });
const deactivateStudent = asyncHandler(async (req, res) => { return success(res, 200, { student: await userService.deactivateUser(req.params.id) }, 'Student deactivated'); });
const deleteStudent = asyncHandler(async (req, res) => { return success(res, 200, await userService.permanentlyDeleteUser(req.params.id), 'Student deleted'); });

const bulkUploadStudents = asyncHandler(async (req, res) => {
  if (!req.file) return error(res, 400, 'No file uploaded');
  const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  if (!rows.length) return error(res, 400, 'Excel file is empty');
  const result = await userService.bulkCreateStudents(rows, req.user.id);
  return success(res, 201, result, `${result.created.length} created, ${result.failed.length} failed`);
});

const promoteStudents = asyncHandler(async (req, res) => { return success(res, 200, await userService.promoteStudents(req.body.passoutBatchLabel), 'Students promoted'); });
const listPassoutBatches = asyncHandler(async (req, res) => { return success(res, 200, { batches: await userService.listPassoutBatches() }); });
const deletePassoutBatch = asyncHandler(async (req, res) => { return success(res, 200, await userService.deletePassoutBatch(req.body.batchLabel), 'Batch deleted'); });

const assignStudent = asyncHandler(async (req, res) => { return success(res, 201, { assignment: await assignmentService.assignStudentToMentor(req.body.mentorId, req.body.studentId, req.user.id) }, 'Assigned'); });
const listAssignments = asyncHandler(async (req, res) => { return success(res, 200, { assignments: await assignmentService.listAssignments() }); });

const listAllSessions = asyncHandler(async (req, res) => { return success(res, 200, { sessions: await sessionService.getAllSessionsForAdmin(req.query) }); });
const listSubmittedSessions = asyncHandler(async (req, res) => { return success(res, 200, { sessions: await sessionService.getSubmittedSessions(req.query.year) }); });
const listAllReports = asyncHandler(async (req, res) => { return success(res, 200, { reports: await Report.find({}).populate('mentorId', 'name email department').sort({ weekStartDate: -1 }) }); });

module.exports = { createMentor, listMentors, updateMentor, deactivateMentor, deleteMentor, reassignMentorStudents, bulkUploadMentors, createStudent, listStudents, updateStudent, deactivateStudent, deleteStudent, bulkUploadStudents, promoteStudents, listPassoutBatches, deletePassoutBatch, assignStudent, listAssignments, listAllSessions, listSubmittedSessions, listAllReports };
