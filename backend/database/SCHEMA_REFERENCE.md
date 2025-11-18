# Database Schema - Quick Reference

## 📊 ERD (Entity Relationship Diagram)

```
┌─────────────────┐
│     users       │
├─────────────────┤
│ id (PK)         │
│ nama            │
│ email (UNIQUE)  │
│ password        │
│ role            │
│ telepon         │
│ foto (BLOB)     │
│ is_verified     │
└─────────────────┘
        │
        │ created_by
        ├──────────────────────────────────┐
        │                                  │
        ▼                                  ▼
┌─────────────────┐              ┌─────────────────┐
│    kategori     │              │     materi      │
├─────────────────┤              ├─────────────────┤
│ id (PK)         │◄─────────────│ id (PK)         │
│ nama (UNIQUE)   │ kategori_id  │ judul           │
│ deskripsi       │              │ deskripsi       │
└─────────────────┘              │ isi_materi      │
        │                        │ kategori_id (FK)│
        │                        │ created_by (FK) │
        │                        └─────────────────┘
        │ kategori_id
        │
        ▼
┌─────────────────────┐
│  kumpulan_soal      │
├─────────────────────┤
│ id (PK)             │
│ judul               │
│ deskripsi           │
│ kategori_id (FK)    │
│ created_by (FK)     │
│ updated_by (FK)     │
│ jumlah_soal         │◄───── AUTO UPDATE by trigger
└─────────────────────┘
        │
        │ kumpulan_id
        ▼
┌─────────────────────┐
│       soal          │
├─────────────────────┤
│ id (PK)             │
│ kumpulan_id (FK)    │
│ pertanyaan          │
│ pilihan_a           │
│ pilihan_b           │
│ pilihan_c           │
│ pilihan_d           │
│ jawaban_benar       │
└─────────────────────┘
        │
        │ kumpulan_soal_id
        ▼
┌─────────────────────┐
│       quiz          │
├─────────────────────┤
│ id (PK)             │
│ judul               │
│ deskripsi           │
│ kumpulan_soal_id(FK)│
│ created_by (FK)     │
│ pin_code (UNIQUE)   │◄───── 6-digit unique PIN
│ durasi              │
│ tanggal_mulai       │
│ tanggal_selesai     │
│ status              │
└─────────────────────┘
        │
        │ quiz_id
        ▼
┌─────────────────────┐
│   quiz_attempts     │
├─────────────────────┤
│ id (PK)             │
│ quiz_id (FK)        │
│ user_id (FK)        │
│ start_time          │
│ end_time            │
│ score               │
│ status              │
└─────────────────────┘
        │
        │ attempt_id
        ▼
┌─────────────────────┐
│   user_answers      │
├─────────────────────┤
│ id (PK)             │
│ attempt_id (FK)     │
│ soal_id (FK)        │
│ jawaban             │
│ is_correct          │
│ points_earned       │
└─────────────────────┘

┌─────────────────────┐
│   hasil_quiz        │
├─────────────────────┤
│ id (PK)             │
│ user_id (FK)        │
│ kategori_id (FK)    │
│ score               │
│ completed_at        │
└─────────────────────┘
```

---

## 🗂️ Struktur Tabel Detail

### 1. **users**
```sql
id               INT             Primary Key, Auto Increment
nama             VARCHAR(255)    NOT NULL
email            VARCHAR(255)    NOT NULL, UNIQUE
password         VARCHAR(255)    NOT NULL (bcrypt hash)
role             ENUM            'admin', 'user' (default: 'user')
telepon          VARCHAR(20)     NULLABLE
foto             LONGBLOB        NULLABLE (binary image data)
verification_token VARCHAR(512)  NULLABLE
reset_token      VARCHAR(512)    NULLABLE
is_verified      BOOLEAN         DEFAULT FALSE
created_at       TIMESTAMP       AUTO
updated_at       TIMESTAMP       AUTO
```

### 2. **kategori**
```sql
id               INT             Primary Key, Auto Increment
nama             VARCHAR(100)    NOT NULL, UNIQUE
deskripsi        TEXT            NULLABLE
created_at       TIMESTAMP       AUTO
updated_at       TIMESTAMP       AUTO
```

### 3. **materi**
```sql
id               INT             Primary Key, Auto Increment
judul            VARCHAR(255)    NOT NULL
deskripsi        TEXT            NULLABLE
isi_materi       TEXT            NOT NULL
kategori_id      INT             NOT NULL, FK → kategori.id
created_by       INT             NULLABLE, FK → users.id
created_at       TIMESTAMP       AUTO
updated_at       TIMESTAMP       AUTO
```

### 4. **kumpulan_soal**
```sql
id               INT             Primary Key, Auto Increment
judul            VARCHAR(255)    NULLABLE
deskripsi        TEXT            NULLABLE
kategori_id      INT             NOT NULL, FK → kategori.id
created_by       INT             NULLABLE, FK → users.id
updated_by       INT             NULLABLE, FK → users.id
jumlah_soal      INT             DEFAULT 0, AUTO-UPDATE
created_at       TIMESTAMP       AUTO
updated_at       TIMESTAMP       AUTO
```

### 5. **soal**
```sql
id               INT             Primary Key, Auto Increment
kumpulan_id      INT             NOT NULL, FK → kumpulan_soal.id
pertanyaan       TEXT            NOT NULL
pilihan_a        TEXT            NOT NULL
pilihan_b        TEXT            NOT NULL
pilihan_c        TEXT            NOT NULL
pilihan_d        TEXT            NOT NULL
jawaban_benar    ENUM            'A', 'B', 'C', 'D'
created_at       TIMESTAMP       AUTO
updated_at       TIMESTAMP       AUTO
```

### 6. **quiz**
```sql
id               INT             Primary Key, Auto Increment
judul            VARCHAR(255)    NOT NULL
deskripsi        TEXT            NULLABLE
kumpulan_soal_id INT             NOT NULL, FK → kumpulan_soal.id
created_by       INT             NOT NULL, FK → users.id
pin_code         CHAR(6)         NOT NULL, UNIQUE (6-digit)
durasi           INT             NOT NULL (minutes)
tanggal_mulai    DATETIME        NOT NULL
tanggal_selesai  DATETIME        NOT NULL
status           ENUM            'draft', 'active', 'completed'
created_at       TIMESTAMP       AUTO
updated_at       TIMESTAMP       AUTO
```

### 7. **quiz_attempts**
```sql
id               INT             Primary Key, Auto Increment
quiz_id          INT             NOT NULL, FK → quiz.id
user_id          INT             NOT NULL, FK → users.id
start_time       DATETIME        NOT NULL
end_time         DATETIME        NULLABLE
score            DECIMAL(5,2)    NULLABLE
status           ENUM            'in_progress', 'completed', 'timed_out'
created_at       TIMESTAMP       AUTO
updated_at       TIMESTAMP       AUTO
```

### 8. **user_answers**
```sql
id               INT             Primary Key, Auto Increment
attempt_id       INT             NOT NULL, FK → quiz_attempts.id
soal_id          INT             NOT NULL, FK → soal.id
jawaban          TEXT            NOT NULL
is_correct       BOOLEAN         NULLABLE
points_earned    DECIMAL(5,2)    DEFAULT 0
created_at       TIMESTAMP       AUTO
```

### 9. **hasil_quiz**
```sql
id               INT             Primary Key, Auto Increment
user_id          INT             NOT NULL, FK → users.id
kategori_id      INT             NOT NULL, FK → kategori.id
score            DECIMAL(5,2)    DEFAULT 0
completed_at     DATETIME        NULLABLE
created_at       TIMESTAMP       AUTO
updated_at       TIMESTAMP       AUTO
```

---

## 🔐 Indexes

```sql
-- Users
idx_users_email              ON users(email)
idx_users_role               ON users(role)
idx_users_is_verified        ON users(is_verified)

-- Kategori
idx_kategori_nama            ON kategori(nama)

-- Materi
idx_materi_kategori          ON materi(kategori_id)

-- Kumpulan Soal
idx_kumpulan_kategori        ON kumpulan_soal(kategori_id)

-- Soal
idx_soal_kumpulan            ON soal(kumpulan_id)

-- Quiz
idx_quiz_pin                 ON quiz(pin_code)
idx_quiz_status              ON quiz(status)
idx_quiz_tanggal             ON quiz(tanggal_mulai, tanggal_selesai)

-- Quiz Attempts
idx_attempts_quiz            ON quiz_attempts(quiz_id)
idx_attempts_user            ON quiz_attempts(user_id)
idx_attempts_status          ON quiz_attempts(status)

-- User Answers
idx_answers_attempt          ON user_answers(attempt_id)

-- Hasil Quiz
idx_hasil_user               ON hasil_quiz(user_id)
idx_hasil_kategori           ON hasil_quiz(kategori_id)
```

---

## ⚙️ Stored Procedures

### User Management
```sql
CALL get_user_profile(user_id)
CALL update_user_profile(user_id, nama, email, telepon, foto)
CALL update_user_foto(user_id, foto)
CALL delete_user_foto(user_id)
CALL verify_user_email(email, token)
CALL set_reset_token(email, token)
CALL reset_user_password(email, new_password)
```

### Quiz Management
```sql
CALL create_quiz_attempt(quiz_id, user_id)
CALL submit_quiz_answer(attempt_id, soal_id, jawaban)
CALL complete_quiz_attempt(attempt_id)
```

---

## 🔢 Functions

```sql
-- Calculate user's average score
SELECT calculate_user_average_score(user_id);

-- Get user quiz completion rate (%)
SELECT get_user_completion_rate(user_id);
```

---

## 🎯 Triggers

### Auto-update jumlah_soal
```sql
-- Trigger: after_soal_insert
-- Action: UPDATE kumpulan_soal.jumlah_soal when soal inserted

-- Trigger: after_soal_delete
-- Action: UPDATE kumpulan_soal.jumlah_soal when soal deleted
```

---

## 👁️ Views

### v_active_quizzes
```sql
SELECT * FROM v_active_quizzes;
-- Shows all active quizzes with category and creator info
```

### v_quiz_results
```sql
SELECT * FROM v_quiz_results;
-- Shows quiz results summary with user performance
```

### v_user_statistics
```sql
SELECT * FROM v_user_statistics;
-- Shows user quiz statistics (attempts, completions, scores)
```

---

## 📝 Common Queries

### Get All Kategori
```sql
SELECT * FROM kategori ORDER BY nama;
```

### Get Kumpulan Soal with Soal Count
```sql
SELECT ks.*, k.nama as kategori_nama, COUNT(s.id) as total_soal
FROM kumpulan_soal ks
JOIN kategori k ON ks.kategori_id = k.id
LEFT JOIN soal s ON ks.id = s.kumpulan_id
GROUP BY ks.id;
```

### Get Soal by Kumpulan ID
```sql
SELECT * FROM soal WHERE kumpulan_id = ? ORDER BY id;
```

### Validate Quiz PIN
```sql
SELECT q.*, ks.jumlah_soal
FROM quiz q
JOIN kumpulan_soal ks ON q.kumpulan_soal_id = ks.id
WHERE q.pin_code = ? 
  AND q.status = 'active'
  AND q.tanggal_mulai <= NOW()
  AND q.tanggal_selesai >= NOW();
```

### Get User Quiz History
```sql
SELECT qa.*, q.judul, q.pin_code
FROM quiz_attempts qa
JOIN quiz q ON qa.quiz_id = q.id
WHERE qa.user_id = ?
ORDER BY qa.created_at DESC;
```

### Get Leaderboard
```sql
SELECT u.nama, qa.score, qa.end_time
FROM quiz_attempts qa
JOIN users u ON qa.user_id = u.id
WHERE qa.quiz_id = ? AND qa.status = 'completed'
ORDER BY qa.score DESC, qa.end_time ASC
LIMIT 10;
```

---

## 🔄 Data Flow

### 1. User Registration Flow
```
1. INSERT INTO users (nama, email, password, verification_token)
2. Send verification email
3. User clicks link → CALL verify_user_email(email, token)
4. UPDATE users SET is_verified = TRUE
```

### 2. Create Quiz Flow
```
1. INSERT INTO kumpulan_soal (kategori_id, created_by)
2. INSERT INTO soal (kumpulan_id, ...) × N soal
3. Trigger: auto-update jumlah_soal
4. INSERT INTO quiz (kumpulan_soal_id, pin_code, ...)
```

### 3. Take Quiz Flow
```
1. SELECT quiz WHERE pin_code = ? (validate)
2. CALL create_quiz_attempt(quiz_id, user_id)
3. SELECT soal WHERE kumpulan_id = ?
4. User answers questions
5. CALL submit_quiz_answer(attempt_id, soal_id, jawaban) × N
6. CALL complete_quiz_attempt(attempt_id)
7. Calculate final score
```

---

## 📊 Database Statistics

```sql
-- Count records per table
SELECT 'users' as tabel, COUNT(*) as jumlah FROM users
UNION ALL
SELECT 'kategori', COUNT(*) FROM kategori
UNION ALL
SELECT 'materi', COUNT(*) FROM materi
UNION ALL
SELECT 'kumpulan_soal', COUNT(*) FROM kumpulan_soal
UNION ALL
SELECT 'soal', COUNT(*) FROM soal
UNION ALL
SELECT 'quiz', COUNT(*) FROM quiz
UNION ALL
SELECT 'quiz_attempts', COUNT(*) FROM quiz_attempts;
```

---

**Version:** 2.0 (Updated November 2025)  
**Status:** ✅ Production Ready
