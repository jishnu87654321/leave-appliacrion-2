const LeaveRequest = require("../models/LeaveRequest");
const LeaveType = require("../models/LeaveType");
const User = require("../models/User");
const Notification = require("../models/Notification");
const AuditTrail = require("../models/AuditTrail");
const { AppError } = require("../middleware/errorHandler");
const { calculateWorkingDays } = require("../utils/helpers");
const { sendLeaveNotificationEmail } = require("../services/emailService");
const { 
  addToPending, 
  deductLeaveBalance, 
  releasePending, 
  restoreBalance 
} = require("../services/leaveBalanceService");

/**
 * POST /api/leaves — Apply for leave
 */
exports.applyLeave = async (req, res, next) => {
  try {
    const { leaveTypeId, fromDate, toDate, halfDay, halfDaySession, reason, isEmergency } = req.body;

    const leaveType = await LeaveType.findById(leaveTypeId);
    if (!leaveType || !leaveType.isActive) return next(new AppError("Invalid or inactive leave type.", 400));

    const user = await User.findById(req.user._id);

    // Probation check
    if (user.probationStatus && !leaveType.applicableDuringProbation) {
      return next(new AppError(`${leaveType.name} is not available during probation period.`, 403));
    }

    // Calculate working days
    const totalDays = halfDay ? 0.5 : calculateWorkingDays(new Date(fromDate), new Date(toDate));
    if (totalDays <= 0) return next(new AppError("No working days in the selected date range.", 400));

    // Check for overlapping leaves
    const overlap = await LeaveRequest.findOne({
      employee: req.user._id,
      status: { $in: ["PENDING", "APPROVED"] },
      $or: [{ fromDate: { $lte: new Date(toDate) }, toDate: { $gte: new Date(fromDate) } }],
    });
    if (overlap) return next(new AppError("You have an existing leave request overlapping with these dates.", 409));

    // Check if 10 or more people are already on leave during the requested dates
    const overlappingLeaves = await LeaveRequest.countDocuments({
      status: { $in: ["PENDING", "APPROVED"] },
      fromDate: { $lte: new Date(toDate) },
      toDate: { $gte: new Date(fromDate) },
    });
    
    if (overlappingLeaves >= 10) {
      return next(new AppError("Cannot apply for leave. Maximum of 10 people can be on leave at the same time. Please choose different dates.", 400));
    }

    // Balance check
    const balEntry = user.leaveBalances.find(b => b.leaveTypeId.toString() === leaveTypeId);
    const balance = balEntry ? balEntry.balance : 0;

    if (!leaveType.allowNegativeBalance && balance < totalDays) {
      return next(new AppError(`Insufficient ${leaveType.code} balance. Available: ${balance} days, Requested: ${totalDays} days.`, 400));
    }

    // Max consecutive days check
    if (totalDays > leaveType.maxConsecutiveDays) {
      return next(new AppError(`Maximum ${leaveType.maxConsecutiveDays} consecutive days allowed for ${leaveType.name}.`, 400));
    }

    // Create request
    const leaveRequest = await LeaveRequest.create({
      employee: req.user._id,
      leaveType: leaveTypeId,
      fromDate: new Date(fromDate),
      toDate: halfDay ? new Date(fromDate) : new Date(toDate),
      totalDays,
      halfDay: halfDay || false,
      halfDaySession: halfDay ? halfDaySession : null,
      reason: reason.trim(),
      appliedBalanceBefore: balance,
      isEmergency: isEmergency || false,
    });

    // Mark balance as pending using service
    await addToPending(req.user._id, leaveTypeId, totalDays);

    // Notify manager
    if (user.managerId) {
      await Notification.create({
        user: user.managerId,
        message: `${user.name} applied for ${leaveType.name} (${totalDays} day${totalDays !== 1 ? "s" : ""}) from ${fromDate}${!halfDay ? " to " + toDate : ""}. Action required.`,
        type: "WARNING",
        relatedLeaveRequest: leaveRequest._id,
      });
      const manager = await User.findById(user.managerId);
      if (manager) await sendLeaveNotificationEmail(manager.email, "new_request", { employee: user.name, leaveType: leaveType.name, totalDays, fromDate, toDate: halfDay ? fromDate : toDate });
    }

    await AuditTrail.log({ action: "Leave Application Submitted", category: "LEAVE", performedBy: req.user._id, performedByName: user.name, performedByRole: user.role, target: `${leaveType.name} (${totalDays} days)`, targetId: leaveRequest._id, targetModel: "LeaveRequest", metadata: { leaveType: leaveType.name, days: totalDays.toString(), fromDate, toDate } });

    res.status(201).json({ success: true, message: "Leave request submitted successfully.", data: { leaveRequest: await leaveRequest.populate(["employee", "leaveType"]) } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/leaves/my — Get my leave requests
 */
exports.getMyLeaves = async (req, res, next) => {
  try {
    const { status, leaveTypeId, page = 1, limit = 20 } = req.query;
    const query = { employee: req.user._id };
    if (status) query.status = status;
    if (leaveTypeId) query.leaveType = leaveTypeId;

    const total = await LeaveRequest.countDocuments(query);
    const leaves = await LeaveRequest.find(query)
      .populate("employee", "name email department designation avatar probationStatus leaveBalances")
      .populate("leaveType", "name code color")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, count: leaves.length, total, pages: Math.ceil(total / limit), data: { leaves } });
  } catch (err) { next(err); }
};

/**
 * GET /api/leaves/team — Get team leave requests (Manager)
 */
exports.getTeamLeaves = async (req, res, next) => {
  try {
    const { status } = req.query;
    const teamMembers = await User.find({ managerId: req.user._id, isActive: true });
    const teamIds = teamMembers.map(u => u._id);
    const query = { employee: { $in: teamIds } };
    if (status) query.status = status;
    const leaves = await LeaveRequest.find(query).populate("employee", "name email department designation avatar probationStatus").populate("leaveType", "name code color requiresDocument").sort({ status: 1, createdAt: -1 });
    res.json({ success: true, count: leaves.length, data: { leaves } });
  } catch (err) { next(err); }
};

/**
 * GET /api/leaves — Get all (HR only)
 */
exports.getAllLeaves = async (req, res, next) => {
  try {
    const { status, department, leaveTypeId, page = 1, limit = 50, startDate, endDate } = req.query;
    const query = {};
    if (status) query.status = status;
    if (leaveTypeId) query.leaveType = leaveTypeId;
    if (startDate && endDate) { query.fromDate = { $gte: new Date(startDate) }; query.toDate = { $lte: new Date(endDate) }; }

    let pipeline = [{ $match: query }, { $lookup: { from: "users", localField: "employee", foreignField: "_id", as: "employeeData" } }, { $unwind: "$employeeData" }];
    if (department) pipeline.push({ $match: { "employeeData.department": department } });
    pipeline.push({ $sort: { createdAt: -1 } }, { $skip: (page - 1) * limit }, { $limit: parseInt(limit) });

    const [leaves, total] = await Promise.all([
      LeaveRequest.find(query).populate("employee", "name email department designation avatar probationStatus leaveBalances").populate("leaveType", "name code color requiresDocument").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit)),
      LeaveRequest.countDocuments(query),
    ]);
    res.json({ success: true, count: leaves.length, total, pages: Math.ceil(total / limit), data: { leaves } });
  } catch (err) { next(err); }
};

/**
 * PUT /api/leaves/:id/approve — Approve leave (Manager or HR)
 */
exports.approveLeave = async (req, res, next) => {
  const session = await LeaveRequest.startSession();
  session.startTransaction();
  
  try {
    const { comment, hrOverride } = req.body;
    const leaveReq = await LeaveRequest.findById(req.params.id).populate("employee").populate("leaveType").session(session);
    if (!leaveReq) {
      await session.abortTransaction();
      return next(new AppError("Leave request not found.", 404));
    }
    if (leaveReq.status !== "PENDING") {
      await session.abortTransaction();
      return next(new AppError("Only pending requests can be approved.", 400));
    }

    // Manager can only approve their team
    if (req.user.role === "MANAGER" && leaveReq.employee.managerId?.toString() !== req.user._id.toString()) {
      await session.abortTransaction();
      return next(new AppError("You can only approve your team's requests.", 403));
    }

    // Balance validation (HR can override)
    const employee = await User.findById(leaveReq.employee._id).session(session);
    const balEntry = employee.leaveBalances.find(b => b.leaveTypeId.toString() === leaveReq.leaveType._id.toString());
    const availableBalance = balEntry ? balEntry.balance : 0;
    
    if (!hrOverride && !leaveReq.leaveType.allowNegativeBalance && availableBalance < leaveReq.totalDays) {
      await session.abortTransaction();
      return next(new AppError(`Insufficient balance. Available: ${availableBalance} days, Required: ${leaveReq.totalDays} days. HR can override this check.`, 400));
    }

    // Update leave request status
    leaveReq.status = "APPROVED";
    leaveReq.approvalHistory.push({
      level: leaveReq.currentApprovalLevel,
      approverId: req.user._id,
      approverName: req.user.name,
      approverRole: req.user.role,
      status: "APPROVED",
      comment: comment || "Approved",
      actionDate: new Date(),
    });
    await leaveReq.save({ session });

    // Deduct balance using service (atomic operation within transaction)
    await deductLeaveBalance(leaveReq.employee._id, leaveReq.leaveType._id, leaveReq.totalDays, session);

    // Commit transaction
    await session.commitTransaction();

    // Notify employee (after transaction)
    await Notification.create({ 
      user: leaveReq.employee._id, 
      message: `Your ${leaveReq.leaveType.name} request for ${leaveReq.totalDays} day(s) has been approved by ${req.user.name}.`, 
      type: "SUCCESS", 
      relatedLeaveRequest: leaveReq._id 
    });
    
    await sendLeaveNotificationEmail(leaveReq.employee.email, "approved", { 
      approverName: req.user.name, 
      leaveType: leaveReq.leaveType.name, 
      totalDays: leaveReq.totalDays 
    });

    await AuditTrail.log({ 
      action: "Leave Request Approved", 
      category: "LEAVE", 
      performedBy: req.user._id, 
      performedByName: req.user.name, 
      performedByRole: req.user.role, 
      target: `${leaveReq.employee.name}'s ${leaveReq.leaveType.name}`, 
      targetId: leaveReq._id, 
      targetModel: "LeaveRequest", 
      metadata: { 
        days: leaveReq.totalDays.toString(), 
        comment: comment || "",
        hrOverride: hrOverride ? "true" : "false"
      }, 
      severity: "LOW" 
    });

    // Fetch updated employee data for response
    const updatedEmployee = await User.findById(leaveReq.employee._id).select("leaveBalances");
    
    // Populate the leave request for consistent response
    const populatedLeaveReq = await LeaveRequest.findById(leaveReq._id)
      .populate("employee", "name email department designation avatar leaveBalances")
      .populate("leaveType", "name code color");

    res.json({ 
      success: true, 
      message: "Leave request approved successfully.", 
      data: { 
        leaveRequest: populatedLeaveReq,
        updatedBalances: updatedEmployee.leaveBalances
      } 
    });
  } catch (err) { 
    await session.abortTransaction();
    next(err); 
  } finally {
    session.endSession();
  }
};

/**
 * PUT /api/leaves/:id/reject — Reject leave
 */
exports.rejectLeave = async (req, res, next) => {
  const session = await LeaveRequest.startSession();
  session.startTransaction();
  
  try {
    const { comment } = req.body;
    if (!comment?.trim()) {
      await session.abortTransaction();
      return next(new AppError("Rejection reason (comment) is required.", 400));
    }

    const leaveReq = await LeaveRequest.findById(req.params.id).populate("employee").populate("leaveType").session(session);
    if (!leaveReq) {
      await session.abortTransaction();
      return next(new AppError("Leave request not found.", 404));
    }
    if (leaveReq.status !== "PENDING") {
      await session.abortTransaction();
      return next(new AppError("Only pending requests can be rejected.", 400));
    }

    // Manager can only reject their team
    if (req.user.role === "MANAGER" && leaveReq.employee.managerId?.toString() !== req.user._id.toString()) {
      await session.abortTransaction();
      return next(new AppError("You can only reject your team's requests.", 403));
    }

    leaveReq.status = "REJECTED";
    leaveReq.comments = comment;
    leaveReq.approvalHistory.push({ 
      level: leaveReq.currentApprovalLevel, 
      approverId: req.user._id, 
      approverName: req.user.name, 
      approverRole: req.user.role, 
      status: "REJECTED", 
      comment, 
      actionDate: new Date() 
    });
    await leaveReq.save({ session });

    // Release pending balance using service (atomic operation within transaction)
    await releasePending(leaveReq.employee._id, leaveReq.leaveType._id, leaveReq.totalDays, session);

    // Commit transaction
    await session.commitTransaction();

    // Notify employee (after transaction)
    await Notification.create({ 
      user: leaveReq.employee._id, 
      message: `Your ${leaveReq.leaveType.name} request was rejected by ${req.user.name}. Reason: ${comment}`, 
      type: "DANGER", 
      relatedLeaveRequest: leaveReq._id 
    });
    
    await sendLeaveNotificationEmail(leaveReq.employee.email, "rejected", { 
      approverName: req.user.name, 
      leaveType: leaveReq.leaveType.name, 
      reason: comment 
    });

    await AuditTrail.log({ 
      action: "Leave Request Rejected", 
      category: "LEAVE", 
      performedBy: req.user._id, 
      performedByName: req.user.name, 
      performedByRole: req.user.role, 
      target: `${leaveReq.employee.name}'s ${leaveReq.leaveType.name}`, 
      targetId: leaveReq._id, 
      targetModel: "LeaveRequest", 
      metadata: { reason: comment }, 
      severity: "MEDIUM" 
    });

    // Fetch updated employee data for response
    const updatedEmployee = await User.findById(leaveReq.employee._id).select("leaveBalances");

    // Populate the leave request for consistent response
    const populatedLeaveReq = await LeaveRequest.findById(leaveReq._id)
      .populate("employee", "name email department designation avatar leaveBalances")
      .populate("leaveType", "name code color");

    res.json({ 
      success: true, 
      message: "Leave request rejected successfully.", 
      data: { 
        leaveRequest: populatedLeaveReq,
        updatedBalances: updatedEmployee.leaveBalances
      } 
    });
  } catch (err) { 
    await session.abortTransaction();
    next(err); 
  } finally {
    session.endSession();
  }
};

/**
 * PUT /api/leaves/:id/cancel — Cancel own leave
 */
exports.cancelLeave = async (req, res, next) => {
  const session = await LeaveRequest.startSession();
  session.startTransaction();
  
  try {
    const leaveReq = await LeaveRequest.findOne({ _id: req.params.id, employee: req.user._id }).populate("leaveType").session(session);
    if (!leaveReq) {
      await session.abortTransaction();
      return next(new AppError("Leave request not found.", 404));
    }
    
    const previousStatus = leaveReq.status;
    
    if (!["PENDING", "APPROVED"].includes(previousStatus)) {
      await session.abortTransaction();
      return next(new AppError("Only pending or approved requests can be cancelled.", 400));
    }

    leaveReq.status = "CANCELLED";
    leaveReq.cancelledAt = new Date();
    leaveReq.cancelReason = req.body.reason || "";
    await leaveReq.save({ session });

    // Handle balance restoration based on previous status
    if (previousStatus === "PENDING") {
      // Release pending balance
      await releasePending(req.user._id, leaveReq.leaveType._id, leaveReq.totalDays, session);
    } else if (previousStatus === "APPROVED") {
      // Restore balance (add back to balance, decrease used)
      await restoreBalance(req.user._id, leaveReq.leaveType._id, leaveReq.totalDays, session);
    }

    // Commit transaction
    await session.commitTransaction();

    await AuditTrail.log({
      action: "Leave Request Cancelled",
      category: "LEAVE",
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      target: `${leaveReq.leaveType.name} (${leaveReq.totalDays} days)`,
      targetId: leaveReq._id,
      targetModel: "LeaveRequest",
      metadata: { previousStatus, reason: req.body.reason || "No reason provided" },
    });

    // Fetch updated employee data for response
    const updatedEmployee = await User.findById(req.user._id).select("leaveBalances");

    // Populate the leave request for consistent response
    const populatedLeaveReq = await LeaveRequest.findById(leaveReq._id)
      .populate("employee", "name email department designation avatar leaveBalances")
      .populate("leaveType", "name code color");

    res.json({ 
      success: true, 
      message: "Leave request cancelled successfully.",
      data: {
        leaveRequest: populatedLeaveReq,
        updatedBalances: updatedEmployee.leaveBalances
      }
    });
  } catch (err) { 
    await session.abortTransaction();
    next(err); 
  } finally {
    session.endSession();
  }
};

/**
 * PUT /api/leaves/:id/force-cancel — Force cancel any leave (HR only)
 */
exports.forceCancelLeave = async (req, res, next) => {
  const session = await LeaveRequest.startSession();
  session.startTransaction();
  
  try {
    const { reason } = req.body;
    if (!reason?.trim()) {
      await session.abortTransaction();
      return next(new AppError("Cancellation reason is required.", 400));
    }

    const leaveReq = await LeaveRequest.findById(req.params.id).populate("employee").populate("leaveType").session(session);
    if (!leaveReq) {
      await session.abortTransaction();
      return next(new AppError("Leave request not found.", 404));
    }
    
    const previousStatus = leaveReq.status;
    
    if (!["PENDING", "APPROVED"].includes(previousStatus)) {
      await session.abortTransaction();
      return next(new AppError("Only pending or approved requests can be cancelled.", 400));
    }

    leaveReq.status = "CANCELLED";
    leaveReq.cancelledAt = new Date();
    leaveReq.cancelReason = reason;
    leaveReq.approvalHistory.push({
      level: leaveReq.currentApprovalLevel + 1,
      approverId: req.user._id,
      approverName: req.user.name,
      approverRole: req.user.role,
      status: "CANCELLED",
      comment: `Force cancelled by HR: ${reason}`,
      actionDate: new Date(),
    });
    await leaveReq.save({ session });

    // Handle balance restoration based on previous status
    if (previousStatus === "PENDING") {
      await releasePending(leaveReq.employee._id, leaveReq.leaveType._id, leaveReq.totalDays, session);
    } else if (previousStatus === "APPROVED") {
      await restoreBalance(leaveReq.employee._id, leaveReq.leaveType._id, leaveReq.totalDays, session);
    }

    // Commit transaction
    await session.commitTransaction();

    // Notify employee
    await Notification.create({
      user: leaveReq.employee._id,
      message: `Your ${leaveReq.leaveType.name} request has been cancelled by HR. Reason: ${reason}`,
      type: "WARNING",
      relatedLeaveRequest: leaveReq._id,
    });

    await AuditTrail.log({
      action: "Leave Request Force Cancelled by HR",
      category: "LEAVE",
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      target: `${leaveReq.employee.name}'s ${leaveReq.leaveType.name}`,
      targetId: leaveReq._id,
      targetModel: "LeaveRequest",
      metadata: { previousStatus, reason },
      severity: "HIGH",
    });

    res.json({ 
      success: true, 
      message: "Leave request cancelled successfully.",
      data: { leaveRequest: leaveReq }
    });
  } catch (err) { 
    await session.abortTransaction();
    next(err); 
  } finally {
    session.endSession();
  }
};

/**
 * GET /api/leaves/team-calendar — Get team calendar data
 */
exports.getTeamCalendar = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    let employeeIds;
    if (req.user.role === "HR_ADMIN") {
      employeeIds = (await User.find({ isActive: true })).map(u => u._id);
    } else if (req.user.role === "MANAGER") {
      const team = await User.find({ managerId: req.user._id });
      employeeIds = [req.user._id, ...team.map(u => u._id)];
    } else {
      const team = await User.find({ managerId: req.user.managerId, isActive: true });
      employeeIds = team.map(u => u._id);
    }

    const leaves = await LeaveRequest.getInDateRange(startDate, endDate, { employee: { $in: employeeIds } });
    res.json({ success: true, data: { leaves } });
  } catch (err) { next(err); }
};

/**
 * GET /api/leaves/:id — Get leave by ID
 */
exports.getLeaveById = async (req, res, next) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id)
      .populate("employee", "name email department designation avatar")
      .populate("leaveType", "name code color");
    
    if (!leave) return next(new AppError("Leave request not found.", 404));
    
    // Check access rights
    if (req.user.role === "EMPLOYEE" && leave.employee._id.toString() !== req.user._id.toString()) {
      return next(new AppError("You can only view your own leave requests.", 403));
    }
    
    res.json({ success: true, data: { leave } });
  } catch (err) { next(err); }
};

/**
 * GET /api/leaves/stats/dashboard — Get dashboard statistics
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let stats = {};

    if (userRole === "EMPLOYEE") {
      // Employee stats
      const myLeaves = await LeaveRequest.find({ employee: userId });
      const user = await User.findById(userId).select("leaveBalances probationStatus");
      
      stats = {
        pending: myLeaves.filter(l => l.status === "PENDING").length,
        approved: myLeaves.filter(l => l.status === "APPROVED").length,
        rejected: myLeaves.filter(l => l.status === "REJECTED").length,
        totalRequests: myLeaves.length,
        daysUsed: myLeaves.filter(l => l.status === "APPROVED").reduce((sum, l) => sum + l.totalDays, 0),
        leaveBalances: user.leaveBalances,
        probationStatus: user.probationStatus,
      };
    } else if (userRole === "MANAGER") {
      // Manager stats
      const teamMembers = await User.find({ managerId: userId, isActive: true });
      const teamIds = teamMembers.map(u => u._id);
      const teamLeaves = await LeaveRequest.find({ employee: { $in: teamIds } });
      
      stats = {
        teamSize: teamMembers.length,
        pending: teamLeaves.filter(l => l.status === "PENDING").length,
        approved: teamLeaves.filter(l => l.status === "APPROVED").length,
        rejected: teamLeaves.filter(l => l.status === "REJECTED").length,
        totalRequests: teamLeaves.length,
        onProbation: teamMembers.filter(u => u.probationStatus).length,
        // Today's leaves
        onLeaveToday: await LeaveRequest.countDocuments({
          employee: { $in: teamIds },
          status: "APPROVED",
          fromDate: { $lte: new Date() },
          toDate: { $gte: new Date() },
        }),
      };
    } else if (userRole === "HR_ADMIN") {
      // HR Admin stats
      const allUsers = await User.find({ isActive: true });
      const allLeaves = await LeaveRequest.find({});
      
      stats = {
        totalEmployees: allUsers.length,
        pending: allLeaves.filter(l => l.status === "PENDING").length,
        approved: allLeaves.filter(l => l.status === "APPROVED").length,
        rejected: allLeaves.filter(l => l.status === "REJECTED").length,
        totalRequests: allLeaves.length,
        onProbation: allUsers.filter(u => u.probationStatus).length,
        activeUsers: allUsers.filter(u => u.isActive).length,
      };
    }

    res.json({ success: true, data: { stats } });
  } catch (err) { next(err); }
};
