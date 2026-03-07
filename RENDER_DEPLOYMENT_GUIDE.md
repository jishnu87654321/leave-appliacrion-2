# Deploy Backend to Render - Step by Step Guide

## Prerequisites
✅ GitHub repository: https://github.com/ae9-in/leave-management-portal.git
✅ MongoDB Atlas account (or any MongoDB URI)

---

## Step 1: Sign Up for Render

1. Go to https://render.com
2. Click "Get Started for Free"
3. Sign up with GitHub (recommended) or email
4. Verify your email if needed

---

## Step 2: Create a New Web Service

1. Click the **"New +"** button (top right)
2. Select **"Web Service"**
3. Click **"Connect account"** to link your GitHub
4. Find and select: **ae9-in/leave-management-portal**
5. Click **"Connect"**

---

## Step 3: Configure the Web Service

Fill in these settings:

### Basic Settings
- **Name**: `leave-management-backend` (or any name you prefer)
- **Region**: Choose closest to you (e.g., Singapore, Oregon)
- **Branch**: `dev-jishnu` (or `main` if you want)
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Instance Type
- **Free** (select the free tier)

---

## Step 4: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add these variables one by one:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_atlas_uri_here
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRE=7d
JWT_ISSUER=leave-ms-api
JWT_AUDIENCE=leave-ms-web
CORS_ORIGIN=https://figma-leave-approval-layout.vercel.app
FRONTEND_URL=https://figma-leave-approval-layout.vercel.app
SMTP_HOST=smtp.zoho.com
SMTP_PORT=587
SMTP_USER=info@aceitup.in
SMTP_PASS=your_zoho_app_password
SMTP_FROM="ACE IT UP" <info@aceitup.in>
ADMIN_EMAIL=info@aceitup.in
EMAIL_NOTIFICATIONS_ENABLED=true
```

### Important Notes:
- **MONGODB_URI**: Get this from MongoDB Atlas (see Step 5 below)
- **JWT_SECRET**: Generate a strong random string (min 32 characters)
- **SMTP_PASS**: Use Zoho App Password (not your regular password)
- **CORS_ORIGIN**: Update with your actual Vercel frontend URL after deployment

---

## Step 5: Get MongoDB Atlas URI (if you don't have one)

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free
3. Create a new cluster (free tier M0)
4. Click **"Connect"** → **"Connect your application"**
5. Copy the connection string, it looks like:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/leave_management?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your actual database password
7. Replace `myFirstDatabase` with `leave_management`

---

## Step 6: Deploy!

1. Click **"Create Web Service"** at the bottom
2. Wait 3-5 minutes for the build to complete
3. You'll see logs in real-time
4. Once deployed, you'll get a URL like: `https://leave-management-backend.onrender.com`

---

## Step 7: Test Your Backend

Open your browser and test:
```
https://your-backend-url.onrender.com/api/health
```

You should see a success response!

---

## Step 8: Update Frontend Environment Variable

Now update your Vercel frontend to use the new backend URL:

1. Go to https://vercel.com/dashboard
2. Select your project: **figma-leave-approval-layout**
3. Go to **Settings** → **Environment Variables**
4. Add/Update:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-backend-url.onrender.com/api`
   - **Environment**: Production, Preview, Development (select all)
5. Click **"Save"**
6. Go to **Deployments** → Click **"..."** on latest → **"Redeploy"**

---

## Step 9: Seed Your Database

After backend is deployed, you need to seed the database with leave types:

### Option A: Using Render Shell (Recommended)
1. In Render dashboard, go to your web service
2. Click **"Shell"** tab (top right)
3. Run: `node seeds/seedData.js`

### Option B: Using Local Script
1. Update your local `backend/.env` with production MongoDB URI
2. Run: `cd backend && node seeds/seedData.js`
3. Revert your local `.env` back to localhost

---

## Step 10: Create First Admin User

After seeding, create your first HR Admin:

1. In Render Shell, run:
   ```bash
   node scripts/createFirstAdmin.js
   ```
2. Follow the prompts to create your admin account

OR register through the frontend and manually activate in MongoDB Atlas:
1. Register at your frontend URL
2. Go to MongoDB Atlas → Browse Collections
3. Find your user in `users` collection
4. Edit: Set `role: "HR_ADMIN"` and `isActive: true`

---

## 🎉 Done!

Your full-stack app is now deployed:
- **Frontend**: https://figma-leave-approval-layout.vercel.app
- **Backend**: https://your-backend-url.onrender.com

---

## Troubleshooting

### Backend won't start
- Check logs in Render dashboard
- Verify all environment variables are set
- Ensure MongoDB URI is correct

### Frontend can't connect to backend
- Check CORS_ORIGIN in backend env vars
- Verify VITE_API_URL in Vercel env vars
- Check browser console for errors

### Database connection fails
- Verify MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
- Check username/password in connection string
- Ensure database name is correct

---

## Free Tier Limitations

Render free tier:
- ✅ 750 hours/month (enough for 1 service)
- ✅ Automatic HTTPS
- ✅ Continuous deployment from GitHub
- ⚠️ Spins down after 15 minutes of inactivity (first request takes ~30 seconds)
- ⚠️ 512 MB RAM

To avoid spin-down, upgrade to paid tier ($7/month) or use a service like UptimeRobot to ping your backend every 10 minutes.

---

## Next Steps

1. Set up MongoDB Atlas backups
2. Configure custom domain (optional)
3. Set up monitoring/alerts
4. Enable GitHub auto-deploy on push

Need help? Check Render docs: https://render.com/docs
