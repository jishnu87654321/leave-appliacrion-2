const mongoose = require("mongoose");
const logger = require("../utils/logger");

const connectDB = async () => {
  try {
    let mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/leave_management";
    
    // Append database name if URL ends with /
    if (mongoURI.endsWith('/')) {
      mongoURI = mongoURI + 'leave_management';
    }
    
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
    });
    
    console.log(`🗄️  MongoDB connected: ${conn.connection.name}`);

    mongoose.connection.on("error", (err) => console.error("❌ MongoDB error:", err.message));
    mongoose.connection.on("disconnected", () => console.warn("⚠️  MongoDB disconnected"));
    mongoose.connection.on("reconnected", () => console.log("✅ MongoDB reconnected"));
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
