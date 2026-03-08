# 🚀 Deployment Checklist

## Current Status

✅ **Backend Deployed**: https://leave-management-portal-5lb6.onrender.com  
✅ **Frontend Deployed (Preview)**: https://figma-leave-approval-layout-kw7ydrfmz-jishnus-projects-49bd2aa1.vercel.app  
❌ **CORS Error**: Need to fix environment variables

---

## Step-by-Step: Complete Your Deployment

### Step 1: Fix CORS in Render ⚠️ DO THIS FIRST!

1. Go to https://dashboard.render.com
2. Click on: **leave-management-portal-5lb6**
3. Click **Environment** (left sidebar)
4. Click **Add Environment Variable**
5. Add these two variables:

**Variable 1:**
```
Key: CORS_ORIGIN
Value: https://figma-leave-approval-layout-kw7ydrfmz-jishnus-projects-49bd2aa1.vercel.app,https://figma-leave-approval-layout.vercel.app
```

**Variable 2:**
```
Key: FRONTEND_URL  
Value: https://figma-leave-approval-layout.vercel.app
```

6. Click **Save Changes**
7. Wait 2-3 minutes for automatic redeploy

---

### Step 2: Update Vercel Environment Variable

1. Go to https://vercel.com/dashboard
2. Click on: **figma-leave-approval-layout**
3. Go to **Settings** → **Environment Variables**
4. Add or update `VITE_API_URL`:
   ```
   https://leave-management-portal-5lb6.onrender.com/api
   ```
5. Select: **Production**, **Preview**, **Development**
6. Click **Save**

---

### Step 3: Redeploy Frontend

Run this command:
```bash
vercel --prod
```

Or in Vercel dashboard:
- Go to **Deployments** tab
- Click **"..."** on latest → **Redeploy**

---

### Step 4: Seed Database

You need to add leave types to your database.

**Option A: Using Render Shell**
1. In Render dashboard, go to your service
2. Click **Shell** tab (top right)
3. Run:
   ```bash
   node seeds/seedData.js
   ```

**Option B: Using Local Script**
1. Update your local `backend/.env` with production MongoDB URI
2. Run:
   ```bash
   cd backend
   node seeds/seedData.js
   ```
3. Revert `.env` back to localhost

---

### Step 5: Create First Admin User

**Option A: Using Render Shell**
1. In Render Shell, run:
   ```bash
   node scripts/createFirstAdmin.js
   ```
2. Follow the prompts

**Option B: Register + Manual Activation**
1. Register at your frontend URL
2. Go to MongoDB Atlas → Browse Collections
3. Find your user in `users` collection
4. Edit: Set `role: "HR_ADMIN"` and `isActive: true`

---

### Step 6: Test Your Application! 🎉

1. Open: https://figma-leave-approval-layout.vercel.app
2. Login with your admin credentials
3. Test key features:
   - ✅ Login works
   - ✅ Dashboard loads
   - ✅ Can view users
   - ✅ Can apply for leave
   - ✅ No CORS errors in console

---

## Quick Reference

### Your URLs
- **Backend**: https://leave-management-portal-5lb6.onrender.com
- **Backend API**: https://leave-management-portal-5lb6.onrender.com/api
- **Frontend**: https://figma-leave-approval-layout.vercel.app

### Important Environment Variables

**Render (Backend):**
- `NODE_ENV=production`
- `PORT=5000`
- `MONGODB_URI=<your_mongodb_atlas_uri>`
- `JWT_SECRET=3fca41b954a35bcdd8b1c4ff8ffdfc5462bc1c291eadf5371bf01dc767b862a3`
- `CORS_ORIGIN=https://figma-leave-approval-layout-kw7ydrfmz-jishnus-projects-49bd2aa1.vercel.app,https://figma-leave-approval-layout.vercel.app`
- `FRONTEND_URL=https://figma-leave-approval-layout.vercel.app`
- Plus all SMTP variables

**Vercel (Frontend):**
- `VITE_API_URL=https://leave-management-portal-5lb6.onrender.com/api`

---

## Troubleshooting

### CORS Error Still Showing?
- Check CORS_ORIGIN is set correctly in Render
- Make sure Render has redeployed (check logs)
- Clear browser cache and try again

### Frontend Shows "Network Error"?
- Check VITE_API_URL is set in Vercel
- Redeploy frontend after setting env var
- Check backend is running (visit backend URL)

### Can't Login?
- Make sure database is seeded
- Check if admin user exists
- Verify MongoDB connection in Render logs

---

## Next Steps After Deployment

1. Set up MongoDB Atlas backups
2. Configure custom domain (optional)
3. Set up monitoring (UptimeRobot for free tier)
4. Enable GitHub auto-deploy
5. Add more users through the app

---

## Need Help?

- Check `RENDER_TROUBLESHOOTING.md` for common issues
- Check `FIX_CORS_NOW.md` for CORS-specific help
- Check Render logs for backend errors
- Check browser console for frontend errors

🎉 **You're almost done! Just fix CORS and you're good to go!**
