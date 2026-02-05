import { sendSmsNotification } from "./smsService.js";
import { sendEmailNotification } from "./emailService.js";
import Student from "../models/student_login.js";

export const notifyBus = async (bus, message) => {
  try {
    // Normalize busId to string (e.g., "55")
    const normalizeBusId = bus.busId.toString().trim();

    console.log(`Searching for students with busId=${normalizeBusId}`);

    // Find all students with matching busId and notifications enabled
    const students = await Student.find({
      bus_no: normalizeBusId,           // match Student.bus_no with Bus.busId
      is_bus_student: true,
      notificationsEnabled: { $eq: true }
    });

    console.log(`🔍 Found ${students.length} students for busId=${normalizeBusId}`);

    if (students.length === 0) {
      console.log(`⚠️ No students with notifications enabled found for bus ${bus.bus_no}`);
      return;
    }

    // Send SMS notifications in parallel
    const smsPromises = students
      .filter(stu => stu.parents_phone_number)
      .map(stu => {
        const phoneNumber = stu.parents_phone_number.startsWith("+")
          ? stu.parents_phone_number
          : `+91${stu.parents_phone_number}`;
        console.log(`Sending SMS to ${stu.parent_name} (${phoneNumber})`);
        return sendSmsNotification(phoneNumber, message);
      });

    await Promise.all(smsPromises);

    // Optional: email summary to admin
    const adminEmail = process.env.ADMIN_EMAIL || "238w1a5488@vrsec.ac.in";
    await sendEmailNotification(
      `Bus ${bus.bus_no} Alert`,
      message,
      message,
      adminEmail
    );

    console.log(`Bus alert sent successfully for busId=${normalizeBusId}`);

  } catch (err) {
    console.error("Error sending bus alert:", err);
  }
};
