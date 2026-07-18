const CounselingSession = require('../models/CounselingSession.model');
const Attendance = require('../models/Attendance.model');
const Concern = require('../models/Concern.model');
const Report = require('../models/Report.model');
const User = require('../models/User.model');

async function generateWeeklyReport(mentorId, weekStartDate, weekEndDate, highlights) {
  const start = new Date(weekStartDate);
  const end = new Date(weekEndDate);
  // Set end to end of day so the full last day is included
  end.setHours(23, 59, 59, 999);

  // Fetch unique sessions in this date range
  const sessions = await CounselingSession.find({
    mentorId,
    sessionDate: { $gte: start, $lte: end },
  }).populate('studentId', 'name rollNumber');

  // Unique students counseled this week
  const uniqueStudentIds = new Set(sessions.map((s) => s.studentId._id.toString()));

  // Fetch attendance records for this week
  const attendanceRecords = await Attendance.find({
    mentorId,
    date: { $gte: start, $lte: end },
  }).populate('studentId', 'name rollNumber');

  // Total attendance summary
  const attendanceSummary = { present: 0, absent: 0, excused: 0 };
  for (const record of attendanceRecords) {
    if (attendanceSummary[record.status] !== undefined) {
      attendanceSummary[record.status] += 1;
    }
  }

  // Per-student attendance breakdown — shows each student's status for the week
  const studentAttendanceMap = {};
  for (const record of attendanceRecords) {
    const studentId = record.studentId._id.toString();
    const studentName = record.studentId.name;
    const rollNumber = record.studentId.rollNumber;

    if (!studentAttendanceMap[studentId]) {
      studentAttendanceMap[studentId] = {
        studentId,
        name: studentName,
        rollNumber,
        present: 0,
        absent: 0,
        excused: 0,
      };
    }
    studentAttendanceMap[studentId][record.status] += 1;
  }

  const studentBreakdown = Object.values(studentAttendanceMap);

  // Open concerns count
  const openConcerns = await Concern.countDocuments({
    mentorId,
    status: { $in: ['open', 'in-progress'] },
  });

  const report = await Report.findOneAndUpdate(
    { mentorId, weekStartDate: start },
    {
      mentorId,
      weekStartDate: start,
      weekEndDate: end,
      totalStudentsCounseled: uniqueStudentIds.size,
      totalSessionsHeld: sessions.length,
      attendanceSummary,
      studentBreakdown,
      openConcerns,
      highlights: highlights || '',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return report;
}

async function listReportsForMentor(mentorId) {
  return Report.find({ mentorId }).sort({ weekStartDate: -1 });
}

module.exports = { generateWeeklyReport, listReportsForMentor };
