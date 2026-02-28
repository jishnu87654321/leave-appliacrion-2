require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const LeaveType = require('../models/LeaveType');
const LeaveRequest = require('../models/LeaveRequest');

const verify = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║      DATABASE VERIFICATION REPORT         ║');
    console.log('╚════════════════════════════════════════════╝\n');
    
    console.log(`📊 Database: ${mongoose.connection.name}\n`);
    
    // Get counts
    const userCount = await User.countDocuments();
    const leaveTypeCount = await LeaveType.countDocuments();
    const leaveRequestCount = await LeaveRequest.countDocuments();
    
    console.log('📈 Document Counts:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Leave Types: ${leaveTypeCount}`);
    console.log(`   Leave Requests: ${leaveRequestCount}\n`);
    
    // Show users
    const users = await User.find().select('name email role department');
    console.log('👥 Users:');
    users.forEach(u => {
      console.log(`   ${u.role === 'HR_ADMIN' ? '👑' : u.role === 'MANAGER' ? '👨‍💼' : '👤'} ${u.name} (${u.email}) - ${u.role}`);
    });
    
    // Show leave types
    const leaveTypes = await LeaveType.find();
    console.log('\n📋 Leave Types:');
    leaveTypes.forEach(lt => {
      console.log(`   ✓ ${lt.name} (${lt.code}) - ${lt.accrualRate} days/${lt.accrualType.toLowerCase()}`);
    });
    
    console.log('\n✅ Database is fully operational!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

verify();
