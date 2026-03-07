const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testHRAdminLogin() {
  console.log('🔐 Testing HR Admin Login...\n');
  
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'Subramanya@aksharaenterprises.info',
      password: 'admin123'
    });
    
    if (response.data.success) {
      console.log('✅ Login Successful!');
      console.log('User:', response.data.data.user.name);
      console.log('Role:', response.data.data.user.role);
      console.log('Email:', response.data.data.user.email);
      console.log('Token:', response.data.token.substring(0, 20) + '...');
      console.log('\n✅ JWT_SECRET is working correctly!');
    }
  } catch (error) {
    console.error('❌ Login Failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Message:', error.response.data.message || error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    console.log('\n⚠️ Make sure the backend server is running on port 5000');
  }
}

testHRAdminLogin();
