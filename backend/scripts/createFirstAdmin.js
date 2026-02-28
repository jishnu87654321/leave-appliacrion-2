require("dotenv").config();
const mongoose = require("mongoose");
const readline = require("readline");
const User = require("../models/User");
const { initializeUserBalances } = require("../services/leaveBalanceService");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/leave_management");
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

const createFirstAdmin = async () => {
  try {
    console.log("\n🎯 Create First HR Admin\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Check if any HR admin already exists
    const existingAdmin = await User.findOne({ role: "HR_ADMIN", isActive: true });
    if (existingAdmin) {
      console.log("⚠️  An active HR Admin already exists:");
      console.log(`   Name: ${existingAdmin.name}`);
      console.log(`   Email: ${existingAdmin.email}\n`);
      
      const proceed = await question("Do you want to create another HR Admin? (yes/no): ");
      if (proceed.toLowerCase() !== "yes") {
        console.log("\n❌ Operation cancelled.\n");
        process.exit(0);
      }
    }

    // Get user details
    const name = await question("Full Name: ");
    const email = await question("Email: ");
    const password = await question("Password (min 6 characters): ");
    const department = await question("Department (default: Human Resources): ") || "Human Resources";
    const designation = await question("Designation (default: HR Manager): ") || "HR Manager";
    const phone = await question("Phone (optional): ") || "";

    // Validate
    if (!name || !email || !password) {
      console.log("\n❌ Name, email, and password are required.\n");
      process.exit(1);
    }

    if (password.length < 6) {
      console.log("\n❌ Password must be at least 6 characters.\n");
      process.exit(1);
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log("\n⚠️  A user with this email already exists.");
      console.log(`   Name: ${existingUser.name}`);
      console.log(`   Role: ${existingUser.role}`);
      console.log(`   Active: ${existingUser.isActive}\n`);
      
      const update = await question("Do you want to update this user to HR Admin? (yes/no): ");
      if (update.toLowerCase() === "yes") {
        existingUser.role = "HR_ADMIN";
        existingUser.isActive = true;
        existingUser.department = department;
        existingUser.designation = designation;
        if (phone) existingUser.phone = phone;
        await existingUser.save();
        
        // Initialize balances if not already done
        await initializeUserBalances(existingUser._id);
        
        console.log("\n✅ User updated to HR Admin successfully!");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(`Name: ${existingUser.name}`);
        console.log(`Email: ${existingUser.email}`);
        console.log(`Role: ${existingUser.role}`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        process.exit(0);
      } else {
        console.log("\n❌ Operation cancelled.\n");
        process.exit(0);
      }
    }

    // Create new HR Admin
    const hrAdmin = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: "HR_ADMIN",
      department: department.trim(),
      designation: designation.trim(),
      phone: phone.trim(),
      isActive: true,
      probationStatus: false,
    });

    // Initialize leave balances
    await initializeUserBalances(hrAdmin._id);

    console.log("\n✅ HR Admin created successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Name: ${hrAdmin.name}`);
    console.log(`Email: ${hrAdmin.email}`);
    console.log(`Password: ${password}`);
    console.log(`Role: ${hrAdmin.role}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n🎉 You can now login with these credentials!\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
};

connectDB().then(() => {
  createFirstAdmin();
});
