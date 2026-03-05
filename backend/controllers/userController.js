const User = require("../models/User");
const AuditTrail = require("../models/AuditTrail");
const Notification = require("../models/Notification");
const DepartmentChangeRequest = require("../models/DepartmentChangeRequest");
const LeaveCreditLog = require("../models/LeaveCreditLog");
const { AppError } = require("../middleware/errorHandler");
const { initializeUserBalances, getUserBalances } = require("../services/leaveBalanceService");
const { canonicalRole, normalizeRoleForDb } = require("../utils/roles");

/**
 * POST /api/users — Create new user (HR only)
 */
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, department, designation, phone, isActive } = req.body;

    // Validate required fields
    if (!name || !email || !password || !department) {
      return next(new AppError("Name, email, password, and department are required.", 400));
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return next(new AppError("Email already registered.", 409));
    }

    const normalizedRole = normalizeRoleForDb(role || "employee");

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: normalizedRole,
      department: department.trim(),
      designation: designation?.trim() || "",
      phone: phone?.trim() || "",
      isActive: isActive !== undefined ? isActive : true,
      probationStatus: true,
      probationEndDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000),
    });

    // Initialize leave balances
    const { initializeUserBalances } = require("../services/leaveBalanceService");
    await initializeUserBalances(user._id);

    // Create manager profile if role is MANAGER or HR_ADMIN
    if (canonicalRole(user.role) === "MANAGER" || canonicalRole(user.role) === "HR_ADMIN") {
      const Manager = require("../models/Manager");
      const managerProfile = await Manager.create({
        userId: user._id,
        department: user.department,
        managementLevel: canonicalRole(user.role) === "HR_ADMIN" ? "DIRECTOR" : "MANAGER",
        responsibilities: [],
        approvalAuthority: {
          maxLeaveDays: canonicalRole(user.role) === "HR_ADMIN" ? 365 : 30,
          canApproveSpecialLeave: canonicalRole(user.role) === "HR_ADMIN",
          canOverrideRules: canonicalRole(user.role) === "HR_ADMIN"
        }
      });
      await managerProfile.updateTeamSize();
    }

    await AuditTrail.log({
      action: "User Created by HR",
      category: "USER",
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      target: `${user.name} (${user.email})`,
      targetId: user._id,
      targetModel: "User",
      metadata: { role: user.role, department: user.department },
    });

    // Notify the new user
    await Notification.create({
      user: user._id,
      message: `Welcome to LeaveMS! Your account has been created by ${req.user.name}. You can now login.`,
      type: "SUCCESS",
    });

    res.status(201).json({ 
      success: true, 
      message: "User created successfully.", 
      data: { user } 
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users — Get all users (HR only)
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, department, isActive, page = 1, limit = 50, search } = req.query;
    const query = {};
    if (role) query.role = normalizeRoleForDb(role);
    if (department) query.department = department;
    if (isActive !== undefined) query.isActive = isActive === "true";
    if (search) query.$or = [{ name: new RegExp(search, "i") }, { email: new RegExp(search, "i") }];

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .populate("managerId", "name email")
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, count: users.length, total, pages: Math.ceil(total / limit), data: { users } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/:id — Get user by ID
 */
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate("managerId", "name email department");
    if (!user) return next(new AppError("User not found.", 404));
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/users/:id — Update user
 */
exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, role, department, designation, phone, probationStatus, isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError("User not found.", 404));

    const oldRole = user.role;

    if (name) user.name = name.trim();
    if (email) user.email = email.toLowerCase().trim();
    if (role) user.role = normalizeRoleForDb(role);

    // Department updates must be confirmed first via request workflow
    if (department && department.trim() !== user.department) {
      await DepartmentChangeRequest.create({
        userId: user._id,
        requestedBy: req.user._id,
        oldDepartment: user.department,
        newDepartment: department.trim(),
        reason: req.body.departmentChangeReason?.trim() || "",
        status: "PENDING",
        departmentConfirmed: false,
      });
    }
    if (designation) user.designation = designation.trim();
    if (phone) user.phone = phone.trim();
    if (probationStatus !== undefined) user.probationStatus = probationStatus;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    // Handle manager profile creation/deletion on role change
    if (role && oldRole !== role) {
      const Manager = require("../models/Manager");
      
      if (
        (canonicalRole(role) === "MANAGER" || canonicalRole(role) === "HR_ADMIN") &&
        canonicalRole(oldRole) === "EMPLOYEE"
      ) {
        // Create manager profile if promoted to manager
        const existingProfile = await Manager.findOne({ userId: user._id });
        if (!existingProfile) {
          const managerProfile = await Manager.create({
            userId: user._id,
            department: user.department,
            managementLevel: canonicalRole(role) === "HR_ADMIN" ? "DIRECTOR" : "MANAGER",
            responsibilities: [],
            approvalAuthority: {
              maxLeaveDays: canonicalRole(role) === "HR_ADMIN" ? 365 : 30,
              canApproveSpecialLeave: canonicalRole(role) === "HR_ADMIN",
              canOverrideRules: canonicalRole(role) === "HR_ADMIN"
            }
          });
          await managerProfile.updateTeamSize();
        }
      } else if (canonicalRole(role) === "EMPLOYEE" && (canonicalRole(oldRole) === "MANAGER" || canonicalRole(oldRole) === "HR_ADMIN")) {
        // Deactivate manager profile if demoted to employee
        await Manager.findOneAndUpdate(
          { userId: user._id },
          { isActive: false }
        );
      }
    }

    await AuditTrail.log({
      action: "User Updated",
      category: "USER",
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      target: `${user.name} (${user.email})`,
      targetId: user._id,
      targetModel: "User",
      metadata: { changes: req.body },
    });

    res.json({ success: true, message: "User updated successfully.", data: { user } });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/users/:id — Delete user
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError("User not found.", 404));

    await user.deleteOne();

    await AuditTrail.log({
      action: "User Deleted",
      category: "USER",
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      target: `${user.name} (${user.email})`,
      severity: "HIGH",
    });

    res.json({ success: true, message: "User deleted successfully." });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/users/:id/activate — Activate user
 */
exports.activateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError("User not found.", 404));

    user.isActive = true;
    await user.save();

    // Initialize leave balances when user is activated
    await initializeUserBalances(user._id);

    // Activate manager profile if user is a manager
    if (canonicalRole(user.role) === "MANAGER" || canonicalRole(user.role) === "HR_ADMIN") {
      const Manager = require("../models/Manager");
      const managerProfile = await Manager.findOne({ userId: user._id });
      if (managerProfile) {
        managerProfile.isActive = true;
        await managerProfile.save();
        await managerProfile.updateTeamSize();
      }
    }

    await Notification.create({
      user: user._id,
      message: `Your account has been activated by ${req.user.name}. You can now login.`,
      type: "SUCCESS",
    });

    await AuditTrail.log({
      action: "User Activated",
      category: "USER",
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      target: `${user.name} (${user.email})`,
      targetId: user._id,
      targetModel: "User",
    });

    res.json({ success: true, message: "User activated successfully.", data: { user } });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/users/:id/deactivate — Deactivate user
 */
exports.deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError("User not found.", 404));

    user.isActive = false;
    await user.save();

    await AuditTrail.log({
      action: "User Deactivated",
      category: "USER",
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      target: `${user.name} (${user.email})`,
      targetId: user._id,
      targetModel: "User",
      severity: "MEDIUM",
    });

    res.json({ success: true, message: "User deactivated successfully.", data: { user } });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/users/:id/assign-manager — Assign manager
 */
exports.assignManager = async (req, res, next) => {
  try {
    const { managerId } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError("User not found.", 404));

    if (managerId) {
      const manager = await User.findById(managerId);
      if (!manager || canonicalRole(manager.role) === "EMPLOYEE") {
        return next(new AppError("Invalid manager. Must be MANAGER or HR_ADMIN.", 400));
      }
      user.managerId = managerId;
    } else {
      user.managerId = null;
    }

    await user.save();

    await AuditTrail.log({
      action: "Manager Assigned",
      category: "USER",
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      target: `${user.name}`,
      targetId: user._id,
      targetModel: "User",
      metadata: { managerId: managerId || "None" },
    });

    res.json({ success: true, message: "Manager assigned successfully.", data: { user } });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/users/:id/leave-balance — Update leave balance manually (HR only with override)
 */
exports.updateLeaveBalance = async (req, res, next) => {
  try {
    const { leaveTypeId, balance, reason } = req.body;
    
    if (!reason?.trim()) {
      return next(new AppError("Reason for balance adjustment is required.", 400));
    }
    
    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError("User not found.", 404));

    const balIdx = user.leaveBalances.findIndex(b => b.leaveTypeId.toString() === leaveTypeId);
    const oldBalance = balIdx >= 0 ? user.leaveBalances[balIdx].balance : 0;
    
    if (balIdx >= 0) {
      user.leaveBalances[balIdx].balance = balance;
    } else {
      user.leaveBalances.push({ leaveTypeId, balance, used: 0, pending: 0 });
    }

    await user.save();

    // Notify user about balance adjustment
    await Notification.create({
      user: user._id,
      message: `Your leave balance has been adjusted by HR. Reason: ${reason}`,
      type: "INFO",
    });

    await AuditTrail.log({
      action: "Leave Balance Manually Adjusted",
      category: "LEAVE",
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      target: `${user.name}`,
      targetId: user._id,
      targetModel: "User",
      metadata: { 
        leaveTypeId: leaveTypeId.toString(), 
        oldBalance: oldBalance.toString(), 
        newBalance: balance.toString(),
        reason 
      },
      severity: "HIGH",
    });

    res.json({ 
      success: true, 
      message: "Leave balance updated successfully.", 
      data: { 
        user,
        oldBalance,
        newBalance: balance
      } 
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/:id/balances — Get user's leave balances with details
 */
exports.getUserLeaveBalances = async (req, res, next) => {
  try {
    const balances = await getUserBalances(req.params.id);
    const summary = balances.reduce(
      (acc, bal) => {
        const code = bal.leaveType?.code;
        if (code === "EL") acc.earned_leave = bal.balance;
        if (code === "SL") acc.sick_leave = bal.balance;
        if (code === "CL") acc.casual_leave = bal.balance;
        return acc;
      },
      { earned_leave: 0, sick_leave: 0, casual_leave: 0 }
    );
    const lastCredit = await LeaveCreditLog.findOne({ userId: req.params.id }).sort({ month: -1, createdAt: -1 });
    const now = new Date();
    const nextCreditDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    res.json({
      success: true,
      data: {
        balances,
        ...summary,
        earnedLeave: summary.earned_leave,
        sickLeave: summary.sick_leave,
        casualLeave: summary.casual_leave,
        creditInfo: {
          lastCreditedMonth: lastCredit?.month || null,
          nextCreditDate: nextCreditDate.toISOString(),
          creditDay: 1,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/users/process-accrual — Process monthly accrual manually (HR only)
 */
exports.processMonthlyAccrual = async (req, res, next) => {
  try {
    const { processMonthlyAccrual } = require("../services/leaveAccrualService");
    
    await processMonthlyAccrual();

    await AuditTrail.log({
      action: "Monthly Accrual Processed Manually",
      category: "SYSTEM",
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      target: "All Active Users",
      severity: "MEDIUM",
    });

    res.json({ 
      success: true, 
      message: "Monthly accrual processed successfully for all active users." 
    });
  } catch (err) {
    next(err);
  }
};
