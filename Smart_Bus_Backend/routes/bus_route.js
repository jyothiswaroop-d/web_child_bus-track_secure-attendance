import express from "express";
import { 
  updateBusLocation, 
  getBusLocation, 
  initializeBusRoute, 
  getBuses, 
  updateBusSession  // add this import
} from "../controllers/bus_controller.js";

const router = express.Router();

// Get all buses
router.get("/", getBuses);

// Get latest bus location
router.get("/:busId", getBusLocation);

// Initialize bus route with stops
router.post("/initialize-route", initializeBusRoute);

// Update bus location
router.post("/update-location", updateBusLocation);

// Update session (Morning/Evening)
router.put("/session/:busId", updateBusSession);

export default router;
