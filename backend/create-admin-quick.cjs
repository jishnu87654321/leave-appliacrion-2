/**
 * Quick script to create an admin user
 * Run: node create-admin-quick.js
 */

require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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

const createAdmin = async () => {
  try {
    // Define User schema inline
    const leaveBalanceSchema = new mongoose.Schema({
      leaveTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "LeaveType", required: true },
      balance: { type: Number, default: 0 },
      used: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
    }, { _id: false });

    const userSchema = new mongoose.Schema({
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true, lowercase: true },
      password: { type: String, required: true },
      role: { type: String, enum: ["EMPLOYEE", "MANAGER", "HR_ADMIN"], default: "EMPLOYEE" },
      department: { type: String, required: true },
      designation: { type: String, default: "" },
      managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      phone: { type: String, default: "" },
      avatar: { type: String, default: "" },
      joinDate: { type: Date, default: Date.now },
      probationStatus: { type: Boolean, default: false },
      probationEndDate: { type: Date, default: null },
      leaveBalances: { type: [leaveBalanceSchema], default: [] },
      isActive: { type: Boolean, default: true },
      lastLogin: { type: Date, default: null },
    }, { timestamps: true });

    const User = mongoose.models.User || mongoose.model("User", userSchema);

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "Subramanya@aksharaenterprises.info" });

    if (existingAdmin) {
      console.log("⚠️  Admin user already exists!");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`📧 Email: ${existingAdmin.email}`);
      console.log(`👤 Name: ${existingAdmin.name}`);
      console.log(`🔑 Role: ${existingAdmin.role}`);
      console.log(`✅ Active: ${existingAdmin.isActive}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

      // Update password to known value
      const salt = await bcrypt.genSalt(12);
      existingAdmin.password = await bcrypt.hash("admin123", salt);
      existingAdmin.isActive = true;
      existingAdmin.role = "HR_ADMIN";
      await existingAdmin.save();

      console.log("✅ Admin password reset to: admin123");
      console.log("\n🎉 You can now login with:");
      console.log("   Email: Subramanya@aksharaenterprises.info");
      console.log("   Password: admin123\n");
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash("admin123", salt);

    // Create admin user
    const admin = await User.create({
      name: "HR Administrator",
      email: "Subramanya@aksharaenterprises.info",
      password: hashedPassword,
      role: "HR_ADMIN",
      department: "Human Resources",
      designation: "HR Manager",
      phone: "",
      isActive: true,
      probationStatus: false,
      leaveBalances: [],
    });

    console.log("✅ Admin user created successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🔑 Password: admin123`);
    console.log(`👤 Name: ${admin.name}`);
    console.log(`🔑 Role: ${admin.role}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n🎉 You can now login with these credentials!\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
    console.error(error);
    process.exit(1);
  }
};

connectDB().then(createAdmin);
