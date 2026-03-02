# Manager Registration Guide

## Overview

Users can now register directly as **Managers** during the registration process. Manager accounts require HR Admin approval before activation, just like employee accounts.

---

## Registration Flow

### For Users

1. **Go to Registration Page**
   - Navigate to `/register`
   - Fill in personal details

2. **Select Role**
   - Choose between:
     - **Employee** (default)
     - **Manager** (requires approval)

3. **Submit Registration**
   - Account is created but inactive
   - HR Admin receives notification
   - User waits for approval

4. **After Approval**
   - HR Admin activates the account
   - User receives notification
   - User can login immediately
   - Manager profile is automatically activated

---

## Registration Form Fields

| Field | Required | Description |
|-------|----------|-------------|
| Full Name | ✅ Yes | User's full name |
| Email | ✅ Yes | Unique email address |
| Password | ✅ Yes | Min 6 characters |
| Confirm Password | ✅ Yes | Must match password |
| Department | ✅ Yes | Select from dropdown |
| Designation | ❌ No | Job title |
| Phone | ❌ No | Contact number |
| Register As | ✅ Yes | Employee or Manager |

---

## What Happens Behind the Scenes

### When User Registers as Manager

1. **User Record Created**
   ```javascript
   {
     name: "John Manager",
     email: "john@example.com",
     role: "MANAGER",
     isActive: false,  // Inactive until HR approves
     probationStatus: true
   }
   ```

2. **Manager Profile Created**
   ```javascript
   {
     userId: user._id,
     department: "Engineering",
     managementLevel: "MANAGER",
     approvalAuthority: {
       maxLeaveDays: 30,
       canApproveSpecialLeave: false,
       canOverrideRules: false
     },
     isActive: false  // Inactive until HR approves
   }
   ```

3. **Leave Balances Initialized**
   - All leave types are initialized
   - Balances set to 0 or default values

4. **HR Admins Notified**
   - Notification sent to all HR Admins
   - Message: "New Manager registration: John Manager..."

---

## HR Admin Approval Process

### Step 1: View Pending Registrations
- Login as HR Admin
- Go to User Management
- Click "Pending Approval" tab

### Step 2: Review Manager Application
- See user details
- Check requested role (Manager)
- Review department and designation

### Step 3: Approve or Reject

**To Approve:**
- Click "Approve" button
- User account is activated
- Manager profile is activated
- User receives notification
- User can login immediately

**To Reject:**
- Click "Reject" button
- User account is deleted
- Manager profile is deleted
- Registration is removed

---

## Differences: Employee vs Manager Registration

| Aspect | Employee | Manager |
|--------|----------|---------|
| Registration | Allowed | Allowed |
| Default Role | EMPLOYEE | MANAGER |
| Approval Required | Yes | Yes |
| Manager Profile | No | Yes (auto-created) |
| Approval Authority | None | 30 days max |
| Special Permissions | None | Team management |
| Notification to HR | Standard | Highlighted as Manager |

---

## User Experience

### Registration Page

```
┌─────────────────────────────────────┐
│  Create Account                     │
│  Register to access the Leave       │
│  Management System                  │
├─────────────────────────────────────┤
│  Full Name: [John Manager        ]  │
│  Email: [john@example.com        ]  │
│  Password: [••••••••             ]  │
│  Confirm: [••••••••              ]  │
│  Department: [Engineering ▼      ]  │
│  Designation: [Engineering Mgr   ]  │
│  Phone: [+1-555-0000             ]  │
│                                     │
│  Register As: [Manager ▼         ]  │
│  ⚠️ Manager accounts require HR     │
│     Admin approval before activation│
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Note: Your account will be    │ │
│  │ reviewed and activated by HR  │ │
│  │ Admin after verification.     │ │
│  └───────────────────────────────┘ │
│                                     │
│  [Create Account]                   │
└─────────────────────────────────────┘
```

### Success Message

**For Employee:**
```
✅ Registration successful. Your account will be 
   activated by HR Admin.
```

**For Manager:**
```
✅ Registration successful. Your manager account 
   will be reviewed and activated by HR Admin.
```

---

## HR Admin View

### Pending Approvals Table

| Employee | Department | Requested Role | Registration Date | Actions |
|----------|------------|----------------|-------------------|---------|
| John Manager<br>john@example.com | Engineering<br>Engineering Manager | 🔵 MANAGER | 3/2/2026 | [Approve] [Reject] |
| Alice Employee<br>alice@example.com | Marketing<br>Marketing Specialist | 🟢 EMPLOYEE | 3/2/2026 | [Approve] [Reject] |

**Visual Indicators:**
- 🔵 Blue badge for MANAGER
- 🟢 Green badge for EMPLOYEE
- 🟣 Purple badge for HR_ADMIN (if applicable)

---

## API Changes

### Registration Endpoint

**POST** `/api/auth/register`

**Request Body:**
```json
{
  "name": "John Manager",
  "email": "john@example.com",
  "password": "password123",
  "department": "Engineering",
  "designation": "Engineering Manager",
  "phone": "+1-555-0000",
  "role": "MANAGER"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Your manager account will be reviewed and activated by HR Admin."
}
```

**Notes:**
- `role` field is optional
- Accepts: "EMPLOYEE" or "MANAGER"
- Defaults to "EMPLOYEE" if not provided
- HR_ADMIN role cannot be requested during registration

---

## Security Considerations

### Role Validation
- Only EMPLOYEE and MANAGER roles allowed during registration
- HR_ADMIN role can only be assigned by existing HR Admins
- Invalid roles default to EMPLOYEE

### Approval Required
- All registrations start as inactive
- HR Admin must manually approve
- Prevents unauthorized access

### Manager Profile Security
- Manager profile created but inactive
- Activated only when HR approves
- Prevents premature access to manager features

---

## Testing

### Test Manager Registration

1. **Register as Manager**
   ```bash
   # Navigate to /register
   # Fill form with role = "MANAGER"
   # Submit
   ```

2. **Check Database**
   ```bash
   node test-manager-collection.cjs
   ```

3. **Verify Pending Status**
   - Login as HR Admin
   - Check "Pending Approval" tab
   - Should see new manager registration

4. **Approve Manager**
   - Click "Approve" button
   - Verify user is activated
   - Verify manager profile is activated

5. **Login as Manager**
   - Use registered credentials
   - Should have manager access
   - Should see manager dashboard

---

## Common Scenarios

### Scenario 1: User Registers as Manager
```
User fills form → Selects "Manager" → Submits
↓
User created (inactive) + Manager profile created (inactive)
↓
HR Admin notified
↓
HR Admin approves
↓
User activated + Manager profile activated
↓
User can login with manager permissions
```

### Scenario 2: User Registers as Employee
```
User fills form → Selects "Employee" → Submits
↓
User created (inactive)
↓
HR Admin notified
↓
HR Admin approves
↓
User activated
↓
User can login with employee permissions
```

### Scenario 3: HR Admin Rejects Manager
```
User registers as Manager
↓
HR Admin reviews
↓
HR Admin clicks "Reject"
↓
User deleted + Manager profile deleted
↓
User must register again
```

---

## Benefits

### For Users
- ✅ Can request manager role directly
- ✅ No need to contact HR separately
- ✅ Clear indication of approval status
- ✅ Transparent process

### For HR Admins
- ✅ Clear visibility of role requests
- ✅ Easy approval/rejection process
- ✅ Automatic profile creation
- ✅ Audit trail maintained

### For System
- ✅ Consistent data structure
- ✅ Automatic manager profile creation
- ✅ Proper security controls
- ✅ Scalable process

---

## Troubleshooting

### Manager Profile Not Created

**Problem**: User registered as manager but no profile in Manager collection

**Solution**: 
- Check if registration was successful
- Run: `node test-manager-collection.cjs`
- If missing, HR Admin can edit user to trigger creation

### Cannot Login After Approval

**Problem**: User approved but cannot login

**Solution**:
- Verify user.isActive = true
- Verify manager profile.isActive = true (for managers)
- Check password is correct

### Role Shows as EMPLOYEE Instead of MANAGER

**Problem**: Registered as manager but role is employee

**Solution**:
- Check registration request included role field
- HR Admin can edit user and change role
- Manager profile will be created automatically

---

## Future Enhancements

Potential improvements:
- 📝 Add reason field for manager registration
- 📄 Require resume/CV upload for managers
- 👥 Add reference check workflow
- 📧 Email verification before HR review
- 🔍 Background check integration
- 📊 Manager qualification assessment
- 💬 Interview scheduling system

---

## Summary

✅ Users can register as managers during signup
✅ Manager profiles automatically created
✅ HR Admin approval required for activation
✅ Both user and manager profile activated together
✅ Clear visual indicators for role requests
✅ Secure and audited process

The manager registration feature is now live and ready to use!

---

**Created**: March 2, 2026
**Last Updated**: March 2, 2026
