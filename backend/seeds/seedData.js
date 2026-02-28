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
        name: "Casual Leave",
        code: "CL",
        color: "#3B82F6",
        description: "For personal matters and short breaks",
        accrualType: "YEARLY",
        accrualRate: 12,
        carryForwardLimit: 5,
        allowNegativeBalance: false,
        applicableDuringProbation: true,
        maxConsecutiveDays: 5,
        requiresDocument: false,
      },
      {
        name: "Sick Leave",
        code: "SL",
        color: "#EF4444",
        description: "For medical reasons",
        accrualType: "YEARLY",
        accrualRate: 10,
        carryForwardLimit: 3,
        allowNegativeBalance: false,
        applicableDuringProbation: true,
        maxConsecutiveDays: 7,
        requiresDocument: true,
        documentRequiredAfterDays: 3,
      },
      {
        name: "Earned Leave",
        code: "EL",
        color: "#10B981",
        description: "Paid leave earned through service",
        accrualType: "MONTHLY",
        accrualRate: 1.5,
        carryForwardLimit: 15,
        allowNegativeBalance: false,
        applicableDuringProbation: false,
        maxConsecutiveDays: 30,
        requiresDocument: false,
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
