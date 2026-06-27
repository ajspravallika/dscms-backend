const CounselingSession = require('../models/CounselingSession.model');
const Attendance = require('../models/Attendance.model');
const Concern = require('../models/Concern.model');
const Report = require('../models/Report.model');

/**
 * Generates a weekly report for a mentor by aggregating their own
 * sessions/attendance/concerns within [weekStartDate, weekEndDate].
 *
 * V1 has no cron — this is triggered explicitly by the mentor hitting
 * POST /mentor/reports/weekly with a date range (defaulting to "the
 * last 7 days" if not provided). Re-submitting for the same week
 * overwrites the previous report for that week (upsert), since the
 * unique index is on mentorId + weekStartDate.
 */
async function generateWeeklyReport(mentorId, weekStartDate, weekEndDate, highlights) {
  const start = new Date(weekStartDate);
  const end = new Date(weekEndDate);

  const sessions = await CounselingSession.find({
    mentorId,
    sessionDate: { $gte: start, $lte: end },
  });

  const uniqueStudentIds = new Set(sessions.map((s) => s.studentId.toString()));

  const attendanceRecords = await Attendance.find({
    mentorId,
    date: { $gte: start, $lte: end },
  });

  const attendanceSummary = { present: 0, absent: 0, excused: 0 };
  for (const record of attendanceRecords) {
    attendanceSummary[record.status] += 1;
  }

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
