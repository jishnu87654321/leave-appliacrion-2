#!/bin/bash

# Quick Start Script for Leave Management System
# This script will set up and start the entire system

echo "╔════════════════════════════════════════════════════════╗"
echo "║   Leave Management System - Quick Start                ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if MongoDB is running
echo "🔍 Checking MongoDB..."
if ! command -v mongosh &> /dev/null; then
    echo -e "${RED}❌ MongoDB is not installed or not in PATH${NC}"
    echo "Please install MongoDB first: https://www.mongodb.com/try/download/community"
    exit 1
fi

if ! mongosh --eval "db.version()" &> /dev/null; then
    echo -e "${YELLOW}⚠️  MongoDB is not running${NC}"
    echo "Please start MongoDB service first"
    echo "  Windows: Start MongoDB service from Services"
    echo "  Mac: brew services start mongodb-community"
    echo "  Linux: sudo systemctl start mongod"
    exit 1
fi

echo -e "${GREEN}✅ MongoDB is running${NC}"

# Check if Node.js is installed
echo ""
echo "🔍 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js ${NODE_VERSION} is installed${NC}"

# Check if backend dependencies are installed
echo ""
echo "📦 Checking backend dependencies..."
if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Backend dependencies not found. Installing...${NC}"
    cd backend
    npm install
    cd ..
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Backend dependencies already installed${NC}"
fi

# Check if frontend dependencies are installed
echo ""
echo "📦 Checking frontend dependencies..."
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Frontend dependencies not found. Installing...${NC}"
    npm install
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Frontend dependencies already installed${NC}"
fi

# Check if .env file exists
echo ""
echo "🔐 Checking environment configuration..."
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  Backend .env file not found. Creating from example...${NC}"
    cp backend/.env.example backend/.env
    echo -e "${GREEN}✅ Backend .env file created${NC}"
    echo -e "${YELLOW}⚠️  Please edit backend/.env with your MongoDB URI if needed${NC}"
else
    echo -e "${GREEN}✅ Backend .env file exists${NC}"
fi

# Check if database is seeded
echo ""
echo "🌱 Checking database..."
DB_CHECK=$(mongosh leave_management --quiet --eval "db.users.countDocuments()" 2>/dev/null)
if [ "$DB_CHECK" = "0" ] || [ -z "$DB_CHECK" ]; then
    echo -e "${YELLOW}⚠️  Database is empty. Seeding...${NC}"
    cd backend
    node seeds/seedData.js
    cd ..
    echo -e "${GREEN}✅ Database seeded successfully${NC}"
else
    echo -e "${GREEN}✅ Database already has data (${DB_CHECK} users)${NC}"
fi

# Run verification
echo ""
echo "🔍 Running system verification..."
node verify-setup.js

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Verification failed. Please fix the errors above.${NC}"
    exit 1
fi

# Start the servers
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║   Starting Servers                                     ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}🚀 Starting backend server...${NC}"
echo "   Backend will run on: http://localhost:5000"
echo ""
echo -e "${GREEN}🚀 Starting frontend server...${NC}"
echo "   Frontend will run on: http://localhost:5173"
echo ""
echo -e "${YELLOW}📝 Default Login Credentials:${NC}"
echo "   HR Admin:  hr@company.com / password123"
echo "   Manager:   john.manager@company.com / password123"
echo "   Employee:  alice@company.com / password123"
echo ""
echo -e "${YELLOW}⚠️  Press Ctrl+C to stop both servers${NC}"
echo ""

# Start backend in background
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend
npm run dev &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
