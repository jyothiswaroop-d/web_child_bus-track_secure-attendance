import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmailNotification = async (subject, senderName, htmlContent, toEmail) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Convert newlines to <br> for proper email formatting
    const formattedHtml = htmlContent.replace(/\n/g, "<br>");

    await transporter.sendMail({
      from: `${senderName} <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: subject,
      html: formattedHtml,
    });

    console.log(`Email sent successfully to ${toEmail}`);
  } catch (error) {
    console.error("Email sending failed:", error);
  }
};
