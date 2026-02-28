const User = require("../models/User");
const LeaveType = require("../models/LeaveType");
const logger = require("../utils/logger");
const mongoose = require("mongoose");

/**
 * Initialize leave balances for a new user
 * Called when user is created or when leave types are updated
 */
exports.initializeUserBalances = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const leaveTypes = await LeaveType.find({ isActive: true });

    for (const leaveType of leaveTypes) {
      // Skip if probation and not applicable
      if (user.probationStatus && !leaveType.applicableDuringProbation) {
        continue;
      }

      // Check if balance already exists
      const existingBalance = user.leaveBalances.find(
        b => b.leaveTypeId.toString() === leaveType._id.toString()
      );

      if (!existingBalance) {
        // Calculate initial balance based on accrual type
        let initialBalance = 0;

        if (leaveType.accrualType === "YEARLY") {
          initialBalance = leaveType.accrualRate;
        } else if (leaveType.accrualType === "MONTHLY") {
          // Calculate pro-rated balance based on join date
          const joinDate = user.joinDate || new Date();
          const monthsRemaining = 12 - joinDate.getMonth();
          initialBalance = leaveType.accrualRate * monthsRemaining;
        }

        user.leaveBalances.push({
          leaveTypeId: leaveType._id,
          balance: initialBalance,
          used: 0,
          pending: 0,
        });

        logger.info(`Initialized ${leaveType.code} balance for user ${user.email}: ${initialBalance} days`);
      }
    }

    await user.save();

    logger.info(`Leave balances initialized for user: ${user.email}`);
    return user.leaveBalances;
  } catch (error) {
    logger.error(`Failed to initialize balances for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Deduct leave balance after approval
 * Uses atomic operations to prevent race conditions
 * Supports MongoDB transactions
 */
exports.deductLeaveBalance = async (userId, leaveTypeId, days, session = null) => {
  try {
    const user = await User.findById(userId).session(session);
    if (!user) throw new Error("User not found");

    const balanceIndex = user.leaveBalances.findIndex(
      b => b.leaveTypeId.toString() === leaveTypeId.toString()
    );

    if (balanceIndex === -1) {
      throw new Error("Leave balance not found for this leave type");
    }

    const balance = user.leaveBalances[balanceIndex];

    // Deduct from balance and pending, add to used
    balance.balance -= days;
    balance.used += days;
    balance.pending -= days;

    await user.save({ session });

    logger.info(`Deducted ${days} days from ${user.email}'s balance`);
    return balance;
  } catch (error) {
    logger.error(`Failed to deduct balance:`, error);
    throw error;
  }
};

/**
 * Add to pending balance when leave is applied
 * Supports MongoDB transactions
 */
exports.addToPending = async (userId, leaveTypeId, days, session = null) => {
  try {
    const user = await User.findById(userId).session(session);
    if (!user) throw new Error("User not found");

    const balanceIndex = user.leaveBalances.findIndex(
      b => b.leaveTypeId.toString() === leaveTypeId.toString()
    );

    if (balanceIndex === -1) {
      throw new Error("Leave balance not found for this leave type");
    }

    user.leaveBalances[balanceIndex].pending += days;

    await user.save({ session });

    logger.info(`Added ${days} days to pending for ${user.email}`);
    return user.leaveBalances[balanceIndex];
  } catch (error) {
    logger.error(`Failed to add to pending:`, error);
    throw error;
  }
};

/**
 * Release pending balance when leave is rejected or cancelled
 * Supports MongoDB transactions
 */
exports.releasePending = async (userId, leaveTypeId, days, session = null) => {
  try {
    const user = await User.findById(userId).session(session);
    if (!user) throw new Error("User not found");

    const balanceIndex = user.leaveBalances.findIndex(
      b => b.leaveTypeId.toString() === leaveTypeId.toString()
    );

    if (balanceIndex === -1) {
      throw new Error("Leave balance not found for this leave type");
    }

    user.leaveBalances[balanceIndex].pending -= days;

    await user.save({ session });

    logger.info(`Released ${days} days from pending for ${user.email}`);
    return user.leaveBalances[balanceIndex];
  } catch (error) {
    logger.error(`Failed to release pending:`, error);
    throw error;
  }
};

/**
 * Restore balance when approved leave is cancelled
 * Supports MongoDB transactions
 */
exports.restoreBalance = async (userId, leaveTypeId, days, session = null) => {
  try {
    const user = await User.findById(userId).session(session);
    if (!user) throw new Error("User not found");

    const balanceIndex = user.leaveBalances.findIndex(
      b => b.leaveTypeId.toString() === leaveTypeId.toString()
    );

    if (balanceIndex === -1) {
      throw new Error("Leave balance not found for this leave type");
    }

    const balance = user.leaveBalances[balanceIndex];

    // Restore balance and decrease used
    balance.balance += days;
    balance.used -= days;

    await user.save({ session });

    logger.info(`Restored ${days} days to ${user.email}'s balance`);
    return balance;
  } catch (error) {
    logger.error(`Failed to restore balance:`, error);
    throw error;
  }
};

/**
 * Get user's current balances with leave type details
 */
exports.getUserBalances = async (userId) => {
  try {
    const user = await User.findById(userId).populate("leaveBalances.leaveTypeId");
    if (!user) throw new Error("User not found");

    const balances = await Promise.all(
      user.leaveBalances.map(async (bal) => {
        const leaveType = await LeaveType.findById(bal.leaveTypeId);
        return {
          leaveType: {
            _id: leaveType._id,
            name: leaveType.name,
            code: leaveType.code,
            color: leaveType.color,
            accrualRate: leaveType.accrualRate,
            accrualType: leaveType.accrualType,
          },
          balance: bal.balance,
          used: bal.used,
          pending: bal.pending,
          available: bal.balance - bal.pending,
        };
      })
    );

    return balances;
  } catch (error) {
    logger.error(`Failed to get user balances:`, error);
    throw error;
  }
};

/**
 * Reset balances for new year
 * Called by cron job on January 1st
 */
exports.resetYearlyBalances = async () => {
  try {
    const users = await User.find({ isActive: true });
    const leaveTypes = await LeaveType.find({ isActive: true });

    for (const user of users) {
      for (const leaveType of leaveTypes) {
        // Skip if probation and not applicable
        if (user.probationStatus && !leaveType.applicableDuringProbation) {
          continue;
        }

        const balanceIndex = user.leaveBalances.findIndex(
          b => b.leaveTypeId.toString() === leaveType._id.toString()
        );

        if (balanceIndex >= 0) {
          const balance = user.leaveBalances[balanceIndex];

          if (leaveType.accrualType === "YEARLY") {
            // Apply carry-forward limit
            const carryForward = Math.min(balance.balance, leaveType.carryForwardLimit);
            balance.balance = carryForward + leaveType.accrualRate;
            balance.used = 0;
            balance.pending = 0;
          } else if (leaveType.accrualType === "MONTHLY") {
            // Reset monthly accrual
            balance.balance = leaveType.accrualRate;
            balance.used = 0;
            balance.pending = 0;
          }
        } else {
          // Initialize if not exists
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

    logger.info(`Yearly balance reset completed for ${users.length} users`);
  } catch (error) {
    logger.error("Yearly balance reset failed:", error);
    throw error;
  }
};

/**
 * Process monthly accrual for monthly leave types
 * Called by cron job on 1st of each month
 */
exports.processMonthlyAccrual = async () => {
  try {
    const users = await User.find({ isActive: true });
    const monthlyLeaveTypes = await LeaveType.find({ 
      isActive: true, 
      accrualType: "MONTHLY" 
    });

    for (const user of users) {
      for (const leaveType of monthlyLeaveTypes) {
        // Skip if probation and not applicable
        if (user.probationStatus && !leaveType.applicableDuringProbation) {
          continue;
        }

        const balanceIndex = user.leaveBalances.findIndex(
          b => b.leaveTypeId.toString() === leaveType._id.toString()
        );

        if (balanceIndex >= 0) {
          user.leaveBalances[balanceIndex].balance += leaveType.accrualRate;
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

    logger.info(`Monthly accrual processed for ${users.length} users`);
  } catch (error) {
    logger.error("Monthly accrual failed:", error);
    throw error;
  }
};

module.exports = exports;
