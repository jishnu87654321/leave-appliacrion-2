const LeaveType = require("../models/LeaveType");
const AuditTrail = require("../models/AuditTrail");
const { AppError } = require("../middleware/errorHandler");

/**
 * GET /api/leave-types — Get all leave types
 */
exports.getAllLeaveTypes = async (req, res, next) => {
  try {
    const { isActive } = req.query;
    const query = {};
    if (isActive !== undefined) query.isActive = isActive === "true";

    const leaveTypes = await LeaveType.find(query).sort({ displayOrder: 1, name: 1 });

    res.json({ success: true, count: leaveTypes.length, data: { leaveTypes } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/leave-types/:id — Get leave type by ID
 */
exports.getLeaveTypeById = async (req, res, next) => {
  try {
    const leaveType = await LeaveType.findById(req.params.id);
    if (!leaveType) return next(new AppError("Leave type not found.", 404));

    res.json({ success: true, data: { leaveType } });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/leave-types — Create leave type (HR only)
 */
exports.createLeaveType = async (req, res, next) => {
  try {
    const {
      name,
      code,
      description,
      accrualType,
      accrualRate,
      carryForwardLimit,
      maxConsecutiveDays,
      allowNegativeBalance,
      applicableDuringProbation,
      requiresDocument,
      color,
      displayOrder,
    } = req.body;

    const existing = await LeaveType.findOne({ $or: [{ name }, { code }] });
    if (existing) return next(new AppError("Leave type with this name or code already exists.", 409));

    const leaveType = await LeaveType.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description?.trim() || "",
      accrualType,
      accrualRate,
      carryForwardLimit: carryForwardLimit || 0,
      maxConsecutiveDays: maxConsecutiveDays || 365,
      allowNegativeBalance: allowNegativeBalance || false,
      applicableDuringProbation: applicableDuringProbation || false,
      requiresDocument: requiresDocument || false,
      color: color || "#3B82F6",
      displayOrder: displayOrder || 0,
    });

    await AuditTrail.log({
      action: "Leave Type Created",
      category: "CONFIG",
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      target: `${leaveType.name} (${leaveType.code})`,
      targetId: leaveType._id,
      targetModel: "LeaveType",
      metadata: { accrualType, accrualRate },
    });

    res.status(201).json({ success: true, message: "Leave type created successfully.", data: { leaveType } });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/leave-types/:id — Update leave type
 */
exports.updateLeaveType = async (req, res, next) => {
  try {
    const leaveType = await LeaveType.findById(req.params.id);
    if (!leaveType) return next(new AppError("Leave type not found.", 404));

    const allowedFields = [
      "name", "description", "accrualRate", "carryForwardLimit", "maxConsecutiveDays",
      "allowNegativeBalance", "applicableDuringProbation", "requiresDocument", "color", "displayOrder", "isActive"
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) leaveType[field] = req.body[field];
    });

    await leaveType.save();

    await AuditTrail.log({
      action: "Leave Type Updated",
      category: "CONFIG",
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      target: `${leaveType.name} (${leaveType.code})`,
      targetId: leaveType._id,
      targetModel: "LeaveType",
      metadata: { changes: req.body },
    });

    res.json({ success: true, message: "Leave type updated successfully.", data: { leaveType } });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/leave-types/:id — Delete leave type
 */
exports.deleteLeaveType = async (req, res, next) => {
  try {
    const leaveType = await LeaveType.findById(req.params.id);
    if (!leaveType) return next(new AppError("Leave type not found.", 404));

    await leaveType.deleteOne();

    await AuditTrail.log({
      action: "Leave Type Deleted",
      category: "CONFIG",
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      target: `${leaveType.name} (${leaveType.code})`,
      severity: "HIGH",
    });

    res.json({ success: true, message: "Leave type deleted successfully." });
  } catch (err) {
    next(err);
  }
};
