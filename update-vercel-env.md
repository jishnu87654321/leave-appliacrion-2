# Update Vercel Environment Variable

## Quick Steps

### Option 1: Using Vercel Dashboard (Easiest)

1. Go to https://vercel.com/dashboard
2. Click on your project: **figma-leave-approval-layout**
3. Go to **Settings** → **Environment Variables**
4. Find `VITE_API_URL` or add new one
5. Set value to:
   ```
   https://leave-management-portal-5lb6.onrender.com/api
   ```
6. Select: **Production**, **Preview**, **Development** (all three)
7. Click **Save**
8. Go to **Deployments** tab
9. Click **"..."** on the latest deployment → **Redeploy**

### Option 2: Using CLI

Run these commands:

```bash
# Set for production
vercel env add VITE_API_URL production
# When prompted, enter: https://leave-management-portal-5lb6.onrender.com/api

# Set for preview
vercel env add VITE_API_URL preview
# When prompted, enter: https://leave-management-portal-5lb6.onrender.com/api

# Set for development
vercel env add VITE_API_URL development
# When prompted, enter: https://leave-management-portal-5lb6.onrender.com/api
```

Then redeploy:
```bash
vercel --prod
```

---

## Summary of What You Need to Do

### 1. Fix CORS in Render (Do This First!)
- Go to Render dashboard
- Add environment variables:
  - `CORS_ORIGIN`: `https://figma-leave-approval-layout-kw7ydrfmz-jishnus-projects-49bd2aa1.vercel.app,https://figma-leave-approval-layout.vercel.app`
  - `FRONTEND_URL`: `https://figma-leave-approval-layout.vercel.app`
- Wait for redeploy (2-3 minutes)

### 2. Update Vercel Backend URL
- Go to Vercel dashboard
- Set `VITE_API_URL` to: `https://leave-management-portal-5lb6.onrender.com/api`
- Redeploy

### 3. Deploy to Production
```bash
vercel --prod
```

### 4. Test Your App
- Open: https://figma-leave-approval-layout.vercel.app
- Try to login
- Should work!

---

## Your Deployment URLs

- **Backend**: https://leave-management-portal-5lb6.onrender.com
- **Backend API**: https://leave-management-portal-5lb6.onrender.com/api
- **Frontend (Preview)**: https://figma-leave-approval-layout-kw7ydrfmz-jishnus-projects-49bd2aa1.vercel.app
- **Frontend (Production)**: https://figma-leave-approval-layout.vercel.app
