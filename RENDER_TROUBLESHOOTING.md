# Render Deployment Troubleshooting

## ✅ FIXED: Missing "build" script error

**Error**: `npm error Missing script: "build"`

**Solution**: ✅ Already fixed! I've added a build script to `backend/package.json` and pushed to GitHub.

**What I did**:
1. Added `"build": "echo 'No build step required'"` to package.json
2. Created `render.yaml` for better Render configuration
3. Pushed changes to GitHub

**Action Required**: 
- If your Render deployment is still failing, click **"Manual Deploy"** → **"Clear build cache & deploy"**
- Or create a new deployment (it will pull the latest code with the fix)

---

## Common Render Deployment Issues

### 1. Build Command Issues

**Problem**: Render tries to auto-detect build command

**Solutions**:
- Set Build Command to: `npm install` (nothing else)
- Or leave it empty
- The dummy build script will handle any auto-detection

### 2. Root Directory Not Set

**Problem**: Render tries to build from project root instead of backend folder

**Solution**:
- Make sure **Root Directory** is set to: `backend`
- This tells Render to look for package.json in the backend folder

### 3. Environment Variables Missing

**Problem**: App crashes with "Cannot connect to database" or similar

**Solution**:
- Check all environment variables are added in Render dashboard
- Required variables:
  - `NODE_ENV=production`
  - `PORT=5000`
  - `MONGODB_URI=your_mongodb_uri`
  - `JWT_SECRET=your_secret`
  - All SMTP variables
  - CORS_ORIGIN and FRONTEND_URL

### 4. MongoDB Connection Fails

**Problem**: "MongoNetworkError" or "Authentication failed"

**Solutions**:
- Check MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
- Verify username/password in connection string
- Ensure database name is in the URI: `...mongodb.net/leave_management?retryWrites=true`
- Check if IP whitelist includes 0.0.0.0/0 in MongoDB Atlas

### 5. Port Already in Use

**Problem**: "Port 5000 is already in use"

**Solution**:
- This shouldn't happen on Render (they assign ports dynamically)
- Make sure your code uses: `process.env.PORT || 5000`
- Check `backend/server.js` - it should already have this

### 6. Health Check Fails

**Problem**: Render shows "Service Unhealthy"

**Solutions**:
- Check if `/api/health` endpoint exists in your backend
- Test locally: `curl http://localhost:5000/api/health`
- Check Render logs for actual error
- Temporarily disable health check in Render settings

### 7. Slow Cold Starts

**Problem**: First request takes 30+ seconds

**Explanation**: This is normal on Render free tier
- Service spins down after 15 minutes of inactivity
- First request wakes it up (takes ~30 seconds)

**Solutions**:
- Upgrade to paid tier ($7/month) for always-on service
- Use UptimeRobot to ping your service every 10 minutes
- Accept it as a limitation of free tier

### 8. Logs Show "Cannot find module"

**Problem**: Missing dependencies

**Solutions**:
- Make sure all dependencies are in `package.json` (not devDependencies)
- Clear build cache and redeploy
- Check if `node_modules` is in `.gitignore` (it should be)

---

## How to Check Render Logs

1. Go to Render dashboard
2. Click on your service
3. Click **"Logs"** tab
4. Look for errors (red text)
5. Common errors to look for:
   - MongoDB connection errors
   - Missing environment variables
   - Port binding issues
   - Module not found errors

---

## How to Redeploy

### Option 1: Automatic (Recommended)
```bash
git add .
git commit -m "Fix deployment issue"
git push origin dev-jishnu
```
Render will automatically detect the push and redeploy.

### Option 2: Manual
1. Go to Render dashboard
2. Click on your service
3. Click **"Manual Deploy"** button (top right)
4. Select **"Clear build cache & deploy"** if needed

---

## How to Clear Build Cache

If deployment keeps failing with the same error:

1. Go to Render dashboard
2. Click on your service
3. Click **"Manual Deploy"** → **"Clear build cache & deploy"**
4. This forces a fresh build

---

## Test Your Deployment

After successful deployment, test these endpoints:

```bash
# Health check
curl https://your-backend-url.onrender.com/api/health

# Should return: {"status":"ok","timestamp":"..."}
```

```bash
# Test CORS
curl -H "Origin: https://figma-leave-approval-layout.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://your-backend-url.onrender.com/api/health
```

---

## Still Having Issues?

1. **Check Render Status**: https://status.render.com
2. **Check Render Docs**: https://render.com/docs
3. **Check Logs**: Look for specific error messages
4. **Test Locally**: Make sure it works on your machine first
5. **Compare Environment**: Ensure local .env matches Render env vars

---

## Quick Checklist

- [ ] Root Directory set to `backend`
- [ ] Build Command is `npm install` or empty
- [ ] Start Command is `npm start`
- [ ] All environment variables added
- [ ] MongoDB Atlas allows connections from 0.0.0.0/0
- [ ] Latest code pushed to GitHub
- [ ] Build cache cleared if needed
- [ ] Logs checked for specific errors

---

## Contact Support

If nothing works:
- Render Community: https://community.render.com
- Render Support: support@render.com (paid plans only)
- Check this repo's issues: https://github.com/ae9-in/leave-management-portal/issues
