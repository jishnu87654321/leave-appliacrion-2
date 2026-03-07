require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");

async function checkConnection() {
  try {
    let mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/leave_management";
    
    console.log("Original URI:", mongoURI);
    
    // Append database name if URL ends with /
    if (mongoURI.endsWith('/')) {
      mongoURI = mongoURI + 'leave_management';
      console.log("Modified URI:", mongoURI);
    }
    
    await mongoose.connect(mongoURI);
    
    console.log("\n✅ Connected to database:", mongoose.connection.name);
    console.log("Database host:", mongoose.connection.host);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("\nCollections in this database:");
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    // Count users
    const usersCount = await mongoose.connection.collection("users").countDocuments();
    console.log(`\nTotal users in 'users' collection: ${usersCount}`);
    
    // Find hradmin
    const hradmin = await mongoose.connection.collection("users").findOne({ email: "Subramanya@aksharaenterprises.info" });
    if (hradmin) {
      console.log("\n✅ Subramanya@aksharaenterprises.info FOUND!");
      console.log("Name:", hradmin.name);
      console.log("Role:", hradmin.role);
      console.log("Active:", hradmin.isActive);
    } else {
      console.log("\n❌ Subramanya@aksharaenterprises.info NOT FOUND!");
    }
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkConnection();
