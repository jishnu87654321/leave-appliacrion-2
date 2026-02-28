# Leave Management System

A comprehensive, production-ready Leave Management System with full-stack implementation using React, Node.js, Express, and MongoDB.

## 🌟 Features

### ✅ Complete Backend Integration
- **No mock data** - All features connected to real MongoDB database
- **JWT Authentication** - Secure token-based authentication
- **Role-Based Access Control** - EMPLOYEE, MANAGER, HR_ADMIN roles
- **Real-time Validation** - Server-side validation for all operations
- **Audit Trail** - Complete logging of all system actions

### 👥 User Management
- Search users by name/email (backend filtering)
- Filter by role and department
- Add/Edit/Delete users
- Activate/Deactivate accounts
- Assign managers
- Manual leave balance adjustment
- All operations update database immediately

### 📝 Leave Management
- Apply for leave with automatic validation
- Auto-calculate working days
- Leave balance checking
- Multi-level approval workflow
- Approve/Reject with comments
- Cancel leave requests
- Team calendar view
- HR override capability

### 📊 Leave Policies
- Multiple leave types (CL, SL, EL, WFH, OH)
- Configurable accrual rates (Monthly/Yearly)
- Carry-forward limits
- Probation period restrictions
- Document requirements
- Negative balance control

### 🔔 Notifications
- In-app notifications stored in database
- Real-time updates
- Triggered on all key actions

### 📈 Reports & Analytics
- Employee-wise reports
- Department-wise reports
- Monthly summaries
- Yearly summaries
- CSV export

### 🔒 Security
- Password hashing with bcrypt
- JWT token authentication
- Role-based route guards
- Input validation
- Rate limiting
- CORS protection

## 🚀 Quick Start

### Prerequisites
- Node.js v16+
- MongoDB v5+
- npm or yarn

### Installation

1. **Install dependencies**
```bash
# Backend
cd backend
npm install

# Frontend
cd ..
npm install
```

2. **Configure environment**
```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Frontend
cd ..
echo "VITE_API_URL=http://localhost:5000/api" > .env
```

3. **Seed the database (Leave Types Only)**
```bash
cd backend
node seeds/seedData.js
```

This will create only the leave types. The first user should register through the application.

4. **Start the servers**
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
npm run dev
```

5. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

## 🔐 First Time Setup

### Option 1: Using the Helper Script (Recommended)

```bash
cd backend
node scripts/createFirstAdmin.js
```

Follow the prompts to create your first HR Admin account.

### Option 2: Manual Database Update

1. **Register through the application**
   - Go to http://localhost:5173/register
   - Fill in your details
   - Your account will be created as EMPLOYEE (inactive by default)

2. **Manually activate the first HR Admin**
   ```bash
   # Connect to MongoDB
   mongosh
   
   # Switch to your database
   use leave_management
   
   # Update the first user to HR_ADMIN and activate
   db.users.updateOne(
     { email: "your-email@company.com" },
     { $set: { role: "HR_ADMIN", isActive: true } }
   )
   ```

3. **Login as HR Admin**
   - Now you can login and approve other user registrations
   - Go to User Management → Pending Approval tab

## 👥 User Approval Workflow

1. New users register through the registration page
2. Their accounts are created as EMPLOYEE with `isActive: false`
3. HR Admin receives a notification
4. HR Admin goes to User Management → Pending Approval tab
5. HR Admin can:
   - **Approve**: Activates the account and initializes leave balances
   - **Reject**: Deletes the user account
6. Approved users receive a notification and can login

## 📚 Documentation

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup and deployment guide
- **[TEST_INTEGRATION.md](./TEST_INTEGRATION.md)** - End-to-end testing guide
- **[USER_APPROVAL_GUIDE.md](./USER_APPROVAL_GUIDE.md)** - User approval workflow

## 🧪 Verify Setup

Run the verification script:

```bash
node verify-setup.js
```

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login
GET    /api/auth/me                - Get current user
```

### Users (HR Admin Only)
```
GET    /api/users                  - Get all users (with filters)
PUT    /api/users/:id              - Update user
PATCH  /api/users/:id/activate     - Activate user
```

### Leave Requests
```
POST   /api/leaves/apply           - Apply for leave
GET    /api/leaves/my-leaves       - Get my leave requests
PATCH  /api/leaves/:id/approve     - Approve leave
PATCH  /api/leaves/:id/reject      - Reject leave
```

## 🏗️ Project Structure

```
leave-management-system/
├── backend/                    # Node.js + Express + MongoDB
│   ├── config/                # Database configuration
│   ├── controllers/           # Request handlers
│   ├── middleware/            # Auth, validation
│   ├── models/               # Mongoose schemas
│   ├── routes/               # API endpoints
│   ├── services/             # Business logic
│   └── server.js             # Entry point
│
├── src/                       # React Frontend
│   ├── app/
│   │   ├── components/       # UI components
│   │   ├── context/          # State management
│   │   ├── pages/            # Page components
│   │   └── services/         # API integration
│   └── main.tsx              # Entry point
│
└── Documentation files
```

## 🔧 Technology Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- bcrypt for passwords
- express-validator

### Frontend
- React 18 + TypeScript
- React Router
- Axios
- Context API
- Tailwind CSS

## 🎯 Key Features Implementation

### User Management with Real Backend Filtering
```javascript
// Frontend makes API call with query parameters
GET /api/users?search=alice&role=EMPLOYEE&department=Engineering

// Backend processes filters and returns results
```

### Leave Application with Validation
- Check leave balance
- Validate dates
- Calculate working days
- Check restrictions
- Deduct from balance on approval

### Automatic Notifications
- Triggered on all key actions
- Stored in database
- Real-time updates

### Audit Trail Logging
- Every action is logged
- Complete history tracking

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
mongosh

# Start MongoDB service
```

### Port Already in Use
```bash
# Find and kill process
# Windows: netstat -ano | findstr :5000
# Mac/Linux: lsof -i :5000
```

## ✅ Verification Checklist

- [ ] MongoDB is running
- [ ] Backend .env configured
- [ ] Database seeded
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can login with test credentials
- [ ] User search works
- [ ] Leave application works
- [ ] Notifications appear

## 🎉 Success!

Your Leave Management System is fully operational with complete frontend-backend integration!

---

**Built with ❤️ using React, Node.js, Express, and MongoDB**
