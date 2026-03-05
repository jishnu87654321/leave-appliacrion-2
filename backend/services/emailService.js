const logger = require("../utils/logger");
const mailer = require("./mailer");

exports.sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@leavems.com",
      to,
      subject,
      html,
      text,
    };

    return await mailer.sendMail(mailOptions);
  } catch (error) {
    logger.error(`Email send failed to ${to}:`, error.message);
    throw error;
  }
};

/**
 * Send leave notification email
 */
exports.sendLeaveNotificationEmail = async (to, type, data) => {
  try {
    let subject, html;

    switch (type) {
      case "new_request":
        subject = `New Leave Request from ${data.employee}`;
        html = `
          <h3>New Leave Request</h3>
          <p><strong>${data.employee}</strong> has applied for <strong>${data.leaveType}</strong>.</p>
          <ul>
            <li>Duration: ${data.totalDays} day(s)</li>
            <li>From: ${data.fromDate}</li>
            <li>To: ${data.toDate}</li>
          </ul>
          <p>Please review and take action.</p>
        `;
        break;

      case "approved":
        subject = "Leave Request Approved";
        html = `
          <h3>Leave Request Approved</h3>
          <p>Your <strong>${data.leaveType}</strong> request for <strong>${data.totalDays} day(s)</strong> has been approved by <strong>${data.approverName}</strong>.</p>
        `;
        break;

      case "rejected":
        subject = "Leave Request Rejected";
        html = `
          <h3>Leave Request Rejected</h3>
          <p>Your <strong>${data.leaveType}</strong> request has been rejected by <strong>${data.approverName}</strong>.</p>
          <p><strong>Reason:</strong> ${data.reason}</p>
        `;
        break;

      default:
        return;
    }

    await exports.sendEmail({ to, subject, html });
  } catch (error) {
    logger.error(`Failed to send leave notification email to ${to}:`, error.message);
  }
};

exports.getCapturedEmails = mailer.getCapturedEmails;
exports.clearCapturedEmails = mailer.clearCapturedEmails;
