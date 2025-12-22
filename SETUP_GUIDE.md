# QuizMaster - Setup & Troubleshooting Guide

## 🚀 Current Status
- **Frontend**: Deployed on Vercel (https://ippl-quiz-master.vercel.app)
- **Backend**: Deployed on Railway (https://ippl-quiz-master-production.up.railway.app)
- **Database**: MySQL on Railway

## 📋 Complete Setup Checklist

### Step 1: Railway Backend Environment Variables ⚠️ **REQUIRED**
Go to: **Railway Dashboard → Select Project → Backend Service → Variables**

Add/Update these variables:
```
PORT=5000
NODE_ENV=production
DB_HOST=shuttle.proxy.rlwy.net
DB_PORT=43358
DB_USER=root
DB_PASSWORD=wKdNtcTjTLGpGzQyIAmhxyEsAyLlSBGC
DB_NAME=railway
JWT_SECRET=1a3a0a279b9fd4bb17aa84f910a4884d957c1343d757c425975eb706c70d808d6cb3cda1d2eeab5344ece3fa16667ebbe43e089ffa93f87e401935b150c11cc3
EMAIL_USER=amishanabila37@gmail.com
EMAIL_PASSWORD=xawn wvup jarh lfde
FRONTEND_URL=https://ippl-quiz-master.vercel.app
```

✅ After saving, Railway will auto-redeploy backend.

### Step 2: Verify Backend Health
Open in browser: `https://ippl-quiz-master-production.up.railway.app/health`

Should see:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-12-22T...",
  "environment": "production"
}
```

**If error**, check Railway logs for database connection issues.

### Step 3: Database Schema Setup
When backend starts with environment variables set, it will automatically:
1. Connect to Railway MySQL
2. Check if tables exist
3. Create tables if missing

⚠️ **If tables don't exist**, check backend logs in Railway Dashboard.

### Step 4: Test Login
1. Go to: https://ippl-quiz-master.vercel.app/login
2. Try login with test account
3. Check browser Network tab for API errors

## 🔍 Debugging

### Test API Connection
```bash
# Check if backend is running
curl https://ippl-quiz-master-production.up.railway.app/health

# Test login endpoint
curl -X POST https://ippl-quiz-master-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### Frontend Console Errors
1. Open DevTools (F12) → Console tab
2. Check for API errors
3. Verify BASE_URL is correct (should be Railway backend URL)

### Railway Logs
1. Go to Railway Dashboard → Backend Service → Logs
2. Look for database connection errors
3. Check for missing environment variables

## 🛠️ Common Issues

### Error: "Cannot connect to database"
- **Cause**: Environment variables not set in Railway
- **Fix**: Go to Railway Dashboard → Variables → Add all variables above

### Error: 404 on /login
- **Cause**: Frontend routing issue (should be fixed by vercel.json)
- **Fix**: Hard refresh (Ctrl+Shift+Delete) and clear cache

### Error: "Terjadi kesalahan saat login"
- **Cause**: Backend database not initialized or API not responding
- **Fix**: 
  1. Check /health endpoint
  2. Check Railway logs
  3. Ensure database tables exist

### Error: CORS error
- **Cause**: Frontend and backend domain mismatch
- **Fix**: Already handled with `origin: '*'` in CORS

## 📦 Files Changed
- `backend/server.js` - Added /health endpoint, added db import
- `backend/setup-db.js` - Auto database setup script
- `backend/package.json` - Updated start script to run setup-db first
- `backend/src/config/db.js` - Added DB_PORT support
- `frontend/vercel.json` - SPA routing configuration
- `frontend/.env` - Updated API URL variable name
- `frontend/vite.config.js` - Added history API fallback

## 🚀 Next Steps

1. **Set Railway environment variables** (required!)
2. **Monitor deployment** - Wait for backend to redeploy
3. **Check /health endpoint** - Verify database connection
4. **Test login** - Try logging in
5. **Monitor Network tab** - Check for API errors

## 📞 Quick Reference

**Frontend URL**: https://ippl-quiz-master.vercel.app
**Backend URL**: https://ippl-quiz-master-production.up.railway.app
**Health Check**: https://ippl-quiz-master-production.up.railway.app/health
**Railway Dashboard**: https://railway.app

---
Last Updated: 2025-12-22
