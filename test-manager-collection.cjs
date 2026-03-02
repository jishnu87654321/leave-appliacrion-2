require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');

const testManagerCollection = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Define schemas
    const UserSchema = new mongoose.Schema({
      name: String,
      email: String,
      role: String,
      department: String,
      designation: String,
      isActive: Boolean,
    });

    const ManagerSchema = new mongoose.Schema({
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      department: String,
      managementLevel: String,
      teamSize: Number,
      responsibilities: [String],
      approvalAuthority: Object,
      preferences: Object,
      performance: Object,
      isActive: Boolean,
    }, { timestamps: true });

    const User = mongoose.model('User', UserSchema);
    const Manager = mongoose.model('Manager', ManagerSchema);

    // Get all managers from User collection
    console.log('📊 Checking Users with MANAGER role:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const managerUsers = await User.find({ role: 'MANAGER', isActive: true });
    console.log(`Found ${managerUsers.length} users with MANAGER role\n`);

    if (managerUsers.length > 0) {
      managerUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email})`);
        console.log(`   Department: ${user.department}`);
        console.log(`   Designation: ${user.designation || 'N/A'}`);
        console.log(`   User ID: ${user._id}\n`);
      });
    }

    // Get all manager profiles from Manager collection
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Checking Manager Collection:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const managerProfiles = await Manager.find({ isActive: true }).populate('userId', 'name email department');
    console.log(`Found ${managerProfiles.length} manager profiles\n`);

    if (managerProfiles.length > 0) {
      managerProfiles.forEach((profile, index) => {
        console.log(`${index + 1}. Manager Profile:`);
        console.log(`   Name: ${profile.userId?.name || 'N/A'}`);
        console.log(`   Email: ${profile.userId?.email || 'N/A'}`);
        console.log(`   Department: ${profile.department}`);
        console.log(`   Management Level: ${profile.managementLevel}`);
        console.log(`   Team Size: ${profile.teamSize}`);
        console.log(`   Max Leave Days: ${profile.approvalAuthority?.maxLeaveDays || 'N/A'}`);
        console.log(`   Can Approve Special Leave: ${profile.approvalAuthority?.canApproveSpecialLeave ? 'Yes' : 'No'}`);
        console.log(`   Profile ID: ${profile._id}`);
        console.log(`   Created: ${profile.createdAt?.toLocaleDateString() || 'N/A'}\n`);
      });
    } else {
      console.log('⚠️  No manager profiles found in Manager collection');
      console.log('   Manager profiles are created automatically when:');
      console.log('   1. A new user is created with MANAGER role');
      console.log('   2. An existing user is promoted to MANAGER role\n');
    }

    // Check for managers without profiles
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 Checking for managers without profiles:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const managersWithoutProfiles = [];
    for (const user of managerUsers) {
      const profile = await Manager.findOne({ userId: user._id });
      if (!profile) {
        managersWithoutProfiles.push(user);
      }
    }

    if (managersWithoutProfiles.length > 0) {
      console.log(`⚠️  Found ${managersWithoutProfiles.length} manager(s) without profiles:\n`);
      managersWithoutProfiles.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email})`);
        console.log(`   User ID: ${user._id}\n`);
      });
      console.log('💡 Tip: Update these users through the UI to auto-create their profiles');
    } else {
      console.log('✅ All managers have profiles!\n');
    }

    // Collection statistics
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📈 Statistics:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total Users with MANAGER role: ${managerUsers.length}`);
    console.log(`Total Manager Profiles: ${managerProfiles.length}`);
    console.log(`Managers without profiles: ${managersWithoutProfiles.length}`);
    
    const totalTeamSize = managerProfiles.reduce((sum, p) => sum + (p.teamSize || 0), 0);
    const avgTeamSize = managerProfiles.length > 0 ? (totalTeamSize / managerProfiles.length).toFixed(1) : 0;
    console.log(`Total Team Members Managed: ${totalTeamSize}`);
    console.log(`Average Team Size: ${avgTeamSize}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

testManagerCollection();
