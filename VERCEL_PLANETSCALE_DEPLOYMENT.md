# Deploy Backend ke Vercel + PlanetScale

Deployment backend di Vercel (same platform dengan frontend) + PlanetScale untuk MySQL database.

## 📋 Requirement

- ✅ Frontend sudah di Vercel
- ✅ Vercel account
- ✅ PlanetScale account (free tier)
- ✅ GitHub repository connected ke Vercel

---

## 🗄️ Step 1: Setup PlanetScale Database

### 1.1 Create PlanetScale Account
- Signup di [planetscale.com](https://planetscale.com)
- Login dengan GitHub (recommended)

### 1.2 Create Database
1. **New Database** → `quiz-master`
2. **Pillih Plan:** Free (unlimited queries, reads/writes)
3. **Region:** Sesuaikan dengan lokasi users (Asia: Singapore/Tokyo)
4. Klik **Create Database**

### 1.3 Setup Schema
Di PlanetScale Dashboard:

1. Buka database → **Branches** → main
2. **Connect** → pilih **MySQL Client**
3. Copy connection string:
   ```
   mysql -h <host> -u <user> -p<password> <database>
   ```

Di terminal lokal:
```bash
# Gunakan connection string dari PlanetScale
mysql -h <host> -u <user> -p<password> quiz_master

# Import schema
source backend/database/quiz_master.sql
```

Atau gunakan PlanetScale Web Console:
1. Klik **Console** tab
2. Copy-paste queries dari `backend/database/quiz_master.sql`

### 1.4 Create Application Password
1. Database → **Passwords** tab
2. **New Password** → `vercel-app`
3. Copy connection string akan digunakan di Vercel

---

## 🚀 Step 2: Setup Backend di Vercel

### 2.1 Import Project ke Vercel

1. Pergi ke [vercel.com/dashboard](https://vercel.com/dashboard)
2. **Add New** → **Project**
3. **Import Git Repository** → Pilih `IPPL-Quiz-Master`
4. **Configure Project:**
   - **Project Name:** `ippl-quiz-master-backend` atau sesuai
   - **Framework Preset:** Other
   - **Root Directory:** `backend`
   - **Build Command:** `npm ci`
   - **Output Directory:** (kosongkan atau `.`)
   - **Install Command:** `npm install`

### 2.2 Set Environment Variables

Di Vercel Dashboard → Project Settings → **Environment Variables**

Tambahkan variables:

```
NODE_ENV = production
PORT = 5000

# PlanetScale Connection (pilih SALAH SATU format)
# Option A: DATABASE_URL (single string)
DATABASE_URL = mysql://username:password@hostname:port/quiz_master

# Option B: Individual variables
DB_HOST = hostname (dari PlanetScale)
DB_PORT = 3306 atau port custom
DB_USER = username
DB_PASSWORD = password
DB_NAME = quiz_master

# Security
JWT_SECRET = (generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Email Service (Gmail)
EMAIL_SERVICE = gmail
EMAIL_USER = your-email@gmail.com
EMAIL_PASSWORD = your-app-password

# CORS
FRONTEND_URL = https://your-frontend.vercel.app
CORS_ORIGIN = https://your-frontend.vercel.app
```

### 2.3 Deploy

1. Klik **Deploy** button
2. Vercel akan:
   - Download code dari GitHub
   - Install dependencies (`npm install`)
   - Build (`npm ci`)
   - Deploy ke serverless environment
3. Tunggu ~2-3 menit sampai deployment selesai

---

## ✅ Step 3: Verifikasi Deployment

### 3.1 Test Health Endpoint
```bash
curl https://your-backend-url.vercel.app/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-12-22T10:00:00.000Z",
  "environment": "production"
}
```

### 3.2 Test API Endpoints
```bash
# Test login endpoint
curl -X POST https://your-backend-url.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test get categories
curl https://your-backend-url.vercel.app/api/kategori
```

### 3.3 Check Logs
Di Vercel Dashboard → Project → **Deployments** → Latest deployment → **Logs**

---

## 🔗 Step 4: Update Frontend

Update frontend `.env` atau Vercel environment variables dengan backend URL:

```
VITE_API_URL=https://your-backend-url.vercel.app
```

Test di Vercel:
1. Frontend Vercel Dashboard → Settings → **Environment Variables**
2. Update `VITE_API_URL` ke backend URL Vercel
3. Trigger redeploy (atau auto-redeploy jika GitHub connected)

---

## 📊 PlanetScale Features

### Monitor Database
- **Insights** tab: Query analytics, performance
- **Backups** tab: Automatic backups (setiap jam)
- **Metrics** tab: Connections, queries, slow queries

### Scaling
- PlanetScale otomatis scale, no downtime migrations
- Unlimited reads/writes pada free tier (fairly used)

---

## 🚨 Troubleshooting

### Error: Database Connection Refused
```
Error: connect ECONNREFUSED
```
**Solution:**
- Verify PlanetScale connection string di env variables
- Pastikan password benar
- Check PlanetScale dashboard apakah database aktif
- Jika pakai IP whitelist, add Vercel IP ranges

### Error: CORS dari Frontend
```
Access to XMLHttpRequest has been blocked by CORS policy
```
**Solution:**
- Update `CORS_ORIGIN` env variable di backend
- Restart deployment

### Deployment Fails
**Cek di Logs:**
1. Vercel Dashboard → Deployments → Failed deployment
2. Lihat error message
3. Common issues:
   - Missing env variables → Set di Project Settings
   - npm install gagal → Check package.json & lock files
   - Database connection → Verify connection string

### Database Seeding Gagal
Jika tables tidak exist:
1. Login ke PlanetScale Console
2. Paste SQL queries dari `backend/database/quiz_master.sql`
3. Execute setiap query

---

## 📈 Upgrade Plan (Optional)

Saat ini pakai:
- ✅ Vercel Free (12 serverless functions, limited compute)
- ✅ PlanetScale Free (unlimited reads/writes, 1 dev branch)

Upgrade jika:
- ⬆️ **Vercel Pro:** $20/month - faster builds, more features
- ⬆️ **PlanetScale Pro:** $49/month - more performance insights

---

## 🎯 Checklist

- [ ] PlanetScale account dibuat
- [ ] Database `quiz-master` dibuat
- [ ] Schema di-import ke PlanetScale
- [ ] Connection password di-generate
- [ ] Project di-import ke Vercel
- [ ] Environment variables set di Vercel
- [ ] Deployment success
- [ ] Health check endpoint working
- [ ] API endpoints tested
- [ ] Frontend connected ke backend URL

---

**Selamat! Backend Anda sekarang live di Vercel + PlanetScale!** 🎉

Untuk pertanyaan: tanya di sini atau cek [Vercel Docs](https://vercel.com/docs) dan [PlanetScale Docs](https://planetscale.com/docs)
