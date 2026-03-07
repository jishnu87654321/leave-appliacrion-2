const logger = require("../utils/logger");
const {
  sendAdminNotification,
  sendEmail,
  verifySmtpConnection,
  getEmailConfig,
  hasRequiredSmtpConfig,
} = require("./emailService");

function toLabel(key) {
  return String(key || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildTemplate({ eventTitle, details, timestamp = new Date().toISOString() }) {
  const rows = Object.entries(details || {})
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `<tr><td style="padding:6px 10px;border:1px solid #e5e7eb;"><strong>${escapeHtml(toLabel(key))}</strong></td><td style="padding:6px 10px;border:1px solid #e5e7eb;">${escapeHtml(value)}</td></tr>`)
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;padding:16px;color:#111827;">
      <h2 style="margin:0 0 10px;">${escapeHtml(eventTitle)}</h2>
      <p style="margin:0 0 14px;color:#6b7280;">Leave Management System - Admin Notification</p>
      <table style="border-collapse:collapse;width:100%;margin:0 0 14px;">${rows}</table>
      <p style="margin:0;font-size:12px;color:#6b7280;">Timestamp: ${escapeHtml(timestamp)}</p>
    </div>
  `;
}

function makePayload(eventKey, details) {
  const map = {
    NEW_EMPLOYEE_REGISTRATION: `New Employee Registration - ${details.employeeName || details.name || "User"}`,
    LEAVE_APPLICATION_SUBMITTED: `New Leave Application - ${details.employeeName || "Employee"}`,
    LEAVE_APPROVED: `Leave Approved - ${details.employeeName || "Employee"}`,
    LEAVE_REJECTED: `Leave Rejected - ${details.employeeName || "Employee"}`,
    HR_OVERRIDE_ACTION: `HR Override Action - ${details.employeeName || "Employee"}`,
    USER_ACTIVATION_STATUS_CHANGED: `User Status Updated - ${details.employeeName || details.userName || "User"}`,
    LEAVE_BALANCE_MANUALLY_UPDATED: `Leave Balance Updated - ${details.employeeName || "Employee"}`,
    HOLIDAY_CALENDAR_UPDATED: "Holiday/Calendar Updated",
    CONTACT_FORM_SUBMISSION: `Contact Form Submission - ${details.name || details.email || "New Message"}`,
  };
  return map[eventKey] || `Admin Notification - ${toLabel(eventKey)}`;
}

async function sendAdminEventNotification(eventKey, details = {}) {
  const subject = makePayload(eventKey, details);
  const html = buildTemplate({ eventTitle: subject, details });
  const text = Object.entries(details || {})
    .map(([key, value]) => `${toLabel(key)}: ${value}`)
    .join("\n");
  return sendAdminNotification(subject, text || subject, {
    html,
    text: `${subject}\n\n${text}`,
  });
}

async function sendContactFormNotification(details = {}) {
  const subject = "New Contact Form Submission";
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;padding:16px;color:#111827;">
      <h2>${escapeHtml(subject)}</h2>
      <p><strong>Name:</strong> ${escapeHtml(details.name || "")}</p>
      <p><strong>Email:</strong> ${escapeHtml(details.email || "")}</p>
      <p><strong>Phone:</strong> ${escapeHtml(details.phone || "")}</p>
      <p><strong>Message:</strong> ${escapeHtml(details.message || "")}</p>
      <p style="font-size:12px;color:#6b7280;">Timestamp: ${escapeHtml(details.submittedAt || new Date().toISOString())}</p>
    </div>
  `;
  return sendAdminNotification(subject, subject, { html });
}

async function sendContactFormUserConfirmation({ email, name }) {
  if (!email) return { success: false, skipped: true, reason: "missing_user_email" };
  return sendEmail({
    to: email,
    subject: "Thank you for contacting ACE IT UP",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;padding:16px;color:#111827;">
        <h2>Thank you for contacting ACE IT UP</h2>
        <p>Dear ${escapeHtml(name || "Customer")},</p>
        <p>Thank you for reaching out to ACE IT UP.</p>
        <p>Our team will contact you shortly.</p>
      </div>
    `,
  });
}

function queueAdminEventNotification(eventKey, details = {}) {
  setImmediate(async () => {
    try {
      await sendAdminEventNotification(eventKey, details);
    } catch (error) {
      logger.error(`Admin event email failed for ${eventKey}: ${error?.message || "Unknown error"}`);
    }
  });
}

function getDiagnostics() {
  const config = getEmailConfig();
  return {
    enabled: hasRequiredSmtpConfig(),
    smtpHost: config.host || "smtp.zoho.com",
    smtpPort: Number(config.port || 587),
    smtpUser: config.user || "",
    smtpPassMasked: process.env.SMTP_PASS ? "***configured***" : "(empty)",
    smtpFrom: config.from || "",
    adminRecipients: config.adminEmail ? [config.adminEmail] : [],
  };
}

async function verifyTransporter() {
  return verifySmtpConnection();
}

module.exports = {
  getDiagnostics,
  verifyTransporter,
  sendAdminNotification,
  sendAdminEventNotification,
  sendContactFormNotification,
  sendContactFormUserConfirmation,
  queueAdminEventNotification,
};
