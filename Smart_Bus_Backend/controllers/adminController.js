import Admin from "../models/adminModel.js";

// Add a new admin
export const addAdmin = async (req, res) => {
  try {
    const { name, designation, user_name, dob, work_experience } = req.body;

    const existingAdmin = await Admin.findOne({ user_name });
    if (existingAdmin) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const newAdmin = new Admin({
      name,
      designation,
      user_name,
      dob,
      work_experience,
    });

    const savedAdmin = await newAdmin.save();
    res.status(201).json({
      message: "Admin added successfully",
      data: savedAdmin,
    });
  } catch (error) {
    res.status(500).json({ message: "Error adding admin", error: error.message });
  }
};

// Get all admins
export const getAdmins = async (req, res) => {
  try {
    const admins = await Admin.find();
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving admins", error: error.message });
  }
};

// Get a single admin by username
export const getAdminByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const admin = await Admin.findOne({ user_name: username });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.status(200).json(admin);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving admin", error: error.message });
  }
};
