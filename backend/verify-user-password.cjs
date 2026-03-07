require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function verifyUserPassword() {
  try {
    console.log('🔍 Verifying User Password\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String,
      isActive: Boolean,
    }));

    const user = await User.findOne({ email: 'Subramanya@aksharaenterprises.info' }).select('+password');
    
    if (!user) {
      console.log('❌ User not found!');
      await mongoose.connection.close();
      return;
    }

    console.log('User found:');
    console.log('  Name:', user.name);
    console.log('  Email:', user.email);
    console.log('  Role:', user.role);
    console.log('  Active:', user.isActive);
    console.log('  Password hash:', user.password.substring(0, 30) + '...');
    console.log('  Hash length:', user.password.length);
    
    // Test password comparison
    console.log('\n🔐 Testing password comparison...');
    const testPassword = 'admin123';
    
    try {
      const isMatch = await bcrypt.compare(testPassword, user.password);
      console.log('  Password "admin123":', isMatch ? '✅ MATCHES' : '❌ DOES NOT MATCH');
      
      if (!isMatch) {
        console.log('\n🔧 Password does not match. Resetting...');
        
        // Hash the password properly
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(testPassword, salt);
        
        // Update directly without triggering pre-save hook
        await User.updateOne(
          { email: 'Subramanya@aksharaenterprises.info' },
          { 
            $set: { 
              password: hashedPassword,
              isActive: true 
            } 
          }
        );
        
        console.log('✅ Password reset successfully');
        
        // Verify the new password
        const updatedUser = await User.findOne({ email: 'Subramanya@aksharaenterprises.info' }).select('+password');
        const newMatch = await bcrypt.compare(testPassword, updatedUser.password);
        console.log('  Verification:', newMatch ? '✅ Password now works!' : '❌ Still not working');
      }
    } catch (error) {
      console.log('❌ Error comparing password:', error.message);
    }

    await mongoose.connection.close();
    console.log('\n✅ Done');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyUserPassword();
