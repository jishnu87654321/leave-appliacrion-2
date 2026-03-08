/**
 * Create Admin User in Production Database from Local Machine
 */

const mongoose = require('mongoose');
const readline = require('readline');

// Get MongoDB URI from environment variable
const PRODUCTION_MONGODB_URI = process.env.PRODUCTION_MONGODB_URI;

if (!PRODUCTION_MONGODB_URI) {
  console.error('❌ Error: PRODUCTION_MONGODB_URI environment variable is not set!');
  console.error('Please run: $env:PRODUCTION_MONGODB_URI="your_mongodb_uri"');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdmin() {
  try {
    console.log('🔌 Connecting to production database...');
    await mongoose.connect(PRODUCTION_MONGODB_URI);
    console.log('✅ Connected to production database\n');

    // Import models
    const User = require('./backend/models/User');
    const LeaveBalance = require('./backend/models/LeaveBalance');
    const LeaveType = require('./backend/models/LeaveType');

    // Get user input
    console.log('📝 Create First HR Admin User\n');
    const firstName = await question('First Name: ');
    const lastName = await question('Last Name: ');
    const email = await question('Email: ');
    const password = await question('Password: ');
    const employeeId = await question('Employee ID: ');

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('\n❌ User with this email already exists!');
      rl.close();
      await mongoose.connection.close();
      return;
    }

    // Create admin user
    const admin = await User.create({
      firstName,
      lastName,
      email,
      // Set plain password; User model pre-save hook handles hashing.
      password,
      employeeId,
      role: 'HR_ADMIN',
      department: 'Human Resources',
      isActive: true,
      joiningDate: new Date()
    });

    console.log('\n✅ Admin user created successfully!');

    // Initialize leave balances
    const leaveTypes = await LeaveType.find({ isActive: true });
    
    if (leaveTypes.length > 0) {
      const balances = leaveTypes.map(type => ({
        user: admin._id,
        leaveType: type._id,
        balance: type.defaultBalance,
        used: 0,
        pending: 0,
        year: new Date().getFullYear()
      }));

      await LeaveBalance.insertMany(balances);
      console.log(`✅ Initialized ${balances.length} leave balances`);
    }

    console.log('\n🎉 Setup complete!');
    console.log('\nYou can now login with:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('\n🌐 Login at: https://figma-leave-approval-layout.vercel.app');

    rl.close();
    await mongoose.connection.close();
  } catch (error) {
    console.error('\n❌ Error creating admin:', error);
    rl.close();
    process.exit(1);
  }
}

// Run
createAdmin();
