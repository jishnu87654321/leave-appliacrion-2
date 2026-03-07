# Manager Account Credentials

## Quick Login Manager Account

The quick login button on the login page uses these credentials:

**Email:** `johnmanager@gmail.com`  
**Password:** `password123`  
**Role:** Manager

---

## Check Manager Accounts

To see all manager accounts in your database:

```bash
node check-manager-details.cjs
```

This will show:
- All manager accounts (active and inactive)
- Their email addresses
- Account status
- Whether the quick login account exists

---

## Creating Manager Accounts

### Method 1: Self-Registration (Recommended)

1. Go to `/register`
2. Fill in the form:
   - **Name:** John Manager
   - **Email:** johnmanager@gmail.com
   - **Password:** password123
   - **Department:** Engineering (or any)
   - **Designation:** Engineering Manager (or any)
   - **Register As:** Manager
3. Submit registration
4. Login as HR Admin
5. Go to User Management → Pending Approval
6. Approve the manager registration

### Method 2: HR Admin Creates Manager

1. Login as HR Admin
2. Go to User Management
3. Click "Create New User" button
4. Fill in the form:
   - **Name:** John Manager
   - **Email:** johnmanager@gmail.com
   - **Password:** password123
   - **Role:** Manager
   - **Department:** Engineering
   - **Active Account:** ON
5. Click "Create User"

### Method 3: Using Script

Edit `create-manager.cjs` and set:

```javascript
const managerData = {
  name: 'John Manager',
  email: 'johnmanager@gmail.com',
  password: 'password123',
  department: 'Engineering',
  designation: 'Engineering Manager',
  phone: '+1234567890',
  role: 'MANAGER',
  isActive: true,
  probationStatus: false,
};
```

Then run:
```bash
node create-manager.cjs
```

---

## Default Demo Accounts

### Employee
- **Email:** alice@company.com
- **Password:** password123
- **Role:** Employee

### Manager
- **Email:** johnmanager@gmail.com
- **Password:** password123
- **Role:** Manager

### HR Admin
- **Email:** Subramanya@aksharaenterprises.info
- **Password:** password123
- **Role:** HR Admin

---

## Verify Manager Account

After creating a manager account, verify it works:

1. **Check Database:**
   ```bash
   node check-manager-details.cjs
   ```

2. **Test Login:**
   - Go to login page
   - Click "Manager" quick login button
   - Or manually enter: johnmanager@gmail.com / password123
   - Should redirect to Manager Dashboard

3. **Check Manager Profile:**
   ```bash
   node test-manager-collection.cjs
   ```
   - Should show manager profile in Manager collection
   - Should show team size and approval authority

---

## Troubleshooting

### Quick Login Button Not Working

**Problem:** Clicking "Manager" button doesn't work

**Solutions:**
1. Check if account exists:
   ```bash
   node check-manager-details.cjs
   ```

2. If account doesn't exist, create it using Method 1, 2, or 3 above

3. If account exists but inactive, activate it:
   - Login as HR Admin
   - Go to User Management
   - Find the manager
   - Click edit and toggle "Active Account" ON

### Wrong Email in Quick Login

**Problem:** Quick login uses wrong email

**Solution:** Update the email in `src/app/pages/auth/Login.tsx`:

```typescript
const quickFill = (role: string) => {
  const map: Record<string, string> = {
    employee: "alice@company.com",
    manager: "YOUR_MANAGER_EMAIL@example.com", // Change this
    admin: "Subramanya@aksharaenterprises.info",
  };
  setForm({ email: map[role], password: "password123" });
  setError("");
};
```

### Manager Can't Login

**Problem:** Manager account exists but can't login

**Checklist:**
- ✅ Account is active (isActive: true)
- ✅ Password is correct (default: password123)
- ✅ Email is correct
- ✅ Role is MANAGER (not EMPLOYEE)

**Fix:**
```bash
# Check account status
node check-manager-details.cjs

# If inactive, activate via HR Admin UI
# Or update directly in database
```

---

## Manager Permissions

Once logged in, managers can:
- ✅ View their team members
- ✅ Approve/reject leave requests from team
- ✅ View team calendar
- ✅ Access manager dashboard
- ✅ View team reports
- ✅ Manage up to 30 days of leave (default)

---

## Changing Manager Email

To use a different email for the manager account:

1. **Update Quick Login Button:**
   Edit `src/app/pages/auth/Login.tsx` line ~16

2. **Create Account with New Email:**
   Use any of the 3 methods above with your new email

3. **Update Documentation:**
   Update this file with the new email

---

## Security Notes

⚠️ **Important for Production:**

1. **Change Default Passwords:**
   - Never use "password123" in production
   - Require strong passwords (8+ chars, mixed case, numbers, symbols)

2. **Remove Quick Login Buttons:**
   - Quick login is for demo/development only
   - Remove from production builds

3. **Secure Email Addresses:**
   - Use company email domain
   - Implement email verification

4. **Enable 2FA:**
   - Add two-factor authentication
   - Especially for manager and admin accounts

---

## Summary

**Current Manager Quick Login:**
- Email: johnmanager@gmail.com
- Password: password123

**To Check:** `node check-manager-details.cjs`  
**To Create:** Use registration, HR Admin UI, or script  
**To Test:** Click "Manager" button on login page

---

**Last Updated:** March 2, 2026
