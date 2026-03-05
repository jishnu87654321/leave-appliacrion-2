require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const LeaveType = require("../models/LeaveType");
const LeaveRequest = require("../models/LeaveRequest");
const POLICY = require("../config/policy");

async function upsertEarnedAndSick() {
  const earned = await LeaveType.findOneAndUpdate(
    { code: "EL" },
    {
      $set: {
        name: "Earned Leave",
        code: "EL",
        description: "Accrued monthly leave for planned time off",
        accrualType: "MONTHLY",
        accrualRate: POLICY.LEAVE_TYPES.EARNED.accrualRate,
        accrualPerMonth: POLICY.LEAVE_TYPES.EARNED.accrualRate,
        yearlyTotal: POLICY.LEAVE_TYPES.EARNED.annualEntitlement,
        carryForwardLimit: POLICY.LEAVE_TYPES.EARNED.carryForwardLimit,
        maxConsecutiveDays: POLICY.LEAVE_TYPES.EARNED.maxConsecutiveDays,
        isActive: true,
      },
      $setOnInsert: {
        color: "#10B981",
        allowNegativeBalance: false,
        applicableDuringProbation: true,
        requiresDocument: false,
      },
    },
    { upsert: true, new: true }
  );

  const sick = await LeaveType.findOneAndUpdate(
    { code: "SL" },
    {
      $set: {
        name: "Sick Leave",
        accrualType: "MONTHLY",
        accrualRate: POLICY.LEAVE_TYPES.SICK.accrualRate,
        accrualPerMonth: POLICY.LEAVE_TYPES.SICK.accrualRate,
        yearlyTotal: POLICY.LEAVE_TYPES.SICK.annualEntitlement,
        isActive: true,
      },
      $setOnInsert: {
        color: "#EF4444",
        description: "For medical reasons",
        carryForwardLimit: 0,
        allowNegativeBalance: false,
        applicableDuringProbation: true,
        maxConsecutiveDays: 10,
        requiresDocument: false,
      },
    },
    { upsert: true, new: true }
  );

  return { earned, sick };
}

async function disableCasualLeave() {
  const casual = await LeaveType.findOneAndUpdate(
    { code: "CL" },
    {
      $set: {
        name: "Casual Leave",
        description: "Legacy leave type. Disabled for new requests.",
        isActive: false,
      },
    },
    { new: true }
  );
  return casual;
}

async function run() {
  await connectDB();

  const { earned, sick } = await upsertEarnedAndSick();
  const casual = await disableCasualLeave();

  const legacyCasualRequests = await LeaveRequest.countDocuments({ leaveType: casual?._id });
  const pendingCasualRequests = await LeaveRequest.countDocuments({
    leaveType: casual?._id,
    status: "PENDING",
  });

  console.log("Legacy leave policy migration complete:");
  console.log(`- EL: ${earned._id} (15/year, carry forward 30)`);
  console.log(`- SL: ${sick._id} (12/year)`);
  console.log(`- CL active: ${casual ? casual.isActive : "not found"}`);
  console.log(`- Historical CL requests preserved: ${legacyCasualRequests}`);
  console.log(`- Pending CL requests preserved: ${pendingCasualRequests}`);

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error("Legacy leave migration failed:", err);
  await mongoose.disconnect();
  process.exit(1);
});
