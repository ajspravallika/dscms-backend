const Department = require('../models/Department.model');
async function listDepartments(activeOnly = false) { return Department.find(activeOnly ? { isActive: true } : {}).sort({ name: 1 }); }
async function createDepartment(payload, adminId) { return Department.create({ name: payload.name, code: payload.code, createdBy: adminId }); }
async function updateDepartment(id, payload) {
  const dept = await Department.findByIdAndUpdate(id, { name: payload.name, code: payload.code, isActive: payload.isActive }, { new: true, runValidators: true });
  if (!dept) { const e = new Error('Department not found'); e.statusCode = 404; throw e; } return dept;
}
module.exports = { listDepartments, createDepartment, updateDepartment };