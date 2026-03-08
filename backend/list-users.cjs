const mongoose = require('mongoose');

const PRODUCTION_MONGODB_URI = process.env.PRODUCTION_MONGODB_URI;

async function listUsers() {
  try {
    await mongoose.connect(PRODUCTION_MONGODB_URI);
    console.log('✅ Connected\n');

    const User = require('./models/User');
    const users = await User.find({}).select('firstName lastName email role isActive');
    
    console.log(`Found ${users.length} users:\n`);
    users.forEach(user => {
      console.log(`- ${user.firstName} ${user.lastName}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Active: ${user.isActive}\n`);
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

listUsers();
