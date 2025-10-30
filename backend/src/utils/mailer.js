import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Ensure environment variables are loaded even if this module is imported
// before dotenv.config() is called elsewhere.
dotenv.config();

// Only MAIL_* variables are used as requested
const mailService = process.env.MAIL_SERVICE; // e.g., 'gmail'
const mailUser = process.env.MAIL_USER;
const mailPass = process.env.MAIL_PASS;
const mailFrom = process.env.MAIL_FROM || mailUser;

let transporter = null;

if (mailUser && mailPass) {
  if (mailService) {
    // Service-based transport (Gmail supported)
    transporter = nodemailer.createTransport({
      service: mailService,
      auth: { user: mailUser, pass: mailPass },
    });
  } else {
    // Fallback to Gmail SMTP defaults (no SMTP_* env usage)
    const host = process.env.MAIL_HOST || "smtp.gmail.com";
    const port = Number(process.env.MAIL_PORT) || 465;
    const secure = process.env.MAIL_SECURE !== undefined
      ? String(process.env.MAIL_SECURE).toLowerCase() === "true"
      : true;
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user: mailUser, pass: mailPass },
    });
  }
}

export async function sendMail(to, subject, html) {
  // Support two signatures:
  // 1) sendMail(to, subject, htmlOrText)
  // 2) sendMail({ to, subject, html, text })
  let payload;
  if (typeof to === "object" && to !== null) {
    const opts = to;
    payload = {
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    };
  } else {
    payload = { to, subject, html };
  }

  if (!transporter) {
    console.warn("Mailer not configured. Email to be sent:", { to: payload.to, subject: payload.subject });
    return { mocked: true };
  }

  const from = mailFrom || mailUser || '"Trip Verification" <no-reply@example.com>';
  return transporter.sendMail({ from, ...payload });
}

