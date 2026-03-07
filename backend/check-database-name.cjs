require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");

async function checkDatabase() {
  try {
    console.log('🔍 Checking Database Configuration\n');
    console.log('MONGODB_URI:', process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('\n✅ Connected to MongoDB');
    console.log('Database name:', mongoose.connection.db.databaseName);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📦 Collections in this database:');
    collections.forEach(col => console.log(`   - ${col.name}`));
    
    // Check users collection
    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      role: String,
    }));
    
    const userCount = await User.countDocuments();
    console.log(`\n👥 Total users in database: ${userCount}`);
    
    if (userCount > 0) {
      const users = await User.find().select('name email role');
      console.log('\n📋 Users found:');
      users.forEach(user => {
        console.log(`   - ${user.name} (${user.email}) - ${user.role}`);
      });
    }
    
    // Check for hradmin specifically
    const hradmin = await User.findOne({ email: 'Subramanya@aksharaenterprises.info' });
    console.log('\n🔍 Searching for Subramanya@aksharaenterprises.info:');
    console.log(hradmin ? `   ✅ Found: ${hradmin.name}` : '   ❌ Not found');
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDatabase();
