/**
 * Verify MongoDB Connection and Check Users
 */

require("dotenv").config({ path: "./backend/.env" });
const mongoose = require("mongoose");

async function verifyConnection() {
  try {
    console.log("🔍 Verifying MongoDB Connection\n");
    
    // Connect to MongoDB
    console.log("📡 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB:", mongoose.connection.name);
    console.log();

    // Check Users collection
    console.log("👥 Checking Users Collection...");
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const users = await User.find({}).select('name email role department isActive');
    
    console.log(`✅ Found ${users.length} users in database\n`);
    
    if (users.length > 0) {
      console.log("📋 User List:");
      console.log("─".repeat(80));
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Department: ${user.department || 'N/A'}`);
        console.log(`   Active: ${user.isActive ? 'Yes' : 'No'}`);
        console.log();
      });
    } else {
      console.log("⚠️  No users found in database");
      console.log("   You may need to run: node backend/scripts/createFirstAdmin.js");
    }

    // Check Leave Requests collection
    console.log("📝 Checking Leave Requests Collection...");
    const LeaveRequest = mongoose.model('LeaveRequest', new mongoose.Schema({}, { strict: false }));
    const leaveCount = await LeaveRequest.countDocuments();
    console.log(`✅ Found ${leaveCount} leave requests in database\n`);

    // Check Leave Types collection
    console.log("📋 Checking Leave Types Collection...");
    const LeaveType = mongoose.model('LeaveType', new mongoose.Schema({}, { strict: false }));
    const leaveTypes = await LeaveType.find({ isActive: true }).select('name code');
    console.log(`✅ Found ${leaveTypes.length} active leave types\n`);
    
    if (leaveTypes.length > 0) {
      console.log("Leave Types:");
      leaveTypes.forEach(lt => {
        console.log(`  - ${lt.name} (${lt.code})`);
      });
      console.log();
    }

    console.log("🎉 MongoDB Connection Verified Successfully!\n");
    console.log("Summary:");
    console.log(`  - Database: ${mongoose.connection.name}`);
    console.log(`  - Users: ${users.length}`);
    console.log(`  - Leave Requests: ${leaveCount}`);
    console.log(`  - Leave Types: ${leaveTypes.length}`);
    console.log();
    console.log("✅ System is ready to use!");

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

verifyConnection();
