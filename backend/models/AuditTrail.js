const mongoose = require("mongoose");

const auditTrailSchema = new mongoose.Schema({
  action: { type: String, required: true, trim: true },
  category: { type: String, enum: ["LEAVE", "USER", "POLICY", "AUTH", "REPORT", "SYSTEM"], required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  performedByName: { type: String, required: true },
  performedByRole: { type: String, enum: ["EMPLOYEE", "MANAGER", "HR_ADMIN", "SYSTEM"], required: true },
  target: { type: String, required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
  targetModel: { type: String, enum: ["User", "LeaveRequest", "LeaveType", null], default: null },
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
  ipAddress: { type: String, default: null },
  userAgent: { type: String, default: null },
  severity: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], default: "LOW" },
  timestamp: { type: Date, default: Date.now, index: true },
}, { timestamps: false });

auditTrailSchema.index({ performedBy: 1 });
auditTrailSchema.index({ category: 1 });
auditTrailSchema.index({ targetId: 1 });
auditTrailSchema.index({ timestamp: -1 });

// Static: log action
auditTrailSchema.statics.log = function (data) {
  return this.create({ ...data, timestamp: new Date() });
};

// Static: get audit for a specific resource
auditTrailSchema.statics.getForTarget = function (targetId, limit = 20) {
  return this.find({ targetId }).populate("performedBy", "name email role").sort({ timestamp: -1 }).limit(limit);
};

module.exports = mongoose.model("AuditTrail", auditTrailSchema);
