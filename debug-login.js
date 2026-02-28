/**
 * Debug login issue - Test the full login flow
 * Run: node debug-login.js
 */

require("dotenv").config({ path: "./backend/.env" });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const axios = require("axios");

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/leave_management";
    await mongoose.connect(uri);
    console.log("✅ MongoDB Connected\n");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

const debugLogin = async () => {
  try {
    console.log("🔍 DEBUGGING LOGIN ISSUE\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Define User schema
    const userSchema = new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String,
      department: String,
      isActive: Boolean,
      probationStatus: Boolean,
    });

    userSchema.methods.comparePassword = async function (candidatePassword) {
      return bcrypt.compare(candidatePassword, this.password);
    };

    const User = mongoose.models.User || mongoose.model("User", userSchema);

    // Step 1: Check if any users exist
    console.log("Step 1: Checking database for users...");
    const userCount = await User.countDocuments();
    console.log(`   Found ${userCount} user(s) in database\n`);

    if (userCount === 0) {
      console.log("❌ No users found in database!");
      console.log("\n💡 Creating admin user...\n");

      // Create admin user
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash("password123", salt);

      const admin = await User.create({
        name: "HR Administrator",
        email: "hradmin@gmail.com",
        password: hashedPassword,
        role: "HR_ADMIN",
        department: "Human Resources",
        isActive: true,
        probationStatus: false,
      });

      console.log("✅ Admin user created!");
      console.log(`   Email: ${admin.email}`);
      console.log(`   Password: password123\n`);
    }

    // Step 2: Find admin user
    console.log("Step 2: Looking for admin user...");
    const admin = await User.findOne({ email: "hradmin@gmail.com" }).select("+password");
    
    if (!admin) {
      console.log("❌ Admin user not found!");
      console.log("\n💡 Run: node create-admin-quick.js\n");
      process.exit(1);
    }

    console.log("✅ Admin user found!");
    console.log(`   Name: ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Active: ${admin.isActive}`);
    console.log(`   Password Hash: ${admin.password.substring(0, 20)}...\n`);

    // Step 3: Test password comparison
    console.log("Step 3: Testing password comparison...");
    const testPassword = "password123";
    const isMatch = await admin.comparePassword(testPassword);
    console.log(`   Password "${testPassword}" matches: ${isMatch ? "✅ YES" : "❌ NO"}\n`);

    if (!isMatch) {
      console.log("❌ Password does not match!");
      console.log("\n💡 Resetting password...\n");
      
      const salt = await bcrypt.genSalt(12);
      admin.password = await bcrypt.hash("password123", salt);
      await admin.save();
      
      console.log("✅ Password reset to: password123\n");
    }

    // Step 4: Check if backend is running
    console.log("Step 4: Testing backend API...");
    try {
      const response = await axios.get("http://localhost:5000/api/health", { timeout: 3000 });
      console.log("✅ Backend is running\n");
    } catch (error) {
      console.log("❌ Backend is NOT running!");
      console.log("\n💡 Start backend with: cd backend && npm start\n");
      process.exit(1);
    }

    // Step 5: Test login API
    console.log("Step 5: Testing login API...");
    try {
      const loginResponse = await axios.post("http://localhost:5000/api/auth/login", {
        email: "hradmin@gmail.com",
        password: "password123",
      });

      if (loginResponse.data.success) {
        console.log("✅ Login API works!");
        console.log(`   Token: ${loginResponse.data.token.substring(0, 30)}...`);
        console.log(`   User: ${loginResponse.data.data.user.name}`);
        console.log(`   Role: ${loginResponse.data.data.user.role}\n`);
      }
    } catch (error) {
      console.log("❌ Login API failed!");
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Message: ${error.response.data.message}`);
        console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}\n`);
      } else if (error.code === 'ECONNREFUSED') {
        console.log("   Error: Cannot connect to backend");
        console.log("\n💡 Make sure backend is running: cd backend && npm start\n");
      } else {
        console.log(`   Error: ${error.message}\n`);
      }
      process.exit(1);
    }

    // Summary
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ ALL CHECKS PASSED!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n🎉 You can now login with:");
    console.log("   Email: hradmin@gmail.com");
    console.log("   Password: password123\n");
    console.log("📍 Frontend: http://localhost:5173");
    console.log("📍 Backend: http://localhost:5000\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error);
    process.exit(1);
  }
};

connectDB().then(debugLogin);
