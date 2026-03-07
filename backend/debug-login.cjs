require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  isActive: Boolean,
  department: String,
  designation: String,
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", UserSchema);

async function debugLogin() {
  try {
    console.log("🔍 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    const email = "Subramanya@aksharaenterprises.info";
    const password = "admin123";

    console.log("🔍 Searching for user:", email);
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log("❌ User not found. Creating admin user...\n");
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await User.create({
        name: "HR Admin",
        email: email.toLowerCase(),
        password: hashedPassword,
        role: "HR_ADMIN",
        isActive: true,
        department: "Human Resources",
        designation: "HR Administrator",
      });

      console.log("✅ Admin user created successfully!");
      console.log("📧 Email:", email);
      console.log("🔑 Password:", password);
      console.log("👤 Role:", newUser.role);
      console.log("✓ Active:", newUser.isActive);
    } else {
      console.log("✅ User found!");
      console.log("👤 Name:", user.name);
      console.log("📧 Email:", user.email);
      console.log("🔑 Role:", user.role);
      console.log("✓ Active:", user.isActive);
      console.log("🏢 Department:", user.department);
      
      console.log("\n🔍 Testing password...");
      const isMatch = await user.comparePassword(password);
      
      if (isMatch) {
        console.log("✅ Password is correct!");
      } else {
        console.log("❌ Password is incorrect. Resetting password...\n");
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.isActive = true;
        await user.save();
        console.log("✅ Password reset to:", password);
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("✅ LOGIN CREDENTIALS:");
    console.log("=".repeat(50));
    console.log("Email:    Subramanya@aksharaenterprises.info");
    console.log("Password: admin123");
    console.log("=".repeat(50));

    await mongoose.connection.close();
    console.log("\n✅ Database connection closed");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

debugLogin();
