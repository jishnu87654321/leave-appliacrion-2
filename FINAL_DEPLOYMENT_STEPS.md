# 🚀 Final Deployment Steps

## ✅ Current Status

- **Backend URL**: https://leave-management-portal-5lb6.onrender.com
- **Frontend Preview**: https://figma-leave-approval-layout-kw7ydrfmz-jishnus-projects-49bd2aa1.vercel.app
- **Frontend Production**: https://figma-leave-approval-layout.vercel.app

---

## Step 1: Update Vercel Environment Variable

### Option A: Using Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Click on project: **figma-leave-approval-layout**
3. Go to **Settings** → **Environment Variables**
4. Find `VITE_API_URL` and click **Edit** (or add new if not exists)
5. Update value to:
   ```
   https://leave-management-portal-5lb6.onrender.com/api
   ```
6. Make sure it's selected for: **Production**, **Preview**, **Development**
7. Click **Save**

### Option B: Using CLI

```bash
# Remove old variable
vercel env rm VITE_API_URL

# Add new variable (run 3 times for each environment)
vercel env add VITE_API_URL production
# Enter: https://leave-management-portal-5lb6.onrender.com/api

vercel env add VITE_API_URL preview
# Enter: https://leave-management-portal-5lb6.onrender.com/api

vercel env add VITE_API_URL development
# Enter: https://leave-management-portal-5lb6.onrender.com/api
```

---

## Step 2: Update Render CORS Settings

1. Go to https://dashboard.render.com
2. Click on: **leave-management-portal-5lb6**
3. Click **Environment** (left sidebar)
4. Add or update these variables:

**CORS_ORIGIN:**
```
https://figma-leave-approval-layout-kw7ydrfmz-jishnus-projects-49bd2aa1.vercel.app,https://figma-leave-approval-layout.vercel.app
```

**FRONTEND_URL:**
```
https://figma-leave-approval-layout.vercel.app
```

5. Click **Save Changes**
6. Wait for automatic redeploy (2-3 minutes)

---

## Step 3: Deploy Frontend to Production

Run this command:
```bash
vercel --prod
```

Or in Vercel dashboard:
- Go to **Deployments** tab
- Click **"..."** on latest deployment
- Click **Redeploy**
- Select **Production**

---

## Step 4: Seed Database

You need to add leave types to your database.

### Using Render Shell:

1. In Render dashboard, go to your service
2. Click **Shell** tab (top right)
3. Wait for shell to connect
4. Run:
   ```bash
   node seeds/seedData.js
   ```
5. You should see: "✅ Database seeded successfully"

---

## Step 5: Create First Admin User

### Option A: Using Render Shell

In Render Shell, run:
```bash
node scripts/createFirstAdmin.js
```

Follow the prompts to create your admin account.

### Option B: Register + Manual Activation

1. Go to your frontend: https://figma-leave-approval-layout.vercel.app
2. Click **Register**
3. Fill in your details
4. Go to MongoDB Atlas → Browse Collections
5. Find your user in `users` collection
6. Edit the document:
   - Set `role: "HR_ADMIN"`
   - Set `isActive: true`
7. Save

---

## Step 6: Test Your Application! 🎉

1. Open: https://figma-leave-approval-layout.vercel.app
2. Login with your admin credentials
3. Test these features:
   - ✅ Login works (no CORS errors)
   - ✅ Dashboard loads
   - ✅ Can view users
   - ✅ Can apply for leave
   - ✅ Can approve/reject leave
   - ✅ Notifications work

---

## Troubleshooting

### CORS Errors?
- Check `CORS_ORIGIN` in Render includes both Vercel URLs
- Make sure Render has redeployed after adding env vars
- Clear browser cache

### Frontend Shows "Network Error"?
- Check `VITE_API_URL` in Vercel is correct
- Redeploy frontend after setting env var
- Check backend is running: https://leave-management-portal-5lb6.onrender.com/api/health

### Can't Login?
- Make sure database is seeded
- Check if admin user exists and is active
- Check MongoDB connection in Render logs

### Backend Not Responding?
- Free tier spins down after 15 min inactivity
- First request takes ~30 seconds (cold start)
- Check Render logs for errors

---

## Your Complete Deployment URLs

### Backend
- **Base URL**: https://leave-management-portal-5lb6.onrender.com
- **API URL**: https://leave-management-portal-5lb6.onrender.com/api
- **Health Check**: https://leave-management-portal-5lb6.onrender.com/api/health

### Frontend
- **Production**: https://figma-leave-approval-layout.vercel.app
- **Preview**: https://figma-leave-approval-layout-kw7ydrfmz-jishnus-projects-49bd2aa1.vercel.app

---

## Environment Variables Summary

### Render (Backend)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/leave_management?retryWrites=true&w=majority
JWT_SECRET=3fca41b954a35bcdd8b1c4ff8ffdfc5462bc1c291eadf5371bf01dc767b862a3
JWT_EXPIRE=7d
JWT_ISSUER=leave-ms-api
JWT_AUDIENCE=leave-ms-web
CORS_ORIGIN=https://figma-leave-approval-layout-kw7ydrfmz-jishnus-projects-49bd2aa1.vercel.app,https://figma-leave-approval-layout.vercel.app
FRONTEND_URL=https://figma-leave-approval-layout.vercel.app
SMTP_HOST=smtp.zoho.in
SMTP_PORT=587
SMTP_USER=hr.admin@aksharaenterprises.info
SMTP_PASS=<your_zoho_app_password>
SMTP_FROM=<hr.admin@aksharaenterprises.info>
ADMIN_EMAIL=hr.admin@aksharaenterprises.info
EMAIL_NOTIFICATIONS_ENABLED=true
```

### Vercel (Frontend)
```env
VITE_API_URL=https://leave-management-portal-5lb6.onrender.com/api
```

---

## Next Steps After Deployment

1. ✅ Set up MongoDB Atlas backups
2. ✅ Configure custom domain (optional)
3. ✅ Set up monitoring (UptimeRobot for free tier)
4. ✅ Add more users through the app
5. ✅ Configure email notifications
6. ✅ Test all features thoroughly

---

## Quick Commands Reference

### Deploy Frontend
```bash
vercel --prod
```

### Check Deployment Status
```bash
vercel ls
```

### View Logs
```bash
vercel logs
```

### Seed Database (in Render Shell)
```bash
node seeds/seedData.js
```

### Create Admin (in Render Shell)
```bash
node scripts/createFirstAdmin.js
```

---

🎉 **Congratulations! Your Leave Management System is now fully deployed!**

Access your app at: https://figma-leave-approval-layout.vercel.app
