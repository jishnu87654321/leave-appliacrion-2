const Notification = require("../models/Notification");
const { sendEmail } = require("./emailService");
const logger = require("../utils/logger");

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

    await sendEmail({ to, subject, html });
  } catch (error) {
    logger.error(`Failed to send leave notification email to ${to}:`, error.message);
  }
};

/**
 * Create in-app notification
 */
exports.createNotification = async (userId, message, type = "INFO", relatedLeaveRequest = null) => {
  try {
    await Notification.create({
      user: userId,
      message,
      type,
      relatedLeaveRequest,
    });
  } catch (error) {
    logger.error("Failed to create notification:", error.message);
  }
};
