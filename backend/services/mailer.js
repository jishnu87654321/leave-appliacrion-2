const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

const capturedEmails = [];

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

function isTestMode() {
  return process.env.NODE_ENV === "test" || process.env.EMAIL_TRANSPORT_MODE === "test";
}

async function sendMail(mailOptions) {
  if (isTestMode()) {
    capturedEmails.push({ ...mailOptions, sentAt: new Date().toISOString() });
    return { messageId: `qa-${Date.now()}` };
  }

  const info = await transporter.sendMail(mailOptions);
  logger.info(`Email sent to ${mailOptions.to}: ${info.messageId}`);
  return info;
}

function getCapturedEmails() {
  return capturedEmails.slice();
}

function clearCapturedEmails() {
  capturedEmails.length = 0;
}

module.exports = {
  sendMail,
  getCapturedEmails,
  clearCapturedEmails,
};
