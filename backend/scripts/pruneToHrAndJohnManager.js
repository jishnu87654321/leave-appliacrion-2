require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const User = require("../models/User");
const LeaveRequest = require("../models/LeaveRequest");
const Notification = require("../models/Notification");
const AuditTrail = require("../models/AuditTrail");
const Manager = require("../models/Manager");
const LeaveBalance = require("../models/LeaveBalance");
const LeaveAccrualLedger = require("../models/LeaveAccrualLedger");
const LeaveCreditLog = require("../models/LeaveCreditLog");
const DepartmentChangeRequest = require("../models/DepartmentChangeRequest");
const NotificationLog = require("../models/NotificationLog");

async function run() {
  await connectDB();

  const keepEmails = ["hradmin@gmail.com", "johnmanager@gmail.com"];
  const keepUsers = await User.find({
    email: { $in: keepEmails },
  }).select("_id name email role");

  if (keepUsers.length === 0) {
    throw new Error("No keep users found. Aborting to avoid deleting everything by mistake.");
  }

  const keepIds = keepUsers.map((u) => u._id);
  console.log("Keeping users:");
  keepUsers.forEach((u) => console.log(` - ${u.name} <${u.email}> (${u.role})`));

  const deleted = {};

  deleted.leaveRequests = (await LeaveRequest.deleteMany({ employee: { $nin: keepIds } })).deletedCount || 0;
  deleted.notifications = (await Notification.deleteMany({ user: { $nin: keepIds } })).deletedCount || 0;
  deleted.auditTrail = (await AuditTrail.deleteMany({ performedBy: { $nin: keepIds } })).deletedCount || 0;
  deleted.managers = (await Manager.deleteMany({ userId: { $nin: keepIds } })).deletedCount || 0;
  deleted.leaveBalances = (await LeaveBalance.deleteMany({ userId: { $nin: keepIds } })).deletedCount || 0;
  deleted.accrualLedger = (await LeaveAccrualLedger.deleteMany({ userId: { $nin: keepIds } })).deletedCount || 0;
  deleted.creditLogs = (await LeaveCreditLog.deleteMany({ userId: { $nin: keepIds } })).deletedCount || 0;
  deleted.departmentChanges = (
    await DepartmentChangeRequest.deleteMany({
      $and: [{ userId: { $nin: keepIds } }, { requestedBy: { $nin: keepIds } }, { confirmedBy: { $nin: keepIds } }],
    })
  ).deletedCount || 0;
  deleted.notificationLogs = (await NotificationLog.deleteMany({ recipientUserId: { $nin: keepIds } })).deletedCount || 0;
  deleted.users = (await User.deleteMany({ _id: { $nin: keepIds } })).deletedCount || 0;

  await User.updateMany(
    { _id: { $in: keepIds } },
    {
      $pull: {
        leaveBalances: { leaveTypeId: { $exists: false } },
      },
      $set: {
        managerId: null,
      },
    }
  );

  const remainingUsers = await User.find({ _id: { $in: keepIds } }).select("name email role");
  console.log("\nDeleted counts:");
  Object.entries(deleted).forEach(([k, v]) => console.log(` - ${k}: ${v}`));

  console.log("\nRemaining users:");
  remainingUsers.forEach((u) => console.log(` - ${u.name} <${u.email}> (${u.role})`));

  await mongoose.disconnect();
}

run()
  .then(() => {
    console.log("\nPrune complete.");
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("\nPrune failed:", err.message);
    await mongoose.disconnect();
    process.exit(1);
  });

