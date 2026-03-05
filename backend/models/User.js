const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { normalizeRoleForDb } = require("../utils/roles");

const leaveBalanceSchema = new mongoose.Schema({
  leaveTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "LeaveType", required: true },
  balance: { type: Number, default: 0, min: -365 },
  used: { type: Number, default: 0, min: 0 },
  pending: { type: Number, default: 0, min: 0 },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, "Name is required"], trim: true, minlength: 2, maxlength: 100 },
  email: { type: String, required: [true, "Email is required"], trim: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, "Invalid email format"] },
  password: { type: String, required: [true, "Password is required"], minlength: 6, select: false },
  role: {
    type: String,
    enum: [
      "employee",
      "intern",
      "manager",
      "hr_admin",
      // legacy values kept for backward compatibility
      "EMPLOYEE",
      "INTERN",
      "MANAGER",
      "HR_ADMIN",
      "ADMIN",
      "HR",
    ],
    default: "employee",
  },
  department: { type: String, required: [true, "Department is required"], trim: true },
  designation: { type: String, trim: true, default: "" },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  phone: { type: String, trim: true, default: "" },
  avatar: { type: String, default: "" },
  joinDate: { type: Date, default: Date.now },
  joining_date: { type: Date, default: null },
  probationStatus: { type: Boolean, default: true },
  probationEndDate: { type: Date, default: null },
  leaveBalances: { type: [leaveBalanceSchema], default: [] },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null },
  passwordChangedAt: { type: Date, default: null },
  resetPasswordToken: { type: String, select: false },
  resetPasswordExpires: { type: Date, select: false },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ department: 1 });
userSchema.index({ managerId: 1 });
userSchema.index({ role: 1 });

// Virtual: full name initials
userSchema.virtual("initials").get(function () {
  return this.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
});

// Pre-save: hash password
userSchema.pre("save", async function (next) {
  if (this.isModified("role")) {
    this.role = normalizeRoleForDb(this.role);
  }
  if (this.isModified("joining_date") && this.joining_date) {
    this.joinDate = this.joining_date;
  } else if (this.isModified("joinDate") && this.joinDate) {
    this.joining_date = this.joinDate;
  }
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  if (!this.isNew) this.passwordChangedAt = new Date();
  next();
});

// Method: compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method: get leave balance for a type
userSchema.methods.getBalance = function (leaveTypeId) {
  const bal = this.leaveBalances.find(b => b.leaveTypeId.toString() === leaveTypeId.toString());
  return bal ? bal.balance : 0;
};

// Static: find active employees in department
userSchema.statics.findByDepartment = function (dept) {
  return this.find({ department: dept, isActive: true }).select("-password");
};

module.exports = mongoose.model("User", userSchema);
