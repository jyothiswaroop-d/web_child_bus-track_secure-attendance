import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

export const sendSmsNotification = async (toPhone, message) => {
  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to: toPhone,
    });
    console.log(`SMS sent to ${toPhone}: ${result.sid}`);
    return result;
  } catch (err) {
    console.error(`SMS sending failed to ${toPhone}:`, err);
    throw err;
  }
};
