/**
 * Seed Production and Create Admin - All in One
 */

const mongoose = require('mongoose');

// Use the production URI from environment
const PROD_URI = process.env.PRODUCTION_MONGODB_URI;

if (!PROD_URI) {
  console.error('❌ Set PRODUCTION_MONGODB_URI first!');
  console.error('Run: $env:PRODUCTION_MONGODB_URI="your_uri"');
  process.exit(1);
}

async function setupProduction() {
  try {
    console.log('🔌 Connecting to PRODUCTION database...');
    console.log('URI:', PROD_URI.replace(/:[^:@]+@/, ':****@'));
    await mongoose.connect(PROD_URI);
    console.log('✅ Connected!\n');

    // Import models
    const LeaveType = require('./models/LeaveType');
    const User = require('./models/User');
    const LeaveBalance = require('./models/LeaveBalance');

    // Check if already seeded
    const existingTypes = await LeaveType.countDocuments();
    if (existingTypes === 0) {
      console.log('📝 Seeding leave types...');
      const leaveTypes = [
        {
          name: 'Casual Leave',
          code: 'CL',
          description: 'For personal matters',
          defaultBalance: 12,
          accrualRate: 1,
          accrualFrequency: 'monthly',
          maxCarryForward: 5,
          requiresApproval: true,
          isActive: true,
          applicableRoles: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN']
        },
        {
          name: 'Sick Leave',
          code: 'SL',
          description: 'For medical reasons',
          defaultBalance: 12,
          accrualRate: 1,
          accrualFrequency: 'monthly',
          maxCarryForward: 10,
          requiresApproval: true,
          requiresDocument: true,
          isActive: true,
          applicableRoles: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN']
        },
        {
          name: 'Earned Leave',
          code: 'EL',
          description: 'Earned after service',
          defaultBalance: 15,
          accrualRate: 1.25,
          accrualFrequency: 'monthly',
          maxCarryForward: 30,
          requiresApproval: true,
          isActive: true,
          applicableRoles: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN']
        },
        {
          name: 'Work From Home',
          code: 'WFH',
          description: 'Remote work',
          defaultBalance: 24,
          accrualRate: 2,
          accrualFrequency: 'monthly',
          maxCarryForward: 0,
          requiresApproval: true,
          isActive: true,
          applicableRoles: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN']
        }
      ];
      await LeaveType.insertMany(leaveTypes);
      console.log('✅ Created 4 leave types\n');
    } else {
      console.log(`ℹ️  Leave types already exist (${existingTypes})\n`);
    }

    // Create admin user
    const adminEmail = 'subramanya@aksharaenterprises.info';
    let admin = await User.findOne({ email: adminEmail });
    
    if (!admin) {
      console.log('👤 Creating admin user...');
      admin = await User.create({
        name: 'Subramanya',
        firstName: 'Subramanya',
        lastName: 'Admin',
        email: adminEmail,
        // Set plain password; User model pre-save hook handles hashing.
        password: 'Admin@123',
        employeeId: 'EMP001',
        role: 'HR_ADMIN',
        department: 'HR',
        designation: 'HR Manager',
        isActive: true,
        joiningDate: new Date()
      });
      console.log('✅ Admin user created!\n');

      // Initialize leave balances
      const leaveTypes = await LeaveType.find({ isActive: true });
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
    } else {
      console.log('ℹ️  Admin user already exists\n');
    }

    console.log('🎉 Production database is ready!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Login Credentials:');
    console.log('Email: subramanya@aksharaenterprises.info');
    console.log('Password: Admin@123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupProduction();
