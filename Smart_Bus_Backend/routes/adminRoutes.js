import express from "express";
import { addAdmin, getAdmins, getAdminByUsername } from "../controllers/adminController.js";

const router = express.Router();

// Route to add new admin
router.post("/add", addAdmin);

// Route to get all admins
router.get("/all", getAdmins);

// Route to get single admin by username
router.get("/:username", getAdminByUsername);

export default router;
