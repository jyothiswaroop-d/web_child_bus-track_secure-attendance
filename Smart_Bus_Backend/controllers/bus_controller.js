import Bus from "../models/Bus.js";
import Student from "../models/student_login.js";
import { notifyBus } from "../utils/busNotification.js"; // new utility

const STUCK_THRESHOLD_MINUTES = 5;
const DISTANCE_THRESHOLD_METERS = 30; 

// Helper: Automatically decide current session (Morning / Evening)
function getCurrentSession() {
  const now = new Date();
  const indiaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

  const hour = indiaTime.getHours();
  const minute = indiaTime.getMinutes();

  // Example cutoff time — before 2:25 PM = Morning, after = Evening
  const cutoffHour = 14;   // 2 PM
  const cutoffMinute = 25; // 25 min

  if (hour < cutoffHour || (hour === cutoffHour && minute < cutoffMinute)) {
    return "Morning";
  } else {
    return "Evening";
  }
}

// Helper: Haversine formula to calculate distance (in meters)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in meters
}

/* ---------------------- BUS MANAGEMENT ---------------------- */

// Add a new bus
export const addBus = async (req, res) => {
  try {
    const bus = new Bus(req.body);
    await bus.save();
    res.status(201).json(bus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all buses
export const getBuses = async (req, res) => {
  try {
    const buses = await Bus.find();
    res.json(buses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get bus by student ID + students assigned
export const getBusWithStudents = async (req, res) => {
  try {
    const stuId = req.params.id;

    const student = await Student.findOne({ stu_id: stuId });
    if (!student)
      return res.status(404).json({ message: "Student not found" });

    const bus = await Bus.findOne({ bus_no: student.bus_no });
    if (!bus)
      return res
        .status(404)
        .json({ message: "Bus not found for this student" });

    const students = await Student.find({ bus_no: bus.bus_no });
    res.json({ bus, students });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ---------------------- BUS ROUTE & STOPS ---------------------- */

// Initialize bus with stops (route)
export const initializeBusRoute = async (req, res) => {
  try {
    const { busId, bus_no, latitude, longitude, currentSession, routes } = req.body;

    if (!busId || !bus_no || !routes || !routes.length) {
      return res.status(400).json({ message: "Bus ID, bus_no and routes required" });
    }

    // Find existing bus by busId
    let bus = await Bus.findOne({ busId });

    if (!bus) {
      // Create new bus with route information
      bus = new Bus({
        busId,
        bus_no,
        latitude,
        longitude,
        currentSession,
        routes: routes.map(route => ({
          ...route,
          stops: route.stops.map(stop => ({
            ...stop,
            visited: false,
            radius: stop.radius || 50, // default radius
          })),
        })),
      });

      await bus.save();
      return res.status(201).json({ success: true, message: "Bus route initialized successfully", bus });
    }

    // If bus exists, update its route and session info
    bus.latitude = latitude;
    bus.longitude = longitude;
    bus.currentSession = currentSession;
    bus.routes = routes.map(route => ({
      ...route,
      stops: route.stops.map(stop => ({
        ...stop,
        visited: false,
        radius: stop.radius || 50,
      })),
    }));

    await bus.save();

    res.json({ success: true, message: "Bus route updated successfully", bus });

  } catch (error) {
    console.error("Error initializing bus route:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ---------------------- LIVE LOCATION UPDATES ---------------------- */

// Update bus location and check for stop/stuck alerts

// ────────────────────────────────────────────────
// 🕒 GLOBAL VARIABLES for periodic logs
// ────────────────────────────────────────────────
let lastPrintedAt = 0; // last time distances were printed
const PRINT_INTERVAL_MINUTES = 2; // ⏱️ print every 2 minutes

// ────────────────────────────────────────────────
// 🚌 UPDATE BUS LOCATION CONTROLLER
// ────────────────────────────────────────────────
export const updateBusLocation = async (req, res) => {
  try {
    const { busId, latitude, longitude } = req.body;

    // 🔍 Find bus in database
    const bus = await Bus.findOne({ busId });
    if (!bus) return res.status(404).json({ message: "Bus not found" });

    const now = new Date();
    const dateTime = now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    // 🔍 Identify current route (Morning / Evening)
    const currentRoute = bus.routes.find(
      (r) => r.routeType.toLowerCase().trim() === bus.currentSession.toLowerCase().trim()
    );
    if (!currentRoute) {
      console.log(`⚠️ No matching route found for session: ${bus.currentSession}`);
      return res.status(400).json({ message: "No active route found" });
    }

    /* ───────────────────────────────
       ⏱️ PERIODIC DISTANCE LOG (every 2 min)
    ─────────────────────────────── */
    const nowMs = Date.now();
    const shouldPrint = nowMs - lastPrintedAt > PRINT_INTERVAL_MINUTES * 60 * 1000;

    if (shouldPrint) {
      console.log("\n⏱️ [Periodic Distance Update]");
    }

    /* ───────────────────────────────
       📍 STOP CROSSING ALERTS
    ─────────────────────────────── */
    for (const stop of currentRoute.stops) {
      const distToStop = getDistance(latitude, longitude, stop.lat, stop.lng);

      // 🧭 Log distances every 2 minutes only
      if (shouldPrint) {
        console.log(`🧭 Distance to stop ${stop.name}: ${distToStop.toFixed(2)}m (visited: ${stop.visited})`);
      }

      // 🚍 Stop crossing alert (within radius)
      if (!stop.visited && distToStop < (stop.radius || 50)) {
        stop.visited = true;
        const crossMsg = `📍 Bus ${bus.bus_no} has crossed ${stop.name}.`;
        console.log(crossMsg);

        try {
          await notifyBus(bus, crossMsg);
        } catch (err) {
          console.error("❌ Error sending stop crossing alert:", err);
        }
      }
    }

    // ⏱️ Update timestamp after printing
    if (shouldPrint) lastPrintedAt = nowMs;

    /* ───────────────────────────────
       🏁 DESTINATION REACHED ALERT
    ─────────────────────────────── */
    const destination = currentRoute.destination_point;
    const distToDestination = getDistance(latitude, longitude, destination.lat, destination.lng);

    if (distToDestination < 80) {
      console.log(`✅ Bus ${bus.bus_no} reached destination (${destination.name})`);

      try {
        await notifyBus(
          bus,
          `✅ Bus ${bus.bus_no} has reached ${destination.name}.\nTime: ${dateTime}`
        );
      } catch (err) {
        console.error("❌ Error sending destination alert:", err);
      }

      // 🔁 Reset stops & switch session automatically
      for (const route of bus.routes) {
        route.stops.forEach((stop) => (stop.visited = false));
      }

      bus.currentSession =
        bus.currentSession === "Morning" ? "Evening" : "Morning";
      console.log(`🔄 Session switched to: ${bus.currentSession}`);
    }

    /* ───────────────────────────────
       💾 UPDATE BUS LOCATION IN DATABASE
    ─────────────────────────────── */
    bus.latitude = latitude;
    bus.longitude = longitude;
    bus.updatedAt = now;
    await bus.save();

    res.json({ success: true, message: "Bus location updated successfully" });

  } catch (error) {
    console.error("❌ Error updating bus location:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const getBusLocation = async (req, res) => {
  try {
    const { busId } = req.params;

    const bus = await Bus.findOne({ busId });
    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    res.json(bus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const updateBusSession = async (req, res) => {
  try {
    const { busId } = req.params;
    let { currentSession } = req.body;

    // Automatically determine session if not sent in body
    if (!currentSession) {
      currentSession = getCurrentSession();
    }

    if (!["Morning", "Evening"].includes(currentSession)) {
      return res.status(400).json({ message: "Invalid session (must be 'Morning' or 'Evening')" });
    }

    const bus = await Bus.findOne({ busId });
    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    bus.currentSession = currentSession;
    await bus.save();

    res.json({
      success: true,
      message: `Bus ${bus.bus_no} session auto-set to ${currentSession}`,
      bus
    });
  } catch (error) {
    console.error("Error updating bus session:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const getBusByBusNo = async (req, res) => {
  try {
    const { bus_no } = req.params;
    const bus = await Bus.findOne({ bus_no });
    if (!bus) return res.status(404).json({ message: "Bus not found" });
    res.json(bus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};