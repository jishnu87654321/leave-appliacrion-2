/**
 * Test script to verify the leave balance system
 * Run with: node test-balance-system.cjs
 */

require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");
const User = require("./models/User");
const LeaveType = require("./models/LeaveType");
const { getUserBalances } = require("./services/leaveBalanceService");

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/leave_management";
    await mongoose.connect(uri);
    console.log("✅ MongoDB Connected\n");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    console.log("\n⚠️  Make sure MongoDB is running and MONGODB_URI is correct in .env");
    process.exit(1);
  }
};

const testBalanceSystem = async () => {
  try {
    console.log("🧪 Testing Leave Balance System\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Test 1: Check if leave types exist
    console.log("Test 1: Checking Leave Types...");
    const leaveTypes = await LeaveType.find({ isActive: true });
    console.log(`✅ Found ${leaveTypes.length} active leave types:`);
    leaveTypes.forEach(lt => {
      console.log(`   - ${lt.code}: ${lt.name} (${lt.accrualType}, ${lt.accrualRate}/${lt.accrualType === 'YEARLY' ? 'year' : 'month'})`);
    });
    console.log();

    // Test 2: Check user balances
    console.log("Test 2: Checking User Balances...");
    const users = await User.find({ isActive: true }).limit(3);
    
    for (const user of users) {
      console.log(`\n👤 ${user.name} (${user.email})`);
      console.log(`   Role: ${user.role} | Probation: ${user.probationStatus ? 'Yes' : 'No'}`);
      
      const balances = await getUserBalances(user._id);
      console.log(`   Balances:`);
      balances.forEach(bal => {
        console.log(`   - ${bal.leaveType.code}: Balance=${bal.balance}, Used=${bal.used}, Pending=${bal.pending}, Available=${bal.available}`);
      });
    }
    console.log();

    // Test 3: Verify probation user doesn't have EL
    console.log("Test 3: Verifying Probation Rules...");
    const probationUser = await User.findOne({ probationStatus: true });
    if (probationUser) {
      const balances = await getUserBalances(probationUser._id);
      const hasEL = balances.some(b => b.leaveType.code === 'EL');
      if (!hasEL) {
        console.log(`✅ Probation user (${probationUser.name}) correctly does NOT have EL`);
      } else {
        console.log(`❌ ERROR: Probation user has EL (should not)`);
      }
    } else {
      console.log(`⚠️  No probation users found to test`);
    }
    console.log();

    // Test 4: Verify balance calculations
    console.log("Test 4: Verifying Balance Calculations...");
    const testUser = users[0];
    const testBalances = await getUserBalances(testUser._id);
    
    const clBalance = testBalances.find(b => b.leaveType.code === 'CL');
    const elBalance = testBalances.find(b => b.leaveType.code === 'EL');
    
    if (clBalance && clBalance.balance === 12) {
      console.log(`✅ CL balance correct: ${clBalance.balance} days (expected 12)`);
    } else {
      console.log(`❌ CL balance incorrect: ${clBalance?.balance} (expected 12)`);
    }
    
    if (elBalance && elBalance.balance >= 15 && elBalance.balance <= 18) {
      console.log(`✅ EL balance correct: ${elBalance.balance} days (expected 15-18 based on join date)`);
    } else if (!elBalance) {
      console.log(`⚠️  No EL balance found (might be probation user)`);
    } else {
      console.log(`❌ EL balance incorrect: ${elBalance.balance} (expected 15-18)`);
    }
    console.log();

    // Test 5: Check balance structure
    console.log("Test 5: Verifying Balance Structure...");
    const sampleBalance = testBalances[0];
    const hasRequiredFields = 
      sampleBalance.leaveType &&
      typeof sampleBalance.balance === 'number' &&
      typeof sampleBalance.used === 'number' &&
      typeof sampleBalance.pending === 'number' &&
      typeof sampleBalance.available === 'number';
    
    if (hasRequiredFields) {
      console.log(`✅ Balance structure is correct`);
      console.log(`   Fields: leaveType, balance, used, pending, available`);
    } else {
      console.log(`❌ Balance structure is missing required fields`);
    }
    console.log();

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 Balance System Tests Complete!\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
};

connectDB().then(testBalanceSystem);
