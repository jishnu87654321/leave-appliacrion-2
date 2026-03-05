const mongoose = require("mongoose");

const leaveTypeSchema = new mongoose.Schema({
  name: { type: String, required: [true, "Leave type name required"], trim: true },
  code: { type: String, required: [true, "Leave code required"], trim: true, uppercase: true, maxlength: 10 },
  color: { type: String, default: "#3B82F6", match: [/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"] },
  description: { type: String, trim: true, default: "" },
  accrualType: { type: String, enum: ["MONTHLY", "YEARLY", "NONE"], default: "YEARLY" },
  accrualRate: { type: Number, default: 0, min: 0, max: 365 },
  accrualPerMonth: { type: Number, default: 0, min: 0, max: 31 },
  yearlyTotal: { type: Number, default: 0, min: 0, max: 365 },
  carryForwardLimit: { type: Number, default: 0, min: 0 },
  allowNegativeBalance: { type: Boolean, default: false },
  applicableDuringProbation: { type: Boolean, default: true },
  maxConsecutiveDays: { type: Number, default: 30, min: 1, max: 365 },
  requiresDocument: { type: Boolean, default: false },
  documentRequiredAfterDays: { type: Number, default: 3 },
  isActive: { type: Boolean, default: true },
  requiresApproval: { type: Boolean, default: true },
  minNoticeDays: { type: Number, default: 0 },
  excludeWeekends: { type: Boolean, default: true },
  excludePublicHolidays: { type: Boolean, default: true },
}, { timestamps: true });

leaveTypeSchema.index({ code: 1 }, { unique: true });
leaveTypeSchema.index({ name: 1 }, { unique: true });
leaveTypeSchema.index({ isActive: 1 });

module.exports = mongoose.model("LeaveType", leaveTypeSchema);
