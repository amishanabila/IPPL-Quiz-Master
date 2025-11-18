# DEBUG CHECKLIST - Profile Not Loading

## Penyebab Umum Error "Gagal memuat profil"

### 1. ✅ Token Issues
- [ ] Check localStorage "authToken" ada atau tidak
- [ ] Buka Browser DevTools → Application → Storage → Local Storage
- [ ] Pastikan authToken tidak kosong
- [ ] Pastikan token format: eyJhbGciOiJIUzI1NiIs...

**Solusi jika tidak ada token:**
- Login kembali
- Pastikan login response include token

---

### 2. ✅ API Request Issues
- [ ] Buka Browser DevTools → Network tab
- [ ] Refresh halaman /profil
- [ ] Cari request GET `/api/user/me`
- [ ] Check:
  - Status: 200 OK (bukan 401, 500, etc)
  - Authorization header: "Bearer {token}"
  - Response body memiliki status: "success"

**Jika response 401 Unauthorized:**
```
Kemungkinan:
- Token invalid/expired
- Token format salah
- Backend middleware tidak read token
```

**Jika response 500:**
```
Kemungkinan:
- Backend error
- Database connection error
- req.user.userId undefined
```

---

### 3. ✅ Database Issues
**Check di MySQL/phpMyAdmin:**

```sql
-- Check users table exists
SHOW TABLES;

-- Check users table structure
DESC users;

-- Should include columns:
-- | id       | int(11)    | PRIMARY KEY | AUTO_INCREMENT |
-- | nama     | varchar    |
-- | email    | varchar    | UNIQUE     |
-- | password | varchar    |
-- | telepon  | varchar    |
-- | foto     | longblob   |
-- | role     | enum       |
-- | is_verified | tinyint |
-- | created_at  | timestamp |

-- Check if your user data exists
SELECT id, nama, email, telepon FROM users LIMIT 5;
```

---

### 4. ✅ Backend Auth Middleware Check

**File: `/backend/src/middleware/auth.js`**
- [ ] Pastikan middleware extract token dari "Authorization" header
- [ ] Pastikan middleware verify JWT dengan JWT_SECRET
- [ ] Pastikan middleware set `req.user = decoded`

**Test di curl:**
```bash
curl -X GET http://localhost:5000/api/user/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "nama": "John Doe",
      "email": "john@gmail.com",
      "telepon": "08123456789",
      "foto": "data:image/png;base64,...",
      "role": "user",
      "is_verified": true
    }
  }
}
```

---

### 5. ✅ Token Payload Check

**Pastikan login method generate token dengan `userId`:**

File: `/backend/src/controllers/authController.js`
```javascript
// BENAR ✅
const token = jwt.sign(
  { userId: user.id, email: user.email },  // userId harus ada!
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

// SALAH ❌
const token = jwt.sign(
  { id: user.id, email: user.email },  // ini tidak cocok dengan getProfile
  ...
);
```

**Decode token untuk check payload:**
- Paste token di https://jwt.io
- Check payload memiliki `userId` field

---

### 6. ✅ Frontend authService Check

**File: `/frontend/src/services/authService.js`**
- [ ] getProfile() call ke URL yang benar: `${BASE_URL}/user/me`
- [ ] Punya Authorization header: `Bearer {token}`
- [ ] Throw error jika token tidak ada
- [ ] Handle response status

---

### 7. ✅ .env Configuration

**File: `/backend/.env`**
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=quiz_master
JWT_SECRET=your_super_secret_key
NODE_ENV=development
PORT=5000
```

- [ ] DB credentials benar
- [ ] JWT_SECRET ada (tidak kosong)
- [ ] PORT=5000 (atau sesuai backend listen)

---

### 8. ✅ Frontend Constants

**File: `/frontend/src/services/authService.js`**
```javascript
const BASE_URL = 'http://localhost:5000/api';
const AUTH_TOKEN_KEY = 'authToken';
const USER_DATA_KEY = 'userData';
```

- [ ] BASE_URL correct ke backend URL
- [ ] PORT 5000 cocok dengan backend

---

## 🧪 Quick Debug Steps

### Langkah 1: Check Token
```javascript
// Di Browser Console:
localStorage.getItem('authToken')
```
Output harus: `eyJhbGciOiJIUzI1NiIs...` (bukan null/undefined)

### Langkah 2: Check API Response
```javascript
// Di Browser Console:
fetch('http://localhost:5000/api/user/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  }
}).then(r => r.json()).then(console.log)
```

Output harus:
```json
{ "status": "success", "data": { "user": {...} } }
```

### Langkah 3: Check Backend Logs
- Lihat console backend (npm run dev)
- Pastikan request masuk: `GET /api/user/me`
- Check error log jika ada

---

## ✨ Solution Summary

Jika error "Gagal memuat profil. Silakan refresh halaman":

1. **Cek token di localStorage** - ada atau tidak?
2. **Cek /api/user/me response** - status berapa?
3. **Cek token payload** - ada userId atau tidak?
4. **Cek database** - user data ada atau tidak?
5. **Cek .env** - JWT_SECRET ada atau tidak?
6. **Restart backend** - `npm run dev`

---

## 📝 Error Messages Reference

| Error Message | Penyebab | Solusi |
|---|---|---|
| "Token tidak ditemukan" | Tidak login | Login kembali |
| "HTTP Error: 401" | Token invalid/expired | Login kembali |
| "HTTP Error: 404" | User not found di DB | Check database |
| "HTTP Error: 500" | Backend error | Check console log backend |
| "Failed to load profile" | API response bukan success | Check response format |

