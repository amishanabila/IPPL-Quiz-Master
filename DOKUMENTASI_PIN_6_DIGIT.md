# Dokumentasi Fitur PIN 6 Digit & Tampilan Soal User

## 📋 Ringkasan
Fitur ini menambahkan:
1. Sistem PIN 6 digit untuk quiz yang memungkinkan guru membuat soal dan mendapatkan PIN unik
2. Peserta dapat join quiz menggunakan PIN tersebut
3. **BARU**: Soal yang dibuat user otomatis muncul di halaman awal dengan badge "Soal Saya"

## ✨ Fitur Utama

### 1. **Generate PIN 6 Digit (Halaman Guru)**
- Setelah guru berhasil membuat soal, sistem otomatis generate PIN 6 digit
- PIN ditampilkan dalam box hijau yang menarik dengan fitur copy
- PIN tersimpan di database dan terhubung dengan quiz
- Validasi PIN unik (tidak ada duplikasi)

### 2. **Validasi PIN 6 Digit (Halaman Peserta)**
- Input PIN hanya menerima 6 digit angka (tidak bisa kurang/lebih)
- Validasi realtime dengan counter "X/6 digit"
- Auto-format: hanya angka yang diterima
- Validasi backend untuk memastikan PIN valid dan quiz masih aktif

### 3. **Tampilan Soal User di Halaman Awal** ⭐ BARU
- Soal yang dibuat user otomatis muncul di halaman awal
- Section "Soal Terbaru Saya" menampilkan 3 soal terbaru dengan design khusus
- Badge "Soal Saya" pada semua soal buatan user
- Menampilkan jumlah soal pada card
- Soal user muncul di atas, dummy data di bawah
- Filter berdasarkan kategori tetap berfungsi
- Tidak ada duplikasi antara soal user dan dummy data

## 🔧 Perubahan Backend

### File: `backend/database/schema.sql`
- **Penambahan kolom**: `pin_code CHAR(6) NOT NULL UNIQUE` pada tabel `quiz`

### File: `backend/src/controllers/quizController.js`
**Endpoint Baru:**
1. `POST /api/quiz/generate-pin` - Generate PIN untuk quiz baru
   - Input: judul, deskripsi, kumpulan_soal_id, user_id, durasi, tanggal_mulai, tanggal_selesai
   - Output: quiz_id, pin_code (6 digit)

2. `POST /api/quiz/validate-pin` - Validasi PIN yang dimasukkan peserta
   - Input: pin (6 digit)
   - Output: quiz info (id, judul, kategori, durasi, dll)

**Helper Functions:**
- `generatePin()` - Generate random 6 digit PIN
- `isPinExists(pin)` - Cek apakah PIN sudah digunakan

### File: `backend/src/routes/quizRoutes.js`
- Routing untuk endpoint generate-pin dan validate-pin

### File: `frontend/src/services/api.js`
- `generatePin(data)` - API call untuk generate PIN
- `validatePin(pin)` - API call untuk validasi PIN

## 🎨 Perubahan Frontend

### File: `frontend/src/buat soal/BuatSoal.jsx`
**Fitur Baru:**
- State `pinCode` untuk menyimpan PIN yang di-generate
- State `copied` untuk status copy PIN
- Integrasi dengan API `generatePin()`
- UI display PIN dalam box hijau setelah berhasil simpan
- Tombol copy PIN dengan icon animasi
- Auto scroll ke PIN setelah generate
- **BARU**: Menyimpan metadata tambahan (jumlahSoal, createdAt) ke localStorage
- **BARU**: Update data jika soal dengan materi yang sama sudah ada

**Validasi:**
- User harus login untuk bisa generate PIN
- Semua validasi form tetap berjalan

### File: `frontend/src/HalamanAwalPeserta.jsx`
**Fitur Baru:**
- Input PIN dengan validasi 6 digit ketat
- Counter "X/6 digit" untuk feedback user
- Format input: hanya angka, maxLength 6
- Integrasi dengan API `validatePin()`
- State `quizData` untuk menyimpan info quiz dari backend

**Validasi:**
- PIN wajib 6 digit (tidak bisa kurang/lebih)
- Hanya angka yang diterima
- Validasi backend untuk memastikan quiz aktif
- Error handling yang user-friendly

### File: `frontend/src/materi/KumpulanMateri.jsx` ⭐ BARU
**Fitur Baru:**
- **Section "Soal Terbaru Saya"**: Menampilkan 3 soal terbaru buatan user
  - Design khusus dengan gradient biru
  - Badge "Baru" untuk highlight
  - Menampilkan jumlah soal
  
- **Integrasi Data User & Dummy**:
  - Ambil data dari localStorage dan gabungkan dengan dummy data
  - Soal user muncul di atas dengan sort by date (terbaru di atas)
  - Dummy data di-acak dan muncul di bawah
  - Filter duplikat: jika nama materi sama, hanya tampilkan versi user
  
- **Badge "Soal Saya"**: 
  - Muncul di semua card soal buatan user
  - Warna biru untuk membedakan dengan dummy
  
- **Filter Kategori**: 
  - Tetap berfungsi untuk semua data (user + dummy)
  - Judul section berubah sesuai kategori aktif
  
- **Informasi Jumlah Soal**:
  - Ditampilkan di card soal user
  - Format: "📝 X soal"

## 🚀 Cara Menggunakan

### Untuk Guru:
1. Login ke sistem
2. Buat soal seperti biasa (pilih kategori, materi, jumlah soal)
3. Isi semua pertanyaan dan jawaban
4. Klik "Buat Soal"
5. PIN 6 digit akan muncul di bawah
6. Copy PIN dan bagikan ke peserta

### Untuk Peserta:
1. Buka halaman peserta
2. Masukkan PIN 6 digit yang diberikan guru
3. Sistem validasi PIN secara realtime
4. Jika valid, masukkan nama
5. Mulai mengerjakan quiz

## 🔒 Keamanan

- PIN bersifat unik (tidak ada duplikasi)
- Validasi di backend untuk mencegah manipulasi
- Quiz hanya bisa diakses jika statusnya 'active'
- Cek waktu mulai dan selesai quiz
- Input sanitization untuk mencegah SQL injection

## 📝 Catatan Penting

1. **PIN 6 Digit**: Sistem hanya menerima dan generate PIN dengan tepat 6 digit angka
2. **Koneksi Backend**: Frontend sudah terhubung penuh dengan backend
3. **Database Migration**: Jangan lupa jalankan schema.sql yang baru untuk update tabel quiz
4. **User Authentication**: Fitur generate PIN memerlukan user login

## 🐛 Troubleshooting

**Problem**: PIN tidak muncul setelah klik "Buat Soal"
- **Solusi**: Pastikan user sudah login dan backend server running

**Problem**: Peserta tidak bisa masukkan PIN
- **Solusi**: Pastikan PIN tepat 6 digit angka, tidak ada spasi atau karakter lain

**Problem**: Error "PIN tidak valid"
- **Solusi**: Cek apakah quiz masih aktif dan PIN benar

## 🔄 Update Database

Jalankan query berikut untuk update database yang sudah ada:

```sql
USE quiz_master;

-- Tambah kolom pin_code jika belum ada
ALTER TABLE quiz 
ADD COLUMN pin_code CHAR(6) NOT NULL UNIQUE AFTER created_by;

-- Update quiz yang sudah ada dengan PIN random
UPDATE quiz 
SET pin_code = LPAD(FLOOR(RAND() * 1000000), 6, '0')
WHERE pin_code IS NULL OR pin_code = '';
```

## 📞 Support

Jika ada masalah atau pertanyaan, silakan hubungi developer team.
