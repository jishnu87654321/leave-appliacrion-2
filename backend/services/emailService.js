const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

let transporter;
let activeHost = null;

function getEmailConfig() {
  return {
    host: String(process.env.SMTP_HOST || "smtp.zoho.com").trim(),
    port: Number(process.env.SMTP_PORT || 587),
    user: String(process.env.SMTP_USER || "").trim(),
    pass: String(process.env.SMTP_PASS || "").trim(),
    from: String(process.env.SMTP_FROM || process.env.SMTP_USER || "").trim(),
    adminEmail: String(process.env.ADMIN_EMAIL || "").trim(),
  };
}

function hasRequiredSmtpConfig() {
  const cfg = getEmailConfig();
  return Boolean(cfg.host && cfg.port && cfg.user && cfg.pass && cfg.from);
}

function getCandidateHosts(primaryHost) {
  const host = String(primaryHost || "").trim().toLowerCase();
  if (host === "smtp.zoho.com") return ["smtp.zoho.com", "smtp.zoho.in"];
  if (host === "smtp.zoho.in") return ["smtp.zoho.in", "smtp.zoho.com"];
  return [host];
}

function getTransporter(hostOverride) {
  const cfg = getEmailConfig();
  const targetHost = String(hostOverride || cfg.host).trim();

  return nodemailer.createTransport({
    host: targetHost,
    port: cfg.port,
    secure: false, // true for 465, false for 587
    auth: {
      user: cfg.user,
      pass: cfg.pass,
    },
    requireTLS: true,
    pool: false, // Ensure we don't hold idle connections that might be dropped
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

async function verifySmtpConnection() {
  if (!hasRequiredSmtpConfig()) {
    logger.warn("SMTP verify skipped: SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/SMTP_FROM missing.");
    return { success: false, skipped: true, reason: "missing_smtp_config" };
  }

  const cfg = getEmailConfig();
  const hosts = getCandidateHosts(cfg.host);
  let lastError = null;

  for (const host of hosts) {
    try {
      await getTransporter(host).verify();
      logger.info(`SMTP verify success using host ${host}.`);
      return { success: true, host };
    } catch (error) {
      lastError = error;
      logger.warn(`SMTP verify failed for host ${host}: ${error?.message || "Unknown SMTP verify error"}`);
    }
  }

  logger.error(`SMTP verify failed: ${lastError?.message || "Unknown SMTP verify error"}`);
  return { success: false, error: lastError?.message || "Unknown SMTP verify error" };
}

async function sendEmail({ to, subject, html }) {
  try {
    const cfg = getEmailConfig();
    if (!hasRequiredSmtpConfig()) {
      logger.warn(`Email skipped for ${to}: SMTP configuration incomplete.`);
      return { success: false, skipped: true, reason: "missing_smtp_config" };
    }

    const hosts = getCandidateHosts(cfg.host);
    let lastError = null;

    for (const host of hosts) {
      try {
        const result = await getTransporter(host).sendMail({
          from: cfg.from,
          to,
          subject,
          html,
        });
        logger.info(`Email sent to ${to} via ${host}: ${result.messageId || "no-message-id"}`);
        return { success: true, messageId: result.messageId || null, host };
      } catch (error) {
        lastError = error;
        logger.warn(`Email send failed via ${host} for ${to}: ${error?.message || "Unknown email error"}`);
      }
    }

    logger.error(`Email send failed to ${to}: ${lastError?.message || "Unknown email error"}`);
    return { success: false, error: lastError?.message || "Unknown email error" };
  } catch (error) {
    logger.error(`Email send failed to ${to}: ${error?.message || "Unknown email error"}`);
    return { success: false, error: error?.message || "Unknown email error" };
  }
}

async function sendAdminNotification(subject, message, options = {}) {
  const cfg = getEmailConfig();
  if (!cfg.adminEmail) {
    logger.warn("Admin email skipped: ADMIN_EMAIL not configured.");
    return { success: false, skipped: true, reason: "missing_admin_email" };
  }

  const html =
    options.html ||
    `
      <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;padding:16px;">
        <h2>${subject}</h2>
        <p>${message}</p>
        <p style="font-size:12px;color:#6b7280;">Timestamp: ${new Date().toISOString()}</p>
      </div>
    `;

  return sendEmail({ to: cfg.adminEmail, subject, html });
}

module.exports = {
  getEmailConfig,
  hasRequiredSmtpConfig,
  verifySmtpConnection,
  sendEmail,
  sendAdminNotification,
};
