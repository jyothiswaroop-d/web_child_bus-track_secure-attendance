import Attendance from "../models/Attendance.js";
import Student from "../models/student_login.js";
import Bus from "../models/Bus.js";


// import { sendSmsNotification } from "../utils/smsService.js";  // optional helper

import { sendEmailNotification } from "../utils/emailService.js"; // optional helper

// import { notifyAttendance } from "../utils/attendanceNotification.js"; // new utility

// Add attendance using NFC ID
// Add attendance using NFC ID
// Add attendance using NFC ID
export const addAttendanceByNfc = async (req, res) => {
  try {
    const { nfcId, bus } = req.body;

    // 🧩 Normalize incoming NFC ID
    const cleanNfc = nfcId.replace(/\s+/g, '').toUpperCase();

    // 🧩 Find student with flexible NFC match
    const student = await Student.findOne({
      $expr: {
        $eq: [
          { $replaceAll: { input: { $toUpper: "$nfcId" }, find: " ", replacement: "" } },
          cleanNfc
        ]
      }
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // ✅ Get current time in IST
    const now = new Date();
    const indiaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

    // ✅ Determine session
    const currentHour = indiaTime.getHours();
    const session = currentHour < 12 ? "Morning" : "Evening";

    // ✅ Prepare start & end of day in IST
    const startOfDay = new Date(indiaTime);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(indiaTime);
    endOfDay.setHours(23, 59, 59, 999);

    // ✅ Check for duplicate attendance today
    const existing = await Attendance.findOne({
      student: student._id,
      date: { $gte: startOfDay, $lte: endOfDay },
      session,
    });

    if (existing) {
      return res.status(400).json({
        message: `Attendance already recorded for ${session} today`,
      });
    }

    // ✅ Save new attendance
    const attendance = new Attendance({
      student: student._id,
      bus,
      session,
      status: "Present",
      date: indiaTime,
    });

    await attendance.save();

    // ✅ Notify parent/admin using centralized utility
    if (student.notificationsEnabled) {
      try {
        await notifyAttendance(student, bus, session, indiaTime.toLocaleString("en-IN"));
      } catch (notifyErr) {
        console.error("Notification error:", notifyErr);
      }
    }

    // ✅ Respond success
    res.status(201).json({
      message: `Attendance recorded for ${session}`,
      attendance,
    });

  } catch (error) {
    console.error("Error adding attendance:", error);
    res.status(500).json({ message: error.message });
  }
};



// Get all attendance records
export const getAllAttendance = async (req, res) => {
  try {
    const records = await Attendance.find().populate("student", "stu_name stu_id class_section");
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get attendance by student ID

// Get attendance by student ID (with optional date filter)
export const getAttendanceByStudent = async (req, res) => {
  const { studentId } = req.params;
  const { date } = req.query;

  try {
    // Step 1: Find the student document using stu_id
    const student = await Student.findOne({ stu_id: studentId });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Step 2: Prepare query
    const query = { student: student._id };
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    // Step 3: Fetch attendance
    const attendance = await Attendance.find(query);

    // Step 4: Group by session (morning/evening)
    const morning = attendance.find(a => a.session === "Morning" && a.status === "Present");
    const evening = attendance.find(a => a.session === "Evening" && a.status === "Present");

    res.json({
      morning: morning ? { ...morning._doc } : null,
      evening: evening ? { ...evening._doc } : null
    });

  } catch (err) {
    console.error("Error fetching student attendance:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get attendance by bus number for today
// Get attendance by bus number (with optional date filter)
export const getAttendanceByBus = async (req, res) => {
  try {
    const { busNo } = req.params;
    const { date } = req.query; // read date from query string

    // Determine which date to check
    let targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(targetDate);
    nextDay.setDate(targetDate.getDate() + 1);

    // Find students in this bus
    const studentsInBus = await Student.find({ bus_no: busNo });
    if (!studentsInBus.length) {
      return res.status(404).json({ message: "No students found for this bus" });
    }

    const studentIds = studentsInBus.map((s) => s._id);

    // Find attendance for this date
    const attendanceRecords = await Attendance.find({
      student: { $in: studentIds },
      date: { $gte: targetDate, $lt: nextDay }
    }).populate("student", "stu_name stu_id class_section");

    res.json({
      busNo,
      date: targetDate.toISOString().split("T")[0],
      totalStudents: studentsInBus.length,
      presentCount: attendanceRecords.length,
      present: attendanceRecords,
      absent: studentsInBus.filter(
        (stu) => !attendanceRecords.find((a) => a.student._id.equals(stu._id))
      )
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// Get school-wide attendance for a date (all buses)
export const getDailyAttendanceReport = async (req, res) => {
  try {
    const { date } = req.query;

    // Pick date (default today if not passed)
    let targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(targetDate);
    nextDay.setDate(targetDate.getDate() + 1);

    // Get all buses
    const buses = await Bus.find();

    let report = [];

    for (let bus of buses) {
      // Get students of this bus
      const studentsInBus = await Student.find({ bus_no: bus.bus_no });
      const studentIds = studentsInBus.map((s) => s._id);

      // Get attendance records for this bus students
      const attendanceRecords = await Attendance.find({
        student: { $in: studentIds },
        date: { $gte: targetDate, $lt: nextDay }
      }).populate("student", "stu_name stu_id class_section");

      report.push({
        busNo: bus.bus_no,
        route: bus.route,
        totalStudents: studentsInBus.length,
        presentCount: attendanceRecords.length,
        absentCount: studentsInBus.length - attendanceRecords.length,
        present: attendanceRecords,
        absent: studentsInBus.filter(
          (stu) => !attendanceRecords.find((a) => a.student._id.equals(stu._id))
        )
      });
    }

    res.json({
      date: targetDate.toISOString().split("T")[0],
      totalBuses: buses.length,
      report
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 🚨 Proxy Detection Alert — Email to Admin Only
export const handleProxyAlert = async (req, res) => {
  try {
    const { nfcIds } = req.body; // from Arduino { nfcIds: ["UID1", "UID2"] }

    if (!nfcIds || !Array.isArray(nfcIds) || nfcIds.length < 2) {
      return res.status(400).json({ message: "Invalid or insufficient NFC IDs" });
    }

    // 🧩 Find students linked with these NFC IDs
    const students = await Student.find({
      nfcId: { $in: nfcIds.map(id => id.replace(/\s+/g, "").toUpperCase()) },
    });

    if (!students.length) {
      return res.status(404).json({ message: "No students found for these NFC IDs" });
    }

    const studentNames = students.map(s => s.stu_name).join(", ");
    const message = `⚠️ Proxy attendance detected for: ${studentNames}. Please verify immediately.`;

    const adminEmail = process.env.ADMIN_EMAIL || "admin@school.org";
    await sendEmailNotification(
      "Proxy Attendance Alert",
      "SmartBus System",
      message,
      adminEmail
    );

    console.log(`🚨 Proxy Alert Email Sent for: ${studentNames}`);
    res.status(200).json({ message: "Proxy alert sent successfully", studentNames });
  } catch (error) {
    console.error("Error handling proxy alert:", error);
    res.status(500).json({ message: error.message });
  }
};



// Get monthly attendance stats for a student
export const getMonthlyStats = async (req, res) => {
  try {
    const stuIdParam = req.params.studentId;
    const { year, month } = req.query;

    const student = await Student.findOne({ stu_id: stuIdParam });
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(year, month, 0);
    endDate.setHours(23, 59, 59, 999);

    // Get attendance records
    const records = await Attendance.find({
      student: student._id,
      date: { $gte: startDate, $lte: endDate }
    });

    // Count unique days (excluding Sundays)
    const uniqueDays = new Set();
    records.forEach(r => {
      const day = new Date(r.date);
      if (day.getDay() !== 0) { // Exclude Sundays
        uniqueDays.add(day.toDateString());
      }
    });

    // Calculate total working days in month (excluding Sundays)
    let totalDays = 0;
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0) totalDays++;
    }

    res.json({
      present: uniqueDays.size,
      total: totalDays
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get weekly attendance stats for a student
export const getWeeklyStats = async (req, res) => {
  try {
    const stuIdParam = req.params.studentId;
    const { weekStart } = req.query;

    const student = await Student.findOne({ stu_id: stuIdParam });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const startDate = new Date(weekStart);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 7);

    const records = await Attendance.find({
      student: student._id,
      date: { $gte: startDate, $lt: endDate }
    });

    // Count unique days (excluding Sundays)
    const uniqueDays = new Set();
    records.forEach(r => {
      const day = new Date(r.date);
      if (day.getDay() !== 0) {
        uniqueDays.add(day.toDateString());
      }
    });

    // Count working days in week (excluding Sundays)
    let totalDays = 0;
    for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0) totalDays++;
    }

    res.json({
      present: uniqueDays.size,
      total: totalDays
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};