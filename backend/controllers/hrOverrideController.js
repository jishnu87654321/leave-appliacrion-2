const mongoose = require("mongoose");
const LeaveRequest = require("../models/LeaveRequest");
const User = require("../models/User");
const LeaveType = require("../models/LeaveType");
const AuditTrail = require("../models/AuditTrail");
const Notification = require("../models/Notification");
const { AppError } = require("../middleware/errorHandler");
const { deductLeaveBalance, releasePending } = require("../services/leaveBalanceService");

/**
 * PUT /api/leaves/:id/override
 * HR Admin Override - Approve or Reject leave with full authority
 * Bypasses all balance checks and manager approval requirements
 */
exports.hrOverrideLeave = async (req, res, next) => {
  let session = null;
  
  try {
    const { status, comment } = req.body;
    const leaveId = req.params.id;

    // Validate input
    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either APPROVED or REJECTED"
      });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment is required for HR override"
      });
    }

    // Validate leave ID
    if (!mongoose.Types.ObjectId.isValid(leaveId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave request ID"
      });
    }

    // Start MongoDB session for transaction
    session = await mongoose.startSession();
    session.startTransaction();

    // Fetch leave request with populated fields
    const leaveRequest = await LeaveRequest.findById(leaveId)
      .populate("employee", "name email department leaveBalances")
      .populate("leaveType", "name code color allowNegativeBalance")
      .session(session);

    if (!leaveRequest) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Leave request not found"
      });
    }

    // Check if already in the target status
    if (leaveRequest.status === status) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Leave request is already ${status}.`
      });
    }

    const previousStatus = leaveRequest.status;
    const employee = leaveRequest.employee;
    const leaveType = leaveRequest.leaveType;
    const totalDays = leaveRequest.totalDays;

    // Process based on status
    if (status === "APPROVED") {
      // HR Override Approve - Bypass balance check
      // Even if balance is insufficient, HR can approve
      
      // If changing from REJECTED to APPROVED, need to handle pending balance
      if (previousStatus === "REJECTED") {
        // Re-add to pending first (will be deducted below)
        const balEntry = employee.leaveBalances.find(b => b.leaveTypeId.toString() === leaveType._id.toString());
        if (balEntry) {
          balEntry.pending += totalDays;
          await employee.save({ session });
        }
      }
      
      // Update leave request
      leaveRequest.status = "APPROVED";
      leaveRequest.approvalHistory.push({
        level: leaveRequest.currentApprovalLevel + 1,
        approverId: req.user._id,
        approverName: req.user.name,
        approverRole: req.user.role,
        status: "APPROVED",
        comment: `[HR OVERRIDE] ${comment.trim()}`,
        actionDate: new Date(),
      });
      
      await leaveRequest.save({ session });

      // Deduct balance (allows negative balance for HR override)
      // This will move from pending to used
      await deductLeaveBalance(
        employee._id,
        leaveType._id,
        totalDays,
        session
      );

      // Create notification for employee
      await Notification.create([{
        user: employee._id,
        message: `Your ${leaveType.name} request for ${totalDays} day(s) has been APPROVED by HR Admin (${req.user.name}). Reason: ${comment.trim()}`,
        type: "SUCCESS",
        relatedLeaveRequest: leaveRequest._id,
      }], { session });

      // Create audit trail
      await AuditTrail.create([{
        action: "HR Override - Leave Approved",
        category: "LEAVE",
        performedBy: req.user._id,
        performedByName: req.user.name,
        performedByRole: req.user.role,
        target: `${employee.name}'s ${leaveType.name} (${totalDays} days)`,
        targetId: leaveRequest._id,
        targetModel: "LeaveRequest",
        metadata: {
          previousStatus,
          newStatus: "APPROVED",
          days: totalDays.toString(),
          comment: comment.trim(),
          hrOverride: "true",
          bypassedBalanceCheck: "true"
        },
        severity: "HIGH",
      }], { session });

    } else if (status === "REJECTED") {
      // HR Override Reject
      
      // If changing from APPROVED to REJECTED, need to restore balance
      if (previousStatus === "APPROVED") {
        // Restore the used balance
        const balEntry = employee.leaveBalances.find(b => b.leaveTypeId.toString() === leaveType._id.toString());
        if (balEntry) {
          balEntry.balance += totalDays;
          balEntry.used -= totalDays;
          await employee.save({ session });
        }
      } else if (previousStatus === "PENDING") {
        // Release pending balance
        await releasePending(
          employee._id,
          leaveType._id,
          totalDays,
          session
        );
      }
      
      // Update leave request
      leaveRequest.status = "REJECTED";
      leaveRequest.comments = comment.trim();
      leaveRequest.approvalHistory.push({
        level: leaveRequest.currentApprovalLevel + 1,
        approverId: req.user._id,
        approverName: req.user.name,
        approverRole: req.user.role,
        status: "REJECTED",
        comment: `[HR OVERRIDE] ${comment.trim()}`,
        actionDate: new Date(),
      });
      
      await leaveRequest.save({ session });

      // Create notification for employee
      await Notification.create([{
        user: employee._id,
        message: `Your ${leaveType.name} request for ${totalDays} day(s) has been REJECTED by HR Admin (${req.user.name}). Reason: ${comment.trim()}`,
        type: "DANGER",
        relatedLeaveRequest: leaveRequest._id,
      }], { session });

      // Create audit trail
      await AuditTrail.create([{
        action: "HR Override - Leave Rejected",
        category: "LEAVE",
        performedBy: req.user._id,
        performedByName: req.user.name,
        performedByRole: req.user.role,
        target: `${employee.name}'s ${leaveType.name} (${totalDays} days)`,
        targetId: leaveRequest._id,
        targetModel: "LeaveRequest",
        metadata: {
          previousStatus,
          newStatus: "REJECTED",
          days: totalDays.toString(),
          reason: comment.trim(),
          hrOverride: "true"
        },
        severity: "MEDIUM",
      }], { session });
    }

    // Commit transaction - CRITICAL
    await session.commitTransaction();
    session.endSession();

    // Fetch updated employee balances
    const updatedEmployee = await User.findById(employee._id)
      .select("leaveBalances")
      .lean();

    // Return success response - CRITICAL
    return res.status(200).json({
      success: true,
      message: `Leave request ${status.toLowerCase()} successfully via HR override`,
      data: {
        leaveRequest: {
          _id: leaveRequest._id,
          status: leaveRequest.status,
          employee: {
            _id: employee._id,
            name: employee.name,
            email: employee.email
          },
          leaveType: {
            _id: leaveType._id,
            name: leaveType.name,
            code: leaveType.code
          },
          totalDays: leaveRequest.totalDays,
          fromDate: leaveRequest.fromDate,
          toDate: leaveRequest.toDate,
          approvalHistory: leaveRequest.approvalHistory
        },
        updatedBalances: updatedEmployee.leaveBalances
      }
    });

  } catch (error) {
    // Abort transaction on error
    if (session) {
      try {
        await session.abortTransaction();
        session.endSession();
      } catch (abortError) {
        console.error("Error aborting transaction:", abortError);
      }
    }

    console.error("HR Override Error:", error);

    // Return error response - CRITICAL
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process HR override",
      error: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};
