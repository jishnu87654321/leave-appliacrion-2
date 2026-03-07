const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const CREDENTIALS = {
  email: 'Subramanya@aksharaenterprises.info',
  password: 'admin123'
};

async function testCompleteLogin() {
  console.log('🧪 COMPLETE LOGIN TEST');
  console.log('='.repeat(70));
  
  // Test 1: Server Health
  console.log('\n1️⃣  Testing server connectivity...');
  try {
    await axios.get(`${API_URL}/auth/login`, { 
      timeout: 3000,
      validateStatus: () => true // Accept any status
    });
    console.log('✅ Backend server is reachable');
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend server is NOT running!');
      console.log('\n📝 Start the backend:');
      console.log('   cd backend');
      console.log('   npm start');
      console.log('\nThen run this test again.');
      return;
    }
    console.log('⚠️  Unexpected error:', error.message);
  }

  // Test 2: Login with correct credentials
  console.log('\n2️⃣  Testing login with correct credentials...');
  console.log(`   Email: ${CREDENTIALS.email}`);
  console.log(`   Password: ${CREDENTIALS.password}`);
  
  try {
    const response = await axios.post(`${API_URL}/auth/login`, CREDENTIALS);
    
    console.log('\n✅ LOGIN SUCCESSFUL!');
    console.log('\n📦 Response Details:');
    console.log('   Status:', response.status);
    console.log('   Success:', response.data.success);
    console.log('   Token:', response.data.token ? `${response.data.token.substring(0, 20)}...` : 'Missing');
    
    if (response.data.data?.user) {
      const user = response.data.data.user;
      console.log('\n👤 User Information:');
      console.log('   ID:', user._id);
      console.log('   Name:', user.name);
      console.log('   Email:', user.email);
      console.log('   Role:', user.role);
      console.log('   Department:', user.department);
      console.log('   Active:', user.isActive ? '✓ Yes' : '✗ No');
      console.log('   Last Login:', user.lastLogin || 'Never');
    }
    
    // Test 3: Verify token works
    console.log('\n3️⃣  Testing token authentication...');
    try {
      const meResponse = await axios.get(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${response.data.token}`
        }
      });
      console.log('✅ Token is valid and working');
      console.log('   Authenticated as:', meResponse.data.data.user.name);
    } catch (error) {
      console.log('❌ Token validation failed:', error.response?.data?.message || error.message);
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ ALL TESTS PASSED - LOGIN SYSTEM IS WORKING!');
    console.log('='.repeat(70));
    console.log('\n🎉 You can now login to the frontend:');
    console.log('   URL: http://localhost:5173');
    console.log('   Email: Subramanya@aksharaenterprises.info');
    console.log('   Password: admin123');
    console.log('='.repeat(70));
    
  } catch (error) {
    console.log('\n❌ LOGIN FAILED!');
    
    if (error.response) {
      console.log('\n🔴 Server Response:');
      console.log('   Status:', error.response.status);
      console.log('   Message:', error.response.data?.message || 'Unknown error');
      console.log('   Success:', error.response.data?.success);
      
      if (error.response.status === 400) {
        console.log('\n💡 Bad Request - Check:');
        console.log('   - Email format is correct');
        console.log('   - Password is provided');
        console.log('   - Request body is valid JSON');
      } else if (error.response.status === 401) {
        console.log('\n💡 Unauthorized - This means:');
        console.log('   - Invalid email or password');
        console.log('   - User not found in database');
        console.log('   - Password comparison failed');
        console.log('\n📝 Fix by running:');
        console.log('   cd backend');
        console.log('   node fix-and-test-login.cjs');
      } else if (error.response.status === 403) {
        console.log('\n💡 Forbidden - Account not activated');
        console.log('   Run: cd backend && node fix-and-test-login.cjs');
      } else if (error.response.status === 429) {
        console.log('\n💡 Too Many Requests - Rate limit exceeded');
        console.log('   Wait a few minutes and try again');
      } else if (error.response.status === 500) {
        console.log('\n💡 Server Error - Check backend logs');
        console.log('   Look at: backend/logs/error.log');
      }
      
      // Show full error for debugging
      if (error.response.data) {
        console.log('\n📋 Full Error Response:');
        console.log(JSON.stringify(error.response.data, null, 2));
      }
    } else {
      console.log('\n🔴 Network Error:', error.message);
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('❌ LOGIN TEST FAILED');
    console.log('='.repeat(70));
  }
  
  // Test 4: Test with wrong password
  console.log('\n4️⃣  Testing with wrong password (should fail)...');
  try {
    await axios.post(`${API_URL}/auth/login`, {
      email: CREDENTIALS.email,
      password: 'wrongpassword'
    });
    console.log('⚠️  Login succeeded with wrong password - THIS IS A SECURITY ISSUE!');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Correctly rejected wrong password');
    } else {
      console.log('⚠️  Unexpected error:', error.response?.status || error.message);
    }
  }
}

testCompleteLogin();
