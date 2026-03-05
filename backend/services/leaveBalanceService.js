const User = require("../models/User");
const LeaveType = require("../models/LeaveType");
const LeaveBalance = require("../models/LeaveBalance");
const POLICY = require("../config/policy");
const { processMonthlyAccrual: processMonthlyAccrualLedger } = require("./leaveAccrualService");

async function syncLeaveBalanceDoc(userId, leaveTypeId, balanceObj) {
  await LeaveBalance.findOneAndUpdate(
    { userId, leaveTypeId },
    {
      $set: {
        balance: balanceObj.balance,
        used: balanceObj.used,
        pending: balanceObj.pending,
      },
    },
    { upsert: true, new: true }
  );
}

async function initializeUserBalances(userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const leaveTypes = await LeaveType.find({ isActive: true });
  for (const leaveType of leaveTypes) {
    if (user.probationStatus && !leaveType.applicableDuringProbation) continue;

    const existing = user.leaveBalances.find(
      (b) => b.leaveTypeId.toString() === leaveType._id.toString()
    );
    if (existing) {
      await syncLeaveBalanceDoc(user._id, leaveType._id, existing);
      continue;
    }

    user.leaveBalances.push({
      leaveTypeId: leaveType._id,
      balance: 0,
      used: 0,
      pending: 0,
    });
  }
  await user.save();

  for (const balance of user.leaveBalances) {
    await syncLeaveBalanceDoc(user._id, balance.leaveTypeId, balance);
  }
  return user.leaveBalances;
}

async function deductLeaveBalance(userId, leaveTypeId, days, session = null) {
  const user = await User.findById(userId).session(session);
  if (!user) throw new Error("User not found");

  const idx = user.leaveBalances.findIndex(
    (b) => b.leaveTypeId.toString() === leaveTypeId.toString()
  );
  if (idx === -1) throw new Error("Leave balance not found");

  user.leaveBalances[idx].balance -= days;
  user.leaveBalances[idx].used += days;
  user.leaveBalances[idx].pending = Math.max(0, user.leaveBalances[idx].pending - days);
  await user.save({ session });

  await syncLeaveBalanceDoc(user._id, leaveTypeId, user.leaveBalances[idx]);
  return user.leaveBalances[idx];
}

async function addToPending(userId, leaveTypeId, days, session = null) {
  const user = await User.findById(userId).session(session);
  if (!user) throw new Error("User not found");

  const idx = user.leaveBalances.findIndex(
    (b) => b.leaveTypeId.toString() === leaveTypeId.toString()
  );
  if (idx === -1) throw new Error("Leave balance not found");

  user.leaveBalances[idx].pending += days;
  await user.save({ session });
  await syncLeaveBalanceDoc(user._id, leaveTypeId, user.leaveBalances[idx]);
  return user.leaveBalances[idx];
}

async function releasePending(userId, leaveTypeId, days, session = null) {
  const user = await User.findById(userId).session(session);
  if (!user) throw new Error("User not found");

  const idx = user.leaveBalances.findIndex(
    (b) => b.leaveTypeId.toString() === leaveTypeId.toString()
  );
  if (idx === -1) throw new Error("Leave balance not found");

  user.leaveBalances[idx].pending = Math.max(0, user.leaveBalances[idx].pending - days);
  await user.save({ session });
  await syncLeaveBalanceDoc(user._id, leaveTypeId, user.leaveBalances[idx]);
  return user.leaveBalances[idx];
}

async function restoreBalance(userId, leaveTypeId, days, session = null) {
  const user = await User.findById(userId).session(session);
  if (!user) throw new Error("User not found");

  const idx = user.leaveBalances.findIndex(
    (b) => b.leaveTypeId.toString() === leaveTypeId.toString()
  );
  if (idx === -1) throw new Error("Leave balance not found");

  user.leaveBalances[idx].balance += days;
  user.leaveBalances[idx].used = Math.max(0, user.leaveBalances[idx].used - days);
  await user.save({ session });
  await syncLeaveBalanceDoc(user._id, leaveTypeId, user.leaveBalances[idx]);
  return user.leaveBalances[idx];
}

async function getUserBalances(userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const leaveTypeIds = user.leaveBalances.map((b) => b.leaveTypeId);
  const leaveTypes = await LeaveType.find({ _id: { $in: leaveTypeIds } });
  const balanceDocs = await LeaveBalance.find({ userId, leaveTypeId: { $in: leaveTypeIds } });
  const map = new Map(leaveTypes.map((lt) => [lt._id.toString(), lt]));
  const balanceDocMap = new Map(balanceDocs.map((doc) => [doc.leaveTypeId.toString(), doc]));

  return user.leaveBalances.map((bal) => {
    const leaveType = map.get(bal.leaveTypeId.toString());
    const balanceDoc = balanceDocMap.get(bal.leaveTypeId.toString());
    const code = leaveType?.code;
    const earnedLeave = code === "EL" ? bal.balance : (balanceDoc?.earned_leave || 0);
    const sickLeave = code === "SL" ? bal.balance : (balanceDoc?.sick_leave || 0);
    const casualLeave = code === "CL" ? bal.balance : (balanceDoc?.casual_leave || 0);
    return {
      leaveType: {
        _id: leaveType?._id,
        name: leaveType?.name,
        code: leaveType?.code,
        color: leaveType?.color,
        accrualRate: leaveType?.accrualRate,
        accrualPerMonth: leaveType?.accrualPerMonth || 0,
        yearlyTotal: leaveType?.yearlyTotal || 0,
        accrualType: leaveType?.accrualType,
        carryForwardLimit: leaveType?.carryForwardLimit || 0,
        maxConsecutiveDays: leaveType?.maxConsecutiveDays || 30,
      },
      balance: bal.balance,
      used: bal.used,
      pending: bal.pending,
      available: bal.balance - bal.pending,
      earned_leave: earnedLeave,
      sick_leave: sickLeave,
      casual_leave: casualLeave,
      earnedLeave,
      sickLeave,
      casualLeave,
    };
  });
}

async function convertCasualToEarned(userId, days) {
  return convertToEarned(userId, "CL", days);
}

async function convertToEarned(userId, sourceCode, days) {
  const safeDays = Number(days);
  if (!Number.isFinite(safeDays) || safeDays <= 0) {
    throw new Error("Invalid conversion days");
  }

  const safeSourceCode = String(sourceCode || "").trim().toUpperCase();
  const conversionLimit = POLICY.CONVERSION?.TO_EARNED?.[safeSourceCode];
  if (!conversionLimit) {
    throw new Error("Unsupported conversion source. Allowed: CL, SL");
  }

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const leaveTypes = await LeaveType.find({ code: { $in: [safeSourceCode, "EL"] } });
  const sourceType = leaveTypes.find((lt) => lt.code === safeSourceCode);
  const earnedType = leaveTypes.find((lt) => lt.code === "EL");
  if (!sourceType || !earnedType) throw new Error("Required leave types not configured");

  const sourceIdx = user.leaveBalances.findIndex(
    (b) => b.leaveTypeId.toString() === sourceType._id.toString()
  );
  const earnedIdx = user.leaveBalances.findIndex(
    (b) => b.leaveTypeId.toString() === earnedType._id.toString()
  );
  if (sourceIdx < 0 || earnedIdx < 0) throw new Error("Leave balances not initialized");

  const availableSource = user.leaveBalances[sourceIdx].balance;
  const cappedDays = Math.min(safeDays, conversionLimit);
  if (availableSource < cappedDays) {
    throw new Error(`Insufficient ${safeSourceCode} balance for conversion`);
  }

  user.leaveBalances[sourceIdx].balance -= cappedDays;
  user.leaveBalances[earnedIdx].balance += cappedDays;
  await user.save();

  await syncLeaveBalanceDoc(user._id, sourceType._id, user.leaveBalances[sourceIdx]);
  await syncLeaveBalanceDoc(user._id, earnedType._id, user.leaveBalances[earnedIdx]);

  return { convertedDays: cappedDays, sourceCode: safeSourceCode, limit: conversionLimit };
}

async function processMonthlyAccrual(options = {}) {
  return processMonthlyAccrualLedger(options);
}

module.exports = {
  initializeUserBalances,
  deductLeaveBalance,
  addToPending,
  releasePending,
  restoreBalance,
  getUserBalances,
  convertCasualToEarned,
  convertToEarned,
  processMonthlyAccrual,
};
