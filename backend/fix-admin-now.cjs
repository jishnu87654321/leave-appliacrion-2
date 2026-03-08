/**
 * Delete existing admin and create fresh one with exact credentials
 */

const mongoose = require('mongoose');

const PROD_URI = process.env.PRODUCTION_MONGODB_URI;

async function fixAdmin() {
  try {
    console.log('🔌 Connecting...');
    await mongoose.connect(PROD_URI);
    console.log('✅ Connected\n');

    const User = require('./models/User');
    const LeaveBalance = require('./models/LeaveBalance');
    const LeaveType = require('./models/LeaveType');

    const email = 'subramanya@aksharaenterprises.info';
    const password = 'Admin@123';

    // Delete existing user if exists
    const existing = await User.findOne({ email });
    if (existing) {
      console.log('🗑️  Deleting existing user...');
      await LeaveBalance.deleteMany({ userId: existing._id });
      await User.deleteOne({ email });
      console.log('✅ Deleted\n');
    }

    // Create fresh admin
    console.log('👤 Creating fresh admin...');
    const admin = await User.create({
      name: 'Subramanya',
      email: email,
      // Set plain password; User model pre-save hook handles hashing.
      password: password,
      employeeId: 'EMP001',
      role: 'HR_ADMIN',
      department: 'HR',
      designation: 'HR Manager',
      phone: '1234567890',
      isActive: true,
      joiningDate: new Date()
    });

    console.log('✅ Admin created!\n');

    // Initialize leave balances
    const leaveTypes = await LeaveType.find({ isActive: true });
    if (leaveTypes.length > 0) {
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

    console.log('🎉 Done!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Login with:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixAdmin();
