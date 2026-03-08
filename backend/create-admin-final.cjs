const mongoose = require('mongoose');

const PROD_URI = process.env.PRODUCTION_MONGODB_URI;

async function createAdmin() {
  try {
    await mongoose.connect(PROD_URI);
    console.log('✅ Connected\n');

    const User = require('./models/User');
    const LeaveBalance = require('./models/LeaveBalance');
    const LeaveType = require('./models/LeaveType');

    const email = 'subramanya@aksharaenterprises.info';
    const password = 'Admin@123';

    // Delete existing
    await User.deleteOne({ email });
    console.log('🗑️  Deleted old user\n');

    // Create new admin - use .save() to trigger pre-save hook
    console.log('👤 Creating admin...');
    const admin = new User({
      name: 'Subramanya',
      email: email,
      password: password,
      role: 'hr_admin',
      department: 'HR',
      designation: 'HR Manager',
      phone: '1234567890',
      isActive: true,
      joinDate: new Date()
    });
    
    await admin.save();
    console.log('✅ Admin saved!\n');

    // Verify password was saved
    const check = await User.findOne({ email }).select('+password');
    console.log(`Password saved: ${!!check.password}`);
    console.log(`Password length: ${check.password ? check.password.length : 0}\n`);

    // Initialize leave balances
    const leaveTypes = await LeaveType.find({ isActive: true });
    if (leaveTypes.length > 0) {
      await LeaveBalance.deleteMany({ userId: admin._id });
      const balances = leaveTypes.map(type => ({
        userId: admin._id,
        leaveTypeId: type._id,
        balance: type.defaultBalance,
        used: 0,
        pending: 0,
        year: new Date().getFullYear()
      }));
      await LeaveBalance.insertMany(balances);
      console.log(`✅ Initialized ${balances.length} leave balances\n`);
    }

    console.log('🎉 Done!');
    console.log('Email: subramanya@aksharaenterprises.info');
    console.log('Password: Admin@123\n');

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createAdmin();
