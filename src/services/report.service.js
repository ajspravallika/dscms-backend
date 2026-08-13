const CounselingSession = require('../models/CounselingSession.model');
const SessionStudent = require('../models/SessionStudent.model');
const Concern = require('../models/Concern.model');
const Report = require('../models/Report.model');

async function generateWeeklyReport(mentorId, weekStartDate, weekEndDate, highlights) {
  const start = new Date(weekStartDate);
  const end = new Date(weekEndDate);
  end.setHours(23, 59, 59, 999);

  const sessions = await CounselingSession.find({ mentorId, sessionDate: { $gte: start, $lte: end } });
  const sessionIds = sessions.map(s => s._id);
  const studentRecords = await SessionStudent.find({ sessionId: { $in: sessionIds } })
    .populate('studentId', 'name rollNumber');

  const uniqueStudentIds = new Set(studentRecords.filter(r => r.attendance === 'present').map(r => r.studentId._id.toString()));
  const attendanceSummary = { present: 0, absent: 0, excused: 0 };
  for (const r of studentRecords) { if (attendanceSummary[r.attendance] !== undefined) attendanceSummary[r.attendance]++; }

  const studentMap = {};
  for (const r of studentRecords) {
    const sid = r.studentId._id.toString();
    if (!studentMap[sid]) studentMap[sid] = { studentId: sid, name: r.studentId.name, rollNumber: r.studentId.rollNumber, present: 0, absent: 0, excused: 0 };
    studentMap[sid][r.attendance]++;
  }

  const openConcerns = await Concern.countDocuments({ mentorId, status: { $in: ['open', 'in-progress'] } });

  return Report.findOneAndUpdate(
    { mentorId, weekStartDate: start },
    { mentorId, weekStartDate: start, weekEndDate: end, totalStudentsCounseled: uniqueStudentIds.size, totalSessionsHeld: sessions.length, attendanceSummary, studentBreakdown: Object.values(studentMap), openConcerns, highlights: highlights || '' },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function listReportsForMentor(mentorId) {
  return require('../models/Report.model').find({ mentorId }).sort({ weekStartDate: -1 });
}

module.exports = { generateWeeklyReport, listReportsForMentor };
