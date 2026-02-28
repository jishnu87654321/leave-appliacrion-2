require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const axios = require("axios");

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  isActive: Boolean,
  department: String,
  designation: String,
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", UserSchema);

async function fixAndTestLogin() {
  console.log('🔧 LOGIN FIX & TEST SCRIPT');
  console.log('='.repeat(70));
  
  try {
    // Step 1: Connect to database
    console.log('\n1️⃣  Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Step 2: Ensure admin user exists and is active
    console.log('\n2️⃣  Checking admin user...');
    const email = "hradmin@gmail.com";
    const password = "password123";
    
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log('   Creating admin user...');
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await User.create({
        name: "HR Admin",
        email: email.toLowerCase(),
        password: hashedPassword,
        role: "HR_ADMIN",
        isActive: true,
        department: "Human Resources",
        designation: "HR Administrator",
      });
      console.log('✅ Admin user created');
    } else {
      console.log('✅ Admin user exists');
      
      // Ensure user is active
      if (!user.isActive) {
        user.isActive = true;
        await user.save();
        console.log('✅ User activated');
      }
      
      // Reset password to ensure it's correct
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      await user.save();
      console.log('✅ Password reset to: password123');
    }

    console.log('\n   User Details:');
    console.log('   Name:', user.name);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Active:', user.isActive);

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');

    // Step 3: Check environment variables
    console.log('\n3️⃣  Checking environment variables...');
    console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '✓ Set' : '✗ Missing');
    console.log('   MONGODB_URI:', process.env.MONGODB_URI ? '✓ Set' : '✗ Missing');
    console.log('   PORT:', process.env.PORT || '5000');
    console.log('   CORS_ORIGIN:', process.env.CORS_ORIGIN || 'http://localhost:3000');

    // Step 4: Test backend server
    console.log('\n4️⃣  Testing backend server...');
    try {
      const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: email,
        password: password
      }, { timeout: 5000 });

      console.log('✅ Backend server is running and login works!');
      console.log('   Token received:', loginResponse.data.token ? '✓' : '✗');
      console.log('   User data:', loginResponse.data.data?.user?.name || 'Unknown');
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('⚠️  Backend server is NOT running');
        console.log('\n📝 Start the backend server:');
        console.log('   Terminal 1: cd backend && npm start');
        console.log('   Terminal 2: npm run dev (for frontend)');
      } else if (error.response) {
        console.log('❌ Login failed with status:', error.response.status);
        console.log('   Error:', error.response.data?.message || 'Unknown');
        
        if (error.response.status === 401) {
          console.log('\n💡 This could mean:');
          console.log('   - JWT_SECRET mismatch');
          console.log('   - Password comparison failing');
          console.log('   - User not found in database');
        }
      } else {
        console.log('❌ Error:', error.message);
      }
    }

    // Final instructions
    console.log('\n' + '='.repeat(70));
    console.log('✅ SETUP COMPLETE - LOGIN CREDENTIALS:');
    console.log('='.repeat(70));
    console.log('Email:    hradmin@gmail.com');
    console.log('Password: password123');
    console.log('Frontend: http://localhost:5173');
    console.log('Backend:  http://localhost:5000');
    console.log('='.repeat(70));
    
    console.log('\n📝 NEXT STEPS:');
    console.log('1. Make sure backend is running: cd backend && npm start');
    console.log('2. Make sure frontend is running: npm run dev');
    console.log('3. Clear browser cache and localStorage');
    console.log('4. Try logging in with the credentials above');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

fixAndTestLogin();
