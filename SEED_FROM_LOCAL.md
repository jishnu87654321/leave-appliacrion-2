# Seed Production Database from Local Machine

Since Render Shell is paid, you can seed your production database from your local machine.

## Step 1: Get Your Production MongoDB URI

1. Go to your Render dashboard
2. Click on your service: **leave-management-portal-5lb6**
3. Click **Environment** tab
4. Find `MONGODB_URI` and copy its value
5. It should look like: `mongodb+srv://username:password@cluster.mongodb.net/leave_management?retryWrites=true&w=majority`

## Step 2: Set Environment Variable

### Windows PowerShell:
```powershell
$env:PRODUCTION_MONGODB_URI="your_mongodb_uri_here"
```

### Windows CMD:
```cmd
set PRODUCTION_MONGODB_URI=your_mongodb_uri_here
```

### Mac/Linux:
```bash
export PRODUCTION_MONGODB_URI="your_mongodb_uri_here"
```

## Step 3: Seed Leave Types

Run this command:
```bash
node seed-production.js
```

You should see:
```
🔌 Connecting to production database...
✅ Connected to production database
📝 Creating leave types...
✅ Created 5 leave types
🎉 Production database seeded successfully!
```

## Step 4: Create Admin User

Run this command:
```bash
node create-admin-production.js
```

Follow the prompts:
```
📝 Create First HR Admin User

First Name: John
Last Name: Doe
Email: admin@company.com
Password: YourSecurePassword123
Employee ID: EMP001

✅ Admin user created successfully!
✅ Initialized 5 leave balances
🎉 Setup complete!
```

## Step 5: Login!

1. Go to: https://figma-leave-approval-layout.vercel.app
2. Login with the credentials you just created
3. You're done! 🎉

---

## Troubleshooting

### "Cannot find module"
Make sure you're in the project root directory and run:
```bash
cd backend
npm install
cd ..
```

### "Connection failed"
- Check your MongoDB URI is correct
- Make sure you copied it exactly from Render
- Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0

### "User already exists"
If you already created a user, you can login with those credentials. Or use MongoDB Atlas to delete the existing user and try again.

---

## Alternative: Use MongoDB Atlas Directly

If the scripts don't work, you can manually create a user in MongoDB Atlas:

1. Go to https://cloud.mongodb.com
2. Browse Collections → `users`
3. Insert Document:
```json
{
  "firstName": "Admin",
  "lastName": "User",
  "email": "admin@company.com",
  "password": "$2a$10$YourHashedPasswordHere",
  "employeeId": "EMP001",
  "role": "HR_ADMIN",
  "department": "HR",
  "isActive": true,
  "joiningDate": "2026-03-07T00:00:00.000Z"
}
```

Note: You'll need to hash the password first using bcrypt.

---

## Quick Commands Summary

```bash
# Set environment variable (Windows PowerShell)
$env:PRODUCTION_MONGODB_URI="mongodb+srv://..."

# Seed database
node seed-production.js

# Create admin
node create-admin-production.js

# Done! Login at your frontend URL
```

🎉 That's it! Your production database is now seeded and ready to use!
