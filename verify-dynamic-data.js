/**
 * Verification Script for Dynamic Data Implementation
 * Run this after starting the backend to verify all endpoints work
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';
let userId = '';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
};

async function testEndpoint(name, method, url, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };
    
    if (data) config.data = data;
    
    const response = await axios(config);
    log.success(`${name}: ${response.status} ${response.statusText}`);
    return response.data;
  } catch (error) {
    log.error(`${name}: ${error.response?.status || 'ERROR'} - ${error.response?.data?.message || error.message}`);
    return null;
  }
}

async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('DYNAMIC DATA IMPLEMENTATION VERIFICATION');
  console.log('='.repeat(60) + '\n');

  // 1. Test Authentication
  log.info('Testing Authentication...');
  const loginData = await testEndpoint(
    'Login',
    'POST',
    '/auth/login',
    { email: 'admin@company.com', password: 'admin123' }
  );
  
  if (loginData && loginData.token) {
    authToken = loginData.token;
    userId = loginData.data.user._id;
    log.success('Authentication successful');
  } else {
    log.error('Authentication failed - cannot continue tests');
    return;
  }

  const authHeaders = { Authorization: `Bearer ${authToken}` };

  console.log('\n' + '-'.repeat(60));
  log.info('Testing Dashboard Stats Endpoint...');
  console.log('-'.repeat(60));
  
  // 2. Test Dashboard Stats
  const dashboardStats = await testEndpoint(
    'Dashboard Stats',
    'GET',
    '/leaves/stats/dashboard',
    null,
    authHeaders
  );
  
  if (dashboardStats) {
    log.info(`Stats received: ${JSON.stringify(dashboardStats.data.stats, null, 2)}`);
  }

  console.log('\n' + '-'.repeat(60));
  log.info('Testing Leave Management Endpoints...');
  console.log('-'.repeat(60));

  // 3. Test Leave Endpoints
  await testEndpoint('Get My Leaves', 'GET', '/leaves/my-leaves', null, authHeaders);
  await testEndpoint('Get Team Leaves', 'GET', '/leaves/team/requests', null, authHeaders);
  await testEndpoint('Get All Leaves (HR)', 'GET', '/leaves', null, authHeaders);
  await testEndpoint('Get Team Calendar', 'GET', '/leaves/team-calendar?month=1&year=2025', null, authHeaders);

  console.log('\n' + '-'.repeat(60));
  log.info('Testing Report Endpoints...');
  console.log('-'.repeat(60));

  // 4. Test Report Endpoints
  await testEndpoint('Employee Report', 'GET', '/reports/employee', null, authHeaders);
  await testEndpoint('Department Report', 'GET', '/reports/department', null, authHeaders);
  await testEndpoint('Monthly Report', 'GET', '/reports/monthly?year=2025', null, authHeaders);
  await testEndpoint('Audit Trail', 'GET', '/reports/audit-trail?page=1&limit=10', null, authHeaders);

  console.log('\n' + '-'.repeat(60));
  log.info('Testing User Management Endpoints...');
  console.log('-'.repeat(60));

  // 5. Test User Endpoints
  await testEndpoint('Get All Users', 'GET', '/users', null, authHeaders);
  await testEndpoint('Get User by ID', 'GET', `/users/${userId}`, null, authHeaders);

  console.log('\n' + '-'.repeat(60));
  log.info('Testing Leave Type Endpoints...');
  console.log('-'.repeat(60));

  // 6. Test Leave Type Endpoints
  const leaveTypes = await testEndpoint('Get Leave Types', 'GET', '/leave-types', null, authHeaders);

  console.log('\n' + '-'.repeat(60));
  log.info('Testing Notification Endpoints...');
  console.log('-'.repeat(60));

  // 7. Test Notification Endpoints
  await testEndpoint('Get Notifications', 'GET', '/notifications', null, authHeaders);

  console.log('\n' + '='.repeat(60));
  log.success('VERIFICATION COMPLETE');
  console.log('='.repeat(60) + '\n');

  console.log('Next Steps:');
  console.log('1. Start the frontend: npm run dev');
  console.log('2. Login with: admin@company.com / admin123');
  console.log('3. Navigate to each dashboard to verify data');
  console.log('4. Test Reports page with different filters');
  console.log('5. Check Audit Trail page for logged actions');
  console.log('6. Apply for leave and verify auto-refresh');
  console.log('7. Approve/reject leave and verify updates\n');
}

// Run tests
runTests().catch(error => {
  log.error(`Test execution failed: ${error.message}`);
  process.exit(1);
});
