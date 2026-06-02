import nodemailer from "nodemailer";

const getTransporter = () => {
  if (!process.env.GMAIL_HOST || !process.env.GMAIL || !process.env.GMAIL_PASS) {
    return null;
  }

  // Remove quotes if they exist in the env variable
  const host = process.env.GMAIL_HOST.replace(/"/g, '');

  return nodemailer.createTransport({
    host: host,
    port: process.env.GMAIL_PORT || 465,
    secure: process.env.GMAIL_PORT == 465,
    auth: {
      user: process.env.GMAIL,
      pass: process.env.GMAIL_PASS,
    },
  });
};

export const sendAdminNotification = async (subject, htmlContent) => {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("SMTP credentials not configured. Skipping admin notification email.");
    return;
  }

  // Collect all admin and admission emails
  const adminEmails = [
    process.env.ADMIN_MAIL1,
    process.env.ADMIN_MAIL2,
    process.env.ADMIN_MAIL3,
    process.env.ADMIN_MAIL4,
    process.env.ADMISSION_MAIL1,
    process.env.ADMISSION_MAIL2,
    process.env.ADMISSION_MAIL3,
  ].filter(email => email && email.trim() !== "");

  // Fallback to default admin email if none are configured
  if (adminEmails.length === 0) {
    const defaultEmail = process.env.DEFAULT_ADMIN_EMAIL;
    if (defaultEmail) adminEmails.push(defaultEmail);
  }
  
  if (adminEmails.length === 0) return;

  // Use a Set to remove duplicate emails (e.g. emea92540@gmail.com appears twice)
  const uniqueEmails = [...new Set(adminEmails)];

  try {
    await transporter.sendMail({
      from: `"EME Platform" <${process.env.GMAIL}>`,
      to: uniqueEmails.join(", "),
      subject: `[EME Platform] ${subject}`,
      html: htmlContent,
    });
    console.log(`Admin notification sent to: ${uniqueEmails.join(", ")}`);
  } catch (error) {
    console.error("Failed to send admin notification email:", error);
  }
};
