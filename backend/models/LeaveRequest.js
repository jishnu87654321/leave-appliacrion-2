const mongoose = require("mongoose");

const approvalStepSchema = new mongoose.Schema({
  level: { type: Number, required: true },
  approverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  approverName: { type: String, required: true },
  approverRole: { type: String, enum: ["MANAGER", "HR_ADMIN"] },
  status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], required: true },
  comment: { type: String, trim: true, default: "" },
  actionDate: { type: Date, default: null },
}, { _id: false });

const leaveRequestSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: [true, "Employee reference required"] },
  leaveType: { type: mongoose.Schema.Types.ObjectId, ref: "LeaveType", required: [true, "Leave type required"] },
  fromDate: { type: Date, required: [true, "From date required"] },
  toDate: { type: Date, required: [true, "To date required"] },
  totalDays: { type: Number, required: [true, "Total days required"], min: [0.5, "Minimum 0.5 day"] },
  halfDay: { type: Boolean, default: false },
  halfDaySession: { type: String, enum: ["MORNING", "AFTERNOON", null], default: null },
  reason: { type: String, required: [true, "Reason is required"], trim: true, minlength: [10, "Reason must be at least 10 characters"] },
  status: { type: String, enum: ["PENDING", "HR_PENDING", "APPROVED", "REJECTED", "CANCELLED"], default: "PENDING" },
  approvalHistory: { type: [approvalStepSchema], default: [] },
  currentApprovalLevel: { type: Number, default: 1 },
  comments: { type: String, trim: true, default: "" },
  attachmentUrl: { type: String, default: null },
  document: {
    url: { type: String, default: null },
    originalName: { type: String, default: null },
    mimeType: { type: String, default: null },
    uploadedAt: { type: Date, default: null },
  },
  attachment: {
    fileName: { type: String, default: null },
    mimeType: { type: String, default: null },
    size: { type: Number, default: 0 },
    storagePath: { type: String, default: null },
    uploadedAt: { type: Date, default: null },
  },
  hrOverride: {
    isOverridden: { type: Boolean, default: false },
    overriddenBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    overriddenAt: { type: Date, default: null },
    previousStatus: { type: String, default: null },
    reason: { type: String, default: "" },
  },
  hrFinalApproval: {
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    approvedAt: { type: Date, default: null },
    decision: { type: String, enum: ["APPROVED", "REJECTED", null], default: null },
  },
  appliedBalanceBefore: { type: Number, default: 0 },
  isEmergency: { type: Boolean, default: false },
  cancelledAt: { type: Date, default: null },
  cancelReason: { type: String, default: "" },
}, { timestamps: true, toJSON: { virtuals: true } });

// Indexes
leaveRequestSchema.index({ employee: 1, status: 1 });
leaveRequestSchema.index({ leaveType: 1 });
leaveRequestSchema.index({ fromDate: 1, toDate: 1 });
leaveRequestSchema.index({ status: 1 });
leaveRequestSchema.index({ createdAt: -1 });

// Validation: toDate >= fromDate
leaveRequestSchema.pre("save", function (next) {
  if (this.toDate < this.fromDate) {
    return next(new Error("To date cannot be before from date"));
  }
  next();
});

// Virtual: duration label
leaveRequestSchema.virtual("durationLabel").get(function () {
  return `${this.totalDays} day${this.totalDays !== 1 ? "s" : ""}`;
});

// Static: get pending requests for a manager's team
leaveRequestSchema.statics.getPendingForManager = function (teamMemberIds) {
  return this.find({
    employee: { $in: teamMemberIds },
    status: "PENDING",
  }).populate("employee", "name email department designation avatar probationStatus")
    .populate("leaveType", "name code color requiresDocument")
    .sort({ createdAt: 1 });
};

// Static: get requests in date range
leaveRequestSchema.statics.getInDateRange = function (startDate, endDate, query = {}) {
  return this.find({
    ...query,
    fromDate: { $lte: new Date(endDate) },
    toDate: { $gte: new Date(startDate) },
    status: "APPROVED",
  }).populate("employee", "name avatar department")
    .populate("leaveType", "name code color");
};

module.exports = mongoose.model("LeaveRequest", leaveRequestSchema);
