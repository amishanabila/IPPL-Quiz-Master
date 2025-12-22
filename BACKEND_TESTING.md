# Testing Backend After Deployment to Vercel

## ✅ Quick Test Checklist

### 1. Health Check
```bash
curl https://your-backend.vercel.app/health
```

Expected:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-12-22T10:00:00.000Z",
  "environment": "production",
  "uptime": 123.45
}
```

### 2. CORS Test (dari browser frontend Anda)
```javascript
// Buka console di frontend Vercel
fetch('https://your-backend.vercel.app/health')
  .then(r => r.json())
  .then(d => console.log(d))
  .catch(e => console.error('CORS Error:', e))
```

### 3. API Endpoints

#### Register
```bash
curl -X POST https://your-backend.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Password123!",
    "role": "peserta"
  }'
```

#### Login
```bash
curl -X POST https://your-backend.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }'
```

#### Get Categories
```bash
curl https://your-backend.vercel.app/api/kategori
```

#### Get User Profile (with token)
```bash
# Ganti TOKEN dengan JWT dari login response
curl https://your-backend.vercel.app/api/user/profile \
  -H "Authorization: Bearer TOKEN"
```

## 🔍 Debugging

### Check Vercel Logs
```bash
# Install Vercel CLI if not yet
npm install -g vercel

# Login
vercel login

# View logs
vercel logs --follow
```

### Common Issues

#### Database Connection Error
**Error:** `Error: connect ECONNREFUSED`

**Fix:**
1. Check PlanetScale connection string format:
   ```
   mysql://username:password@hostname:port/database
   ```
2. Verify env variables di Vercel:
   - `DB_HOST`: hostname dari PlanetScale
   - `DB_PORT`: port (biasanya 3306)
   - `DB_USER`: username
   - `DB_PASSWORD`: password (jangan ada special chars yang tidak di-escape)
3. Make sure database created dan tables exist

#### CORS Error
**Error:** `Access to XMLHttpRequest at 'https://backend.vercel.app' from origin 'https://frontend.vercel.app' has been blocked by CORS policy`

**Fix:**
1. Update env variables:
   ```
   FRONTEND_URL=https://frontend.vercel.app
   CORS_ORIGIN=https://frontend.vercel.app
   ```
2. Redeploy backend
3. Clear frontend cache (Ctrl+Shift+R atau npm cache)

#### JWT Secret Missing
**Error:** `Error: JwtError`

**Fix:**
1. Generate secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Add ke Vercel env: `JWT_SECRET=<generated-value>`
3. Redeploy

#### Email Service Not Configured
**Error:** `Error sending email`

**Fix:**
- Setup Email env variables:
  ```
  EMAIL_SERVICE=gmail
  EMAIL_USER=your-email@gmail.com
  EMAIL_PASSWORD=your-app-password-16-chars
  ```
- Untuk Gmail: gunakan [App Password](https://support.google.com/accounts/answer/185833), bukan password biasa

## 📊 Load Testing (Optional)

### Simple Load Test
```bash
# Perlu Apache Bench
ab -n 100 -c 10 https://your-backend.vercel.app/health

# Atau pakai wrk (perlu install)
wrk -t4 -c100 -d30s https://your-backend.vercel.app/health
```

## 🎯 Test Frontend Integration

### Setup di frontend:

1. Update `.env`:
   ```
   VITE_API_URL=https://your-backend.vercel.app
   ```

2. Test di browser console:
   ```javascript
   const apiUrl = import.meta.env.VITE_API_URL;
   console.log('API URL:', apiUrl);
   
   fetch(`${apiUrl}/health`)
     .then(r => r.json())
     .then(d => console.log('Backend health:', d))
   ```

3. Test login flow:
   - Open frontend
   - Try register
   - Try login
   - Check browser DevTools → Network tab untuk request details

## ✅ Final Verification

Sebelum production, pastikan:
- [ ] Health endpoint returns `status: ok` dan `database: connected`
- [ ] All env variables set di Vercel
- [ ] CORS error sudah hilang di frontend
- [ ] Login/Register flow working
- [ ] Database queries executing correctly
- [ ] Logs menunjukkan no errors

---

**Sudah semuanya tested dan working?** Congrats! Backend siap untuk production! 🚀
