const { AppError } = require("./errorHandler");
const { roleMatches, canonicalRole } = require("../utils/roles");

/**
 * Role-based access control middleware
 * Usage: restrictTo("HR_ADMIN", "MANAGER")
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return next(new AppError("Not authenticated.", 401));
    if (!roleMatches(req.user.role, roles)) {
      return next(new AppError(`Access denied. Required role: ${roles.join(" or ")}`, 403));
    }
    next();
  };
};
exports.requireRole = exports.restrictTo;

/**
 * Ensure a user can only access their own resource (or admin can access all)
 */
exports.isOwnerOrAdmin = (userIdField = "id") => {
  return (req, res, next) => {
    const targetId = req.params[userIdField] || req.body[userIdField];
    const isOwner = req.user._id.toString() === targetId;
    const role = canonicalRole(req.user.role);
    const isAdmin = role === "HR_ADMIN";
    const isManager = role === "MANAGER";
    if (!isOwner && !isAdmin && !isManager) {
      return next(new AppError("You do not have permission to access this resource.", 403));
    }
    next();
  };
};

/**
 * Ensure manager can only manage their own team members
 */
exports.isManagerOfEmployee = async (req, res, next) => {
  try {
    const User = require("../models/User");
    const employeeId = req.params.employeeId || req.body.employeeId;
    
    const role = canonicalRole(req.user.role);
    if (role === "HR_ADMIN") return next();
    if (role === "MANAGER") {
      const employee = await User.findById(employeeId);
      if (!employee || employee.managerId?.toString() !== req.user._id.toString()) {
        return next(new AppError("You can only manage employees in your team.", 403));
      }
      return next();
    }
    return next(new AppError("Access denied.", 403));
  } catch (err) {
    next(err);
  }
};

/**
 * Check if user can approve/reject a specific leave request
 * HR can approve/reject any leave
 * Manager can approve/reject any leave (not just their team)
 */
exports.canManageLeave = async (req, res, next) => {
  try {
    const LeaveRequest = require("../models/LeaveRequest");
    
    // HR and Manager can manage any leave
    const role = canonicalRole(req.user.role);
    if (role === "HR_ADMIN" || role === "MANAGER") {
      return next();
    }
    
    return next(new AppError("Access denied. Only managers and HR can manage leave requests.", 403));
  } catch (err) {
    next(err);
  }
};
