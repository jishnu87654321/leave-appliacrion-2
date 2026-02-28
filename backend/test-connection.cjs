/**
 * Simple MongoDB Atlas Connection Test
 * Run with: node test-connection.cjs
 */

require("dotenv").config();
const mongoose = require("mongoose");

const testConnection = async () => {
  console.log("🔍 Testing MongoDB Atlas Connection...\n");
  
  const uri = process.env.MONGODB_URI;
  console.log("📍 Connection URI:", uri ? uri.substring(0, 50) + "..." : "NOT FOUND");
  
  if (!uri) {
    console.error("❌ MONGODB_URI not found in .env file");
    process.exit(1);
  }

  try {
    console.log("\n⏳ Attempting to connect...");
    
    // Add database name if URI ends with /
    let finalUri = uri;
    if (uri.endsWith('/')) {
      finalUri = uri + 'leave_management';
      console.log("✅ Appended database name: leave_management");
    }
    
    const conn = await mongoose.connect(finalUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log("\n✅ MongoDB Atlas Connected Successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 Connection Details:");
    console.log(`   Database: ${conn.connection.name}`);
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Port: ${conn.connection.port}`);
    console.log(`   Ready State: ${conn.connection.readyState === 1 ? 'Connected' : 'Not Connected'}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
    // Test a simple query
    console.log("🧪 Testing database query...");
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`✅ Found ${collections.length} collections:`);
    collections.forEach(col => console.log(`   - ${col.name}`));
    
    console.log("\n🎉 Connection test passed!\n");
    
    await mongoose.connection.close();
    console.log("👋 Connection closed gracefully");
    process.exit(0);
    
  } catch (error) {
    console.error("\n❌ Connection Failed!");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("Error:", error.message);
    
    if (error.message.includes("bad auth")) {
      console.error("\n💡 Possible Issues:");
      console.error("   1. Username or password is incorrect");
      console.error("   2. User doesn't have access to the database");
      console.error("   3. IP address not whitelisted in MongoDB Atlas");
      console.error("   4. Password contains special characters that need URL encoding");
      console.error("\n📝 To fix:");
      console.error("   - Check MongoDB Atlas → Database Access → Users");
      console.error("   - Check MongoDB Atlas → Network Access → IP Whitelist");
      console.error("   - Try adding 0.0.0.0/0 to allow all IPs (for testing)");
    } else if (error.message.includes("ENOTFOUND")) {
      console.error("\n💡 Possible Issues:");
      console.error("   1. Cluster URL is incorrect");
      console.error("   2. No internet connection");
      console.error("   3. DNS resolution failed");
    } else if (error.message.includes("timeout")) {
      console.error("\n💡 Possible Issues:");
      console.error("   1. Network firewall blocking connection");
      console.error("   2. IP not whitelisted in MongoDB Atlas");
      console.error("   3. Cluster is paused or unavailable");
    }
    
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    process.exit(1);
  }
};

testConnection();
