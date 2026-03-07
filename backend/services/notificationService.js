const Notification = require("../models/Notification");
const NotificationLog = require("../models/NotificationLog");
const User = require("../models/User");
const { sendEmail } = require("./emailService");
const logger = require("../utils/logger");
const { canonicalRole } = require("../utils/roles");

async function createInAppNotification(userId, message, type = "INFO", relatedLeaveRequest = null) {
  return Notification.create({
    user: userId,
    message,
    type,
    relatedLeaveRequest,
  });
}

async function sendEmailWithFallback({
  event,
  recipientUserId = null,
  recipientEmail,
  leaveRequestId = null,
  subject,
  html,
  payload = {},
}) {
  const logEntry = await NotificationLog.create({
    event,
    channel: "EMAIL",
    recipientUserId,
    recipientEmail,
    leaveRequestId,
    status: "PENDING",
    payload,
  });

  try {
    const result = await sendEmail({ to: recipientEmail, subject, html });
    if (!result?.success) {
      logEntry.status = "FAILED";
      logEntry.error = result?.error || result?.reason || "Unknown email error";
      await logEntry.save();
      logger.error(`Email failed for ${recipientEmail}: ${logEntry.error}`);
      return { success: false, error: logEntry.error };
    }
    logEntry.status = "SENT";
    await logEntry.save();
    return { success: true };
  } catch (error) {
    logEntry.status = "FAILED";
    logEntry.error = error.message || "Unknown email error";
    await logEntry.save();
    logger.error(`Email failed for ${recipientEmail}: ${error?.message || "Unknown email error"}`);
    return { success: false, error: error.message };
  }
}

function leaveEventTemplate(event, data) {
  if (event === "APPLY") {
    const reasonLine = data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : "";
    const reviewLine = data.reviewLink ? `<p><a href="${data.reviewLink}">Review request</a></p>` : "";
    return {
      subject: `New Leave Request from ${data.employeeName}`,
      html: `<p>${data.employeeName} applied for ${data.leaveType}.</p>
<p><strong>Dates:</strong> ${data.fromDate} to ${data.toDate}</p>
<p><strong>Days:</strong> ${data.totalDays}</p>
${reasonLine}
${reviewLine}`,
    };
  }
  if (event === "APPROVED") {
    return {
      subject: "Leave Request Approved",
      html: `<p>Your ${data.leaveType} request for ${data.totalDays} day(s) was approved by ${data.actorName}.</p>`,
    };
  }
  if (event === "REJECTED") {
    return {
      subject: "Leave Request Rejected",
      html: `<p>Your ${data.leaveType} request was rejected by ${data.actorName}. Reason: ${data.comment || "-"}</p>`,
    };
  }
  return {
    subject: "Leave Request Cancelled",
    html: `<p>Your ${data.leaveType} request was cancelled.</p>`,
  };
}

async function notifyLeaveEvent({
  event,
  leaveRequest,
  actor,
  employee,
  managerId = null,
  hrOnly = false,
  comment = "",
}) {
  const payload = {
    employeeName: employee.name,
    leaveType: leaveRequest.leaveType.name,
    totalDays: leaveRequest.totalDays,
    fromDate: leaveRequest.fromDate.toISOString().split("T")[0],
    toDate: leaveRequest.toDate.toISOString().split("T")[0],
    actorName: actor?.name || "",
    comment,
    reason: leaveRequest.reason || "",
    reviewLink: (process.env.FRONTEND_URL || "http://localhost:3000") + "/hr/requests",
  };
  const tpl = leaveEventTemplate(event, payload);

  if (event === "APPLY") {
    const recipients = [];
    const dedupe = new Set();
    if (managerId) {
      const manager = await User.findById(managerId).select("email role");
      if (manager?.email) {
        const key = String(manager.email).toLowerCase();
        if (!dedupe.has(key)) {
          dedupe.add(key);
          recipients.push({
            userId: managerId,
            email: manager.email,
            reviewLink:
              (process.env.FRONTEND_URL || "http://localhost:3000") +
              `/manager/requests?leaveId=${leaveRequest._id}`,
          });
        }
      }
    }
    const hrAdmins = await User.find({ role: { $in: ["HR_ADMIN", "hr_admin", "ADMIN", "HR"] }, isActive: true }).select("email");
    hrAdmins.forEach((hr) => {
      const key = String(hr.email).toLowerCase();
      if (!dedupe.has(key)) {
        dedupe.add(key);
        recipients.push({
          userId: hr._id,
          email: hr.email,
          reviewLink:
            (process.env.FRONTEND_URL || "http://localhost:3000") +
            `/hr/requests?leaveId=${leaveRequest._id}`,
        });
      }
    });

    for (const recipient of recipients) {
      await createInAppNotification(
        recipient.userId,
        `${employee.name} applied for ${leaveRequest.leaveType.name}.`,
        "WARNING",
        leaveRequest._id
      );
      await sendEmailWithFallback({
        event,
        recipientUserId: recipient.userId,
        recipientEmail: recipient.email,
        leaveRequestId: leaveRequest._id,
        subject: tpl.subject,
        html: leaveEventTemplate(event, { ...payload, reviewLink: recipient.reviewLink }).html,
        payload: { ...payload, reviewLink: recipient.reviewLink },
      });
    }
    return;
  }

  // For other events, notify employee and HR admins
  await createInAppNotification(
    employee._id,
    `Your ${leaveRequest.leaveType.name} request is ${leaveRequest.status.toLowerCase()}.`,
    leaveRequest.status === "APPROVED" ? "SUCCESS" : leaveRequest.status === "REJECTED" ? "DANGER" : "INFO",
    leaveRequest._id
  );

  await sendEmailWithFallback({
    event,
    recipientUserId: employee._id,
    recipientEmail: employee.email,
    leaveRequestId: leaveRequest._id,
    subject: tpl.subject,
    html: tpl.html,
    payload,
  });

  if (!hrOnly) {
    const hrAdmins = await User.find({ role: { $in: ["HR_ADMIN", "hr_admin", "ADMIN", "HR"] }, isActive: true }).select("email");
    for (const hr of hrAdmins) {
      await sendEmailWithFallback({
        event,
        recipientUserId: hr._id,
        recipientEmail: hr.email,
        leaveRequestId: leaveRequest._id,
        subject: `[FYI] ${tpl.subject}`,
        html: tpl.html,
        payload,
      });
    }
  }
}

module.exports = {
  createInAppNotification,
  sendEmailWithFallback,
  notifyLeaveEvent,
};
