const asyncHandler = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');
const userService = require('../services/user.service');
const assignmentService = require('../services/assignment.service');
const sessionService = require('../services/session.service');
const deptService = require('../services/department.service');
const Student = require('../models/Student.model');
const Mentor = require('../models/Mentor.model');
const XLSX = require('xlsx');

const createMentor = asyncHandler(async (req, res) => { const r = await userService.createMentor(req.body, req.user.id); return success(res, 201, r, 'Mentor created'); });
const listMentors = asyncHandler(async (req, res) => {
  const mentors = await userService.listMentors(req.query);
  const withCounts = await Promise.all(mentors.map(async m => { const counts = await assignmentService.getMentorWorkload(m._id); return { ...m.toObject(), workload: counts }; }));
  return success(res, 200, { mentors: withCounts });
});
const updateMentor = asyncHandler(async (req, res) => success(res, 200, { mentor: await userService.updateUser(req.params.id, req.body) }));
const deactivateMentor = asyncHandler(async (req, res) => success(res, 200, { mentor: await userService.deactivateUser(req.params.id) }, 'Mentor deactivated'));
const deleteMentor = asyncHandler(async (req, res) => success(res, 200, await userService.permanentlyDeleteUser(req.params.id), 'Mentor deleted'));
const bulkUploadMentors = asyncHandler(async (req, res) => {
  if (!req.file) return error(res, 400, 'No file uploaded');
  const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  if (!rows.length) return error(res, 400, 'Empty file');
  const r = await userService.bulkCreateMentors(rows, req.user.id);
  return success(res, 201, r, r.created.length + ' created, ' + r.duplicates.length + ' duplicates, ' + r.failed.length + ' failed');
});
const getMentorStudents = asyncHandler(async (req, res) => {
  const students = await Student.find({ mentorId: req.params.mentorId, isActive: true, isPassout: false }).sort({ year: 1, rollNumber: 1 });
  const grouped = { 1: [], 2: [], 3: [], 4: [] };
  students.forEach(s => { if (s.year && grouped[s.year]) grouped[s.year].push(s); });
  return success(res, 200, { students, grouped, total: students.length });
});
const createStudent = asyncHandler(async (req, res) => { const r = await userService.createStudent(req.body, req.user.id); return success(res, 201, r, 'Student created'); });
const listStudents = asyncHandler(async (req, res) => success(res, 200, { students: await userService.listStudents(req.query) }));
const updateStudent = asyncHandler(async (req, res) => success(res, 200, { student: await userService.updateUser(req.params.id, req.body) }));
const deactivateStudent = asyncHandler(async (req, res) => success(res, 200, { student: await userService.deactivateUser(req.params.id) }, 'Student deactivated'));
const deleteStudent = asyncHandler(async (req, res) => success(res, 200, await userService.permanentlyDeleteUser(req.params.id), 'Student deleted'));
const bulkUploadStudents = asyncHandler(async (req, res) => {
  if (!req.file) return error(res, 400, 'No file uploaded');
  const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  if (!rows.length) return error(res, 400, 'Empty file');
  const r = await userService.bulkCreateStudents(rows, req.user.id);
  return success(res, 201, r, r.created.length + ' created');
});

// AUTO ASSIGN — splits students by roll number across mentors sequentially
const autoAssignStudents = asyncHandler(async (req, res) => {
  const { mentorIds, studentIds, splitSize } = req.body;
  if (!mentorIds?.length || !studentIds?.length) return error(res, 400, 'mentorIds and studentIds required');
  // Sort students by rollNumber
  const students = await Student.find({ _id: { $in: studentIds }, isActive: true }).sort({ rollNumber: 1 });
  const size = splitSize || Math.ceil(students.length / mentorIds.length);
  const results = { assigned: [], failed: [] };
  let mentorIndex = 0;
  for (let i = 0; i < students.length; i++) {
    if (i > 0 && i % size === 0 && mentorIndex < mentorIds.length - 1) mentorIndex++;
    const r = await assignmentService.assignStudents(mentorIds[mentorIndex], [students[i]._id], req.user.id);
    results.assigned.push(...r.assigned);
    results.failed.push(...r.failed);
  }
  return success(res, 200, results, results.assigned.length + ' students auto-assigned');
});

const assignStudents = asyncHandler(async (req, res) => { const r = await assignmentService.assignStudents(req.body.mentorId, req.body.studentIds, req.user.id); return success(res, 200, r, r.assigned.length + ' assigned'); });
const unassignStudents = asyncHandler(async (req, res) => success(res, 200, await assignmentService.unassignStudents(req.body.studentIds)));
const listAssignments = asyncHandler(async (req, res) => success(res, 200, { assignments: await assignmentService.listAssignments(req.query) }));
const getMentorWorkload = asyncHandler(async (req, res) => success(res, 200, { workload: await assignmentService.getMentorWorkload(req.params.mentorId) }));
const promoteStudents = asyncHandler(async (req, res) => success(res, 200, await userService.promoteStudents(req.body.passoutBatchLabel), 'Students promoted'));
const listPassoutBatches = asyncHandler(async (req, res) => success(res, 200, { batches: await userService.listPassoutBatches() }));
const deletePassoutBatch = asyncHandler(async (req, res) => success(res, 200, await userService.deletePassoutBatch(req.body.batchLabel), 'Batch deleted'));
const listDepartments = asyncHandler(async (req, res) => {
  await deptService.seedDefaultDepartments();
  return success(res, 200, { departments: await deptService.listDepartments(req.query.activeOnly === 'true') });
});
const createDepartment = asyncHandler(async (req, res) => success(res, 201, { department: await deptService.createDepartment(req.body, req.user.id) }, 'Department created'));
const updateDepartment = asyncHandler(async (req, res) => success(res, 200, { department: await deptService.updateDepartment(req.params.id, req.body) }));
const getAllSessions = asyncHandler(async (req, res) => success(res, 200, { sessions: await sessionService.getAllSessionsForAdmin(req.query) }));

module.exports = { createMentor, listMentors, updateMentor, deactivateMentor, deleteMentor, bulkUploadMentors, getMentorStudents, createStudent, listStudents, updateStudent, deactivateStudent, deleteStudent, bulkUploadStudents, autoAssignStudents, assignStudents, unassignStudents, listAssignments, getMentorWorkload, promoteStudents, listPassoutBatches, deletePassoutBatch, listDepartments, createDepartment, updateDepartment, getAllSessions };
