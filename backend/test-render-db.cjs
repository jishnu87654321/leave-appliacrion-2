/**
 * Test what database Render is actually using
 */

const mongoose = require('mongoose');

// This will use whatever MONGODB_URI is in Render's environment
const MONGODB_URI = process.env.MONGODB_URI || process.env.PRODUCTION_MONGODB_URI;

async function testRenderDB() {
  try {
    console.log('Testing Render database connection...\n');
    console.log('URI:', MONGODB_URI ? MONGODB_URI.replace(/:[^:@]+@/, ':****@') : 'NOT SET');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected!\n');

    const User = require('./models/User');
    const LeaveType = require('./models/LeaveType');

    const userCount = await User.countDocuments();
    const leaveTypeCount = await LeaveType.countDocuments();

    console.log(`Users in database: ${userCount}`);
    console.log(`Leave types in database: ${leaveTypeCount}\n`);

    if (userCount > 0) {
      const users = await User.find({}).select('name email role isActive').limit(5);
      console.log('Users:');
      users.forEach(u => {
        console.log(`  - ${u.name || u.email} (${u.role}) - Active: ${u.isActive}`);
      });
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testRenderDB();
