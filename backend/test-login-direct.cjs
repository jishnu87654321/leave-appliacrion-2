/**
 * Test login directly against production database
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const PROD_URI = process.env.PRODUCTION_MONGODB_URI;

async function testLogin() {
  try {
    console.log('Testing login...\n');
    await mongoose.connect(PROD_URI);
    
    const User = require('./models/User');
    
    const email = 'subramanya@aksharaenterprises.info';
    const password = 'Admin@123';
    
    console.log(`Looking for user: ${email}`);
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log('❌ User NOT FOUND in database!\n');
      
      // List all users
      const allUsers = await User.find({}).select('email name role');
      console.log(`Found ${allUsers.length} users in database:`);
      allUsers.forEach(u => console.log(`  - ${u.email} (${u.role})`));
      
      await mongoose.connection.close();
      return;
    }
    
    console.log('✅ User found!');
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.isActive}`);
    console.log(`   Password hash exists: ${!!user.password}`);
    console.log(`   Password hash length: ${user.password ? user.password.length : 0}\n`);
    
    // Test password
    console.log('Testing password...');
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (isMatch) {
      console.log('✅ Password MATCHES!\n');
      console.log('Login should work. If it doesn\'t, the issue is elsewhere.');
    } else {
      console.log('❌ Password DOES NOT MATCH!\n');
      console.log('The password in database is different from what you\'re trying.');
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testLogin();
