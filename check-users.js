/**
 * Check what users exist in the database
 * Run: node check-users.js
 */

require("dotenv").config({ path: "./backend/.env" });
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/leave_management";
    await mongoose.connect(uri);
    console.log("✅ MongoDB Connected");
    console.log(`📍 Database: ${uri}\n`);
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

const checkUsers = async () => {
  try {
    // Define User schema inline
    const userSchema = new mongoose.Schema({
      name: String,
      email: String,
      role: String,
      department: String,
      designation: String,
      isActive: Boolean,
      probationStatus: Boolean,
      createdAt: Date,
    });

    const User = mongoose.models.User || mongoose.model("User", userSchema);

    // Get all users
    const users = await User.find({}).select("name email role department isActive probationStatus createdAt").sort({ createdAt: -1 });

    if (users.length === 0) {
      console.log("⚠️  No users found in the database!");
      console.log("\n💡 To create an admin user, run:");
      console.log("   node create-admin-quick.js\n");
      process.exit(0);
    }

    console.log(`📊 Found ${users.length} user(s) in the database:\n`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.name}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🔑 Role: ${user.role}`);
      console.log(`   🏢 Department: ${user.department}`);
      console.log(`   ✅ Active: ${user.isActive ? "Yes" : "No"}`);
      console.log(`   👤 Probation: ${user.probationStatus ? "Yes" : "No"}`);
      console.log(`   📅 Created: ${user.createdAt ? user.createdAt.toLocaleDateString() : "N/A"}`);
    });

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Check for HR Admins
    const hrAdmins = users.filter(u => u.role === "HR_ADMIN");
    if (hrAdmins.length === 0) {
      console.log("\n⚠️  No HR Admin found!");
      console.log("💡 To create an admin user, run:");
      console.log("   node create-admin-quick.js\n");
    } else {
      console.log(`\n✅ Found ${hrAdmins.length} HR Admin(s)`);
      hrAdmins.forEach(admin => {
        console.log(`   • ${admin.name} (${admin.email}) - Active: ${admin.isActive}`);
      });
      console.log();
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error checking users:", error.message);
    process.exit(1);
  }
};

connectDB().then(checkUsers);
