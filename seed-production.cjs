/**
 * Seed Production Database from Local Machine
 * This script connects to your production MongoDB and seeds it with initial data
 */

const mongoose = require('mongoose');

// Get MongoDB URI from environment variable
const PRODUCTION_MONGODB_URI = process.env.PRODUCTION_MONGODB_URI;

if (!PRODUCTION_MONGODB_URI) {
  console.error('❌ Error: PRODUCTION_MONGODB_URI environment variable is not set!');
  console.error('Please run: $env:PRODUCTION_MONGODB_URI="your_mongodb_uri"');
  process.exit(1);
}

async function seedProduction() {
  try {
    console.log('🔌 Connecting to production database...');
    await mongoose.connect(PRODUCTION_MONGODB_URI);
    console.log('✅ Connected to production database');

    // Import models
    const LeaveType = require('./backend/models/LeaveType');

    // Check if leave types already exist
    const existingTypes = await LeaveType.countDocuments();
    if (existingTypes > 0) {
      console.log(`ℹ️  Database already has ${existingTypes} leave types. Skipping seed.`);
      console.log('If you want to re-seed, delete existing leave types first.');
      await mongoose.connection.close();
      return;
    }

    // Seed leave types
    const leaveTypes = [
      {
        name: 'Casual Leave',
        code: 'CL',
        description: 'For personal matters and short breaks',
        defaultBalance: 12,
        accrualRate: 1,
        accrualFrequency: 'monthly',
        maxCarryForward: 5,
        requiresApproval: true,
        requiresDocument: false,
        minDaysNotice: 1,
        maxConsecutiveDays: 5,
        allowNegativeBalance: false,
        isActive: true,
        applicableRoles: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN'],
        probationPeriodDays: 90
      },
      {
        name: 'Sick Leave',
        code: 'SL',
        description: 'For medical reasons and health issues',
        defaultBalance: 12,
        accrualRate: 1,
        accrualFrequency: 'monthly',
        maxCarryForward: 10,
        requiresApproval: true,
        requiresDocument: true,
        minDaysNotice: 0,
        maxConsecutiveDays: 15,
        allowNegativeBalance: false,
        isActive: true,
        applicableRoles: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN'],
        probationPeriodDays: 0
      },
      {
        name: 'Earned Leave',
        code: 'EL',
        description: 'Earned after completing service period',
        defaultBalance: 15,
        accrualRate: 1.25,
        accrualFrequency: 'monthly',
        maxCarryForward: 30,
        requiresApproval: true,
        requiresDocument: false,
        minDaysNotice: 7,
        maxConsecutiveDays: 30,
        allowNegativeBalance: false,
        isActive: true,
        applicableRoles: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN'],
        probationPeriodDays: 180
      },
      {
        name: 'Work From Home',
        code: 'WFH',
        description: 'Remote work arrangement',
        defaultBalance: 24,
        accrualRate: 2,
        accrualFrequency: 'monthly',
        maxCarryForward: 0,
        requiresApproval: true,
        requiresDocument: false,
        minDaysNotice: 1,
        maxConsecutiveDays: 5,
        allowNegativeBalance: false,
        isActive: true,
        applicableRoles: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN'],
        probationPeriodDays: 90
      },
      {
        name: 'Optional Holiday',
        code: 'OH',
        description: 'Optional holidays for festivals',
        defaultBalance: 3,
        accrualRate: 0,
        accrualFrequency: 'yearly',
        maxCarryForward: 0,
        requiresApproval: true,
        requiresDocument: false,
        minDaysNotice: 3,
        maxConsecutiveDays: 1,
        allowNegativeBalance: false,
        isActive: true,
        applicableRoles: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN'],
        probationPeriodDays: 0
      }
    ];

    console.log('📝 Creating leave types...');
    await LeaveType.insertMany(leaveTypes);
    console.log(`✅ Created ${leaveTypes.length} leave types`);

    console.log('\n🎉 Production database seeded successfully!');
    console.log('\nNext step: Create your first admin user');
    
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  } catch (error) {
    console.error('❌ Error seeding production database:', error);
    process.exit(1);
  }
}

// Run the seed
seedProduction();
