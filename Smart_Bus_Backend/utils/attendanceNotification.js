import { sendSmsNotification } from "./smsService.js";

export const notifyAttendance = async (student, bus, session, dateTime) => {
  try {
    const message = `Your child ${student.stu_name} has boarded the ${session} bus ${bus} on ${dateTime}`;

    if (student.parents_phone_number) {
      const phoneNumber = student.parents_phone_number.startsWith("+")
        ? student.parents_phone_number
        : `+91${student.parents_phone_number}`;
      await sendSmsNotification(phoneNumber, message);
      console.log(`SMS sent to parent of ${student.stu_name}`);
    }
  } catch (err) {
    console.error("Error sending attendance SMS:", err);
  }
};
