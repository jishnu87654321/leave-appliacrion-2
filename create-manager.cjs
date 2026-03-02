require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const createManager = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String,
      department: String,
      designation: String,
      phone: String,
      isActive: Boolean,
      probationStatus: Boolean,
      leaveBalances: Array,
      joinDate: Date,
    }));

    // Manager details - EDIT THESE VALUES
    const managerData = {
      name: 'John Manager',
      email: 'manager@example.com',
      password: 'password123',
      department: 'Engineering',
      designation: 'Engineering Manager',
      phone: '+1234567890',
      role: 'MANAGER',
      isActive: true,
      probationStatus: false,
      leaveBalances: [],
      joinDate: new Date(),
    };

    // Check if user already exists
    const existing = await User.findOne({ email: managerData.email.toLowerCase() });
    if (existing) {
      console.log('❌ User with this email already exists!');
      console.log(`   Name: ${existing.name}`);
      console.log(`   Role: ${existing.role}`);
      process.exit(1);
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    managerData.password = await bcrypt.hash(managerData.password, salt);
    managerData.email = managerData.email.toLowerCase();

    // Create manager
    const manager = await User.create(managerData);
    console.log('\n✅ Manager created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email: ${manager.email}`);
    console.log(`👤 Name: ${manager.name}`);
    console.log(`🏢 Department: ${manager.department}`);
    console.log(`💼 Designation: ${manager.designation}`);
    console.log(`🎭 Role: ${manager.role}`);
    console.log(`✓ Active: ${manager.isActive}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🔐 Login credentials:');
    console.log(`   Email: ${manager.email}`);
    console.log(`   Password: password123`);
    console.log('\n⚠️  Remember to change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createManager();
