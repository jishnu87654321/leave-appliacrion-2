const axios = require('axios');

async function testLogin() {
  try {
    console.log('🔍 Testing login...\n');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'Subramanya@aksharaenterprises.info',
      password: 'password123'
    });

    console.log('✅ Login successful!');
    console.log('Token:', response.data.token);
    console.log('User:', response.data.data.user);
    console.log('\n' + '='.repeat(50));
    console.log('✅ You can now login with:');
    console.log('Email: Subramanya@aksharaenterprises.info');
    console.log('Password: password123');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('❌ Login failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testLogin();
