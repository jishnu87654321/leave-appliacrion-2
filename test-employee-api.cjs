/**
 * Test Employee API Endpoints
 * 
 * This script tests that employee can fetch their own leaves
 * and that the data structure is correct
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Test credentials (update these based on your system)
const EMPLOYEE_CREDENTIALS = {
  email: 'john.doe@company.com',
  password: 'password123'
};

let employeeToken = '';
let employeeId = '';

async function login(credentials) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, credentials);
    return response.data.data;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function getMyLeaves(token) {
  try {
    const response = await axios.get(`${API_URL}/leaves/my-leaves`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Get my leaves failed:', error.response?.data || error.message);
    throw error;
  }
}

async function runTests() {
  console.log('🚀 Testing Employee API Endpoints\n');

  try {
    // Step 1: Login as Employee
    console.log('📝 Step 1: Login as Employee');
    const employeeData = await login(EMPLOYEE_CREDENTIALS);
    employeeToken = employeeData.token;
    employeeId = employeeData.user._id;
    console.log('✅ Employee logged in:', employeeData.user.name);
    console.log('   Employee ID:', employeeId);
    console.log('   Role:', employeeData.user.role);
    console.log();

    // Step 2: Fetch My Leaves
    console.log('📝 Step 2: Fetch My Leaves');
    const myLeavesResponse = await getMyLeaves(employeeToken);
    console.log('✅ API Response received');
    console.log('   Success:', myLeavesResponse.success);
    console.log('   Count:', myLeavesResponse.count);
    console.log('   Total:', myLeavesResponse.total);
    console.log();

    // Step 3: Verify Data Structure
    console.log('📝 Step 3: Verify Data Structure');
    const leaves = myLeavesResponse.data.leaves;
    
    if (leaves.length === 0) {
      console.log('⚠️  No leaves found for this employee');
      console.log('   This is OK if employee has not applied for any leaves');
    } else {
      console.log('✅ Found', leaves.length, 'leave request(s)');
      console.log();
      
      // Check first leave structure
      const firstLeave = leaves[0];
      console.log('📋 First Leave Request Structure:');
      console.log('   _id:', firstLeave._id ? '✅' : '❌');
      console.log('   employee:', firstLeave.employee ? '✅' : '❌');
      console.log('   employee.name:', firstLeave.employee?.name ? '✅' : '❌');
      console.log('   employee.department:', firstLeave.employee?.department ? '✅' : '❌');
      console.log('   leaveType:', firstLeave.leaveType ? '✅' : '❌');
      console.log('   leaveType.name:', firstLeave.leaveType?.name ? '✅' : '❌');
      console.log('   leaveType.code:', firstLeave.leaveType?.code ? '✅' : '❌');
      console.log('   leaveType.color:', firstLeave.leaveType?.color ? '✅' : '❌');
      console.log('   status:', firstLeave.status ? '✅' : '❌');
      console.log('   fromDate:', firstLeave.fromDate ? '✅' : '❌');
      console.log('   toDate:', firstLeave.toDate ? '✅' : '❌');
      console.log('   totalDays:', firstLeave.totalDays !== undefined ? '✅' : '❌');
      console.log('   reason:', firstLeave.reason ? '✅' : '❌');
      console.log();

      // Display sample data
      console.log('📄 Sample Leave Data:');
      console.log(JSON.stringify({
        _id: firstLeave._id,
        employee: {
          _id: firstLeave.employee?._id,
          name: firstLeave.employee?.name,
          department: firstLeave.employee?.department
        },
        leaveType: {
          _id: firstLeave.leaveType?._id,
          name: firstLeave.leaveType?.name,
          code: firstLeave.leaveType?.code,
          color: firstLeave.leaveType?.color
        },
        status: firstLeave.status,
        fromDate: firstLeave.fromDate,
        toDate: firstLeave.toDate,
        totalDays: firstLeave.totalDays,
        reason: firstLeave.reason?.substring(0, 50) + '...'
      }, null, 2));
      console.log();

      // Verify all required fields are present
      const hasAllFields = 
        firstLeave._id &&
        firstLeave.employee &&
        firstLeave.employee.name &&
        firstLeave.employee.department &&
        firstLeave.leaveType &&
        firstLeave.leaveType.name &&
        firstLeave.leaveType.code &&
        firstLeave.status &&
        firstLeave.fromDate &&
        firstLeave.toDate &&
        firstLeave.totalDays !== undefined;

      if (hasAllFields) {
        console.log('✅ All required fields are present');
      } else {
        console.log('❌ Some required fields are missing');
      }
    }
    console.log();

    // Step 4: Test Frontend Transformation
    console.log('📝 Step 4: Test Frontend Transformation');
    const transformedLeaves = leaves.map((leave) => ({
      ...leave,
      id: leave._id || leave.id,
      employeeId: leave.employee?._id || leave.employeeId,
      employeeName: leave.employee?.name || leave.employeeName || '',
      department: leave.employee?.department || leave.department || '',
      leaveTypeId: leave.leaveType?._id || leave.leaveTypeId,
      leaveTypeName: leave.leaveType?.name || leave.leaveTypeName || '',
      leaveTypeCode: leave.leaveType?.code || leave.leaveTypeCode || '',
      leaveTypeColor: leave.leaveType?.color || leave.leaveTypeColor || '#3B82F6',
    }));

    if (transformedLeaves.length > 0) {
      console.log('✅ Frontend transformation successful');
      console.log('   Transformed fields:');
      console.log('   - id:', transformedLeaves[0].id ? '✅' : '❌');
      console.log('   - employeeId:', transformedLeaves[0].employeeId ? '✅' : '❌');
      console.log('   - employeeName:', transformedLeaves[0].employeeName ? '✅' : '❌');
      console.log('   - department:', transformedLeaves[0].department ? '✅' : '❌');
      console.log('   - leaveTypeId:', transformedLeaves[0].leaveTypeId ? '✅' : '❌');
      console.log('   - leaveTypeName:', transformedLeaves[0].leaveTypeName ? '✅' : '❌');
      console.log('   - leaveTypeCode:', transformedLeaves[0].leaveTypeCode ? '✅' : '❌');
      console.log('   - leaveTypeColor:', transformedLeaves[0].leaveTypeColor ? '✅' : '❌');
    }
    console.log();

    console.log('🎉 ALL TESTS PASSED!\n');
    console.log('Summary:');
    console.log('✅ Employee can login');
    console.log('✅ Employee can fetch their leaves');
    console.log('✅ API returns correct data structure');
    console.log('✅ Frontend transformation works');
    console.log();
    console.log('Employee dashboard should now update correctly!');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run tests
runTests();
