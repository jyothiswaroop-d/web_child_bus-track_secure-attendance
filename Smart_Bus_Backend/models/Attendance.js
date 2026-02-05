import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true, // Compulsory
  },
  bus: {
    type: String,
    ref: "Bus",
  },
  date: {
    type: Date,
    default: Date.now,
  },
  session: {
    type: String,
    enum: ["Morning", "Evening"],
  },
  status: {
    type: String,
    enum: ["Present", "Absent", "Reached School"],
    default: "Absent",
  },
  isProxy: {
    type: Boolean,
    default: false,
  },
});

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;
