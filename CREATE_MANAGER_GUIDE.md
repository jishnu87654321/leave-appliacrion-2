# How to Create a Manager

## ✅ Method 1: Through the UI (Recommended)

### Step 1: Login as HR Admin
- Navigate to your application
- Login with HR Admin credentials

### Step 2: Go to User Management
- Click on "User Management" in the sidebar
- You'll see the user management dashboard

### Step 3: Click "Create New User"
- Look for the green "Create New User" button in the top right
- Click it to open the creation modal

### Step 4: Fill in Manager Details
Fill in the required fields:
- **Full Name**: Manager's full name (e.g., "John Manager")
- **Email**: Manager's email (e.g., "manager@example.com")
- **Password**: Set initial password (min 6 characters)
- **Phone**: Optional phone number
- **Designation**: Job title (e.g., "Engineering Manager")
- **Role**: Select **"Manager"** from dropdown ⭐
- **Department**: Select department (e.g., "Engineering")
- **Active Account**: Toggle ON (green)
- **On Probation**: Toggle as needed

### Step 5: Create User
- Click "Create User" button
- The manager account will be created with:
  - Automatic leave balance initialization
  - Welcome notification sent
  - Immediate login access

### Step 6: Manager Can Login
- The new manager can now login with:
  - Email: (the email you provided)
  - Password: (the password you set)

---

## Method 2: Using the Script

If you prefer command-line:

### Step 1: Edit the Script
Open `create-manager.cjs` and modify the manager details (lines 22-31):

```javascript
const managerData = {
  name: 'John Manager',              // Change this
  email: 'manager@example.com',      // Change this
  password: 'password123',           // Change this
  department: 'Engineering',         // Change this
  designation: 'Engineering Manager', // Change this
  phone: '+1234567890',              // Change this
  role: 'MANAGER',                   // Keep as MANAGER
  isActive: true,
  probationStatus: false,
  leaveBalances: [],
  joinDate: new Date(),
};
```

### Step 2: Run the Script
```bash
node create-manager.cjs
```

### Step 3: Verify Creation
The script will output the manager's details and login credentials.

---

## Method 3: Promote Existing Employee

### Step 1: Find the Employee
- Go to User Management
- Find the employee in the Active Users table

### Step 2: Edit User
- Click the edit (pencil) icon on their row

### Step 3: Change Role
- In the edit modal, find the "Role" dropdown
- Change from "Employee" to **"Manager"**

### Step 4: Save
- Click "Save Changes"
- The employee is now a Manager!

---

## What Managers Can Do

Once created, managers have access to:
- ✅ View their team members
- ✅ Approve/reject leave requests from their team
- ✅ View team leave calendar
- ✅ Access manager dashboard
- ✅ View team reports

---

## Important Notes

1. **Email must be unique** - Cannot create duplicate emails
2. **Password requirements** - Minimum 6 characters
3. **Leave balances** - Automatically initialized based on leave types
4. **Notifications** - New user receives welcome notification
5. **Audit trail** - All user creation is logged

---

## Troubleshooting

### "Email already registered"
- Check if user already exists
- Use a different email address

### "Password must be at least 6 characters"
- Ensure password is 6+ characters long

### Manager can't see team members
- Employees need to be assigned to this manager
- Go to User Management → Edit Employee → Assign Manager

---

## Quick Reference

| Field | Required | Description |
|-------|----------|-------------|
| Name | ✅ Yes | Full name of the manager |
| Email | ✅ Yes | Unique email address |
| Password | ✅ Yes | Min 6 characters |
| Department | ✅ Yes | Manager's department |
| Role | ✅ Yes | Must be "MANAGER" |
| Designation | ❌ No | Job title |
| Phone | ❌ No | Contact number |
| Active | ❌ No | Default: true |
| Probation | ❌ No | Default: true |

---

## Next Steps After Creating Manager

1. **Assign Team Members**
   - Edit employees
   - Set their "Manager" field to the new manager

2. **Configure Permissions**
   - Managers automatically get manager-level permissions
   - No additional configuration needed

3. **Notify Manager**
   - Send them their login credentials
   - Guide them through first login
   - Show them the manager dashboard

---

**Created**: March 2, 2026
**Last Updated**: March 2, 2026
