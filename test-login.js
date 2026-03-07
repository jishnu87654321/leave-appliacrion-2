/**
 * Test login API
 */

const axios = require('axios');

const testLogin = async () => {
  console.log('🧪 Testing Login API...\n');
  
  const credentials = [
    { email: 'Subramanya@aksharaenterprises.info', password: 'password123', role: 'HR Admin' },
    { email: 'johnmanager@gmail.com', password: 'password123', role: 'Manager 1' },
    { email: 'sarahmanager@gmail.com', password: 'password123', role: 'Manager 2' },
  ];
  
  for (const cred of credentials) {
    try {
      console.log(`Testing ${cred.role}: ${cred.email}`);
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email: cred.email,
        password: cred.password
      });
      
      if (response.data.success) {
        console.log(`✅ ${cred.role} login successful`);
        console.log(`   User: ${response.data.data.user.name}`);
        console.log(`   Role: ${response.data.data.user.role}`);
        console.log(`   Token: ${response.data.data.token.substring(0, 20)}...`);
      }
    } catch (error) {
      console.log(`❌ ${cred.role} login failed`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Message: ${error.response.data.message}`);
      } else {
        console.log(`   Error: ${error.message}`);
      }
    }
    console.log();
  }
};

testLogin();
