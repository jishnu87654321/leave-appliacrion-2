const mongoose = require("mongoose");

const leaveAccrualLedgerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    leaveTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "LeaveType", required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true, min: 2000, max: 3000 },
    amount: { type: Number, required: true, min: 0 },
    source: { type: String, enum: ["MONTHLY_JOB", "MANUAL"], default: "MONTHLY_JOB" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

leaveAccrualLedgerSchema.index(
  { userId: 1, leaveTypeId: 1, month: 1, year: 1 },
  { unique: true, name: "uniq_user_leave_month_year" }
);

module.exports = mongoose.model("LeaveAccrualLedger", leaveAccrualLedgerSchema);
