import express from "express";
import {
  addStudent,
  getStudents,
  addManyStudents,
  getStudentById,
  updateNotificationPreference,  // for PUT
  updateNotifications,            // for PATCH
  loginStudent
} from "../controllers/student_login_controller.js";

const router = express.Router();

// IMP : Static routes FIRST

// Login student
router.post("/login", loginStudent);

// Add many students (bulk insert)
router.post("/bulk", addManyStudents);

// Add single student
router.post("/", addStudent);

// Get all students
router.get("/", getStudents);


// Dynamic routes AFTER static ones


// Update parent notification preference (PUT)
router.put("/:stu_id/notifications", updateNotificationPreference);

// Update notifications (PATCH)
router.patch("/:stu_id/notifications", updateNotifications);

// Get single student by stu_id
router.get("/:stu_id", getStudentById);

export default router;
