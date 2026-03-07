const mongoose = require("mongoose");
const { canonicalRole } = require("../utils/roles");
const { hashForAudit } = require("../config/security");

const normalizeAuditRole = (value) => {
  const upper = String(value || "").toUpperCase();
  if (upper === "SYSTEM") return "SYSTEM";
  return canonicalRole(value || "EMPLOYEE");
};

const ALLOWED_CATEGORIES = ["LEAVE", "USER", "POLICY", "AUTH", "REPORT", "SYSTEM", "CONFIG"];

const normalizeCategory = (value) => {
  const upper = String(value || "").trim().toUpperCase();
  if (upper === "CONFIG") return "POLICY";
  if (ALLOWED_CATEGORIES.includes(upper)) return upper;
  return "SYSTEM";
};

const auditTrailSchema = new mongoose.Schema({
  action: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ALLOWED_CATEGORIES,
    required: true,
    set: normalizeCategory,
  },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  performedByName: { type: String, required: true },
  performedByRole: {
    type: String,
    enum: ["EMPLOYEE", "INTERN", "MANAGER", "HR_ADMIN", "SYSTEM"],
    required: true,
    set: normalizeAuditRole,
  },
  target: { type: String, required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
  targetModel: { type: String, enum: ["User", "LeaveRequest", "LeaveType", null], default: null },
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
  ipAddress: { type: String, default: null },
  userAgent: { type: String, default: null },
  severity: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], default: "LOW" },
  previousHash: { type: String, default: null },
  entryHash: { type: String, default: null, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
}, { timestamps: false });

auditTrailSchema.index({ performedBy: 1 });
auditTrailSchema.index({ category: 1 });
auditTrailSchema.index({ targetId: 1 });
auditTrailSchema.index({ timestamp: -1 });

// Static: log action
auditTrailSchema.statics.log = function (data) {
  const normalizedRole = normalizeAuditRole(data?.performedByRole);
  const normalizedCategory = normalizeCategory(data?.category);
  return this.findOne({}).sort({ timestamp: -1 }).then((previous) => {
    const previousHash = previous?.entryHash || null;
    const payloadForHash = JSON.stringify({
      action: data?.action || "",
      category: normalizedCategory,
      performedBy: String(data?.performedBy || ""),
      target: data?.target || "",
      metadata: data?.metadata || {},
      timestamp: new Date().toISOString(),
      previousHash,
    });
    const entryHash = hashForAudit(payloadForHash);
    return this.create({
      ...data,
      category: normalizedCategory,
      performedByRole: normalizedRole,
      previousHash,
      entryHash,
      timestamp: new Date(),
    });
  });
};

// Static: get audit for a specific resource
auditTrailSchema.statics.getForTarget = function (targetId, limit = 20) {
  return this.find({ targetId }).populate("performedBy", "name email role").sort({ timestamp: -1 }).limit(limit);
};

module.exports = mongoose.model("AuditTrail", auditTrailSchema);
