# 🔧 BACKEND RAW SQL - NO ORM

## 📅 Tanggal: ${new Date().toLocaleDateString('id-ID')}

---

## 🎯 PERUBAHAN UTAMA

Semua controller backend sekarang menggunakan **RAW SQL QUERIES** langsung ke database **TANPA ORM/MODEL**.

---

## ✅ CONTROLLER YANG DIPERBAIKI

### 1. **kategoriController.js** ✅
**Sebelum:** Menggunakan `KategoriModel`  
**Sesudah:** RAW SQL dengan `db.query()`

**Operasi:**
```javascript
// GET ALL
const [kategori] = await db.query('SELECT * FROM kategori ORDER BY nama_kategori');

// GET BY ID
const [kategori] = await db.query('SELECT * FROM kategori WHERE id = ?', [id]);

// CREATE
const [result] = await db.query(
  'INSERT INTO kategori (nama_kategori, deskripsi) VALUES (?, ?)',
  [nama_kategori, deskripsi]
);

// UPDATE
const [result] = await db.query(
  'UPDATE kategori SET nama_kategori = ?, deskripsi = ? WHERE id = ?',
  [nama_kategori, deskripsi, id]
);

// DELETE
const [result] = await db.query('DELETE FROM kategori WHERE id = ?', [id]);
```

---

### 2. **userController.js** ✅
**Sebelum:** Menggunakan `UserModel`  
**Sesudah:** RAW SQL dengan `db.query()`

**Operasi:**
```javascript
// GET PROFILE
const [users] = await db.query(
  'SELECT id, nama, email, role, telepon, foto, is_verified, created_at, updated_at FROM users WHERE id = ?',
  [userId]
);

// UPDATE PROFILE (dengan foto)
const [result] = await db.query(
  'UPDATE users SET nama = ?, telepon = ?, foto = ?, updated_at = NOW() WHERE id = ?',
  [nama, telepon, foto, userId]
);

// UPDATE PROFILE (tanpa foto)
const [result] = await db.query(
  'UPDATE users SET nama = ?, telepon = ?, updated_at = NOW() WHERE id = ?',
  [nama, telepon, userId]
);
```

---

### 3. **quizController.js** ✅
**Sudah menggunakan RAW SQL, diperbaiki nama kolom**

**Perbaikan:**
- `quiz.id` → `quiz.quiz_id`
- `kumpulan_soal.id` → `kumpulan_soal.kumpulan_soal_id`
- `soal.id` → `soal.soal_id`
- `kategori.nama` → `kategori.nama_kategori`
- `hasil_quiz.id` → `hasil_quiz.hasil_id`

**Query untuk startQuiz (Peserta):**
```javascript
// Insert hasil quiz untuk peserta (tanpa user_id)
const [result] = await db.query(
  'INSERT INTO hasil_quiz (nama_peserta, kumpulan_soal_id, total_soal, pin_code) VALUES (?, ?, ?, ?)',
  [nama_peserta, kumpulan_soal_id, soal.length, pin_code]
);
```

**Query untuk submitQuiz:**
```javascript
// Update hasil_quiz dengan skor lengkap
await db.query(
  'UPDATE hasil_quiz SET skor = ?, jawaban_benar = ?, waktu_selesai = ?, completed_at = NOW() WHERE hasil_id = ?',
  [skor, totalBenar, waktu_selesai, hasilId]
);
```

---

### 4. **soalController.js** ✅
**Sudah menggunakan RAW SQL, diperbaiki nama kolom**

**Perbaikan:**
- `kumpulan_soal.id` → `kumpulan_soal.kumpulan_soal_id`
- `soal.kumpulan_id` → `soal.kumpulan_soal_id`
- `soal.id` → `soal.soal_id`

**Query dengan Transaction:**
```javascript
// Start transaction
await db.beginTransaction();

try {
  // Create kumpulan_soal
  const [kumpulanResult] = await db.query(
    'INSERT INTO kumpulan_soal (kategori_id, materi_id, created_by) VALUES (?, ?, ?)',
    [kategori_id, materi_id, created_by]
  );

  // Insert soal
  for (const soal of soal_list) {
    await db.query(
      'INSERT INTO soal (kumpulan_soal_id, pertanyaan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, jawaban_benar) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [kumpulan_soal_id, ...]
    );
  }

  // Commit
  await db.commit();
} catch (error) {
  // Rollback on error
  await db.rollback();
  throw error;
}
```

---

### 5. **materiController.js** ✅
**Sudah menggunakan RAW SQL, diperbaiki nama kolom**

**Perbaikan:**
- `materi.id` → `materi.materi_id`

**Query:**
```javascript
// GET BY ID
const [materi] = await db.query('SELECT * FROM materi WHERE materi_id = ?', [id]);

// UPDATE
const [result] = await db.query(
  'UPDATE materi SET judul = ?, deskripsi = ?, kategori_id = ?, isi_materi = ? WHERE materi_id = ?',
  [judul, deskripsi, kategori_id, isi_materi, id]
);

// DELETE
const [result] = await db.query('DELETE FROM materi WHERE materi_id = ?', [id]);
```

---

### 6. **leaderboardController.js** ✅
**Sudah menggunakan RAW SQL**

**Query JOIN untuk Leaderboard:**
```javascript
const [results] = await db.query(`
  SELECT 
    ha.nama_peserta,
    m.judul as materi,
    k.nama_kategori as kategori,
    ha.skor,
    ha.jawaban_benar,
    ha.waktu_selesai,
    ha.created_at
  FROM hasil_quiz ha
  LEFT JOIN kumpulan_soal ks ON ha.kumpulan_soal_id = ks.kumpulan_soal_id
  LEFT JOIN materi m ON ks.materi_id = m.materi_id
  LEFT JOIN kategori k ON ks.kategori_id = k.id
  WHERE ha.skor IS NOT NULL
  ORDER BY ha.skor DESC, ha.waktu_selesai ASC
  LIMIT 100
`);
```

**Query Reset:**
```javascript
const [result] = await db.query('DELETE FROM hasil_quiz');
```

---

## 🗄️ DATABASE CONNECTION

**File:** `backend/src/config/db.js`

```javascript
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'quiz_master',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
```

---

## 📊 KONSISTENSI NAMA KOLOM

### Primary Keys:
| Table | PK Column |
|-------|-----------|
| users | id |
| kategori | id |
| materi | materi_id |
| kumpulan_soal | kumpulan_soal_id |
| soal | soal_id |
| quiz | quiz_id |
| hasil_quiz | hasil_id |

### Nama Kolom Khusus:
| Table | Column | Type |
|-------|--------|------|
| kategori | nama_kategori | VARCHAR(100) |
| materi | isi_materi | TEXT |
| kumpulan_soal | materi_id | INT (FK) |
| soal | kumpulan_soal_id | INT (FK) |
| hasil_quiz | nama_peserta | VARCHAR(255) |
| hasil_quiz | kumpulan_soal_id | INT (FK) |

---

## 🔄 DATA FLOW: Frontend → Backend → Database

### 1. **Create Quiz (Peserta Mulai Quiz)**
```
Frontend (HalamanAwalPeserta.jsx)
  ↓ POST /api/quiz/start
  { nama_peserta, kumpulan_soal_id, pin_code }
  ↓
Backend (quizController.js)
  ↓ RAW SQL
  INSERT INTO hasil_quiz (nama_peserta, kumpulan_soal_id, total_soal, pin_code)
  ↓
Database (hasil_quiz table)
  ↓ Return hasil_id
Frontend (Soal.jsx)
  ↓ Display soal
```

### 2. **Submit Quiz**
```
Frontend (Soal.jsx)
  ↓ POST /api/quiz/submit/:hasilId
  { jawaban: {soal_id: 'A', ...}, waktu_selesai: '00:15:30' }
  ↓
Backend (quizController.js)
  ↓ RAW SQL
  1. SELECT soal_id, jawaban_benar FROM soal WHERE soal_id IN (...)
  2. Calculate: skor, jawaban_benar
  3. UPDATE hasil_quiz SET skor = ?, jawaban_benar = ?, waktu_selesai = ? WHERE hasil_id = ?
  ↓
Database (hasil_quiz table updated)
  ↓ Return skor, jawaban_benar, total_soal
Frontend (HasilAkhir.jsx)
  ↓ Display hasil
```

### 3. **Get Leaderboard**
```
Frontend (Leaderboard.jsx)
  ↓ GET /api/leaderboard
Backend (leaderboardController.js)
  ↓ RAW SQL JOIN
  SELECT ha.nama_peserta, m.judul, k.nama_kategori, ha.skor ...
  FROM hasil_quiz ha
  LEFT JOIN kumpulan_soal ks ...
  LEFT JOIN materi m ...
  LEFT JOIN kategori k ...
  ↓
Database (multi-table JOIN)
  ↓ Return array hasil
Frontend (Leaderboard.jsx)
  ↓ Display ranking
```

---

## 🚀 KEUNGGULAN RAW SQL

### ✅ Advantages:
1. **Direct Control:** Full control over SQL queries
2. **Performance:** No ORM overhead, queries lebih efisien
3. **Transparency:** Jelas query apa yang dijalankan
4. **Flexibility:** Mudah optimize dengan indexes dan JOIN
5. **Learning:** Meningkatkan pemahaman SQL
6. **Debugging:** Mudah debug karena query terlihat langsung

### ⚠️ Considerations:
1. **SQL Injection:** Harus selalu pakai parameterized queries `?`
2. **Manual Validation:** Tidak ada auto-validation seperti ORM
3. **Schema Changes:** Harus manual update semua query jika schema berubah

---

## 🔒 SECURITY BEST PRACTICES

### ✅ Yang Sudah Diterapkan:
```javascript
// ✅ GOOD - Parameterized query (SQL injection safe)
const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);

// ✅ GOOD - Multiple parameters
await db.query(
  'INSERT INTO kategori (nama_kategori, deskripsi) VALUES (?, ?)',
  [nama_kategori, deskripsi]
);

// ✅ GOOD - Transaction for atomic operations
await db.beginTransaction();
try {
  await db.query('INSERT INTO ...');
  await db.query('UPDATE ...');
  await db.commit();
} catch (error) {
  await db.rollback();
  throw error;
}
```

### ❌ Yang TIDAK BOLEH Dilakukan:
```javascript
// ❌ BAD - String concatenation (SQL injection vulnerable)
const query = `SELECT * FROM users WHERE id = ${userId}`;
await db.query(query);

// ❌ BAD - Template literal dengan user input
const query = `SELECT * FROM users WHERE name = '${userName}'`;
await db.query(query);
```

---

## 🧪 TESTING

### Manual Testing:
```bash
# 1. Start backend
cd backend
npm start

# 2. Test API dengan curl
curl http://localhost:5000/api/kategori
curl http://localhost:5000/api/leaderboard
```

### Database Testing:
```sql
-- Check data langsung di database
SELECT * FROM hasil_quiz;
SELECT * FROM kumpulan_soal;
SELECT * FROM kategori;

-- Test JOIN query
SELECT 
  ha.nama_peserta,
  m.judul as materi,
  k.nama_kategori as kategori,
  ha.skor
FROM hasil_quiz ha
LEFT JOIN kumpulan_soal ks ON ha.kumpulan_soal_id = ks.kumpulan_soal_id
LEFT JOIN materi m ON ks.materi_id = m.materi_id
LEFT JOIN kategori k ON ks.kategori_id = k.id;
```

---

## 📂 FILE STRUCTURE

```
backend/src/
├── config/
│   └── db.js                    ✅ Database connection pool
├── controllers/
│   ├── authController.js        ✅ RAW SQL (already)
│   ├── kategoriController.js    ✅ RAW SQL (updated)
│   ├── materiController.js      ✅ RAW SQL (column names fixed)
│   ├── soalController.js        ✅ RAW SQL (column names fixed)
│   ├── quizController.js        ✅ RAW SQL (column names fixed)
│   ├── userController.js        ✅ RAW SQL (updated)
│   └── leaderboardController.js ✅ RAW SQL (already)
└── models/                      ❌ NOT USED ANYMORE
    ├── kategoriModel.js         ❌ Deprecated
    └── userModel.js             ❌ Deprecated
```

---

## ✅ CHECKLIST COMPLETION

- [x] Remove all Model imports
- [x] Replace with `const db = require('../config/db')`
- [x] Convert all queries to RAW SQL with `db.query()`
- [x] Fix column names (id → materi_id, kumpulan_soal_id, etc)
- [x] Fix foreign key references in JOIN queries
- [x] Use parameterized queries for security
- [x] Add transaction support for multi-step operations
- [x] Test all endpoints
- [x] Verify data flow frontend → backend → database

---

## 🎯 SUMMARY

### Before:
```javascript
const UserModel = require('../models/userModel');
const user = await UserModel.findById(userId);
```

### After:
```javascript
const db = require('../config/db');
const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
const user = users[0];
```

---

**Semua controller backend sekarang menggunakan RAW SQL langsung ke database!**

**Status:** ✅ COMPLETED  
**Version:** 2.2.0  
**Last Updated:** ${new Date().toLocaleString('id-ID')}
