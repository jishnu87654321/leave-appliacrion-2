# Deployment Guide

## Architecture
- Frontend: Vite React app (`/`) deploy to Vercel.
- Backend: Express API (`/backend`) deploy to a Node host (Render/Railway/VM).

## 1) Backend Deployment
Set these environment variables on backend host:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=<your_mongodb_uri_with_db_or_base_uri>
JWT_SECRET=<strong_secret>
JWT_EXPIRE=7d
FRONTEND_URL=<https://your-frontend-domain>
CORS_ORIGIN=<https://your-frontend-domain>

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<gmail_address>
SMTP_PASS=<gmail_app_password>
SMTP_FROM=<gmail_address>
ADMIN_EMAIL=<admin_email>
ADMIN_EMAILS=<optional,comma,separated,list>
EMAIL_NOTIFICATIONS_ENABLED=true
```

Start command:

```bash
npm start
```

## 2) Frontend Deployment (Vercel)
Set frontend env on Vercel:

```env
VITE_API_URL=<https://your-backend-domain>/api
```

Build command:

```bash
npm run build
```

Output directory:

```txt
dist
```

`vercel.json` is included for SPA routing.

## 3) Post-Deploy Smoke Test
1. Backend health: `GET <backend>/health`
2. Frontend loads without console API errors.
3. Login works.
4. Apply leave works.
5. `POST <backend>/api/admin/test-email` works and inbox receives mail.

## 4) Common Production Notes
- Use Google App Password for `SMTP_PASS`.
- Keep `.env` files out of git.
- If using multiple frontend domains, set `CORS_ORIGIN` as comma-separated values.
