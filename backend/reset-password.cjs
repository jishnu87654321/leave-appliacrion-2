/**
 * Reset User Password in Production
 */

const mongoose = require('mongoose');
const readline = require('readline');

const PRODUCTION_MONGODB_URI = process.env.PRODUCTION_MONGODB_URI;

if (!PRODUCTION_MONGODB_URI) {
  console.error('❌ Error: PRODUCTION_MONGODB_URI environment variable is not set!');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function resetPassword() {
  try {
    console.log('🔌 Connecting to production database...');
    await mongoose.connect(PRODUCTION_MONGODB_URI);
    console.log('✅ Connected\n');

    const User = require('./models/User');

    const email = await question('Email: ');
    const newPassword = await question('New Password: ');

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log('\n❌ User not found!');
      rl.close();
      await mongoose.connection.close();
      return;
    }

    // Set plain password; User model pre-save hook handles hashing.
    user.password = newPassword;
    // Clear lock state in case account was locked after repeated failures.
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    console.log('\n✅ Password updated and account unlocked successfully!');
    console.log(`\nYou can now login with:`);
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${newPassword}`);

    rl.close();
    await mongoose.connection.close();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

resetPassword();
