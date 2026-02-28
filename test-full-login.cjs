const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testFullLogin() {
  console.log('🔍 Testing Login System\n');
  console.log('='.repeat(60));
  
  // Step 1: Check if backend is running
  console.log('\n1️⃣  Checking if backend server is running...');
  try {
    await axios.get(`${API_URL}/health`, { timeout: 3000 });
    console.log('✅ Backend server is running');
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend server is NOT running!');
      console.log('\n📝 To start the backend server:');
      console.log('   cd backend');
      console.log('   npm start');
      console.log('\nOr run from root:');
      console.log('   npm run dev\n');
      return;
    }
    console.log('⚠️  Health endpoint not found, but server might be running');
  }

  // Step 2: Test login
  console.log('\n2️⃣  Testing login with credentials...');
  console.log('   Email: hradmin@gmail.com');
  console.log('   Password: password123');
  
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'hradmin@gmail.com',
      password: 'password123'
    }, { timeout: 5000 });

    console.log('\n✅ LOGIN SUCCESSFUL!');
    console.log('\n📦 Response Data:');
    console.log('   Token:', response.data.token ? '✓ Received' : '✗ Missing');
    console.log('   User:', response.data.data?.user?.name || 'Unknown');
    console.log('   Role:', response.data.data?.user?.role || 'Unknown');
    console.log('   Email:', response.data.data?.user?.email || 'Unknown');
    console.log('   Active:', response.data.data?.user?.isActive ? '✓ Yes' : '✗ No');
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ YOU CAN NOW LOGIN TO THE FRONTEND');
    console.log('='.repeat(60));
    console.log('Email:    hradmin@gmail.com');
    console.log('Password: password123');
    console.log('URL:      http://localhost:5173');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.log('\n❌ LOGIN FAILED!');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔴 Error: Cannot connect to backend server');
      console.log('   The backend server is not running on http://localhost:5000');
      console.log('\n📝 Start the backend server:');
      console.log('   cd backend');
      console.log('   npm start');
    } else if (error.response) {
      console.log('\n🔴 Server Response:');
      console.log('   Status:', error.response.status);
      console.log('   Message:', error.response.data?.message || 'Unknown error');
      
      if (error.response.status === 401) {
        console.log('\n💡 This means:');
        console.log('   - Invalid email or password, OR');
        console.log('   - User account is not active');
        console.log('\n📝 Run this to recreate the admin user:');
        console.log('   cd backend');
        console.log('   node debug-login.cjs');
      } else if (error.response.status === 403) {
        console.log('\n💡 Account not activated. Run:');
        console.log('   cd backend');
        console.log('   node debug-login.cjs');
      }
    } else {
      console.log('\n🔴 Error:', error.message);
    }
  }
}

testFullLogin();
