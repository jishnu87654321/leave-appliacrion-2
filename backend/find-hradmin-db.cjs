require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");

async function findHradmin() {
  try {
    const baseURI = process.env.MONGODB_URI;
    console.log("Base URI:", baseURI);
    
    // Try different database names
    const dbNames = ["leave_management", "test", "admin", ""];
    
    for (const dbName of dbNames) {
      const uri = baseURI + dbName;
      console.log(`\n🔍 Checking database: "${dbName || '(default)'}"`);
      console.log(`URI: ${uri}`);
      
      try {
        await mongoose.connect(uri);
        console.log(`✅ Connected to: ${mongoose.connection.name}`);
        
        const usersCount = await mongoose.connection.collection("users").countDocuments();
        console.log(`   Users count: ${usersCount}`);
        
        const hradmin = await mongoose.connection.collection("users").findOne({ email: "Subramanya@aksharaenterprises.info" });
        if (hradmin) {
          console.log(`   ✅ FOUND Subramanya@aksharaenterprises.info in database "${mongoose.connection.name}"!`);
          console.log(`   Name: ${hradmin.name}`);
          console.log(`   Role: ${hradmin.role}`);
        } else {
          console.log(`   ❌ Subramanya@aksharaenterprises.info not found`);
        }
        
        await mongoose.connection.close();
      } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

findHradmin();
