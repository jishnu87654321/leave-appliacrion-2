const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"],
    },
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

holidaySchema.index({ date: 1 }, { unique: true });

module.exports = mongoose.model("Holiday", holidaySchema);

