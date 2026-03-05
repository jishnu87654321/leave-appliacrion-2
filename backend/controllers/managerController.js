const Manager = require("../models/Manager");
const User = require("../models/User");
const AuditTrail = require("../models/AuditTrail");
const { AppError } = require("../middleware/errorHandler");
const { canonicalRole } = require("../utils/roles");

/**
 * POST /api/managers — Create manager profile
 */
exports.createManagerProfile = async (req, res, next) => {
  try {
    const { 
      userId, 
      managementLevel, 
      responsibilities, 
      approvalAuthority,
      preferences 
    } = req.body;

    // Verify user exists and has MANAGER role
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError("User not found.", 404));
    }
    
    if (canonicalRole(user.role) !== "MANAGER" && canonicalRole(user.role) !== "HR_ADMIN") {
      return next(new AppError("User must have MANAGER or HR_ADMIN role.", 400));
    }

    // Check if manager profile already exists
    const existing = await Manager.findOne({ userId });
    if (existing) {
      return next(new AppError("Manager profile already exists for this user.", 409));
    }

    // Create manager profile
    const manager = await Manager.create({
      userId,
      department: user.department,
      managementLevel: managementLevel || "MANAGER",
      responsibilities: responsibilities || [],
      approvalAuthority: approvalAuthority || {},
      preferences: preferences || {}
    });

    // Update team size
    await manager.updateTeamSize();

    await AuditTrail.log({
      action: "Manager Profile Created",
      category: "USER",
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      target: `${user.name}`,
      targetId: manager._id,
      targetModel: "Manager",
      metadata: { managementLevel: manager.managementLevel }
    });

    res.status(201).json({
      success: true,
      message: "Manager profile created successfully.",
      data: { manager }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/managers — Get all managers
 */
exports.getAllManagers = async (req, res, next) => {
  try {
    const { department, isActive } = req.query;
    
    const query = {};
    if (department) query.department = department;
    if (isActive !== undefined) query.isActive = isActive === "true";

    const managers = await Manager.find(query)
      .populate("userId", "name email department designation phone avatar")
      .sort({ teamSize: -1 });

    res.json({
      success: true,
      count: managers.length,
      data: { managers }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/managers/:id — Get manager by ID
 */
exports.getManagerById = async (req, res, next) => {
  try {
    const manager = await Manager.findById(req.params.id)
      .populate("userId", "name email department designation phone avatar");
    
    if (!manager) {
      return next(new AppError("Manager not found.", 404));
    }

    res.json({
      success: true,
      data: { manager }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/managers/user/:userId — Get manager by user ID
 */
exports.getManagerByUserId = async (req, res, next) => {
  try {
    const manager = await Manager.findOne({ userId: req.params.userId })
      .populate("userId", "name email department designation phone avatar");
    
    if (!manager) {
      return next(new AppError("Manager profile not found.", 404));
    }

    res.json({
      success: true,
      data: { manager }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/managers/:id — Update manager profile
 */
exports.updateManagerProfile = async (req, res, next) => {
  try {
    const { 
      managementLevel, 
      responsibilities, 
      approvalAuthority,
      preferences,
      notes 
    } = req.body;

    const manager = await Manager.findById(req.params.id);
    if (!manager) {
      return next(new AppError("Manager not found.", 404));
    }

    if (managementLevel) manager.managementLevel = managementLevel;
    if (responsibilities) manager.responsibilities = responsibilities;
    if (approvalAuthority) manager.approvalAuthority = { ...manager.approvalAuthority, ...approvalAuthority };
    if (preferences) manager.preferences = { ...manager.preferences, ...preferences };
    if (notes !== undefined) manager.notes = notes;

    await manager.save();

    await AuditTrail.log({
      action: "Manager Profile Updated",
      category: "USER",
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      target: `Manager ID: ${manager._id}`,
      targetId: manager._id,
      targetModel: "Manager",
      metadata: { changes: req.body }
    });

    res.json({
      success: true,
      message: "Manager profile updated successfully.",
      data: { manager }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/managers/:id/team — Get manager's team members
 */
exports.getTeamMembers = async (req, res, next) => {
  try {
    const manager = await Manager.findById(req.params.id);
    if (!manager) {
      return next(new AppError("Manager not found.", 404));
    }

    const teamMembers = await manager.getTeamMembers();

    res.json({
      success: true,
      count: teamMembers.length,
      data: { teamMembers }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/managers/:id/sync-team — Sync team size
 */
exports.syncTeamSize = async (req, res, next) => {
  try {
    const manager = await Manager.findById(req.params.id);
    if (!manager) {
      return next(new AppError("Manager not found.", 404));
    }

    const teamSize = await manager.updateTeamSize();

    res.json({
      success: true,
      message: "Team size synchronized successfully.",
      data: { teamSize }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/managers/:id/update-metrics — Update performance metrics
 */
exports.updateMetrics = async (req, res, next) => {
  try {
    const manager = await Manager.findById(req.params.id);
    if (!manager) {
      return next(new AppError("Manager not found.", 404));
    }

    await manager.updatePerformanceMetrics();

    res.json({
      success: true,
      message: "Performance metrics updated successfully.",
      data: { 
        performance: manager.performance 
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/managers/stats/overview — Get manager statistics
 */
exports.getManagerStats = async (req, res, next) => {
  try {
    const totalManagers = await Manager.countDocuments({ isActive: true });
    const byDepartment = await Manager.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$department", count: { $sum: 1 }, totalTeamSize: { $sum: "$teamSize" } } },
      { $sort: { count: -1 } }
    ]);

    const avgTeamSize = await Manager.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, avgSize: { $avg: "$teamSize" } } }
    ]);

    res.json({
      success: true,
      data: {
        totalManagers,
        byDepartment,
        averageTeamSize: avgTeamSize[0]?.avgSize || 0
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/managers/:id — Delete manager profile
 */
exports.deleteManagerProfile = async (req, res, next) => {
  try {
    const manager = await Manager.findById(req.params.id);
    if (!manager) {
      return next(new AppError("Manager not found.", 404));
    }

    await manager.deleteOne();

    await AuditTrail.log({
      action: "Manager Profile Deleted",
      category: "USER",
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      target: `Manager ID: ${manager._id}`,
      severity: "HIGH"
    });

    res.json({
      success: true,
      message: "Manager profile deleted successfully."
    });
  } catch (err) {
    next(err);
  }
};
