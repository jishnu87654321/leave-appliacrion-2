const { AppError } = require("./errorHandler");

/**
 * Role-based access control middleware
 * Usage: restrictTo("HR_ADMIN", "MANAGER")
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return next(new AppError("Not authenticated.", 401));
    if (!roles.includes(req.user.role)) {
      return next(new AppError(`Access denied. Required role: ${roles.join(" or ")}`, 403));
    }
    next();
  };
};

/**
 * Ensure a user can only access their own resource (or admin can access all)
 */
exports.isOwnerOrAdmin = (userIdField = "id") => {
  return (req, res, next) => {
    const targetId = req.params[userIdField] || req.body[userIdField];
    const isOwner = req.user._id.toString() === targetId;
    const isAdmin = req.user.role === "HR_ADMIN";
    const isManager = req.user.role === "MANAGER";
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
    
    if (req.user.role === "HR_ADMIN") return next();
    if (req.user.role === "MANAGER") {
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
    if (req.user.role === "HR_ADMIN" || req.user.role === "MANAGER") {
      return next();
    }
    
    return next(new AppError("Access denied. Only managers and HR can manage leave requests.", 403));
  } catch (err) {
    next(err);
  }
};
