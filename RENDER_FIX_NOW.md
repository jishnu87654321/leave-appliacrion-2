# 🔧 Fix "Cannot find module 'dotenv'" Error

## The Problem
Render is running `npm run build` successfully, but NOT installing dependencies. That's why `dotenv` and other modules are missing.

## ✅ Solution (Choose One)

### Option 1: Update Build Command in Render Dashboard (Fastest)

1. Go to your Render dashboard
2. Click on your service: **leave-management-backend**
3. Click **Settings** (left sidebar)
4. Scroll to **Build & Deploy** section
5. Update **Build Command** to:
   ```
   npm install --production
   ```
6. Click **Save Changes**
7. Go back to your service
8. Click **Manual Deploy** → **Clear build cache & deploy**

### Option 2: Let Render Auto-Detect (Recommended)

1. In Render dashboard, go to **Settings**
2. **Delete** the Build Command (leave it empty)
3. Render will auto-detect and run `npm install`
4. Click **Save Changes**
5. Click **Manual Deploy** → **Clear build cache & deploy**

---

## Why This Happened

The build command was set to `npm run build`, which runs our dummy build script but doesn't install dependencies. We need to either:
- Run `npm install` explicitly, OR
- Let Render auto-detect (it will run `npm install` automatically)

---

## Verify It Works

After redeploying, check the logs. You should see:

```
==> Running build command 'npm install --production'
added 50 packages...
==> Build successful 🎉
==> Running 'npm start'
> leave-management-backend@1.0.0 start
> node start.js

╔════════════════════════════════════════════╗
║   Leave Management System - Backend       ║
╚════════════════════════════════════════════╝

📦 Environment: production
🔌 Database: Connected
🔐 Security: Enabled
```

---

## Still Getting Errors?

If you still see "Cannot find module" errors:

1. **Clear build cache**: Manual Deploy → Clear build cache & deploy
2. **Check Root Directory**: Must be set to `backend`
3. **Check package.json**: Should be in `backend/package.json`
4. **Check logs**: Look for "npm install" in the build logs

---

## Alternative: Use render.yaml (Already Done)

I've already updated `render.yaml` with the correct build command. If Render is using the YAML file, it should work automatically on the next deploy.

Just trigger a new deployment:
- Push any change to GitHub, OR
- Click "Manual Deploy" in Render dashboard

---

## Quick Test

Once deployed successfully, test:
```bash
curl https://your-backend-url.onrender.com/api/health
```

Should return:
```json
{"status":"ok","timestamp":"2026-03-07T..."}
```

🎉 You're done!
