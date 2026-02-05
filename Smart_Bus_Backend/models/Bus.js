import mongoose from "mongoose";

// Subschema for each stop
const StopSchema = new mongoose.Schema({
  name: { type: String, required: true },      // Stop name / area
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  radius: { type: Number, default: 50 },       // detection radius in meters
  visited: { type: Boolean, default: false }   // flag for stop crossing detection
});

// Subschema for each route (morning or evening)
const RouteSchema = new mongoose.Schema({
  routeType: { type: String, enum: ["morning", "evening"], required: true },
  start_point: {
    name: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  destination_point: {
    name: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  stops: [StopSchema]
});

// Main Bus Schema
const BusSchema = new mongoose.Schema(
  {
    busId: { type: String, required: true, unique: true },
    bus_no: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },

    // Contains both routes
    routes: [RouteSchema],

    // Keeps track of which session is active (auto-detected via time)
    currentSession: { type: String, enum: ["Morning", "Evening"], default: "Morning" },

    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model("Bus", BusSchema);
