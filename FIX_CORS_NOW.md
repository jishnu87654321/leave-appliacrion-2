# 🔧 Fix CORS Error - Quick Guide

## The Problem
Your frontend can't connect to the backend because CORS is blocking it.

## ✅ Solution: Add Environment Variables in Render

### Step 1: Go to Render Dashboard
1. Open https://dashboard.render.com
2. Click on your service: **leave-management-portal-5lb6**
3. Click **Environment** (left sidebar)

### Step 2: Add/Update These Variables

Click **Add Environment Variable** and add:

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

### Step 3: Save and Redeploy
1. Click **Save Changes**
2. Render will automatically redeploy (wait 2-3 minutes)
3. Your app should work!

---

## Alternative: Allow All Origins (Not Recommended for Production)

If you want to test quickly, you can temporarily allow all origins:

```
Key: CORS_ORIGIN
Value: *
```

⚠️ **Warning**: This is insecure. Only use for testing!

---

## Verify It Works

After redeploying:
1. Open your frontend: https://figma-leave-approval-layout-kw7ydrfmz-jishnus-projects-49bd2aa1.vercel.app
2. Try to login
3. Check browser console - CORS errors should be gone!

---

## Your URLs

- **Backend**: https://leave-management-portal-5lb6.onrender.com
- **Frontend (Preview)**: https://figma-leave-approval-layout-kw7ydrfmz-jishnus-projects-49bd2aa1.vercel.app
- **Frontend (Production)**: https://figma-leave-approval-layout.vercel.app

---

## Next Steps After CORS is Fixed

1. ✅ Update Vercel environment variable with backend URL
2. ✅ Deploy frontend to production
3. ✅ Seed database with leave types
4. ✅ Create first admin user
5. ✅ Test the full application!
