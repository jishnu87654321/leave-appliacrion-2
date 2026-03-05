const mongoose = require("mongoose");

const leaveCreditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    month: { type: String, required: true }, // YYYY-MM (legacy key)
    monthKey: { type: String, default: "" }, // YYYY-MM (preferred key)
    creditedAt: { type: Date, default: Date.now },
    earnedAdded: { type: Number, default: 0 },
    sickAdded: { type: Number, default: 0 },
    role: { type: String, default: "" },
    joinDate: { type: Date, default: null },
    source: { type: String, enum: ["MONTHLY_JOB", "MANUAL"], default: "MONTHLY_JOB" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

leaveCreditLogSchema.pre("validate", function (next) {
  if (!this.monthKey && this.month) this.monthKey = this.month;
  if (!this.month && this.monthKey) this.month = this.monthKey;
  next();
});

leaveCreditLogSchema.index({ userId: 1, month: 1 }, { unique: true, name: "uniq_user_month_credit_log" });
leaveCreditLogSchema.index({ userId: 1, monthKey: 1 }, { unique: true, name: "uniq_user_month_key_credit_log" });
leaveCreditLogSchema.index({ month: 1, createdAt: -1 });

module.exports = mongoose.model("LeaveCreditLog", leaveCreditLogSchema);
