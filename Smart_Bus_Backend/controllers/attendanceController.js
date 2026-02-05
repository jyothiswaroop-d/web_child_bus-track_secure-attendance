import Attendance from "../models/Attendance.js";
import Student from "../models/student_login.js";
import Bus from "../models/Bus.js";
import { sendEmailNotification } from "../utils/emailService.js";
import { notifyAttendance } from "../utils/attendanceNotification.js";



// ADD NORMAL ATTENDANCE (No proxy detection here)

export const addAttendanceByNfc = async (req, res) => {
  try {
    const { nfcId, bus } = req.body;
    
    console.log("Received:", req.body);
    
    if (!nfcId) {
      return res.status(400).json({ message: "Missing NFC ID" });
    }

    const cleanNfc = nfcId.replace(/\s+/g, "").toUpperCase();

    const student = await Student.findOne({
      $expr: {
        $eq: [
          { $replaceAll: { input: { $toUpper: "$nfcId" }, find: " ", replacement: "" } },
          cleanNfc,
        ],
      },
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found for NFC: " + nfcId });
    }

    // Current time in IST
    const now = new Date();
    const indiaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

    // Session (Morning / Evening)

    const cutoffHour = 9;
    const cutoffMinute = 25;
    const session =
      indiaTime.getHours() < cutoffHour ||
      (indiaTime.getHours() === cutoffHour && indiaTime.getMinutes() < cutoffMinute)
        ? "Morning"
        : "Evening";


        // Date boundaries
    const startOfDay = new Date(indiaTime);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(indiaTime);
    endOfDay.setHours(23, 59, 59, 999);

    // Prevent duplicate attendance for same day/session
    const existing = await Attendance.findOne({
      student: student._id,
      date: { $gte: startOfDay, $lte: endOfDay },
      session,
      isProxy: false,
    });

    if (existing) {
      return res.status(400).json({
        message: `Attendance already recorded for ${student.stu_name} (${session} session)`,
      });
    }

    //  Save Normal Attendance
    const attendance = new Attendance({
      student: student._id,
      bus: bus || student.bus_no,
      session,
      status: "Present",
      date: indiaTime,
      isProxy: false,
    });
    await attendance.save();

    console.log(` Attendance saved: ${student.stu_name} (${session})`);

    // Optional: Send notification to parent
    if (student.notificationsEnabled) {
      try {
        await notifyAttendance(student, bus, session, indiaTime.toLocaleString("en-IN"));
      } catch (notifyErr) {
        console.error("Notification error:", notifyErr);
      }
    }

    res.status(201).json({
      message: `Attendance recorded for ${student.stu_name} (${session})`,
      attendance,
    });
  } catch (error) {
    console.error("Error adding attendance:", error);
    res.status(500).json({ message: error.message });
  }
};

// PROXY ALERT HANDLER (Separate endpoint)

export const handleProxyAlert = async (req, res) => {
  try {
    const { nfcIds, bus, isProxy } = req.body;

    console.log("🚨 Proxy Alert Received:", req.body);

    if (!nfcIds || !Array.isArray(nfcIds) || nfcIds.length < 2) {
      return res.status(400).json({ 
        message: "Invalid proxy alert: Need at least 2 NFC IDs",
        received: req.body 
      });
    }

    const normalizedIds = nfcIds.map((id) => 
      id.replace(/\s+/g, "").toUpperCase()
    );

    // Find all students with these NFC IDs
    const students = await Student.find({
      $expr: {
        $in: [
          { $replaceAll: { input: { $toUpper: "$nfcId" }, find: " ", replacement: "" } },
          normalizedIds
        ]
      }
    });

    if (!students || students.length === 0) {
      console.log("No students found for NFC IDs:", normalizedIds);
      return res.status(404).json({ 
        message: "No students found for these NFC IDs",
        nfcIds: normalizedIds
      });
    }

    const indiaTime = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
    
    const session =
      indiaTime.getHours() < 14 || 
      (indiaTime.getHours() === 14 && indiaTime.getMinutes() < 25)
        ? "Morning"
        : "Evening";

    // Save proxy records for all involved students
    const proxyRecords = [];
    for (const stu of students) {
      const proxyRecord = new Attendance({
        student: stu._id,
        bus: bus || stu.bus_no,
        session,
        status: "Absent", // Mark as absent due to proxy
        date: indiaTime,
        isProxy: true,
      });
      await proxyRecord.save();
      proxyRecords.push(proxyRecord);
    }

    const studentNames = students.map((s) => s.stu_name).join(", ");
    const nfcList = nfcIds.join(", ");
    
    const message = `
🚨 PROXY ATTENDANCE DETECTED

Bus: ${bus}
Session: ${session}
Time: ${indiaTime.toLocaleString("en-IN")}

Students Involved: ${studentNames}
NFC Cards Scanned: ${nfcList}

⚠️ Multiple cards were scanned for a single boarding event.
Please verify and take appropriate action.
    `;

    // Send email alert to admin
    const adminEmail = process.env.ADMIN_EMAIL || "admin@school.org";
    try {
      await sendEmailNotification(
        " Proxy Attendance Alert - " + bus,
        "SmartBus System",
        message,
        adminEmail
      );
      console.log("✅ Email sent to:", adminEmail);
    } catch (emailErr) {
      console.error("Email failed:", emailErr);
    }

    console.log(`Proxy logged: ${studentNames}`);

    res.status(200).json({
      success: true,
      message: "Proxy alert logged and admin notified",
      students: studentNames,
      nfcIds: nfcList,
      proxyRecords
    });

  } catch (error) {
    console.error("Error handling proxy alert:", error);
    res.status(500).json({ 
      message: "Server error processing proxy alert",
      error: error.message 
    });
  }
};







// OTHER FUNCTIONS 

export const getAllAttendance = async (req, res) => {
  try {
    const records = await Attendance.find()
      .populate("student", "stu_name stu_id class_section bus_no")
      .sort({ date: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAttendanceByStudent = async (req, res) => {
  try {
    const stuIdParam = req.params.studentId;
    const { date } = req.query;

    const student = await Student.findOne({ stu_id: stuIdParam });
    if (!student) return res.status(404).json({ message: "Student not found" });

    // 🔹 Convert input date to IST
    const indiaDate = date
      ? new Date(new Date(date).toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
      : new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

    const startOfDay = new Date(indiaDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(indiaDate);
    endOfDay.setHours(23, 59, 59, 999);

    //Correct chaining of .populate()
    const records = await Attendance.find({
      student: student._id,
      date: { $gte: startOfDay, $lte: endOfDay },
      $or: [{ isProxy: false }, { isProxy: { $exists: false } }]
    }).populate("student", "stu_name stu_id class_section");

    //Separate records by session
    const morningRecord = records.find(r => r.session === "Morning");
    const eveningRecord = records.find(r => r.session === "Evening");

    res.json({
      morning: morningRecord ? { boardingTime: morningRecord.date } : null,
      evening: eveningRecord ? { boardingTime: eveningRecord.date } : null
    });

  } catch (error) {
    console.error("Error in getAttendanceByStudent:", error);
    res.status(500).json({ message: error.message });
  }
};


export const getAttendanceByBus = async (req, res) => {
  try {
    const { busNo } = req.params;
    const { date } = req.query;

    //Convert date to IST
    const indiaDate = date
      ? new Date(new Date(date).toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
      : new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

    const startOfDay = new Date(indiaDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(indiaDate);
    endOfDay.setHours(23, 59, 59, 999);

    const studentsInBus = await Student.find({ bus_no: busNo });
    if (!studentsInBus.length) {
      return res.status(404).json({ message: "No students found for this bus" });
    }

    const studentIds = studentsInBus.map((s) => s._id);

    //Include both isProxy: false and records without the field
    const attendanceRecords = await Attendance.find({
      student: { $in: studentIds },
      date: { $gte: startOfDay, $lte: endOfDay },
      $or: [{ isProxy: false }, { isProxy: { $exists: false } }]
    }).populate("student", "stu_name stu_id class_section");

    res.json({
      busNo,
      date: startOfDay.toISOString().split("T")[0],
      totalStudents: studentsInBus.length,
      presentCount: attendanceRecords.length,
      present: attendanceRecords,
      absent: studentsInBus.filter(
        (stu) => !attendanceRecords.find((a) => a.student._id.equals(stu._id))
      )
    });
  } catch (error) {
    console.error("Error in getAttendanceByBus:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getDailyAttendanceReport = async (req, res) => {
  try {
    const { date } = req.query;

    // 🔹 Convert to IST
    const indiaDate = date
      ? new Date(new Date(date).toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
      : new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

    const startOfDay = new Date(indiaDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(indiaDate);
    endOfDay.setHours(23, 59, 59, 999);

    const buses = await Bus.find();
    let report = [];

    for (let bus of buses) {
      const studentsInBus = await Student.find({ bus_no: bus.bus_no });
      const studentIds = studentsInBus.map((s) => s._id);

      const attendanceRecords = await Attendance.find({
        student: { $in: studentIds },
        date: { $gte: startOfDay, $lte: endOfDay },
        $or: [{ isProxy: false }, { isProxy: { $exists: false } }]
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
      date: startOfDay.toISOString().split("T")[0],
      totalBuses: buses.length,
      report
    });
  } catch (error) {
    console.error("Error in getDailyAttendanceReport:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getMonthlyStats = async (req, res) => {
  try {
    const stuIdParam = req.params.studentId;
    const { year, month } = req.query;

    const student = await Student.findOne({ stu_id: stuIdParam });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const startDate = new Date(year, month - 1, 1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(year, month, 0);
    endDate.setHours(23, 59, 59, 999);

    const records = await Attendance.find({
      student: student._id,
      date: { $gte: startDate, $lte: endDate },
      $or: [{ isProxy: false }, { isProxy: { $exists: false } }]
    });

    const uniqueDays = new Set(records.map(r => new Date(r.date).toDateString()));
    const totalDays = new Date(year, month, 0).getDate();

    res.json({
      present: uniqueDays.size,
      total: totalDays
    });

  } catch (error) {
    console.error("Error in getMonthlyStats:", error);
    res.status(500).json({ message: error.message });
  }
};


export const getWeeklyStats = async (req,  res) => {
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
      date: { $gte: startDate, $lt: endDate },
      $or: [{ isProxy: false }, { isProxy: { $exists: false } }]
    });

    const uniqueDays = new Set(records.map(r => new Date(r.date).toDateString()));

    res.json({
      present: uniqueDays.size,
      total: 7
    });

  } catch (error) {
    console.error("Error in getWeeklyStats:", error);
    res.status(500).json({ message: error.message });
  }
};
