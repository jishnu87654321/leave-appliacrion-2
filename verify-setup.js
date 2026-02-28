#!/usr/bin/env node

/**
 * Setup Verification Script
 * Checks if all components are properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Leave Management System Setup...\n');

let errors = [];
let warnings = [];
let success = [];

// Check 1: Backend files
console.log('📁 Checking Backend Structure...');
const backendFiles = [
  'backend/server.js',
  'backend/.env',
  'backend/package.json',
  'backend/config/db.js',
  'backend/models/User.js',
  'backend/models/LeaveRequest.js',
  'backend/models/LeaveType.js',
  'backend/controllers/authController.js',
  'backend/controllers/userController.js',
  'backend/controllers/leaveController.js',
  'backend/routes/authRoutes.js',
  'backend/routes/userRoutes.js',
  'backend/routes/leaveRoutes.js',
  'backend/middleware/auth.js',
  'backend/middleware/roleCheck.js',
];

backendFiles.forEach(file => {
  if (fs.existsSync(file)) {
    success.push(`✅ ${file}`);
  } else {
    errors.push(`❌ Missing: ${file}`);
  }
});

// Check 2: Frontend files
console.log('\n📁 Checking Frontend Structure...');
const frontendFiles = [
  'src/main.tsx',
  'src/app/App.tsx',
  'src/app/services/api.ts',
  'src/app/services/authService.ts',
  'src/app/services/userService.ts',
  'src/app/services/leaveService.ts',
  'src/app/context/AuthContext.tsx',
  'src/app/context/LeaveContext.tsx',
  'src/app/pages/auth/Login.tsx',
  'src/app/pages/hr/UserManagement.tsx',
  'src/app/pages/employee/ApplyLeave.tsx',
  'index.html',
  'vite.config.ts',
  'package.json',
];

frontendFiles.forEach(file => {
  if (fs.existsSync(file)) {
    success.push(`✅ ${file}`);
  } else {
    errors.push(`❌ Missing: ${file}`);
  }
});

// Check 3: Environment files
console.log('\n🔐 Checking Environment Configuration...');
if (fs.existsSync('backend/.env')) {
  const envContent = fs.readFileSync('backend/.env', 'utf8');
  
  const requiredVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'PORT',
    'NODE_ENV'
  ];
  
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      success.push(`✅ ${varName} configured`);
    } else {
      errors.push(`❌ Missing environment variable: ${varName}`);
    }
  });
} else {
  errors.push('❌ backend/.env file not found');
}

if (fs.existsSync('.env')) {
  const frontendEnv = fs.readFileSync('.env', 'utf8');
  if (frontendEnv.includes('VITE_API_URL')) {
    success.push('✅ Frontend API URL configured');
  } else {
    warnings.push('⚠️  VITE_API_URL not set in .env');
  }
} else {
  warnings.push('⚠️  Frontend .env file not found (optional)');
}

// Check 4: Dependencies
console.log('\n📦 Checking Dependencies...');
if (fs.existsSync('backend/node_modules')) {
  success.push('✅ Backend dependencies installed');
} else {
  errors.push('❌ Backend dependencies not installed. Run: cd backend && npm install');
}

if (fs.existsSync('node_modules')) {
  success.push('✅ Frontend dependencies installed');
} else {
  errors.push('❌ Frontend dependencies not installed. Run: npm install');
}

// Check 5: Package.json scripts
console.log('\n📜 Checking Scripts...');
const backendPkg = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
if (backendPkg.scripts && backendPkg.scripts.start) {
  success.push('✅ Backend start script configured');
} else {
  errors.push('❌ Backend start script missing');
}

const frontendPkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (frontendPkg.scripts && frontendPkg.scripts.dev) {
  success.push('✅ Frontend dev script configured');
} else {
  errors.push('❌ Frontend dev script missing');
}

// Check 6: API Integration
console.log('\n🔌 Checking API Integration...');
const apiFile = fs.readFileSync('src/app/services/api.ts', 'utf8');
if (apiFile.includes('axios.create')) {
  success.push('✅ Axios configured');
} else {
  errors.push('❌ Axios not properly configured');
}

if (apiFile.includes('Authorization')) {
  success.push('✅ JWT token interceptor configured');
} else {
  errors.push('❌ JWT interceptor missing');
}

// Check 7: Authentication
console.log('\n🔐 Checking Authentication Setup...');
const authController = fs.readFileSync('backend/controllers/authController.js', 'utf8');
if (authController.includes('bcrypt')) {
  success.push('✅ Password hashing configured');
} else {
  errors.push('❌ Password hashing not configured');
}

if (authController.includes('jwt.sign')) {
  success.push('✅ JWT token generation configured');
} else {
  errors.push('❌ JWT token generation missing');
}

// Check 8: Database Models
console.log('\n🗄️  Checking Database Models...');
const models = ['User', 'LeaveRequest', 'LeaveType', 'Notification', 'AuditTrail'];
models.forEach(model => {
  const modelPath = `backend/models/${model}.js`;
  if (fs.existsSync(modelPath)) {
    success.push(`✅ ${model} model exists`);
  } else {
    errors.push(`❌ Missing model: ${model}`);
  }
});

// Print Results
console.log('\n' + '='.repeat(60));
console.log('📊 VERIFICATION RESULTS');
console.log('='.repeat(60));

if (errors.length > 0) {
  console.log('\n❌ ERRORS:');
  errors.forEach(err => console.log(err));
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  warnings.forEach(warn => console.log(warn));
}

console.log(`\n✅ SUCCESS: ${success.length} checks passed`);
console.log(`❌ ERRORS: ${errors.length} issues found`);
console.log(`⚠️  WARNINGS: ${warnings.length} warnings`);

console.log('\n' + '='.repeat(60));

if (errors.length === 0) {
  console.log('\n🎉 All checks passed! Your system is ready to run.');
  console.log('\n📝 Next Steps:');
  console.log('1. Start MongoDB: mongod');
  console.log('2. Seed database: cd backend && node seeds/seedData.js');
  console.log('3. Start backend: cd backend && npm start');
  console.log('4. Start frontend: npm run dev');
  console.log('5. Open browser: http://localhost:5173');
  console.log('\n📚 Documentation:');
  console.log('- Setup Guide: SETUP_GUIDE.md');
  console.log('- Testing Guide: TEST_INTEGRATION.md');
  console.log('- User Approval: USER_APPROVAL_GUIDE.md');
  process.exit(0);
} else {
  console.log('\n⚠️  Please fix the errors above before running the system.');
  console.log('📖 Refer to SETUP_GUIDE.md for detailed instructions.');
  process.exit(1);
}
