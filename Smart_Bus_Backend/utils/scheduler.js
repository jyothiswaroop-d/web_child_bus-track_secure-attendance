import cron from "node-cron";
import Attendance from "../models/Attendance.js";
import Student from "../models/student_login.js";
import { sendSmsNotification } from "./smsService.js";
import { sendEmailNotification } from "./emailService.js";

// Utility: get start & end of the current day in IST
function getISTDayRange() {
  const now = new Date();
  const indiaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const today = new Date(indiaTime);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  return { today, tomorrow };
}

/* -------------------------------------------------------------
    MORNING ARRIVAL / MISSED STUDENT CHECK
   - Time: 08:30 AM IST (change to * * * * * for testing)
   - SMS to Parent only
------------------------------------------------------------- */
cron.schedule("30 8 * * *", async () => {
// cron.schedule("30 8 * * *", async () => {
  console.log(" [Scheduler] Morning arrival check started...");
  try {
    const { today, tomorrow } = getISTDayRange();
    const allStudents = await Student.find();

    for (const student of allStudents) {
      const attended = await Attendance.findOne({
        student: student._id,
        session: "Morning",
        date: { $gte: today, $lt: tomorrow },
      });

      // Only send message to parents
      const message = attended
        ? `Bus Has Reached the School`

// ? Your child ${student.stu_name} has reached school.`
      
        : `The bus has reached the school, but your child ${student.stu_name} was marked absent today.`;

      if (student.parents_phone_number) {
        await sendSmsNotification(`+91${student.parents_phone_number}`, message);
      }
    }

    console.log("[Scheduler] Morning arrival check completed.");
  } catch (err) {
    console.error("[Scheduler] Error in morning arrival check:", err);
  }
});

/* -------------------------------------------------------------
    EVENING MISSING STUDENT CROSS-CHECK
   - Time: 03:15 PM IST (change to * * * * * for testing)
   - Email to Admin
------------------------------------------------------------- */
cron.schedule("15 5 * * *", async () => {
// cron.schedule("15 15 * * *", async () => {
  console.log("[Scheduler] Evening missing student check started...");
  try {
    const { today, tomorrow } = getISTDayRange();

    const morningAttendance = await Attendance.find({
      session: "Morning",
      date: { $gte: today, $lt: tomorrow },
    });

    const eveningAttendance = await Attendance.find({
      session: "Evening",
      date: { $gte: today, $lt: tomorrow },
    });

    const morningIds = morningAttendance.map(a => a.student.toString());
    const eveningIds = eveningAttendance.map(a => a.student.toString());
    const missingIds = morningIds.filter(id => !eveningIds.includes(id));

    if (missingIds.length > 0) {
      const missingStudents = await Student.find({ _id: { $in: missingIds } });
      const names = missingStudents.map(s => s.stu_name).join(", ");
      const adminEmail = process.env.ADMIN_EMAIL || "admin@school.org";

      await sendEmailNotification(
        "Missing Student Alert",
        "SmartBus System",
        `🚨 Missing student before departure: ${names}`,
        adminEmail
      );

      console.log(`🚨 [Scheduler] Missing student email sent: ${names}`);
    } else {
      console.log("[Scheduler] No missing students today.");
    }
  } catch (err) {
    console.error("[Scheduler] Error in evening missing student check:", err);
  }
});

/* -------------------------------------------------------------
   🧪 QUICK TEST MODE (Optional)
   Uncomment to run both checks every minute for testing
------------------------------------------------------------- */
// cron.schedule("* * * * *", () => console.log("⏱ Scheduler test tick..."));
