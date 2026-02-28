const User = require("../models/User");
const LeaveType = require("../models/LeaveType");
const logger = require("../utils/logger");

/**
 * Process monthly leave accrual for all active users
 */
exports.processMonthlyAccrual = async () => {
  try {
    const users = await User.find({ isActive: true });
    const leaveTypes = await LeaveType.find({ accrualType: "monthly" });

    for (const user of users) {
      for (const leaveType of leaveTypes) {
        // Skip if probation and not applicable
        if (user.probationStatus && !leaveType.applicableDuringProbation) continue;

        const balanceEntry = user.leaveBalances.find(b => b.leaveTypeId.toString() === leaveType._id.toString());

        if (balanceEntry) {
          balanceEntry.balance += leaveType.accrualRate;
        } else {
          user.leaveBalances.push({
            leaveTypeId: leaveType._id,
            balance: leaveType.accrualRate,
            used: 0,
            pending: 0,
          });
        }
      }
      await user.save();
    }

    logger.info(`Monthly accrual processed for ${users.length} users.`);
  } catch (error) {
    logger.error("Monthly accrual failed:", error);
    throw error;
  }
};

/**
 * Process yearly leave accrual
 */
exports.processYearlyAccrual = async () => {
  try {
    const users = await User.find({ isActive: true });
    const leaveTypes = await LeaveType.find({ accrualType: "yearly" });

    for (const user of users) {
      for (const leaveType of leaveTypes) {
        if (user.probationStatus && !leaveType.applicableDuringProbation) continue;

        const balanceEntry = user.leaveBalances.find(b => b.leaveTypeId.toString() === leaveType._id.toString());

        if (balanceEntry) {
          // Apply carry-forward limit
          const carryForward = Math.min(balanceEntry.balance, leaveType.carryForwardLimit);
          balanceEntry.balance = carryForward + leaveType.accrualRate;
          balanceEntry.used = 0;
        } else {
          user.leaveBalances.push({
            leaveTypeId: leaveType._id,
            balance: leaveType.accrualRate,
            used: 0,
            pending: 0,
          });
        }
      }
      await user.save();
    }

    logger.info(`Yearly accrual processed for ${users.length} users.`);
  } catch (error) {
    logger.error("Yearly accrual failed:", error);
    throw error;
  }
};
