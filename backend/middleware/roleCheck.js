const { AppError } = require("./errorHandler");
const { roleMatches, canonicalRole } = require("../utils/roles");
const { logSecurityEvent, SECURITY_EVENTS } = require("../services/securityEventService");

/**
 * Role-based access control middleware
 * Usage: restrictTo("HR_ADMIN", "MANAGER")
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return next(new AppError("Not authenticated.", 401));
    if (!roleMatches(req.user.role, roles)) {
      logSecurityEvent(SECURITY_EVENTS.ACCESS_DENIED, {
        actorRole: req.user.role,
        requiredRoles: roles.join(","),
      });
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
    const targetId = req.params[userIdField] || req.body[userIdField] || req.query[userIdField];
    const isOwner = req.user._id.toString() === targetId;
    const role = canonicalRole(req.user.role);
    const isAdmin = role === "HR_ADMIN";
    if (!isOwner && !isAdmin) {
      logSecurityEvent(SECURITY_EVENTS.ACCESS_IDOR_BLOCKED, {
        actorId: req.user._id.toString(),
        targetId: String(targetId || ""),
      });
      return next(new AppError("You do not have permission to access this resource.", 403));
    }
    next();
  };
};

exports.isSelfOrPrivileged = () => {
  return async (req, res, next) => {
    const role = canonicalRole(req.user.role);
    const targetId = String(req.params.id || req.params.userId || "");
    const isSelf = req.user._id.toString() === targetId;
    if (isSelf || role === "HR_ADMIN") return next();
    if (role !== "MANAGER") {
      logSecurityEvent(SECURITY_EVENTS.ACCESS_IDOR_BLOCKED, {
        actorId: req.user._id.toString(),
        targetId,
      });
      return next(new AppError("Access denied.", 403));
    }

    try {
      const User = require("../models/User");
      const target = await User.findById(targetId).select("_id managerId");
      if (target && target.managerId?.toString() === req.user._id.toString()) return next();
      logSecurityEvent(SECURITY_EVENTS.ACCESS_IDOR_BLOCKED, {
        actorId: req.user._id.toString(),
        targetId,
      });
      return next(new AppError("Managers can only access their own team members.", 403));
    } catch (err) {
      return next(err);
    }
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
 * Manager approval is restricted to their team in controllers
 */
exports.canManageLeave = async (req, res, next) => {
  try {
    const role = canonicalRole(req.user.role);
    if (role === "HR_ADMIN" || role === "MANAGER") {
      return next();
    }
    
    return next(new AppError("Access denied. Only managers and HR can manage leave requests.", 403));
  } catch (err) {
    next(err);
  }
};
