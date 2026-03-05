const path = require("path");
const { createRequire } = require("module");

const rootDir = path.resolve(__dirname, "..");
const backendDir = path.join(rootDir, "backend");
const backendRequire = createRequire(path.join(backendDir, "package.json"));
const dotenv = backendRequire("dotenv");
const mongoose = backendRequire("mongoose");

dotenv.config({ path: path.join(rootDir, ".env") });
dotenv.config({ path: path.join(backendDir, ".env") });

const User = require(path.join(backendDir, "models", "User"));
const LeaveType = require(path.join(backendDir, "models", "LeaveType"));
const LeaveRequest = require(path.join(backendDir, "models", "LeaveRequest"));
const LeaveBalance = require(path.join(backendDir, "models", "LeaveBalance"));
const LeaveCreditLog = require(path.join(backendDir, "models", "LeaveCreditLog"));

const OPTIONAL_MODELS = [
  "Notification",
  "NotificationLog",
  "AuditTrail",
  "LeaveAccrualLedger",
];

function getCurrentMonthDates() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const join10 = new Date(year, month, 10);
  const join20 = new Date(year, month, 20);
  return { firstDay, join10, join20, year, month };
}

async function connectTestDb() {
  const uri = process.env.MONGODB_URI_TEST;
  if (!uri) {
    throw new Error("MONGODB_URI_TEST is required for qa/seed.cjs");
  }
  if (!/test/i.test(uri) && process.env.QA_ALLOW_NON_TEST_DB !== "true") {
    throw new Error("Refusing to seed non-test database. Set QA_ALLOW_NON_TEST_DB=true to override.");
  }

  if (mongoose.connection.readyState === 1) {
    return uri;
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
  return uri;
}

async function clearCollections() {
  await Promise.all([
    User.deleteMany({}),
    LeaveRequest.deleteMany({}),
    LeaveBalance.deleteMany({}),
    LeaveType.deleteMany({}),
    LeaveCreditLog.deleteMany({}),
  ]);

  for (const modelName of OPTIONAL_MODELS) {
    try {
      const model = require(path.join(backendDir, "models", modelName));
      await model.deleteMany({});
    } catch {
      // optional model not present in some setups
    }
  }
}

async function seedFixtures() {
  await connectTestDb();
  await clearCollections();

  const { join10, join20, firstDay } = getCurrentMonthDates();
  const password = "Password@123";

  const users = await User.create([
    {
      name: "QA Admin",
      email: "qa.admin@example.com",
      password,
      role: "ADMIN",
      department: "Administration",
      joining_date: join10,
      isActive: true,
      probationStatus: false,
    },
    {
      name: "QA HR Admin",
      email: "qa.hr@example.com",
      password,
      role: "HR",
      department: "Human Resources",
      joining_date: join10,
      isActive: true,
      probationStatus: false,
    },
    {
      name: "QA Manager",
      email: "qa.manager@example.com",
      password,
      role: "manager",
      department: "Engineering",
      joining_date: join10,
      isActive: true,
      probationStatus: false,
    },
    {
      name: "QA Employee A",
      email: "qa.employee.a@example.com",
      password,
      role: "employee",
      department: "Engineering",
      joining_date: join10,
      isActive: true,
      probationStatus: false,
    },
    {
      name: "QA Employee B",
      email: "qa.employee.b@example.com",
      password,
      role: "employee",
      department: "Engineering",
      joining_date: join20,
      isActive: true,
      probationStatus: false,
    },
    {
      name: "QA Intern",
      email: "qa.intern@example.com",
      password,
      role: "intern",
      department: "Engineering",
      joining_date: join10,
      isActive: true,
      probationStatus: false,
    },
  ]);

  const byEmail = Object.fromEntries(users.map((u) => [u.email, u]));
  const manager = byEmail["qa.manager@example.com"];
  const employeeA = byEmail["qa.employee.a@example.com"];
  const employeeB = byEmail["qa.employee.b@example.com"];
  const intern = byEmail["qa.intern@example.com"];

  employeeA.managerId = manager._id;
  employeeB.managerId = manager._id;
  intern.managerId = manager._id;
  await Promise.all([employeeA.save(), employeeB.save(), intern.save()]);

  const earned = await LeaveType.findOneAndUpdate(
    { code: "EL" },
    {
      $set: {
        name: "Earned Leave",
        code: "EL",
        description: "Accrued monthly leave for planned time off.",
        accrualType: "MONTHLY",
        accrualRate: 1.25,
        accrualPerMonth: 1.25,
        yearlyTotal: 15,
        carryForwardLimit: 30,
        maxConsecutiveDays: 30,
        allowNegativeBalance: true,
        isActive: true,
      },
    },
    { new: true, upsert: true }
  );

  const sick = await LeaveType.findOneAndUpdate(
    { code: "SL" },
    {
      $set: {
        name: "Sick Leave",
        code: "SL",
        accrualType: "MONTHLY",
        accrualRate: 1,
        accrualPerMonth: 1,
        yearlyTotal: 12,
        isActive: true,
      },
    },
    { new: true, upsert: true }
  );

  await LeaveType.findOneAndUpdate(
    { code: "CL" },
    {
      $set: {
        name: "Casual Leave",
        code: "CL",
        isActive: false,
      },
    },
    { new: true, upsert: true }
  );

  const usersFresh = await User.find({});
  for (const user of usersFresh) {
    user.leaveBalances = [
      { leaveTypeId: earned._id, balance: 0, used: 0, pending: 0 },
      { leaveTypeId: sick._id, balance: 0, used: 0, pending: 0 },
    ];
    await user.save();

    await LeaveBalance.create([
      {
        userId: user._id,
        leaveTypeId: earned._id,
        balance: 0,
        used: 0,
        pending: 0,
        earned_leave: 0,
        sick_leave: 0,
      },
      {
        userId: user._id,
        leaveTypeId: sick._id,
        balance: 0,
        used: 0,
        pending: 0,
        earned_leave: 0,
        sick_leave: 0,
      },
    ]);
  }

  return {
    users: {
      admin: await User.findOne({ email: "qa.admin@example.com" }),
      hr: await User.findOne({ email: "qa.hr@example.com" }),
      manager: await User.findOne({ email: "qa.manager@example.com" }),
      employeeA: await User.findOne({ email: "qa.employee.a@example.com" }),
      employeeB: await User.findOne({ email: "qa.employee.b@example.com" }),
      intern: await User.findOne({ email: "qa.intern@example.com" }),
    },
    leaveTypes: { EL: earned, SL: sick },
    month: { firstDay },
  };
}

if (require.main === module) {
  seedFixtures()
    .then(() => {
      console.log("QA test fixtures seeded successfully.");
      return mongoose.connection.close();
    })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("QA seed failed:", err.message);
      process.exit(1);
    });
}

module.exports = {
  seedFixtures,
  connectTestDb,
};
