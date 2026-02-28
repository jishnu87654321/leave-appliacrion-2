require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");

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

async function listUsers() {
  await connectDB();

  console.log("📋 Listing all users in database...\n");

  const usersCollection = mongoose.connection.collection("users");
  const users = await usersCollection.find({}).toArray();

  console.log(`Found ${users.length} user(s):\n`);

  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.isActive}`);
    console.log(`   ID: ${user._id}`);
    console.log();
  });

  await mongoose.connection.close();
  process.exit(0);
}

listUsers().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
