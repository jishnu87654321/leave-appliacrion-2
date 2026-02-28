/**
 * Test script to verify approval/rejection endpoints
 * Run with: node test-approval-endpoints.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test credentials
const MANAGER_CREDS = {
  email: 'john.manager@company.com',
  password: 'password123'
};

const HR_CREDS = {
  email: 'admin@company.com',
  password: 'admin123'
};

let managerToken = '';
let hrToken = '';

async function login(credentials) {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, credentials);
    return response.data.data.token;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function getTeamLeaves(token) {
  try {
    const response = await axios.get(`${API_BASE}/leaves/team/requests`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data.leaves;
  } catch (error) {
    console.error('Get team leaves failed:', error.response?.data || error.message);
    return [];
  }
}

async function getAllLeaves(token) {
  try {
    const response = await axios.get(`${API_BASE}/leaves`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data.leaves;
  } catch (error) {
    console.error('Get all leaves failed:', error.response?.data || error.message);
    return [];
  }
}

async function testManagerApprove(token, leaveId) {
  try {
    console.log(`\n🧪 Testing Manager Approve: ${leaveId}`);
    const response = await axios.put(
      `${API_BASE}/leaves/${leaveId}/approve`,
      { comment: 'Test approval from script' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✅ Manager Approve Success:', response.data.message);
    return true;
  } catch (error) {
    console.error('❌ Manager Approve Failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testManagerReject(token, leaveId) {
  try {
    console.log(`\n🧪 Testing Manager Reject: ${leaveId}`);
    const response = await axios.put(
      `${API_BASE}/leaves/${leaveId}/reject`,
      { comment: 'Test rejection from script' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✅ Manager Reject Success:', response.data.message);
    return true;
  } catch (error) {
    console.error('❌ Manager Reject Failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testHROverride(token, leaveId, status) {
  try {
    console.log(`\n🧪 Testing HR Override ${status}: ${leaveId}`);
    const response = await axios.put(
      `${API_BASE}/leaves/${leaveId}/override`,
      { 
        status: status,
        comment: `Test ${status.toLowerCase()} from script` 
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✅ HR Override Success:', response.data.message);
    return true;
  } catch (error) {
    console.error('❌ HR Override Failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Approval Endpoints Test\n');
  console.log('=' .repeat(60));

  try {
    // Login as manager
    console.log('\n📝 Logging in as Manager...');
    managerToken = await login(MANAGER_CREDS);
    console.log('✅ Manager login successful');

    // Login as HR
    console.log('\n📝 Logging in as HR Admin...');
    hrToken = await login(HR_CREDS);
    console.log('✅ HR Admin login successful');

    // Get team leaves for manager
    console.log('\n📋 Fetching team leaves for manager...');
    const teamLeaves = await getTeamLeaves(managerToken);
    console.log(`Found ${teamLeaves.length} team leave requests`);

    // Get all leaves for HR
    console.log('\n📋 Fetching all leaves for HR...');
    const allLeaves = await getAllLeaves(hrToken);
    console.log(`Found ${allLeaves.length} total leave requests`);

    // Find pending requests
    const pendingTeamLeaves = teamLeaves.filter(l => l.status === 'PENDING');
    const pendingAllLeaves = allLeaves.filter(l => l.status === 'PENDING');

    console.log(`\n📊 Pending Requests:`);
    console.log(`   Manager's team: ${pendingTeamLeaves.length}`);
    console.log(`   All requests: ${pendingAllLeaves.length}`);

    if (pendingTeamLeaves.length > 0) {
      const testLeave = pendingTeamLeaves[0];
      console.log(`\n🎯 Testing with leave request: ${testLeave._id}`);
      console.log(`   Employee: ${testLeave.employee?.name || 'N/A'}`);
      console.log(`   Leave Type: ${testLeave.leaveType?.name || 'N/A'}`);
      console.log(`   Days: ${testLeave.totalDays}`);

      // Test manager approve (comment this out if you don't want to actually approve)
      // await testManagerApprove(managerToken, testLeave._id);
      
      console.log('\n⚠️  Skipping actual approval to preserve test data');
      console.log('   Uncomment the line in the script to test actual approval');
    } else {
      console.log('\n⚠️  No pending team leaves found for manager testing');
    }

    if (pendingAllLeaves.length > 0) {
      const testLeave = pendingAllLeaves[0];
      console.log(`\n🎯 HR Override test available for: ${testLeave._id}`);
      
      // Test HR override (comment this out if you don't want to actually override)
      // await testHROverride(hrToken, testLeave._id, 'APPROVED');
      
      console.log('\n⚠️  Skipping actual override to preserve test data');
      console.log('   Uncomment the line in the script to test actual override');
    } else {
      console.log('\n⚠️  No pending leaves found for HR override testing');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test completed successfully!');
    console.log('\n💡 Tips:');
    console.log('   - Uncomment test functions to actually approve/reject');
    console.log('   - Check backend logs for detailed error messages');
    console.log('   - Ensure MongoDB is running and seeded with test data');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
main();
