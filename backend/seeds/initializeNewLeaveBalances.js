require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
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

const initializeBalances = async () => {
  try {
    console.log("🔄 Initializing balances for new leave types...\n");

    const users = await User.find({ isActive: true });
    const leaveTypes = await LeaveType.find({ isActive: true });

    let updatedCount = 0;

    for (const user of users) {
      let userUpdated = false;

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
            const joinDate = user.joinDate || new Date();
            const monthsRemaining = 12 - joinDate.getMonth();
            initialBalance = leaveType.accrualRate * monthsRemaining;
          } else if (leaveType.accrualType === "NONE") {
            // For one-time leaves like Maternity, Paternity, Marriage
            // Don't initialize automatically - they request when needed
            initialBalance = 0;
          }

          user.leaveBalances.push({
            leaveTypeId: leaveType._id,
            balance: initialBalance,
            used: 0,
            pending: 0,
          });

          userUpdated = true;
          console.log(`   ✅ ${user.email}: Added ${leaveType.code} (${initialBalance} days)`);
        }
      }

      if (userUpdated) {
        await user.save();
        updatedCount++;
      }
    }

    console.log(`\n🎉 Updated ${updatedCount} users with new leave balances!`);
    
    // Show summary
    console.log("\n📊 Summary:");
    for (const user of users) {
      const freshUser = await User.findById(user._id).populate('leaveBalances.leaveTypeId');
      console.log(`\n${user.name} (${user.email}):`);
      freshUser.leaveBalances.forEach(bal => {
        const lt = leaveTypes.find(l => l._id.toString() === bal.leaveTypeId.toString());
        if (lt) {
          console.log(`   ${lt.code.padEnd(6)} - ${bal.balance} days`);
        }
      });
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to initialize balances:", error);
    process.exit(1);
  }
};

connectDB().then(initializeBalances);
