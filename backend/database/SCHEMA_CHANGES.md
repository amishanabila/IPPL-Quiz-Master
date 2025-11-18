# Perubahan Database Schema

## 🔧 Perbaikan yang Dilakukan

Schema database telah diperbaiki agar sesuai dengan implementasi controller yang sudah ada. Berikut adalah detail perubahannya:

---

## 📊 Perubahan Struktur Tabel

### 1. **Tabel `materi`** ✅
**Perubahan:**
- ❌ `konten` → ✅ `isi_materi`
- ✅ `created_by` sekarang nullable (ON DELETE SET NULL)

**Alasan:**
Controller menggunakan kolom `isi_materi`, bukan `konten`.

---

### 2. **Tabel `kumpulan_soal`** ✅
**Perubahan BESAR:**

**Sebelum (Schema Lama):**
```sql
CREATE TABLE kumpulan_soal (
    id INT,
    judul VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    materi_id INT NOT NULL,          -- ❌ Tidak digunakan
    kategori_id INT NOT NULL,
    created_by INT NOT NULL,
    jumlah_soal INT DEFAULT 0
)
```

**Sesudah (Schema Baru):**
```sql
CREATE TABLE kumpulan_soal (
    id INT,
    judul VARCHAR(255),              -- ✅ Nullable
    deskripsi TEXT,                  -- ✅ Nullable
    kategori_id INT NOT NULL,
    created_by INT,                  -- ✅ Nullable
    updated_by INT,                  -- ✅ Tambahan kolom baru
    jumlah_soal INT DEFAULT 0
)
```

**Alasan:**
- Controller tidak menggunakan `materi_id`
- `judul` dan `deskripsi` tidak selalu diisi
- Tambahan `updated_by` untuk tracking update

---

### 3. **Tabel `soal`** ✅
**Perubahan SANGAT BESAR:**

**Sebelum (Schema Kompleks):**
```sql
CREATE TABLE soal (
    id INT,
    kumpulan_id INT,
    urutan INT NOT NULL,
    jenis ENUM('pilihan_ganda', 'isian_singkat', 'essay') NOT NULL,
    pertanyaan TEXT NOT NULL,
    gambar_url VARCHAR(512),
    poin INT DEFAULT 1
)

-- Plus tabel terpisah untuk opsi jawaban
CREATE TABLE opsi_jawaban (...)
CREATE TABLE jawaban (...)
```

**Sesudah (Schema Sederhana):**
```sql
CREATE TABLE soal (
    id INT,
    kumpulan_id INT NOT NULL,
    pertanyaan TEXT NOT NULL,
    pilihan_a TEXT NOT NULL,
    pilihan_b TEXT NOT NULL,
    pilihan_c TEXT NOT NULL,
    pilihan_d TEXT NOT NULL,
    jawaban_benar ENUM('A', 'B', 'C', 'D') NOT NULL
)
```

**Alasan:**
- Controller menggunakan struktur sederhana untuk soal pilihan ganda
- Tidak ada implementasi untuk soal essay/isian singkat
- Lebih mudah untuk query dan maintenance

**Catatan:** Tabel `opsi_jawaban` dan `jawaban` DIHAPUS karena tidak digunakan.

---

### 4. **Tabel `hasil_quiz`** ✅
**Status:** DITAMBAHKAN (tabel baru)

```sql
CREATE TABLE hasil_quiz (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    kategori_id INT NOT NULL,
    score DECIMAL(5,2) DEFAULT 0,
    completed_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (kategori_id) REFERENCES kategori(id) ON DELETE CASCADE
)
```

**Alasan:**
Controller `quizController.startQuiz()` dan `submitQuiz()` menggunakan tabel ini.

---

## 🔄 Perubahan Stored Procedures

### 1. **`submit_quiz_answer`** ✅

**Sebelum:**
```sql
-- Kompleks, handle multiple jenis soal
DECLARE v_soal_type VARCHAR(20);
IF v_soal_type = 'pilihan_ganda' THEN
    -- Check opsi_jawaban table
ELSE
    -- Check jawaban table
END IF;
```

**Sesudah:**
```sql
-- Sederhana, hanya pilihan ganda
DECLARE v_correct_answer VARCHAR(1);
SELECT jawaban_benar INTO v_correct_answer FROM soal;
SET v_is_correct = (v_correct_answer = p_jawaban);
```

**Alasan:**
Sesuai dengan struktur tabel `soal` yang baru (hanya pilihan ganda).

---

## 📈 Perubahan Views

### 1. **`v_active_quizzes`** ✅

**Perubahan:**
- ✅ Tambahan kolom `pin_code`
- ✅ Gunakan `LEFT JOIN` untuk `users` (karena nullable)
- ✅ Gunakan `COALESCE` untuk handle NULL values

**Alasan:**
Mencegah error jika `created_by` atau `judul` NULL.

---

## 🚀 Peningkatan Performa

### Indexes yang Ditambahkan:

```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_verified ON users(is_verified);

-- Kategori
CREATE INDEX idx_kategori_nama ON kategori(nama);

-- Materi
CREATE INDEX idx_materi_kategori ON materi(kategori_id);

-- Kumpulan Soal
CREATE INDEX idx_kumpulan_kategori ON kumpulan_soal(kategori_id);

-- Soal
CREATE INDEX idx_soal_kumpulan ON soal(kumpulan_id);

-- Quiz
CREATE INDEX idx_quiz_pin ON quiz(pin_code);
CREATE INDEX idx_quiz_status ON quiz(status);
CREATE INDEX idx_quiz_tanggal ON quiz(tanggal_mulai, tanggal_selesai);

-- Quiz Attempts
CREATE INDEX idx_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX idx_attempts_user ON quiz_attempts(user_id);
CREATE INDEX idx_attempts_status ON quiz_attempts(status);

-- User Answers
CREATE INDEX idx_answers_attempt ON user_answers(attempt_id);

-- Hasil Quiz
CREATE INDEX idx_hasil_user ON hasil_quiz(user_id);
CREATE INDEX idx_hasil_kategori ON hasil_quiz(kategori_id);
```

**Manfaat:**
- ⚡ Query lebih cepat untuk JOIN dan WHERE clause
- ⚡ Pencarian by PIN lebih cepat
- ⚡ Filter by kategori, status, user lebih efisien

---

## 📝 Initial Data

### Kategori Default:
```sql
INSERT INTO kategori (nama, deskripsi) VALUES
    ('Matematika', 'Kategori soal Matematika'),
    ('Bahasa Indonesia', 'Kategori soal Bahasa Indonesia'),
    ('Bahasa Inggris', 'Kategori soal Bahasa Inggris'),
    ('IPA', 'Kategori soal Ilmu Pengetahuan Alam'),
    ('IPS', 'Kategori soal Ilmu Pengetahuan Sosial'),
    ('PKN', 'Kategori soal Pendidikan Kewarganegaraan'),
    ('Seni Budaya', 'Kategori soal Seni dan Budaya'),
    ('Olahraga', 'Kategori soal Pendidikan Jasmani dan Olahraga');
```

### Admin User:
```sql
-- Email: admin@gmail.com
-- Password: Admin123! (harus di-hash dengan bcrypt)
INSERT INTO users (nama, email, password, role, is_verified) 
VALUES ('Admin QuizMaster', 'admin@gmail.com', '[hashed_password]', 'admin', true);
```

---

## ⚠️ Breaking Changes

### Tabel yang DIHAPUS:
1. ❌ `opsi_jawaban` - Tidak digunakan dalam implementasi
2. ❌ `jawaban` - Tidak digunakan dalam implementasi

### Kolom yang DIHAPUS:
1. ❌ `kumpulan_soal.materi_id` - Controller tidak menggunakannya
2. ❌ `soal.urutan` - Tidak digunakan
3. ❌ `soal.jenis` - Hanya support pilihan ganda
4. ❌ `soal.gambar_url` - Belum diimplementasi
5. ❌ `soal.poin` - Default semua soal 1 poin

### Kolom yang DITAMBAHKAN:
1. ✅ `kumpulan_soal.updated_by` - Tracking user yang update
2. ✅ `soal.pilihan_a, pilihan_b, pilihan_c, pilihan_d` - Opsi jawaban inline
3. ✅ `soal.jawaban_benar` - Jawaban yang benar (A/B/C/D)

---

## 🔄 Migration Guide

### Jika Sudah Ada Data Lama:

```sql
-- 1. Backup data lama
CREATE TABLE kumpulan_soal_backup AS SELECT * FROM kumpulan_soal;
CREATE TABLE soal_backup AS SELECT * FROM soal;

-- 2. Drop table lama
DROP TABLE IF EXISTS user_answers;
DROP TABLE IF EXISTS quiz_attempts;
DROP TABLE IF EXISTS quiz;
DROP TABLE IF EXISTS jawaban;
DROP TABLE IF EXISTS opsi_jawaban;
DROP TABLE IF EXISTS soal;
DROP TABLE IF EXISTS kumpulan_soal;
DROP TABLE IF EXISTS materi;

-- 3. Run schema.sql yang baru
SOURCE schema.sql;

-- 4. Migrate data jika diperlukan
-- (Custom migration script tergantung struktur data lama)
```

### Fresh Install:
```bash
mysql -u root -p < schema.sql
```

---

## ✅ Validasi Schema

### Test Query untuk Validasi:

```sql
-- 1. Test create kumpulan soal
INSERT INTO kumpulan_soal (kategori_id, created_by) 
VALUES (1, 1);

-- 2. Test create soal
INSERT INTO soal (kumpulan_id, pertanyaan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, jawaban_benar)
VALUES (1, 'Test question?', 'A option', 'B option', 'C option', 'D option', 'A');

-- 3. Test create quiz dengan PIN
INSERT INTO quiz (judul, kumpulan_soal_id, created_by, pin_code, durasi, tanggal_mulai, tanggal_selesai, status)
VALUES ('Test Quiz', 1, 1, '123456', 30, NOW(), DATE_ADD(NOW(), INTERVAL 1 DAY), 'active');

-- 4. Test start quiz
INSERT INTO hasil_quiz (user_id, kategori_id)
VALUES (1, 1);

-- 5. Check triggers (jumlah_soal should auto-update)
SELECT jumlah_soal FROM kumpulan_soal WHERE id = 1;
-- Expected: 1
```

---

## 📊 Perbandingan Kompleksitas

| Aspek | Schema Lama | Schema Baru |
|-------|-------------|-------------|
| **Tabel** | 12 tabel | 10 tabel (-2) |
| **Soal Structure** | 3 tabel (soal + opsi + jawaban) | 1 tabel |
| **Foreign Keys** | 18 FK | 14 FK (-4) |
| **Query Complexity** | JOIN 3+ tabel untuk get soal | SELECT langsung |
| **Maintenance** | Kompleks | Sederhana |
| **Jenis Soal** | Multiple (PG, Essay, Isian) | Pilihan Ganda only |

**Kesimpulan:** Schema baru lebih sederhana dan sesuai dengan implementasi controller yang ada.

---

## 🎯 Rekomendasi

1. **Untuk Development:**
   - ✅ Gunakan schema baru (sudah diperbaiki)
   - ✅ Run migration script untuk data baru

2. **Untuk Production:**
   - ⚠️ Backup database terlebih dahulu
   - ⚠️ Test di staging environment
   - ✅ Run schema baru di production

3. **Future Enhancement:**
   - 💡 Tambahkan support untuk soal essay/isian singkat (jika diperlukan)
   - 💡 Tambahkan kolom `gambar_url` untuk soal dengan gambar
   - 💡 Implementasi scoring yang lebih kompleks (poin berbeda per soal)

---

**Dokumentasi dibuat:** 18 November 2025  
**Status:** ✅ Schema sudah diperbaiki dan sesuai dengan implementasi controller
