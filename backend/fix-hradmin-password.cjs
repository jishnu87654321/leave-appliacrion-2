require("dotenv").config({ path: "./.env" });
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

async function fixPassword() {
  await connectDB();

  console.log("🔧 Fixing HR Admin password...\n");

  // Get the raw collection to bypass mongoose middleware
  const usersCollection = mongoose.connection.collection("users");

  // Hash password directly
  const hashedPassword = await bcrypt.hash("admin123", 10);
  
  console.log("Generated hash:", hashedPassword.substring(0, 30) + "...");

  // Update directly in database
  const result = await usersCollection.updateOne(
    { email: "Subramanya@aksharaenterprises.info" },
    { 
      $set: { 
        password: hashedPassword,
        isActive: true 
      } 
    }
  );

  console.log("Update result:", result.modifiedCount, "document(s) modified");

  // Verify the update
  const user = await usersCollection.findOne({ email: "Subramanya@aksharaenterprises.info" });
  
  if (user) {
    console.log("\n✅ User updated:");
    console.log("Email:", user.email);
    console.log("Name:", user.name);
    console.log("Role:", user.role);
    console.log("Active:", user.isActive);
    console.log("Password hash:", user.password.substring(0, 30) + "...");

    // Test the password
    const isMatch = await bcrypt.compare("admin123", user.password);
    console.log("\n🔐 Password test:");
    console.log("Password 'admin123' matches:", isMatch ? "✅ YES" : "❌ NO");
  }

  console.log("\n✅ Password fix complete!");
  console.log("\n📝 Login Credentials:");
  console.log("Email: Subramanya@aksharaenterprises.info");
  console.log("Password: admin123");

  await mongoose.connection.close();
  process.exit(0);
}

fixPassword().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
