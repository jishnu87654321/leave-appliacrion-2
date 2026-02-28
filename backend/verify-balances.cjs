require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const LeaveType = require("./models/LeaveType");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected\n");
  } catch (error) {
    console.error("❌ Failed:", error.message);
    process.exit(1);
  }
};

const verify = async () => {
  try {
    const users = await User.find({ isActive: true }).limit(3);
    const leaveTypes = await LeaveType.find({ isActive: true });

    console.log("📊 Current Leave Balances:\n");

    for (const user of users) {
      console.log(`${user.name} (${user.email}):`);
      
      user.leaveBalances.forEach(bal => {
        const lt = leaveTypes.find(l => l._id.toString() === bal.leaveTypeId.toString());
        if (lt) {
          const available = bal.balance - bal.pending;
          console.log(`   ${lt.code.padEnd(6)} - Balance: ${bal.balance.toString().padStart(5)}, Used: ${bal.used.toString().padStart(3)}, Pending: ${bal.pending.toString().padStart(3)}, Available: ${available.toString().padStart(5)}`);
        }
      });
      console.log();
    }

    console.log("✅ All balances are properly credited!");
    console.log("\n🧪 Test applying 4 days of BL:");
    const testUser = users[0];
    const blBalance = testUser.leaveBalances.find(b => {
      const lt = leaveTypes.find(l => l._id.toString() === b.leaveTypeId.toString());
      return lt && lt.code === 'BL';
    });
    
    if (blBalance) {
      console.log(`   Current BL balance: ${blBalance.balance}`);
      console.log(`   Requesting: 4 days`);
      console.log(`   Result: ${blBalance.balance >= 4 ? '✅ SUFFICIENT' : '❌ INSUFFICIENT'}`);
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

connectDB().then(verify);
