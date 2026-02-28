const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true, trim: true },
  type: { type: String, enum: ["INFO", "SUCCESS", "WARNING", "DANGER"], default: "INFO" },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date, default: null },
  readStatus: { type: Boolean, default: false },
  link: { type: String, default: null },
  relatedLeaveRequest: { type: mongoose.Schema.Types.ObjectId, ref: "LeaveRequest", default: null },
  metadata: { type: Map, of: String, default: {} },
  expiresAt: { type: Date, default: null },
}, { timestamps: true });

notificationSchema.index({ user: 1, readStatus: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static: get unread count for user
notificationSchema.statics.getUnreadCount = function (userId) {
  return this.countDocuments({ user: userId, readStatus: false });
};

// Static: mark all as read
notificationSchema.statics.markAllReadForUser = function (userId) {
  return this.updateMany({ user: userId, readStatus: false }, { readStatus: true });
};

module.exports = mongoose.model("Notification", notificationSchema);
