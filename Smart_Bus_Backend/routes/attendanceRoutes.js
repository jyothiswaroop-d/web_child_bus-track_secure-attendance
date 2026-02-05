import express from "express";
import {
  addAttendanceByNfc,
  getAllAttendance,
  getAttendanceByStudent,
  getAttendanceByBus,
  getDailyAttendanceReport,
  handleProxyAlert,
  getMonthlyStats,
  getWeeklyStats
} from "../controllers/attendanceController.js";

const router = express.Router();

console.log("Attendance routes loaded");

// Specific routes first
router.post("/nfc", addAttendanceByNfc);
router.post("/proxy-alert", handleProxyAlert); // Fixed line
router.get("/report/daily", getDailyAttendanceReport);
router.get("/bus/:busNo", getAttendanceByBus);

// Stats routes
router.get("/student/:studentId/stats", getMonthlyStats);
router.get("/student/:studentId/weekly", getWeeklyStats);

// Student attendance detail
router.get("/student/:studentId", getAttendanceByStudent);

// Default route
router.get("/", getAllAttendance);

export default router;
