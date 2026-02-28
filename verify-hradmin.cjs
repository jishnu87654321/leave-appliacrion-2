require("dotenv").config({ path: "./backend/.env" });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    console.log("✅ MongoDB Connected\n");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  isActive: Boolean,
});

const User = mongoose.model("User", UserSchema);

async function verifyHRAdmin() {
  await connectDB();

  console.log("🔍 Checking for hradmin@gmail.com...\n");

  const user = await User.findOne({ email: "hradmin@gmail.com" });

  if (!user) {
    console.log("❌ User NOT FOUND in database!");
    console.log("\n📝 Creating HR Admin user...\n");

    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    const newUser = await User.create({
      name: "HR Administrator",
      email: "hradmin@gmail.com",
      password: hashedPassword,
      role: "HR_ADMIN",
      isActive: true,
      department: "Human Resources",
      designation: "HR Admin",
      phone: "1234567890",
      probationStatus: false,
      lastLogin: new Date(),
    });

    console.log("✅ HR Admin created successfully!");
    console.log("Email:", newUser.email);
    console.log("Password: admin123");
    console.log("Role:", newUser.role);
    console.log("Active:", newUser.isActive);
  } else {
    console.log("✅ User FOUND!");
    console.log("Name:", user.name);
    console.log("Email:", user.email);
    console.log("Role:", user.role);
    console.log("Active:", user.isActive);
    console.log("\n🔐 Testing password...");

    // Test password
    const testPassword = "admin123";
    const isMatch = await bcrypt.compare(testPassword, user.password);
    
    if (isMatch) {
      console.log("✅ Password 'admin123' is CORRECT!");
    } else {
      console.log("❌ Password 'admin123' is INCORRECT!");
      console.log("\n🔧 Resetting password to 'admin123'...");
      
      const hashedPassword = await bcrypt.hash("admin123", 10);
      user.password = hashedPassword;
      user.isActive = true;
      await user.save();
      
      console.log("✅ Password reset successfully!");
    }
  }

  console.log("\n✅ Verification complete!");
  console.log("\n📝 Login Credentials:");
  console.log("Email: hradmin@gmail.com");
  console.log("Password: admin123");
  
  await mongoose.connection.close();
  process.exit(0);
}

verifyHRAdmin().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
