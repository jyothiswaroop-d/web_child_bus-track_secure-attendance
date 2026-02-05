import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    designation: { type: String, required: true },
    user_name: { type: String, required: true, unique: true },
    dob: { type: Date, required: true },
    work_experience: { type: Number, required: true },
  },
  { timestamps: true }
);

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;
