// controllers/student_login_controller.js
import Student_login from "../models/student_login.js";


// Add one student
export const addStudent = async (req, res) => {
  try {
    const student = await Student_login.create(req.body);
    res.status(201).json(student);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Add many students
export const addManyStudents = async (req, res) => {
  try {
    const students = await Student_login.insertMany(req.body); // expects array
    res.status(201).json(students);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all students
export const getStudents = async (req, res) => {
  try {
    const students = await Student_login.find();
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get student by ID
export const getStudentById = async (req, res) => {
  try {
    const student = await Student_login.findOne({ stu_id: req.params.stu_id });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login student by stu_id (or nfcId if needed later)

export const loginStudent = async (req, res) => {
  try {
    const { stu_id } = req.body; // Expect { "stu_id": "550101" }

    if (!stu_id) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required",
      });
    }

    //Ensure stu_id is treated as string
    const student = await Student_login.findOne({ stu_id: String(stu_id) });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Invalid Student ID",
      });
    }

    //Login success
    res.status(200).json({
      success: true,
      message: "Login successful",
      student,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Update parent notification preference
export const updateNotificationPreference = async (req, res) => {
  try {
    const { stu_id } = req.params;
    const { notificationsEnabled } = req.body;

    const student = await Student_login.findOneAndUpdate(
      { stu_id },
      { notificationsEnabled },
      { new: true } // return updated document
    );

    if (!student) return res.status(404).json({ message: "Student not found" });

    res.json({ message: "Notification preference updated", student });
  } catch (error) {
    console.error("Error updating notification preference:", error);
    res.status(500).json({ message: error.message });
  }
};


// PATCH /api/students/:stu_id/notifications
// PATCH /api/students/:stu_id/notifications
export const updateNotifications = async (req, res) => {
  try {
    const { stu_id } = req.params;
    const { notificationsEnabled } = req.body;

    console.log("Received PATCH request for student:", stu_id);
    console.log("Request body:", req.body);

    const student = await Student_login.findOneAndUpdate(
      { stu_id },
      { notificationsEnabled },
      { new: true }
    );

    if (!student) {
      console.log("Student not found for stu_id:", stu_id);
      return res.status(404).json({ message: "Student not found" });
    }

    console.log("Updated student:", student.notificationsEnabled);

    res.json({
      message: `Notifications updated to ${notificationsEnabled}`,
      student,
    });
  } catch (error) {
    console.error("Error updating notifications:", error);
    res.status(500).json({ message: error.message });
  }
};

