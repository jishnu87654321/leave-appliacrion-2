require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');

const checkManagerDetails = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const UserSchema = new mongoose.Schema({
      name: String,
      email: String,
      role: String,
      department: String,
      designation: String,
      isActive: Boolean,
      createdAt: Date,
    });

    const User = mongoose.model('User', UserSchema);

    // Find all managers
    console.log('📋 MANAGER ACCOUNTS IN DATABASE:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const managers = await User.find({ role: 'MANAGER' }).sort({ isActive: -1, createdAt: -1 });
    
    if (managers.length === 0) {
      console.log('⚠️  No manager accounts found in database\n');
      console.log('💡 To create a manager account:');
      console.log('   1. Register at /register and select "Manager" role');
      console.log('   2. HR Admin approves the registration');
      console.log('   3. Or use: node create-manager.cjs\n');
    } else {
      console.log(`Found ${managers.length} manager account(s):\n`);
      
      managers.forEach((manager, index) => {
        const status = manager.isActive ? '✅ ACTIVE' : '❌ INACTIVE';
        console.log(`${index + 1}. ${status}`);
        console.log(`   Name: ${manager.name}`);
        console.log(`   Email: ${manager.email}`);
        console.log(`   Department: ${manager.department || 'N/A'}`);
        console.log(`   Designation: ${manager.designation || 'N/A'}`);
        console.log(`   Created: ${manager.createdAt ? manager.createdAt.toLocaleDateString() : 'N/A'}`);
        console.log(`   Password: password123 (default)\n`);
      });
    }

    // Check quick login configuration
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔐 QUICK LOGIN CONFIGURATION:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Manager Quick Login Email: johnmanager@gmail.com');
    console.log('Password: password123\n');

    // Check if quick login email exists
    const quickLoginManager = await User.findOne({ email: 'johnmanager@gmail.com' });
    
    if (quickLoginManager) {
      console.log('✅ Quick login manager account EXISTS');
      console.log(`   Status: ${quickLoginManager.isActive ? 'ACTIVE' : 'INACTIVE'}`);
      console.log(`   Name: ${quickLoginManager.name}`);
      console.log(`   Role: ${quickLoginManager.role}`);
    } else {
      console.log('⚠️  Quick login manager account DOES NOT EXIST');
      console.log('\n💡 To create this account:');
      console.log('   1. Register with email: johnmanager@gmail.com');
      console.log('   2. Select role: Manager');
      console.log('   3. Set password: password123');
      console.log('   4. Wait for HR Admin approval\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkManagerDetails();
