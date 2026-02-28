require("dotenv").config();
const mongoose = require("mongoose");
const LeaveType = require("../models/LeaveType");

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI || "mongodb://localhost:27017/";
    if (uri.endsWith('/')) {
      uri = uri + 'leavedatabase';
    } else {
      const lastSlash = uri.lastIndexOf('/');
      uri = uri.substring(0, lastSlash + 1) + 'leavedatabase';
    }
    
    await mongoose.connect(uri);
    console.log("✅ MongoDB Connected to: leavedatabase\n");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

const addLeaveTypes = async () => {
  try {
    console.log("🌱 Adding Additional Leave Types...\n");

    const newLeaveTypes = [
      {
        name: "Maternity Leave",
        code: "ML",
        color: "#EC4899",
        description: "Leave for pregnancy and childbirth",
        accrualType: "NONE",
        accrualRate: 180,
        carryForwardLimit: 0,
        allowNegativeBalance: false,
        applicableDuringProbation: true,
        maxConsecutiveDays: 180,
        requiresDocument: true,
        documentRequiredAfterDays: 0,
        requiresApproval: true,
        minNoticeDays: 30,
        excludeWeekends: false,
        excludePublicHolidays: false,
        isActive: true,
      },
      {
        name: "Paternity Leave",
        code: "PL",
        color: "#06B6D4",
        description: "Leave for new fathers",
        accrualType: "NONE",
        accrualRate: 15,
        carryForwardLimit: 0,
        allowNegativeBalance: false,
        applicableDuringProbation: true,
        maxConsecutiveDays: 15,
        requiresDocument: true,
        documentRequiredAfterDays: 0,
        requiresApproval: true,
        minNoticeDays: 7,
        excludeWeekends: false,
        excludePublicHolidays: false,
        isActive: true,
      },
      {
        name: "Bereavement Leave",
        code: "BL",
        color: "#6B7280",
        description: "Leave for death of immediate family member",
        accrualType: "YEARLY",
        accrualRate: 5,
        carryForwardLimit: 0,
        allowNegativeBalance: false,
        applicableDuringProbation: true,
        maxConsecutiveDays: 5,
        requiresDocument: true,
        documentRequiredAfterDays: 0,
        requiresApproval: true,
        minNoticeDays: 0,
        excludeWeekends: false,
        excludePublicHolidays: false,
        isActive: true,
      },
      {
        name: "Marriage Leave",
        code: "MAL",
        color: "#F59E0B",
        description: "Leave for employee's own marriage",
        accrualType: "NONE",
        accrualRate: 7,
        carryForwardLimit: 0,
        allowNegativeBalance: false,
        applicableDuringProbation: true,
        maxConsecutiveDays: 7,
        requiresDocument: true,
        documentRequiredAfterDays: 0,
        requiresApproval: true,
        minNoticeDays: 30,
        excludeWeekends: false,
        excludePublicHolidays: false,
        isActive: true,
      },
      {
        name: "Compensatory Off",
        code: "CO",
        color: "#F97316",
        description: "Compensation for overtime or holiday work",
        accrualType: "NONE",
        accrualRate: 0,
        carryForwardLimit: 30,
        allowNegativeBalance: false,
        applicableDuringProbation: true,
        maxConsecutiveDays: 5,
        requiresDocument: false,
        requiresApproval: true,
        minNoticeDays: 1,
        excludeWeekends: true,
        excludePublicHolidays: true,
        isActive: true,
      },
      {
        name: "Study Leave",
        code: "STL",
        color: "#6366F1",
        description: "Leave for professional exams and certifications",
        accrualType: "YEARLY",
        accrualRate: 10,
        carryForwardLimit: 0,
        allowNegativeBalance: false,
        applicableDuringProbation: false,
        maxConsecutiveDays: 10,
        requiresDocument: true,
        documentRequiredAfterDays: 0,
        requiresApproval: true,
        minNoticeDays: 15,
        excludeWeekends: true,
        excludePublicHolidays: true,
        isActive: true,
      },
      {
        name: "Medical Emergency Leave",
        code: "MEL",
        color: "#DC2626",
        description: "Leave for sudden medical emergencies",
        accrualType: "YEARLY",
        accrualRate: 5,
        carryForwardLimit: 0,
        allowNegativeBalance: false,
        applicableDuringProbation: true,
        maxConsecutiveDays: 5,
        requiresDocument: true,
        documentRequiredAfterDays: 1,
        requiresApproval: true,
        minNoticeDays: 0,
        excludeWeekends: false,
        excludePublicHolidays: false,
        isActive: true,
      },
      {
        name: "Unpaid Leave",
        code: "UL",
        color: "#9CA3AF",
        description: "Extended personal time without pay",
        accrualType: "NONE",
        accrualRate: 0,
        carryForwardLimit: 0,
        allowNegativeBalance: true,
        applicableDuringProbation: true,
        maxConsecutiveDays: 30,
        requiresDocument: false,
        requiresApproval: true,
        minNoticeDays: 7,
        excludeWeekends: false,
        excludePublicHolidays: false,
        isActive: true,
      },
    ];

    // Check which leave types already exist
    const existingCodes = await LeaveType.find({}).select('code');
    const existingCodesSet = new Set(existingCodes.map(lt => lt.code));

    // Filter out leave types that already exist
    const leaveTypesToAdd = newLeaveTypes.filter(lt => !existingCodesSet.has(lt.code));

    if (leaveTypesToAdd.length === 0) {
      console.log("ℹ️  All leave types already exist in the database");
      process.exit(0);
    }

    // Insert new leave types
    const inserted = await LeaveType.insertMany(leaveTypesToAdd);
    
    console.log("✅ Successfully added leave types:\n");
    inserted.forEach(lt => {
      console.log(`   ${lt.code.padEnd(6)} - ${lt.name}`);
      console.log(`            Color: ${lt.color}`);
      console.log(`            Accrual: ${lt.accrualRate} days (${lt.accrualType})`);
      console.log(`            Probation: ${lt.applicableDuringProbation ? 'Yes' : 'No'}`);
      console.log();
    });

    console.log(`\n🎉 Added ${inserted.length} new leave types!`);
    console.log("\n💡 Note: Existing users will need to have their balances initialized");
    console.log("   for these new leave types. Run the balance initialization script");
    console.log("   or they will be initialized on next login/activation.\n");

    // Show all leave types now in database
    const allLeaveTypes = await LeaveType.find({ isActive: true }).sort({ code: 1 });
    console.log("📊 All Active Leave Types in Database:");
    console.log("━".repeat(60));
    allLeaveTypes.forEach(lt => {
      console.log(`${lt.code.padEnd(6)} - ${lt.name.padEnd(25)} (${lt.accrualRate} days)`);
    });
    console.log("━".repeat(60));

    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to add leave types:", error);
    process.exit(1);
  }
};

connectDB().then(addLeaveTypes);
