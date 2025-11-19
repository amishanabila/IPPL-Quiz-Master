# Update Guide - IPPL Quiz Master

## Perubahan yang Telah Dilakukan

### 1. Database Schema Updates ✅
- **Role User**: Diubah dari `ENUM('admin', 'user')` menjadi `ENUM('admin', 'kreator')`
  - Default role sekarang adalah `kreator`
  - Semua user yang existing akan otomatis diubah menjadi `kreator`

- **Table kumpulan_soal**: 
  - Ditambahkan kolom `waktu_per_soal` (INT, default 60 detik)
  - Untuk mengatur timer per soal dalam quiz

- **Table hasil_quiz**:
  - Kolom `waktu_selesai` (TIME) diubah menjadi `waktu_pengerjaan` (INT, dalam detik)
  - Untuk tracking waktu pengerjaan peserta lebih akurat

- **Table user_answers**:
  - Struktur disesuaikan untuk relasi dengan `hasil_quiz` melalui `hasil_id`
  - Menghapus reference ke `quiz_attempts` table

### 2. Backend Updates ✅

#### Controllers
- **quizController.js**: 
  - ✅ Menambahkan method `submitQuizResult()` untuk save hasil quiz langsung
  - ✅ Sudah ada `validatePin()` untuk validasi PIN 6 digit
  - ✅ Sudah ada `generatePin()` untuk generate PIN otomatis

- **soalController.js**: 
  - ✅ Update untuk support `waktu_per_soal` dan `judul` di kumpulan_soal
  - ✅ Menambahkan method `getSoalByKumpulanSoal()` untuk ambil soal by PIN
  - ✅ Support edit soal dengan update kategori dan nama materi

- **leaderboardController.js**: 
  - ✅ Menampilkan data dari table `hasil_quiz`
  - ✅ Include nama peserta, materi, kategori, skor, jawaban benar, dan waktu pengerjaan

#### Routes
- **quizRoutes.js**: 
  - ✅ Added route `POST /api/quiz/submit-result`
  - ✅ Already has `POST /api/quiz/validate-pin`
  - ✅ Already has `POST /api/quiz/generate-pin`

- **soalRoutes.js**: 
  - ✅ Added route `GET /api/soal/kumpulan-soal/:kumpulanSoalId`

### 3. Frontend Updates ✅

#### Komponen Utama
- **BuatSoal.jsx** (di folder "Buat Soal/"):
  - ✅ Unified form untuk buat dan edit soal (1 halaman)
  - ✅ Saat edit soal, kreator bisa ubah kategori dan nama materi
  - ✅ Support waktu per soal (timer)
  - ✅ Generate PIN otomatis setelah soal dibuat
  - ✅ Menampilkan popup dengan PIN setelah berhasil

- **HalamanAwalPeserta.jsx**:
  - ✅ Input PIN 6 digit
  - ✅ Validasi PIN ke backend
  - ✅ Redirect ke halaman soal setelah PIN valid dan nama terisi

- **Leaderboard.jsx**:
  - ✅ Menampilkan hasil akhir quiz dari database
  - ✅ Sortir berdasarkan skor tertinggi dan waktu tercepat
  - ✅ Menampilkan nama peserta, materi, kategori, skor, jawaban benar, dan waktu

- **api.js** (services):
  - ✅ Menambahkan method `validatePin(pin)`
  - ✅ Menambahkan method `generatePin(quizData)`
  - ✅ Menambahkan method `submitQuizResult(data)`
  - ✅ Menambahkan method `getSoalByKumpulanSoal(id)`
  - ✅ Menambahkan method `updateKumpulanSoal(id, data, token)`

## Cara Menjalankan Update

### Step 1: Update Database Schema
```bash
# Jalankan SQL script untuk update schema
mysql -u root -p quiz_master < backend/database/schema.sql
```

### Step 2: Update Role User Existing
```bash
# Di folder backend, jalankan script untuk update role
cd backend
node update-role-to-kreator.js
```

### Step 3: Install Dependencies (jika perlu)
```bash
# Backend
cd backend
npm install

# Frontend  
cd frontend
npm install
```

### Step 4: Jalankan Aplikasi
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Fitur yang Sudah Berfungsi

### 1. Peserta Masukkan PIN ✅
- Peserta bisa input PIN 6 digit di halaman awal
- Sistem validasi PIN ke database
- Jika PIN valid, mengarah ke halaman soal

### 2. Semua Data Masuk ke Database ✅
- Data quiz disimpan di table `quiz` dengan PIN
- Jawaban peserta disimpan di table `user_answers`
- Hasil quiz disimpan di table `hasil_quiz`
- Data kategori, materi, dan soal tersimpan lengkap

### 3. Role User Ganti Jadi Kreator ✅
- Default role = `kreator`
- User existing otomatis diubah ke `kreator`
- Hanya ada 2 role: `admin` dan `kreator`

### 4. Halaman Buat Soal dan Edit Soal Jadi 1 ✅
- 1 form untuk buat dan edit
- Saat edit, kreator bisa:
  - Ubah kategori
  - Ubah nama materi
  - Edit semua soal
  - Ubah waktu per soal

### 5. Hasil Akhir Muncul di Leaderboard ✅
- Leaderboard menampilkan semua hasil quiz
- Data diambil dari table `hasil_quiz`
- Terurut berdasarkan skor tertinggi
- Menampilkan: nama peserta, materi, kategori, skor, jawaban benar, waktu

## Testing Checklist

- [ ] Peserta bisa input PIN dan masuk ke soal
- [ ] Peserta bisa mengerjakan soal dan submit jawaban
- [ ] Hasil quiz masuk ke database (table `hasil_quiz`)
- [ ] Jawaban detail masuk ke database (table `user_answers`)
- [ ] Leaderboard menampilkan hasil quiz
- [ ] Kreator bisa buat soal baru dengan PIN otomatis
- [ ] Kreator bisa edit soal existing
- [ ] Saat edit soal, kreator bisa ubah kategori dan nama materi
- [ ] User baru otomatis jadi `kreator`
- [ ] User existing sudah diubah jadi `kreator`

## Notes

- Backend berjalan di `http://localhost:5000`
- Frontend berjalan di `http://localhost:5173` (Vite default)
- Database menggunakan MySQL dengan nama `quiz_master`
- PIN format: 6 digit angka (contoh: `123456`)
- Waktu per soal dalam detik (default: 60 detik)

## File yang Telah Diupdate

### Backend:
- ✅ `backend/database/schema.sql`
- ✅ `backend/src/controllers/quizController.js`
- ✅ `backend/src/controllers/soalController.js`
- ✅ `backend/src/controllers/leaderboardController.js`
- ✅ `backend/src/routes/quizRoutes.js`
- ✅ `backend/src/routes/soalRoutes.js`
- ✅ `backend/update-role-to-kreator.js` (new)

### Frontend:
- ✅ `frontend/src/Buat Soal/BuatSoal.jsx`
- ✅ `frontend/src/Buat Soal/FormBuatSoal.jsx`
- ✅ `frontend/src/Buat Soal/BannerBuatSoal.jsx`
- ✅ `frontend/src/HalamanAwalPeserta.jsx`
- ✅ `frontend/src/HalamanAwalKreator.jsx`
- ✅ `frontend/src/leaderboard/Leaderboard.jsx`
- ✅ `frontend/src/soal/Soal.jsx`
- ✅ `frontend/src/soal/LihatSoal.jsx`
- ✅ `frontend/src/services/api.js`
- ✅ `frontend/src/popup/BuatSoalBerhasil.jsx`
- ✅ `frontend/src/popup/EditSoalBerhasil.jsx`
- ✅ `frontend/src/main.jsx`

---

**Last Updated**: November 19, 2025
**Version**: 2.0 - Major Update (PIN, Kreator Role, Unified Edit/Create, Leaderboard)
