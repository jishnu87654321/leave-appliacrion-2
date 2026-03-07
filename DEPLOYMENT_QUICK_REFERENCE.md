# Deployment Quick Reference

## 🚀 Current Deployment Status

### Frontend (Vercel)
- **Preview URL**: https://figma-leave-approval-layout-bb6bd4zid-jishnus-projects-49bd2aa1.vercel.app
- **Production URL**: https://figma-leave-approval-layout.vercel.app (after `vercel --prod`)
- **Status**: ✅ Deployed (Preview)

### Backend (Render)
- **Status**: ⏳ Pending - Follow RENDER_DEPLOYMENT_GUIDE.md
- **Expected URL**: https://leave-management-backend.onrender.com (or your chosen name)

---

## 📋 Quick Checklist

### Backend Deployment (Render)
- [ ] Sign up at https://render.com
- [ ] Create Web Service from GitHub repo
- [ ] Set Root Directory: `backend`
- [ ] Add all environment variables (see below)
- [ ] Deploy and wait for build
- [ ] Test: `https://your-backend-url.onrender.com/api/health`
- [ ] Run seed script in Render Shell: `node seeds/seedData.js`
- [ ] Create first admin: `node scripts/createFirstAdmin.js`

### Frontend Update (Vercel)
- [ ] Add environment variable in Vercel dashboard:
  - Key: `VITE_API_URL`
  - Value: `https://your-backend-url.onrender.com/api`
- [ ] Redeploy frontend
- [ ] Deploy to production: `vercel --prod`

---

## 🔑 Environment Variables for Render

Copy these to Render (update values in CAPS):

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=YOUR_MONGODB_ATLAS_URI
JWT_SECRET=YOUR_STRONG_SECRET_MIN_32_CHARS
JWT_EXPIRE=7d
JWT_ISSUER=leave-ms-api
JWT_AUDIENCE=leave-ms-web
CORS_ORIGIN=https://figma-leave-approval-layout.vercel.app
FRONTEND_URL=https://figma-leave-approval-layout.vercel.app
SMTP_HOST=smtp.zoho.com
SMTP_PORT=587
SMTP_USER=info@aceitup.in
SMTP_PASS=YOUR_ZOHO_APP_PASSWORD
SMTP_FROM="ACE IT UP" <info@aceitup.in>
ADMIN_EMAIL=info@aceitup.in
EMAIL_NOTIFICATIONS_ENABLED=true
```

---

## 🔗 Important Links

- **Render Dashboard**: https://dashboard.render.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **MongoDB Atlas**: https://cloud.mongodb.com
- **GitHub Repo**: https://github.com/ae9-in/leave-management-portal

---

## 🛠️ Common Commands

### Deploy Frontend to Production
```bash
vercel --prod
```

### Check Vercel Deployment Status
```bash
vercel ls
```

### View Vercel Logs
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

## 📞 Support

- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com

---

## ⚡ Quick Deploy Commands

If you need to redeploy:

```bash
# Frontend (from project root)
vercel --prod

# Backend (automatic on git push to GitHub)
git add .
git commit -m "Update backend"
git push origin dev-jishnu
```

Render will automatically redeploy when you push to GitHub!
