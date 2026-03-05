const mongoose = require("mongoose");

const departmentChangeRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    oldDepartment: { type: String, required: true, trim: true },
    newDepartment: { type: String, required: true, trim: true },
    status: { type: String, enum: ["PENDING", "CONFIRMED", "REJECTED"], default: "PENDING" },
    departmentConfirmed: { type: Boolean, default: false },
    reason: { type: String, default: "", trim: true },
    confirmedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

departmentChangeRequestSchema.index({ userId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("DepartmentChangeRequest", departmentChangeRequestSchema);
