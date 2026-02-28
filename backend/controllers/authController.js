const User = require("../models/User");
const AuditTrail = require("../models/AuditTrail");
const Notification = require("../models/Notification");
const { AppError } = require("../middleware/errorHandler");
const { generateToken } = require("../middleware/auth");
const { sendEmail } = require("../services/emailService");
const { validationResult } = require("express-validator");
const { initializeUserBalances } = require("../services/leaveBalanceService");
const crypto = require("crypto");

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  const userObj = user.toObject();
  delete userObj.password;
  res.status(statusCode).json({ success: true, token, data: { user: userObj } });
};

/**
 * POST /api/auth/register
 */
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new AppError(errors.array()[0].msg, 400));

    const { name, email, password, department, designation, phone } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return next(new AppError("Email already registered.", 409));

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      department: department.trim(),
      designation: designation?.trim() || "",
      phone: phone?.trim() || "",
      role: "EMPLOYEE", // Default role; HR assigns role
      isActive: false, // Activated by HR
      probationStatus: true,
      probationEndDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000),
    });

    // Initialize leave balances for new user
    await initializeUserBalances(user._id);

    await AuditTrail.log({ action: "User Registered", category: "AUTH", performedBy: user._id, performedByName: user.name, performedByRole: "EMPLOYEE", target: `${user.name} (${user.email})`, metadata: { department, role: "EMPLOYEE" } });

    // Notify HR admins
    const hrAdmins = await User.find({ role: "HR_ADMIN", isActive: true });
    for (const admin of hrAdmins) {
      await Notification.create({ user: admin._id, message: `New user registration: ${user.name} (${user.email}) — ${department}. Please activate their account.`, type: "INFO" });
    }

    res.status(201).json({ success: true, message: "Registration successful. Your account will be activated by HR." });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new AppError(errors.array()[0].msg, 400));

    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    
    if (!user) {
      console.log(`❌ Login failed: User not found for email: ${email}`);
      return next(new AppError("Invalid email or password.", 401));
    }
    
    console.log(`✓ User found: ${user.name} (${user.email})`);
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    console.log(`Password comparison result: ${isPasswordValid}`);
    
    if (!isPasswordValid) {
      console.log(`❌ Login failed: Invalid password for ${email}`);
      return next(new AppError("Invalid email or password.", 401));
    }
    
    if (!user.isActive) {
      console.log(`❌ Login failed: Account not active for ${email}`);
      return next(new AppError("Account not activated. Contact HR.", 403));
    }

    console.log(`✅ Login successful for ${user.email}`);
    
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    await AuditTrail.log({ action: "User Login", category: "AUTH", performedBy: user._id, performedByName: user.name, performedByRole: user.role, target: user.email, metadata: { timestamp: new Date().toISOString() }, severity: "LOW" });

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error('❌ Login error:', err);
    next(err);
  }
};

/**
 * GET /api/auth/me
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("managerId", "name email");
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/auth/update-password
 */
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");
    if (!(await user.comparePassword(currentPassword))) return next(new AppError("Current password is incorrect.", 401));
    if (newPassword.length < 6) return next(new AppError("Password must be at least 6 characters.", 400));
    user.password = newPassword;
    await user.save();
    await AuditTrail.log({ action: "Password Changed", category: "AUTH", performedBy: user._id, performedByName: user.name, performedByRole: user.role, target: user.email, severity: "MEDIUM" });
    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email?.toLowerCase() });
    if (!user) return res.json({ success: true, message: "If this email exists, a reset link has been sent." });

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    const resetURL = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password/${resetToken}`;
    await sendEmail({ to: user.email, subject: "Password Reset Request — LeaveMS", html: `<p>Hello ${user.name},</p><p>Reset your password <a href="${resetURL}">here</a>. This link expires in 1 hour.</p>` });

    res.json({ success: true, message: "Password reset link sent to your email." });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 */
exports.logout = async (req, res) => {
  await AuditTrail.log({ action: "User Logout", category: "AUTH", performedBy: req.user._id, performedByName: req.user.name, performedByRole: req.user.role, target: req.user.email, severity: "LOW" });
  res.json({ success: true, message: "Logged out successfully." });
};
