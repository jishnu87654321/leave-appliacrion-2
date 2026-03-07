const { sendEmail } = require("./emailService");

async function sendMail(mailOptions = {}) {
  const to = mailOptions.to;
  const subject = mailOptions.subject || "Notification";
  const html = mailOptions.html || `<pre>${String(mailOptions.text || "").replace(/[<>&]/g, "")}</pre>`;
  return sendEmail({ to, subject, html });
}

function getCapturedEmails() {
  return [];
}

function clearCapturedEmails() {}

module.exports = {
  sendMail,
  getCapturedEmails,
  clearCapturedEmails,
};

