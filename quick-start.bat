@echo off
REM Quick Start Script for Leave Management System (Windows)

echo ╔════════════════════════════════════════════════════════╗
echo ║   Leave Management System - Quick Start                ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
echo 🔍 Checking Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed
    echo Please install Node.js: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% is installed
echo.

REM Check if MongoDB is running
echo 🔍 Checking MongoDB...
mongosh --eval "db.version()" >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  MongoDB is not running
    echo Please start MongoDB service from Windows Services
    echo Or run: net start MongoDB
    pause
    exit /b 1
)

echo ✅ MongoDB is running
echo.

REM Check backend dependencies
echo 📦 Checking backend dependencies...
if not exist "backend\node_modules" (
    echo ⚠️  Backend dependencies not found. Installing...
    cd backend
    call npm install
    cd ..
    echo ✅ Backend dependencies installed
) else (
    echo ✅ Backend dependencies already installed
)
echo.

REM Check frontend dependencies
echo 📦 Checking frontend dependencies...
if not exist "node_modules" (
    echo ⚠️  Frontend dependencies not found. Installing...
    call npm install
    echo ✅ Frontend dependencies installed
) else (
    echo ✅ Frontend dependencies already installed
)
echo.

REM Check .env file
echo 🔐 Checking environment configuration...
if not exist "backend\.env" (
    echo ⚠️  Backend .env file not found. Creating from example...
    copy backend\.env.example backend\.env
    echo ✅ Backend .env file created
    echo ⚠️  Please edit backend\.env with your MongoDB URI if needed
) else (
    echo ✅ Backend .env file exists
)
echo.

REM Check if database is seeded
echo 🌱 Checking database...
for /f %%i in ('mongosh leave_management --quiet --eval "db.users.countDocuments()"') do set DB_COUNT=%%i
if "%DB_COUNT%"=="0" (
    echo ⚠️  Database is empty. Seeding...
    cd backend
    node seeds\seedData.js
    cd ..
    echo ✅ Database seeded successfully
) else (
    echo ✅ Database already has data (%DB_COUNT% users)
)
echo.

REM Run verification
echo 🔍 Running system verification...
node verify-setup.js
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Verification failed. Please fix the errors above.
    pause
    exit /b 1
)
echo.

REM Start servers
echo ╔════════════════════════════════════════════════════════╗
echo ║   Starting Servers                                     ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo 🚀 Starting backend server...
echo    Backend will run on: http://localhost:5000
echo.
echo 🚀 Starting frontend server...
echo    Frontend will run on: http://localhost:5173
echo.
echo 📝 Default Login Credentials:
echo    HR Admin:  hr@company.com / password123
echo    Manager:   john.manager@company.com / password123
echo    Employee:  alice@company.com / password123
echo.
echo ⚠️  Press Ctrl+C to stop both servers
echo.

REM Start backend in new window
start "Backend Server" cmd /k "cd backend && npm start"

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in new window
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ✅ Both servers are starting in separate windows
echo.
echo 📖 Documentation:
echo    - SETUP_GUIDE.md - Complete setup instructions
echo    - TEST_INTEGRATION.md - Testing guide
echo    - USER_APPROVAL_GUIDE.md - User approval workflow
echo    - SYSTEM_OVERVIEW.md - Complete system overview
echo.
pause
