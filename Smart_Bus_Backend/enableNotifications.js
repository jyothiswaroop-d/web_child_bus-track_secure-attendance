import dotenv from "dotenv";
import connectDB from "./config/db.js";
import Student from "./models/student_login.js";

dotenv.config();
connectDB();

const BUS_NO = "55"; // Correct bus_no in student documents

async function enableNotifications() {
  try {
    const result = await Student.updateMany(
      { bus_no: BUS_NO },
      { $set: { notificationsEnabled: true } }
    );

    console.log(`Updated ${result.modifiedCount} students for bus ${BUS_NO}`);
    process.exit(0);
  } catch (err) {
    console.error("Error updating students:", err);
    process.exit(1);
  }
}

enableNotifications();
