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
    // Get base URI and replace database name with 'leavedatabase'
    let uri = process.env.MONGODB_URI || "mongodb://localhost:27017/";
    
    // Remove any existing database name and add 'leavedatabase'
    if (uri.endsWith('/')) {
      uri = uri + 'leavedatabase';
    } else {
      // Remove existing database name
      const lastSlash = uri.lastIndexOf('/');
      uri = uri.substring(0, lastSlash + 1) + 'leavedatabase';
    }
    
    await mongoose.connect(uri);
    console.log("✅ MongoDB Connected to: leavedatabase");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

const seedLeaveDatabase = async () => {
  try {
    console.log("\n🌱 Seeding Leave Management Database...\n");
    
    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      LeaveType.deleteMany({}),
      LeaveRequest.deleteMany({}),
      Notification.deleteMany({}),
      AuditTrail.deleteMany({}),
    ]);
    console.log("🗑️  Cleared existing data");

    // ═══════════════════════════════════════════════════════════
    // 1. CREATE LEAVE TYPES
    // ═══════════════════════════════════════════════════════════
    console.log("\n📋 Creating Leave Types...");
    const leaveTypes = await LeaveType.insertMany([
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
        requiresApproval: true,
        minNoticeDays: 1,
        excludeWeekends: true,
        excludePublicHolidays: true,
        isActive: false,
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
        maxConsecutiveDays: 7,
        requiresDocument: true,
        documentRequiredAfterDays: 3,
        requiresApproval: true,
        minNoticeDays: 0,
        excludeWeekends: true,
        excludePublicHolidays: true,
        isActive: true,
      },
      {
        name: "Earned Leave",
        code: "EL",
        color: "#10B981",
        description: "Paid leave earned through service",
        accrualType: "MONTHLY",
        accrualRate: 1.25,
        accrualPerMonth: 1.25,
        yearlyTotal: 15,
        carryForwardLimit: 30,
        allowNegativeBalance: false,
        applicableDuringProbation: false,
        maxConsecutiveDays: 30,
        requiresDocument: false,
        requiresApproval: true,
        minNoticeDays: 7,
        excludeWeekends: true,
        excludePublicHolidays: true,
        isActive: true,
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
        requiresApproval: true,
        minNoticeDays: 1,
        excludeWeekends: false,
        excludePublicHolidays: false,
        isActive: true,
      },
    ]);
    console.log(`✅ Created ${leaveTypes.length} leave types`);

    // ═══════════════════════════════════════════════════════════
    // 2. CREATE HR ADMIN
    // ═══════════════════════════════════════════════════════════
    console.log("\n👤 Creating HR Admin...");
    const hrAdmin = await User.create({
      name: "HR Admin",
      email: "hradmin@gmail.com",
      password: "password123",
      role: "HR_ADMIN",
      department: "Human Resources",
      designation: "HR Manager",
      phone: "+1234567890",
      isActive: true,
      probationStatus: false,
      joinDate: new Date("2024-01-01"),
    });
    await initializeUserBalances(hrAdmin._id);
    console.log("✅ Created HR Admin with initialized balances");

    // ═══════════════════════════════════════════════════════════
    // 3. CREATE MANAGERS
    // ═══════════════════════════════════════════════════════════
    console.log("\n👥 Creating Managers...");
    const manager1 = await User.create({
      name: "John Manager",
      email: "johnmanager@gmail.com",
      password: "password123",
      role: "MANAGER",
      department: "Engineering",
      designation: "Engineering Manager",
      phone: "+1234567891",
      isActive: true,
      probationStatus: false,
      joinDate: new Date("2024-03-01"),
    });
    await initializeUserBalances(manager1._id);

    const manager2 = await User.create({
      name: "Sarah Manager",
      email: "sarahmanager@gmail.com",
      password: "password123",
      role: "MANAGER",
      department: "Marketing",
      designation: "Marketing Manager",
      phone: "+1234567892",
      isActive: true,
      probationStatus: false,
      joinDate: new Date("2024-02-15"),
    });
    await initializeUserBalances(manager2._id);
    console.log("✅ Created 2 Managers with initialized balances");

    // ═══════════════════════════════════════════════════════════
    // 4. CREATE EMPLOYEES
    // ═══════════════════════════════════════════════════════════
    console.log("\n👨‍💼 Creating Employees...");
    
    const alice = await User.create({
      name: "Alice Developer",
      email: "alicedev@gmail.com",
      password: "password123",
      role: "EMPLOYEE",
      department: "Engineering",
      designation: "Senior Developer",
      managerId: manager1._id,
      phone: "+1234567893",
      isActive: true,
      probationStatus: false,
      joinDate: new Date("2023-06-01"),
    });
    await initializeUserBalances(alice._id);

    const bob = await User.create({
      name: "Bob Engineer",
      email: "bobengineer@gmail.com",
      password: "password123",
      role: "EMPLOYEE",
      department: "Engineering",
      designation: "Software Engineer",
      managerId: manager1._id,
      phone: "+1234567894",
      isActive: true,
      probationStatus: true,
      probationEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      joinDate: new Date("2025-12-01"),
    });
    await initializeUserBalances(bob._id);

    const carol = await User.create({
      name: "Carol Designer",
      email: "caroldesigner@gmail.com",
      password: "password123",
      role: "EMPLOYEE",
      department: "Marketing",
      designation: "UI/UX Designer",
      managerId: manager2._id,
      phone: "+1234567895",
      isActive: true,
      probationStatus: false,
      joinDate: new Date("2024-01-15"),
    });
    await initializeUserBalances(carol._id);

    const david = await User.create({
      name: "David Analyst",
      email: "davidanalyst@gmail.com",
      password: "password123",
      role: "EMPLOYEE",
      department: "Marketing",
      designation: "Marketing Analyst",
      managerId: manager2._id,
      phone: "+1234567896",
      isActive: true,
      probationStatus: false,
      joinDate: new Date("2024-04-01"),
    });
    await initializeUserBalances(david._id);

    const employees = [alice, bob, carol, david];
    console.log(`✅ Created ${employees.length} employees with initialized balances`);

    // ═══════════════════════════════════════════════════════════
    // 5. CREATE LEAVE REQUESTS
    // ═══════════════════════════════════════════════════════════
    console.log("\n📝 Creating Leave Requests...");
    
    const casualLeave = leaveTypes.find(lt => lt.code === "CL");
    const sickLeave = leaveTypes.find(lt => lt.code === "SL");
    const earnedLeave = leaveTypes.find(lt => lt.code === "EL");

    await LeaveRequest.insertMany([
      {
        employee: alice._id,
        leaveType: casualLeave._id,
        fromDate: new Date("2026-03-10"),
        toDate: new Date("2026-03-12"),
        totalDays: 3,
        halfDay: false,
        reason: "Family function to attend",
        status: "APPROVED",
        appliedBalanceBefore: 12,
        approvalHistory: [{
          level: 1,
          approverId: manager1._id,
          approverName: manager1.name,
          approverRole: "MANAGER",
          status: "APPROVED",
          comment: "Approved. Enjoy!",
          actionDate: new Date(),
        }],
      },
      {
        employee: bob._id,
        leaveType: casualLeave._id,
        fromDate: new Date("2026-03-15"),
        toDate: new Date("2026-03-15"),
        totalDays: 1,
        halfDay: false,
        reason: "Personal work to complete",
        status: "PENDING",
        appliedBalanceBefore: 12,
      },
      {
        employee: carol._id,
        leaveType: sickLeave._id,
        fromDate: new Date("2026-02-20"),
        toDate: new Date("2026-02-21"),
        totalDays: 2,
        halfDay: false,
        reason: "Fever and cold symptoms",
        status: "APPROVED",
        appliedBalanceBefore: 10,
        approvalHistory: [{
          level: 1,
          approverId: manager2._id,
          approverName: manager2.name,
          approverRole: "MANAGER",
          status: "APPROVED",
          comment: "Get well soon!",
          actionDate: new Date(),
        }],
      },
      {
        employee: david._id,
        leaveType: earnedLeave._id,
        fromDate: new Date("2026-04-01"),
        toDate: new Date("2026-04-05"),
        totalDays: 5,
        halfDay: false,
        reason: "Vacation trip planned",
        status: "PENDING",
        appliedBalanceBefore: 16.5,
      },
      {
        employee: alice._id,
        leaveType: sickLeave._id,
        fromDate: new Date("2026-02-10"),
        toDate: new Date("2026-02-10"),
        totalDays: 1,
        halfDay: true,
        reason: "Doctor appointment",
        status: "REJECTED",
        appliedBalanceBefore: 10,
        approvalHistory: [{
          level: 1,
          approverId: manager1._id,
          approverName: manager1.name,
          approverRole: "MANAGER",
          status: "REJECTED",
          comment: "Please use WFH for half day appointments",
          actionDate: new Date(),
        }],
      },
    ]);
    console.log("✅ Created 5 sample leave requests");

    // ═══════════════════════════════════════════════════════════
    // 6. CREATE NOTIFICATIONS
    // ═══════════════════════════════════════════════════════════
    console.log("\n🔔 Creating Notifications...");
    
    await Notification.insertMany([
      {
        user: manager1._id,
        message: `${bob.name} applied for Casual Leave (1 day). Action required.`,
        type: "WARNING",
        isRead: false,
      },
      {
        user: manager2._id,
        message: `${david.name} applied for Earned Leave (5 days). Action required.`,
        type: "WARNING",
        isRead: false,
      },
      {
        user: alice._id,
        message: `Your Casual Leave request has been approved by ${manager1.name}.`,
        type: "SUCCESS",
        isRead: false,
      },
      {
        user: carol._id,
        message: `Your Sick Leave request has been approved by ${manager2.name}.`,
        type: "SUCCESS",
        isRead: true,
      },
      {
        user: alice._id,
        message: `Your Sick Leave request has been rejected by ${manager1.name}.`,
        type: "DANGER",
        isRead: false,
      },
      {
        user: hrAdmin._id,
        message: `System initialized successfully. All users have been assigned leave balances.`,
        type: "INFO",
        isRead: true,
      },
    ]);
    console.log("✅ Created 6 notifications");

    // ═══════════════════════════════════════════════════════════
    // 7. CREATE AUDIT TRAIL
    // ═══════════════════════════════════════════════════════════
    console.log("\n📊 Creating Audit Trail...");
    
    await AuditTrail.insertMany([
      {
        action: "User Created",
        category: "USER",
        performedBy: hrAdmin._id,
        performedByName: hrAdmin.name,
        performedByRole: "HR_ADMIN",
        target: `${alice.name} (${alice.email})`,
        targetId: alice._id,
        targetModel: "User",
        metadata: { role: "EMPLOYEE", department: "Engineering" },
        severity: "LOW",
      },
      {
        action: "Leave Request Approved",
        category: "LEAVE",
        performedBy: manager1._id,
        performedByName: manager1.name,
        performedByRole: "MANAGER",
        target: `Casual Leave - ${alice.name}`,
        targetId: alice._id,
        targetModel: "LeaveRequest",
        metadata: { days: 3, leaveType: "CL" },
        severity: "MEDIUM",
      },
      {
        action: "Leave Request Rejected",
        category: "LEAVE",
        performedBy: manager1._id,
        performedByName: manager1.name,
        performedByRole: "MANAGER",
        target: `Sick Leave - ${alice.name}`,
        targetId: alice._id,
        targetModel: "LeaveRequest",
        metadata: { days: 0.5, leaveType: "SL", reason: "Use WFH instead" },
        severity: "MEDIUM",
      },
      {
        action: "Leave Type Created",
        category: "POLICY",
        performedBy: hrAdmin._id,
        performedByName: hrAdmin.name,
        performedByRole: "HR_ADMIN",
        target: "Casual Leave (CL)",
        targetId: casualLeave._id,
        targetModel: "LeaveType",
        metadata: { accrualRate: 12, accrualType: "YEARLY" },
        severity: "HIGH",
      },
    ]);
    console.log("✅ Created 4 audit trail entries");

    // ═══════════════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════════════
    console.log("\n" + "═".repeat(60));
    console.log("🎉 Database 'leavedatabase' seeded successfully!");
    console.log("═".repeat(60));
    
    console.log("\n📊 Summary:");
    console.log(`   ✅ ${leaveTypes.length} Leave Types`);
    console.log(`   ✅ 7 Users (1 HR Admin, 2 Managers, 4 Employees)`);
    console.log(`   ✅ 5 Leave Requests`);
    console.log(`   ✅ 6 Notifications`);
    console.log(`   ✅ 4 Audit Trail Entries`);
    
    console.log("\n📧 Login Credentials:");
    console.log("━".repeat(60));
    console.log("HR Admin:    hradmin@gmail.com / password123");
    console.log("Manager 1:   johnmanager@gmail.com / password123");
    console.log("Manager 2:   sarahmanager@gmail.com / password123");
    console.log("Employee 1:  alicedev@gmail.com / password123");
    console.log("Employee 2:  bobengineer@gmail.com / password123 (probation)");
    console.log("Employee 3:  caroldesigner@gmail.com / password123");
    console.log("Employee 4:  davidanalyst@gmail.com / password123");
    console.log("━".repeat(60));
    
    console.log("\n💡 Next Steps:");
    console.log("   1. Update backend/.env MONGODB_URI to use 'leavedatabase'");
    console.log("   2. Start backend: cd backend && npm start");
    console.log("   3. Start frontend: npm run dev");
    console.log("   4. Login with any credentials above\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
};

connectDB().then(seedLeaveDatabase);
