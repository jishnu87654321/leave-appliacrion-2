require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function updateManagerEmails() {
  try {
    console.log('🔧 Updating Manager Emails to @gmail.com\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String,
      isActive: Boolean,
      department: String,
      designation: String,
    }));

    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update or create managers
    const managers = [
      {
        oldEmail: 'john.manager@company.com',
        newEmail: 'johnmanager@gmail.com',
        name: 'John Manager',
        department: 'Engineering',
        designation: 'Engineering Manager'
      },
      {
        oldEmail: 'sarah.manager@company.com',
        newEmail: 'sarahmanager@gmail.com',
        name: 'Sarah Manager',
        department: 'Marketing',
        designation: 'Marketing Manager'
      }
    ];

    console.log('📝 Updating managers...\n');

    for (const manager of managers) {
      // Check if old email exists
      const oldUser = await User.findOne({ email: manager.oldEmail });
      
      if (oldUser) {
        // Update existing user
        await User.updateOne(
          { email: manager.oldEmail },
          { 
            $set: { 
              email: manager.newEmail,
              password: hashedPassword,
              isActive: true,
              name: manager.name,
              department: manager.department,
              designation: manager.designation
            } 
          }
        );
        console.log(`✅ Updated: ${manager.oldEmail} → ${manager.newEmail}`);
      } else {
        // Check if new email already exists
        const existingUser = await User.findOne({ email: manager.newEmail });
        
        if (existingUser) {
          // Update password and activate
          await User.updateOne(
            { email: manager.newEmail },
            { 
              $set: { 
                password: hashedPassword,
                isActive: true
              } 
            }
          );
          console.log(`✅ Updated existing: ${manager.newEmail}`);
        } else {
          // Create new user
          await User.create({
            name: manager.name,
            email: manager.newEmail,
            password: hashedPassword,
            role: 'MANAGER',
            isActive: true,
            department: manager.department,
            designation: manager.designation,
            leaveBalances: []
          });
          console.log(`✅ Created: ${manager.newEmail}`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ MANAGER ACCOUNTS READY');
    console.log('='.repeat(60));
    
    // Verify and display all managers
    const allManagers = await User.find({ role: 'MANAGER' }).select('name email role isActive');
    console.log('\n👔 All Manager Accounts:\n');
    
    allManagers.forEach(mgr => {
      console.log(`   Name:   ${mgr.name}`);
      console.log(`   Email:  ${mgr.email}`);
      console.log(`   Active: ${mgr.isActive ? '✓' : '✗'}`);
      console.log(`   Password: password123`);
      console.log('');
    });

    console.log('='.repeat(60));
    console.log('🎉 You can now login with these credentials!');
    console.log('='.repeat(60));

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateManagerEmails();
