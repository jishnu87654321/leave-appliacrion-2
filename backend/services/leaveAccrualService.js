const User = require("../models/User");
const LeaveType = require("../models/LeaveType");
const LeaveBalance = require("../models/LeaveBalance");
const LeaveAccrualLedger = require("../models/LeaveAccrualLedger");
const LeaveCreditLog = require("../models/LeaveCreditLog");
const POLICY = require("../config/policy");
const { canonicalRole } = require("../utils/roles");
const logger = require("../utils/logger");
const mongoose = require("mongoose");

function toDatePartsInTimezone(date, timezone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
  };
}

function getJoinDate(user) {
  const raw = user.joinDate || user.joiningDate || user.joining_date || null;
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function isJoinMonthAfter15th(joinDate, year, month, timezone) {
  if (!joinDate) return false;
  const parts = toDatePartsInTimezone(joinDate, timezone);
  return (
    parts.year === year &&
    parts.month === month &&
    parts.day > 15
  );
}

function determineMonthlyAccrual(user, leaveCode, { year, month, timezone }) {
  const joinDate = getJoinDate(user);
  if (!joinDate) {
    return { amount: 0, skip: true, reason: "MISSING_JOIN_DATE" };
  }

  const isIntern = canonicalRole(user.role) === "INTERN";
  const joinAfter15th = isJoinMonthAfter15th(joinDate, year, month, timezone);

  if (leaveCode === "EL") {
    if (joinAfter15th) return { amount: POLICY.JOINING_MONTH_AFTER_15TH.earnedAccrual, skip: false };
    return {
      amount: isIntern ? POLICY.INTERN.earnedAccrualPerMonth : POLICY.LEAVE_TYPES.EARNED.accrualRate,
      skip: false,
    };
  }

  if (leaveCode === "SL") {
    if (joinAfter15th) return { amount: POLICY.JOINING_MONTH_AFTER_15TH.sickAccrual, skip: false };
    return {
      amount: isIntern ? POLICY.INTERN.sickAccrualPerMonth : POLICY.LEAVE_TYPES.SICK.accrualRate,
      skip: false,
    };
  }

  return { amount: 0, skip: false };
}

function applyMaxBalance(leaveCode, nextBalance) {
  if (leaveCode === "EL") return Math.min(nextBalance, POLICY.LEAVE_TYPES.EARNED.maxBalance);
  if (leaveCode === "SL") return Math.min(nextBalance, POLICY.LEAVE_TYPES.SICK.maxBalance);
  return nextBalance;
}

async function processMonthlyAccrual({ runDate = new Date(), source = "MONTHLY_JOB" } = {}) {
  const timezone = process.env.ORG_TIMEZONE || "Asia/Kolkata";
  const parts = toDatePartsInTimezone(runDate, timezone);
  const year = parts.year;
  const month = parts.month;
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;

  const [users, leaveTypes] = await Promise.all([
    User.find({ isActive: true }),
    LeaveType.find({ isActive: true }),
  ]);

  const leaveTypeMap = new Map();
  for (const lt of leaveTypes) {
    const code = String(lt.code || "").trim().toUpperCase();
    if (code === "EL" || code === "SL") {
      leaveTypeMap.set(code, lt);
    }
  }

  // Backward-compatible fallback for legacy data where code casing/values drifted.
  if (!leaveTypeMap.get("EL")) {
    const earned = leaveTypes.find((lt) => /earned/i.test(String(lt.name || "")));
    if (earned) leaveTypeMap.set("EL", earned);
  }
  if (!leaveTypeMap.get("SL")) {
    const sick = leaveTypes.find((lt) => /sick/i.test(String(lt.name || "")));
    if (sick) leaveTypeMap.set("SL", sick);
  }
  let creditedEntries = 0;
  let creditedUsers = 0;
  let skippedMissingJoinDate = 0;
  let skippedAlreadyCredited = 0;

  for (const user of users) {
    const joinDate = getJoinDate(user);
    if (!joinDate) {
      skippedMissingJoinDate += 1;
      logger.warn(`Skipping monthly credit for user ${user.email || user._id}: missing joining date`);
      continue;
    }

    const existingCreditLog = await LeaveCreditLog.findOne({ userId: user._id, month: monthKey });
    if (existingCreditLog) {
      skippedAlreadyCredited += 1;
      continue;
    }

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const lockLog = await LeaveCreditLog.findOne({ userId: user._id, month: monthKey }).session(session);
        if (lockLog) {
          skippedAlreadyCredited += 1;
          return;
        }

        let earnedAdded = 0;
        let sickAdded = 0;

        for (const leaveCode of ["EL", "SL"]) {
          const leaveType = leaveTypeMap.get(leaveCode);
          if (!leaveType) continue;

          const accrual = determineMonthlyAccrual(user, leaveCode, { year, month, timezone });
          if (accrual.skip) {
            continue;
          }
          const amount = accrual.amount;
          if (amount <= 0) continue;

          const balanceIndex = user.leaveBalances.findIndex(
            (b) => b.leaveTypeId.toString() === leaveType._id.toString()
          );

          let nextBalance = 0;
          let used = 0;
          let pending = 0;

          if (balanceIndex >= 0) {
            const current = user.leaveBalances[balanceIndex].balance || 0;
            used = user.leaveBalances[balanceIndex].used || 0;
            pending = user.leaveBalances[balanceIndex].pending || 0;
            nextBalance = applyMaxBalance(leaveCode, current + amount);
            user.leaveBalances[balanceIndex].balance = nextBalance;
          } else {
            nextBalance = applyMaxBalance(leaveCode, amount);
            user.leaveBalances.push({
              leaveTypeId: leaveType._id,
              balance: nextBalance,
              used: 0,
              pending: 0,
            });
          }

          await LeaveBalance.findOneAndUpdate(
            { userId: user._id, leaveTypeId: leaveType._id },
            {
              $set: {
                balance: nextBalance,
                used,
                pending,
                ...(leaveCode === "EL" ? { earned_leave: nextBalance } : {}),
                ...(leaveCode === "SL" ? { sick_leave: nextBalance } : {}),
                updated_at: new Date(),
              },
            },
            { upsert: true, new: true, session }
          );

          await LeaveAccrualLedger.create(
            [
              {
                userId: user._id,
                leaveTypeId: leaveType._id,
                month,
                year,
                amount,
                source,
                notes: `Monthly accrual for ${monthKey}`,
              },
            ],
            { session }
          );

          if (leaveCode === "EL") earnedAdded += amount;
          if (leaveCode === "SL") sickAdded += amount;
          creditedEntries += 1;
        }

        await user.save({ session });

        await LeaveCreditLog.create(
          [
            {
              userId: user._id,
              month: monthKey,
              creditedAt: new Date(),
              earnedAdded,
              sickAdded,
              role: canonicalRole(user.role),
              joinDate,
              source,
            },
          ],
          { session }
        );

        creditedUsers += 1;
      });
    } catch (error) {
      if (error?.code === 11000) {
        skippedAlreadyCredited += 1;
      } else {
        throw error;
      }
    } finally {
      await session.endSession();
    }
  }

  logger.info(
    `Monthly accrual processed for ${monthKey}. Users credited: ${creditedUsers}, ledger entries: ${creditedEntries}, skipped missing join date: ${skippedMissingJoinDate}, already credited: ${skippedAlreadyCredited}`
  );
  return {
    year,
    month,
    monthKey,
    creditedUsers,
    creditedEntries,
    skippedMissingJoinDate,
    skippedAlreadyCredited,
    timezone,
  };
}

async function creditMonthlyLeaves(options = {}) {
  return processMonthlyAccrual(options);
}

module.exports = {
  processMonthlyAccrual,
  creditMonthlyLeaves,
  determineMonthlyAccrual,
  applyMaxBalance,
  getJoinDate,
  isJoinMonthAfter15th,
  toDatePartsInTimezone,
};
