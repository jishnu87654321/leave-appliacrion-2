const mongoose = require("mongoose");

const notificationLogSchema = new mongoose.Schema(
  {
    event: { type: String, required: true }, // APPLY, APPROVED, REJECTED, CANCELLED
    channel: { type: String, enum: ["EMAIL"], default: "EMAIL" },
    recipientUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    recipientEmail: { type: String, required: true, trim: true, lowercase: true },
    leaveRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "LeaveRequest", default: null },
    status: { type: String, enum: ["PENDING", "SENT", "FAILED"], default: "PENDING" },
    error: { type: String, default: "" },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

notificationLogSchema.index({ status: 1, createdAt: -1 });
notificationLogSchema.index({ leaveRequestId: 1, event: 1 });

module.exports = mongoose.model("NotificationLog", notificationLogSchema);
