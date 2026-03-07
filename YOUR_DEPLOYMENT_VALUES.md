# Your Deployment Values

## 🔐 Generated JWT Secret
```
3fca41b954a35bcdd8b1c4ff8ffdfc5462bc1c291eadf5371bf01dc767b862a3
```
**⚠️ Keep this secret! Don't share publicly.**

---

## 📝 Environment Variables Ready to Copy

### For Render Backend

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=<GET_FROM_MONGODB_ATLAS>
JWT_SECRET=3fca41b954a35bcdd8b1c4ff8ffdfc5462bc1c291eadf5371bf01dc767b862a3
JWT_EXPIRE=7d
JWT_ISSUER=leave-ms-api
JWT_AUDIENCE=leave-ms-web
CORS_ORIGIN=https://figma-leave-approval-layout.vercel.app
FRONTEND_URL=https://figma-leave-approval-layout.vercel.app
SMTP_HOST=smtp.zoho.com
SMTP_PORT=587
SMTP_USER=info@aceitup.in
SMTP_PASS=<YOUR_ZOHO_APP_PASSWORD>
SMTP_FROM="ACE IT UP" <info@aceitup.in>
ADMIN_EMAIL=info@aceitup.in
EMAIL_NOTIFICATIONS_ENABLED=true
```

### For Vercel Frontend

```env
VITE_API_URL=<YOUR_RENDER_BACKEND_URL>/api
```

Example: `https://leave-management-backend.onrender.com/api`

---

## 🔗 Your URLs

### GitHub Repository
```
https://github.com/ae9-in/leave-management-portal
```

### Frontend (Vercel)
- **Preview**: https://figma-leave-approval-layout-bb6bd4zid-jishnus-projects-49bd2aa1.vercel.app
- **Production**: https://figma-leave-approval-layout.vercel.app

### Backend (Render)
- Will be: `https://[your-service-name].onrender.com`

---

## ✅ What You Need to Get

1. **MongoDB Atlas URI**
   - Sign up at: https://www.mongodb.com/cloud/atlas
   - Create free cluster
   - Get connection string
   - Format: `mongodb+srv://username:password@cluster.xxxxx.mongodb.net/leave_management`

2. **Zoho App Password** (if not already have)
   - Login to Zoho Mail
   - Go to Settings → Security → App Passwords
   - Generate new app password
   - Use this instead of your regular password

---

## 🚀 Deployment Order

1. ✅ Frontend Preview Deployed (Done!)
2. ⏳ Deploy Backend to Render (Follow RENDER_DEPLOYMENT_GUIDE.md)
3. ⏳ Update Vercel with backend URL
4. ⏳ Deploy frontend to production: `vercel --prod`
5. ⏳ Seed database
6. ⏳ Create first admin user
7. ✅ Test the full application!

---

## 📞 Next Steps

1. Open **RENDER_DEPLOYMENT_GUIDE.md** for detailed instructions
2. Sign up at https://render.com
3. Follow the guide step by step
4. Come back when backend is deployed to update frontend

Good luck! 🎉
