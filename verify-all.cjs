/**
 * Comprehensive Verification Script
 * Checks all critical files and configurations
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Starting comprehensive verification...\n');

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0
};

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description}: ${filePath}`);
    checks.passed++;
    return true;
  } else {
    console.log(`❌ ${description}: ${filePath} - NOT FOUND`);
    checks.failed++;
    return false;
  }
}

function checkDirectory(dirPath, description) {
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    console.log(`✅ ${description}: ${dirPath}`);
    checks.passed++;
    return true;
  } else {
    console.log(`❌ ${description}: ${dirPath} - NOT FOUND`);
    checks.failed++;
    return false;
  }
}

console.log('📁 Checking Project Structure...\n');

// Frontend files
checkFile('src/app/App.tsx', 'Main App Component');
checkFile('src/app/context/AuthContext.tsx', 'Auth Context');
checkFile('src/app/context/LeaveContext.tsx', 'Leave Context');
checkFile('src/app/services/api.ts', 'API Service');
checkFile('src/app/services/leaveService.ts', 'Leave Service');

console.log('\n📄 Checking Page Components...\n');

// Employee pages
checkFile('src/app/pages/employee/ApplyLeave.tsx', 'Apply Leave Page');
checkFile('src/app/pages/employee/LeaveHistory.tsx', 'Leave History Page');
checkFile('src/app/pages/employee/Dashboard.tsx', 'Employee Dashboard');

// Manager pages
checkFile('src/app/pages/manager/TeamRequests.tsx', 'Team Requests Page');
checkFile('src/app/pages/manager/TeamMembers.tsx', 'Team Members Page');
checkFile('src/app/pages/manager/Dashboard.tsx', 'Manager Dashboard');

// HR pages
checkFile('src/app/pages/hr/AllRequests.tsx', 'All Requests Page');
checkFile('src/app/pages/hr/UserManagement.tsx', 'User Management Page');
checkFile('src/app/pages/hr/LeavePolicy.tsx', 'Leave Policy Page');
checkFile('src/app/pages/hr/AuditTrail.tsx', 'Audit Trail Page');
checkFile('src/app/pages/hr/Reports.tsx', 'Reports Page');

console.log('\n🔧 Checking Backend Files...\n');

// Backend structure
checkDirectory('backend', 'Backend Directory');
checkFile('backend/server.js', 'Server Entry Point');
checkFile('backend/package.json', 'Backend Package.json');

// Controllers
checkFile('backend/controllers/authController.js', 'Auth Controller');
checkFile('backend/controllers/leaveController.js', 'Leave Controller');
checkFile('backend/controllers/userController.js', 'User Controller');
checkFile('backend/controllers/hrOverrideController.js', 'HR Override Controller');

// Models
checkFile('backend/models/User.js', 'User Model');
checkFile('backend/models/LeaveRequest.js', 'Leave Request Model');
checkFile('backend/models/LeaveType.js', 'Leave Type Model');
checkFile('backend/models/AuditTrail.js', 'Audit Trail Model');
checkFile('backend/models/Notification.js', 'Notification Model');

// Services
checkFile('backend/services/leaveBalanceService.js', 'Leave Balance Service');
checkFile('backend/services/emailService.js', 'Email Service');
checkFile('backend/services/notificationService.js', 'Notification Service');

// Middleware
checkFile('backend/middleware/auth.js', 'Auth Middleware');
checkFile('backend/middleware/roleCheck.js', 'Role Check Middleware');
checkFile('backend/middleware/errorHandler.js', 'Error Handler');

console.log('\n⚙️  Checking Configuration Files...\n');

// Config files
checkFile('package.json', 'Frontend Package.json');
checkFile('vite.config.ts', 'Vite Config');
checkFile('tsconfig.json', 'TypeScript Config');
checkFile('tailwind.config.js', 'Tailwind Config');

// Environment files
if (checkFile('.env', 'Frontend Environment')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  if (envContent.includes('VITE_API_URL')) {
    console.log('  ✅ VITE_API_URL configured');
  } else {
    console.log('  ⚠️  VITE_API_URL not found in .env');
    checks.warnings++;
  }
}

if (checkFile('backend/.env', 'Backend Environment')) {
  const backendEnv = fs.readFileSync('backend/.env', 'utf8');
  if (backendEnv.includes('MONGODB_URI')) {
    console.log('  ✅ MONGODB_URI configured');
  } else {
    console.log('  ⚠️  MONGODB_URI not found in backend/.env');
    checks.warnings++;
  }
  if (backendEnv.includes('JWT_SECRET')) {
    console.log('  ✅ JWT_SECRET configured');
  } else {
    console.log('  ⚠️  JWT_SECRET not found in backend/.env');
    checks.warnings++;
  }
}

console.log('\n📊 Verification Summary\n');
console.log('='.repeat(50));
console.log(`✅ Passed: ${checks.passed}`);
console.log(`❌ Failed: ${checks.failed}`);
console.log(`⚠️  Warnings: ${checks.warnings}`);
console.log('='.repeat(50));

if (checks.failed === 0) {
  console.log('\n🎉 All critical files are present!');
  console.log('\n📝 Next Steps:');
  console.log('1. Start backend: cd backend && npm start');
  console.log('2. Start frontend: npm run dev');
  console.log('3. Open http://localhost:5173');
  console.log('4. Login with test credentials (see FINAL_STATUS.md)');
} else {
  console.log('\n⚠️  Some files are missing. Please check the errors above.');
}

console.log('\n✨ Verification complete!\n');
