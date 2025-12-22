# Quick Start: Vercel + PlanetScale Setup

## 🎯 Objectives
- Backend di Vercel (same platform dengan frontend)
- Database di PlanetScale (free MySQL)
- Auto-deploy dari GitHub

## 📋 Checklist Setup

### PlanetScale Setup
- [ ] Signup di planetscale.com
- [ ] Create database `quiz-master`
- [ ] Copy connection string
- [ ] Import schema (dari backend/database/quiz_master.sql)
- [ ] Create password untuk production

### Vercel Setup
- [ ] Login ke vercel.com
- [ ] Import project `IPPL-Quiz-Master`
- [ ] Set root directory: `backend`
- [ ] Set environment variables:
  ```
  NODE_ENV=production
  DB_HOST=<from-planetscale>
  DB_PORT=3306
  DB_USER=<from-planetscale>
  DB_PASSWORD=<from-planetscale>
  DB_NAME=quiz_master
  JWT_SECRET=<generate-random>
  EMAIL_SERVICE=gmail
  EMAIL_USER=<your-email>
  EMAIL_PASSWORD=<app-password>
  FRONTEND_URL=https://your-frontend.vercel.app
  CORS_ORIGIN=https://your-frontend.vercel.app
  ```
- [ ] Deploy
- [ ] Check health endpoint: `https://backend.vercel.app/health`

### Frontend Update
- [ ] Update `VITE_API_URL` ke backend Vercel URL
- [ ] Trigger redeploy di Vercel

### Testing
- [ ] Health check: ✅ database connected
- [ ] Login endpoint: ✅ working
- [ ] API endpoints: ✅ responding
- [ ] Frontend CORS: ✅ no errors

## 🔧 Commands Useful

### Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Test Backend Locally
```bash
cd backend
npm install
npm run dev
```

### Check Deployment Logs
```bash
# Via Vercel CLI
vercel logs --follow
```

## 📚 Resources
- [Vercel Docs](https://vercel.com/docs)
- [PlanetScale Docs](https://planetscale.com/docs)
- [Express on Vercel](https://vercel.com/docs/runtimes/node)

## ✅ Status
- Backend: Vercel ✅
- Frontend: Vercel ✅
- Database: PlanetScale ✅
- All same platform = easier management! 🎉
