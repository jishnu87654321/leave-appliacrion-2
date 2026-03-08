# 🔧 Fix MongoDB Atlas Connection Error

## The Problem
MongoDB Atlas is blocking Render's IP address because it's not whitelisted.

## ✅ Solution: Allow All IPs in MongoDB Atlas

### Step 1: Go to MongoDB Atlas
1. Open https://cloud.mongodb.com
2. Login to your account
3. Select your cluster

### Step 2: Add IP Whitelist
1. Click **"Network Access"** (left sidebar under Security)
2. Click **"Add IP Address"** button
3. Click **"Allow Access from Anywhere"**
4. This will add: `0.0.0.0/0`
5. Click **"Confirm"**

**OR manually add:**
- IP Address: `0.0.0.0/0`
- Comment: `Allow all IPs for Render deployment`

### Step 3: Wait 1-2 Minutes
MongoDB Atlas takes a moment to update the whitelist.

### Step 4: Redeploy in Render
1. Go to Render dashboard
2. Click **"Manual Deploy"** → **"Deploy latest commit"**
3. Check logs - MongoDB connection should work now!

---

## Alternative: Add Specific Render IPs (More Secure)

If you want to be more secure, you can add Render's IP ranges instead of 0.0.0.0/0.

However, Render uses dynamic IPs, so `0.0.0.0/0` is the recommended approach for free tier.

---

## Verify MongoDB Connection String

Make sure your `MONGODB_URI` in Render environment variables is correct:

**Format:**
```
mongodb+srv://username:password@cluster.xxxxx.mongodb.net/leave_management?retryWrites=true&w=majority
```

**Check:**
- ✅ Username is correct
- ✅ Password is correct (no special characters that need encoding)
- ✅ Database name is `leave_management`
- ✅ Cluster URL is correct

**Special Characters in Password?**
If your password has special characters like `@`, `#`, `%`, etc., you need to URL encode them:
- `@` → `%40`
- `#` → `%23`
- `%` → `%25`
- `&` → `%26`

Example:
```
Password: MyP@ss#123
Encoded: MyP%40ss%23123
```

---

## Common Issues

### Issue 1: Wrong Database Name
Make sure the database name in the URI is `leave_management`:
```
...mongodb.net/leave_management?retryWrites=true
```

### Issue 2: Wrong Credentials
- Check username and password in MongoDB Atlas
- Go to **Database Access** → Verify user exists
- Reset password if needed

### Issue 3: Cluster Paused
- Free tier clusters pause after inactivity
- Go to your cluster → Click **"Resume"** if paused

---

## Quick Checklist

- [ ] MongoDB Atlas → Network Access → 0.0.0.0/0 added
- [ ] Wait 1-2 minutes for whitelist to update
- [ ] Verify MONGODB_URI in Render is correct
- [ ] Check username/password are correct
- [ ] Check database name is `leave_management`
- [ ] Redeploy in Render
- [ ] Check logs for successful connection

---

## After Fixing

You should see in Render logs:
```
╔════════════════════════════════════════════╗
║   Leave Management System - Backend       ║
╚════════════════════════════════════════════╝

📦 Environment: production
🔌 Database: Connected
🔐 Security: Enabled

✅ Server running on port 5000
```

🎉 **Done! Your backend should now connect to MongoDB!**
