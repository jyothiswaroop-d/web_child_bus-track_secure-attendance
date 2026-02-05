// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import os from "os";
import connectDB from "./config/db.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize express app
const app = express();

//Enable CORS (important for React and ESP32 communication)
app.use(cors({
  origin: '*', // Allow all origins for dev/testing
  methods: ['GET', 'POST', 'PUT','PATCH', 'DELETE'],
  credentials: true
}));

// Middleware to parse JSON
app.use(express.json());

/* ------------------ IMPORT ROUTES ------------------ */
import studentRoutes from "./routes/student_login_route.js";          // student login & profile
import attendanceRoutes from "./routes/attendanceRoutes.js";    // attendance tracking
import busRoutes from "./routes/bus_route.js";                  // bus info + location
import adminRoutes from "./routes/adminRoutes.js";              // admin dashboard

/* ------------------ REGISTER ROUTES ------------------ */
app.use("/api/students", studentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/buses", busRoutes);
app.use("/api/admin", adminRoutes);


/* ------------------ SCHEDULER ------------------ */
import './utils/scheduler.js';  // cron jobs for attendance notification


/* ------------------ TEST ROOT ROUTE ------------------ */
app.get("/", (req, res) => {
  res.send("Smart Bus Backend Running ");
});

/* ------------------ HELPER: GET LOCAL IP ------------------ */
function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}

/* ------------------ ERROR HANDLING ------------------ */
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

app.use((err, req, res, next) => {
  console.error(" Error:", err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

/* ------------------ START SERVER ------------------ */
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  const localIP = getLocalIP();
  console.log(`\n Server running on port ${PORT}`);
  console.log(`Local:   http://localhost:${PORT}`);
  console.log(`Network: http://${localIP}:${PORT}`);
  console.log(`Use the Network URL in your ESP32 and React app!\n`);
});


