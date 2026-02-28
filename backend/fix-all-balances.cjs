require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const LeaveType = require("./models/LeaveType");

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    console.log("✅ MongoDB Connected\n");
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    process.exit(1);
  }
};

const fixAllBalances = async () => {
  try {
    console.log("🔧 Fixing all user balances...\n");

    const users = await User.find({ isActive: true });
    const leaveTypes = await LeaveType.find({ isActive: true });

    console.log(`Found ${users.length} users and ${leaveTypes.length} leave types\n`);

    for (const user of users) {
      console.log(`\n👤 ${user.name} (${user.email})`);
      
      // Clear existing balances
      user.leaveBalances = [];

      for (const leaveType of leaveTypes) {
        // Skip if probation and not applicable
        if (user.probationStatus && !leaveType.applicableDuringProbation) {
          console.log(`   ⏭️  Skipping ${leaveType.code} (not applicable during probation)`);
          continue;
        }

        let initialBalance = 0;

        if (leaveType.accrualType === "YEARLY") {
          initialBalance = leaveType.accrualRate;
        } else if (leaveType.accrualType === "MONTHLY") {
          const joinDate = user.joinDate || new Date();
          const currentMonth = new Date().getMonth(); // 0-11
          const joinMonth = joinDate.getMonth();
          const monthsRemaining = 12 - (currentMonth - joinMonth);
          initialBalance = leaveType.accrualRate * Math.max(1, monthsRemaining);
        } else if (leaveType.accrualType === "NONE") {
          // For one-time leaves, give them the full amount
          initialBalance = leaveType.accrualRate;
        }

        user.leaveBalances.push({
          leaveTypeId: leaveType._id,
          balance: initialBalance,
          used: 0,
          pending: 0,
        });

        console.log(`   ✅ ${leaveType.code.padEnd(6)} = ${initialBalance} days`);
      }

      await user.save();
      console.log(`   💾 Saved`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎉 All balances fixed successfully!");
    console.log("=".repeat(60));

    // Verify
    console.log("\n📊 Verification:");
    for (const user of users) {
      const freshUser = await User.findById(user._id);
      console.log(`\n${user.email}:`);
      freshUser.leaveBalances.forEach(bal => {
        const lt = leaveTypes.find(l => l._id.toString() === bal.leaveTypeId.toString());
        if (lt) {
          console.log(`   ${lt.code.padEnd(6)} - Balance: ${bal.balance}, Used: ${bal.used}, Pending: ${bal.pending}`);
        }
      });
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Failed:", error);
    process.exit(1);
  }
};

connectDB().then(fixAllBalances);
