require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const LeaveType = require("../models/LeaveType");
const LeaveRequest = require("../models/LeaveRequest");
const Notification = require("../models/Notification");
const AuditTrail = require("../models/AuditTrail");
const { initializeUserBalances } = require("../services/leaveBalanceService");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/leave_management");
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      LeaveType.deleteMany({}),
      LeaveRequest.deleteMany({}),
      Notification.deleteMany({}),
      AuditTrail.deleteMany({}),
    ]);
    console.log("🗑️  Cleared existing data");

    // Create Leave Types
    const leaveTypes = await LeaveType.insertMany([
      {
        name: "Earned Leave",
        code: "EL",
        color: "#10B981",
        description: "Accrued monthly leave for planned time off.",
        accrualType: "MONTHLY",
        accrualRate: 1.25,
        accrualPerMonth: 1.25,
        yearlyTotal: 15,
        carryForwardLimit: 30,
        allowNegativeBalance: false,
        applicableDuringProbation: true,
        maxConsecutiveDays: 30,
        requiresDocument: false,
      },
      {
        name: "Sick Leave",
        code: "SL",
        color: "#EF4444",
        description: "For medical reasons",
        accrualType: "MONTHLY",
        accrualRate: 1,
        accrualPerMonth: 1,
        yearlyTotal: 12,
        carryForwardLimit: 0,
        allowNegativeBalance: false,
        applicableDuringProbation: true,
        maxConsecutiveDays: 10,
        requiresDocument: true,
        documentRequiredAfterDays: 3,
      },
      {
        name: "Casual Leave",
        code: "CL",
        color: "#3B82F6",
        description: "Legacy leave type. Disabled for new requests.",
        accrualType: "NONE",
        accrualRate: 0,
        accrualPerMonth: 0,
        yearlyTotal: 0,
        carryForwardLimit: 0,
        allowNegativeBalance: false,
        applicableDuringProbation: true,
        maxConsecutiveDays: 5,
        requiresDocument: false,
        isActive: false,
      },
      {
        name: "Work From Home",
        code: "WFH",
        color: "#8B5CF6",
        description: "Remote work day",
        accrualType: "MONTHLY",
        accrualRate: 4,
        carryForwardLimit: 0,
        allowNegativeBalance: false,
        applicableDuringProbation: true,
        maxConsecutiveDays: 5,
        requiresDocument: false,
      },
    ]);
    console.log(`✅ Created ${leaveTypes.length} leave types`);

    console.log("\n🎉 Seed data created successfully!\n");
    console.log("📧 System is ready. Register your first HR Admin user through the registration page.");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
};

connectDB().then(seedData);
