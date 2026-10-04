const Department = require('../models/Department.model');

const DEFAULT_DEPARTMENTS = [
  { name: 'Computer Science & Engineering', code: 'CSE', sections: ['A', 'B'] },
  { name: 'Computer Science & Counseling', code: 'CSC', sections: ['A'] },
  { name: 'Cyber Security', code: 'CYS', sections: ['A'] },
  { name: 'Information Technology', code: 'IT', sections: ['A', 'B'] },
  { name: 'Artificial Intelligence & Machine Learning', code: 'AIML', sections: ['A', 'B'] },
  { name: 'Artificial Intelligence & Data Science', code: 'AIDS', sections: ['A'] },
  { name: 'Electronics & Communication Engineering', code: 'ECE', sections: ['A', 'B'] },
  { name: 'Electrical & Electronics Engineering', code: 'EEE', sections: ['A'] },
  { name: 'Mechanical Engineering', code: 'MECH', sections: ['A'] },
  { name: 'Civil Engineering', code: 'CIVIL', sections: ['A'] },
];

async function seedDefaultDepartments() {
  for (const dept of DEFAULT_DEPARTMENTS) {
    const exists = await Department.findOne({ code: dept.code });
    if (!exists) await Department.create(dept);
  }
}

async function listDepartments(activeOnly = false) {
  return Department.find(activeOnly ? { isActive: true } : {}).sort({ name: 1 });
}

async function createDepartment(payload, adminId) {
  const sections = payload.sections
    ? payload.sections.split(',').map(s => s.trim()).filter(Boolean)
    : ['A'];
  return Department.create({
    name: payload.name,
    code: payload.code,
    sections,
    createdBy: adminId,
  });
}

async function updateDepartment(id, payload) {
  const updates = { name: payload.name, code: payload.code, isActive: payload.isActive };
  if (payload.sections) {
    updates.sections = payload.sections.split(',').map(s => s.trim()).filter(Boolean);
  }
  const dept = await Department.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  if (!dept) { const e = new Error('Department not found'); e.statusCode = 404; throw e; }
  return dept;
}

module.exports = { listDepartments, createDepartment, updateDepartment, seedDefaultDepartments };