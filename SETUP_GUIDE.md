# Setup Guide - IPPL Quiz Master

## 📋 Checklist Konfigurasi

### 1. Backend Setup

#### 1.1 Environment Variables
Buat file `.env` di folder `backend/`:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=quiz_master
JWT_SECRET=your_super_secret_key_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
NODE_ENV=development
PORT=5000
```

#### 1.2 Database Setup
1. Buka phpMyAdmin (http://localhost/phpmyadmin)
2. Import file `backend/database/schema.sql`:
   - Click "Import" tab
   - Select file `schema.sql`
   - Click "Go"
   - Database `quiz_master` akan otomatis dibuat dengan semua table

#### 1.3 Start Backend Server
```bash
cd backend
npm install
npm run dev
```
Server akan jalan di `http://localhost:5000`

### 2. Frontend Setup

#### 2.1 Install Dependencies
```bash
cd frontend
npm install
```

#### 2.2 Start Frontend Development Server
```bash
npm run dev
```
Frontend akan jalan di `http://localhost:5173` (atau port lain yang ditampilkan)

---

## 🔄 Profile Photo Sync Flow

### Data Flow:
```
1. User Edit Profile (EditProfilPopup)
   ↓
2. Upload to Backend (POST /api/user/me dengan FormData)
   ↓
3. Backend Process:
   - Validate input
   - Save foto as BLOB ke database
   - Convert BLOB ke Base64
   - Return user dengan foto Base64
   ↓
4. Frontend Actions:
   - Dispatch "profileUpdated" event
   - Update Header (desktop & mobile)
   - Update Profil page
   - Update EditProfilPopup
   ↓
5. All Components Re-render dengan foto terbaru
```

### API Endpoints:

#### Get Profile
```
GET /api/user/me
Header: Authorization: Bearer {token}
Response: {
  status: "success",
  data: {
    user: {
      id, nama, email, telepon, role,
      foto: "data:image/png;base64,..."
    }
  }
}
```

#### Update Profile
```
PUT /api/user/me
Header: Authorization: Bearer {token}
Body: FormData
  - nama: string
  - email: string
  - telepon: string
  - photo: File (optional)

Response: {
  status: "success",
  data: {
    user: { id, nama, email, telepon, foto, ... }
  }
}
```

---

## 🧪 Testing Profile Photo Feature

### Manual Testing Steps:

#### 1. User Registration & Login
- [ ] Register dengan email @gmail.com
- [ ] Verify email (check console untuk token)
- [ ] Login
- [ ] Pastikan token disimpan di localStorage

#### 2. View Profile
- [ ] Buka `/profil` page
- [ ] Pastikan data user ter-load dari database
- [ ] Foto default tampil jika belum upload

#### 3. Upload Profile Photo
- [ ] Click "Edit Profil"
- [ ] Click "Ubah Foto"
- [ ] Select image file
- [ ] Preview foto di modal
- [ ] Click "Simpan"
- [ ] Tunggu response dari server
- [ ] Foto update di profil page
- [ ] Reload halaman - foto masih ada (dari database)

#### 4. Check Header Photo Sync
- [ ] Desktop Header: Foto update di profile dropdown
- [ ] Mobile Header: Foto update di hamburger menu
- [ ] Foto di header sinkron dengan profil page
- [ ] Refresh halaman - header foto tetap ada (dari database)

---

## 🛠️ Troubleshooting

### Error: MODULE_NOT_FOUND - multer
**Solution:** Run `npm install multer` di folder backend

### Error: Can't connect to database
**Checks:**
- [ ] XAMPP/MySQL server running
- [ ] Database credentials benar di `.env`
- [ ] Database `quiz_master` exist di phpMyAdmin
- [ ] Table `users` memiliki kolom `foto` dan `telepon`

```sql
-- Check users table structure
DESC users;
```

### Error: Photo tidak tampil di header
**Checks:**
- [ ] Token valid di localStorage
- [ ] API `/api/user/me` return foto base64
- [ ] Header component listen ke "profileUpdated" event
- [ ] Check browser console untuk error

### Photo tidak tersimpan ke database
**Checks:**
- [ ] FormData dikirim dengan header "Authorization: Bearer {token}"
- [ ] Multer middleware di route `/api/user/me` PUT
- [ ] Backend `updateProfile` menerima `req.file.buffer`
- [ ] Database column `foto` type LONGBLOB

---

## 📝 Database Schema untuk Foto

```sql
-- Users table relevant columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS telepon VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS foto LONGBLOB;

-- Check columns
DESC users;
-- Output harus include:
-- | telepon | varchar(20) | YES | | NULL | |
-- | foto    | longblob    | YES | | NULL | |
```

---

## 🔑 Key Files Modified

### Backend:
- `server.js` - Added user routes
- `src/routes/userRoutes.js` - Added multer middleware
- `src/controllers/userController.js` - Added foto handling
- `src/controllers/authController.js` - Added verifyEmail, updated login
- `src/models/userModel.js` - Updated updateProfile
- `database/schema.sql` - Added foto, telepon columns

### Frontend:
- `src/auth/Profil.jsx` - Load from database, listen to events
- `src/header/Header.jsx` - Load from database, listen to events
- `src/header/HeaderMobile.jsx` - Added event listener for sync
- `src/popup/EditProfilPopup.jsx` - Upload FormData, dispatch event
- `src/services/authService.js` - Updated login & updateProfile

---

## 🚀 Next Steps

1. Verify semua file sudah di-update
2. Test database connection
3. Run backend `npm run dev`
4. Run frontend `npm run dev`
5. Test registration → login → profile photo upload
6. Check header photo sync across all components
7. Refresh browser - photo dari database tetap ada

