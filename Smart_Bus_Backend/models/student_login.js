// models/student_login.js
import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    stu_id: { type: String, required: true, unique: true },
    nfcId: { type: String, required: true, unique: true },
    stu_name: { type: String, required: true },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true
    },
    parent_name: { type: String, required: true },
    parents_phone_number: {
      type: String,
      required: true,
      match: /^[0-9]{10}$/ // Valid 10-digit number
    },
    class_section: { type: String, required: true },
    bus_no: { type: String, required: true },
    is_bus_student: { type: Boolean, required: true },

    notificationsEnabled: { type: Boolean,default: true },

    address: { type: String, required: true },
    bus_stop_address: { type: String, required: false }, // Optional
    transport_fee: { type: Number, required: true }
  },
  { 
     // adds createdAt and updatedAt
    timestamps: true ,
    collection: "student_logins" 

  } 
);

export default mongoose.model("Student", studentSchema);
