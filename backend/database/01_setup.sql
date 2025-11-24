-- ============================================================================
-- DATABASE SETUP - PLATFORM KUIS ONLINE
-- ============================================================================
-- File ini berisi:
-- 1. Create database dan semua tabel
-- 2. Functions dan triggers
-- 3. Views dasar
-- 4. Indexes untuk performa
-- 5. Data initial admin
-- ============================================================================

-- Drop dan create database
DROP DATABASE IF EXISTS quiz_master;
CREATE DATABASE IF NOT EXISTS quiz_master;
USE quiz_master;

-- ============================================================================
-- TABEL UTAMA
-- ============================================================================

-- Tabel Users (Admin & Kreator)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'kreator') DEFAULT 'kreator',
    telepon VARCHAR(20),
    foto LONGBLOB,
    verification_token VARCHAR(512),
    reset_token VARCHAR(512),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_is_verified (is_verified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel Kategori
CREATE TABLE IF NOT EXISTS kategori (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_kategori VARCHAR(100) NOT NULL UNIQUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_nama (nama_kategori)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel Materi
CREATE TABLE IF NOT EXISTS materi (
    materi_id INT AUTO_INCREMENT PRIMARY KEY,
    judul VARCHAR(255) NOT NULL,
    isi_materi TEXT NOT NULL,
    kategori_id INT NOT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (kategori_id) REFERENCES kategori(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_kategori (kategori_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel Kumpulan Soal (memiliki PIN untuk akses)
CREATE TABLE IF NOT EXISTS kumpulan_soal (
    kumpulan_soal_id INT AUTO_INCREMENT PRIMARY KEY,
    judul VARCHAR(255),
    kategori_id INT NOT NULL,
    materi_id INT,
    created_by INT,
    updated_by INT,
    jumlah_soal INT DEFAULT 0,
    pin_code CHAR(6) UNIQUE COMMENT 'PIN 6 digit untuk akses quiz - aktif selama soal ada',
    waktu_per_soal INT DEFAULT 60 COMMENT 'Waktu per soal dalam detik (default 60 detik)',
    waktu_keseluruhan INT DEFAULT NULL COMMENT 'Waktu keseluruhan quiz dalam detik (NULL = hanya waktu per soal)',
    tipe_waktu ENUM('per_soal', 'keseluruhan') DEFAULT 'per_soal' COMMENT 'Jenis pengaturan waktu',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (kategori_id) REFERENCES kategori(id) ON DELETE CASCADE,
    FOREIGN KEY (materi_id) REFERENCES materi(materi_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_kategori (kategori_id),
    INDEX idx_pin (pin_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel Soal (mendukung pilihan ganda dan isian singkat)
CREATE TABLE IF NOT EXISTS soal (
    soal_id INT AUTO_INCREMENT PRIMARY KEY,
    kumpulan_soal_id INT NOT NULL,
    pertanyaan TEXT NOT NULL,
    gambar LONGTEXT COMMENT 'Base64 encoded image data',
    pilihan_a TEXT,
    pilihan_b TEXT,
    pilihan_c TEXT,
    pilihan_d TEXT,
    jawaban_benar TEXT NOT NULL,
    variasi_jawaban JSON DEFAULT NULL COMMENT 'Array of alternative correct answers for isian singkat (stored as JSON)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (kumpulan_soal_id) REFERENCES kumpulan_soal(kumpulan_soal_id) ON DELETE CASCADE,
    INDEX idx_kumpulan (kumpulan_soal_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel Quiz
CREATE TABLE IF NOT EXISTS quiz (
    quiz_id INT AUTO_INCREMENT PRIMARY KEY,
    judul VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    kumpulan_soal_id INT NOT NULL,
    created_by INT NOT NULL,
    pin_code CHAR(6) NOT NULL UNIQUE,
    durasi INT NOT NULL COMMENT 'Durasi dalam menit',
    tanggal_mulai DATETIME NOT NULL,
    tanggal_selesai DATETIME NOT NULL,
    status ENUM('draft', 'active', 'completed') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (kumpulan_soal_id) REFERENCES kumpulan_soal(kumpulan_soal_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_pin (pin_code),
    INDEX idx_status (status),
    INDEX idx_tanggal (tanggal_mulai, tanggal_selesai)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel Quiz Session (tracking waktu pengerjaan real-time peserta)
CREATE TABLE IF NOT EXISTS quiz_session (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    nama_peserta VARCHAR(255) NOT NULL,
    kumpulan_soal_id INT NOT NULL,
    pin_code CHAR(6),
    waktu_mulai DATETIME NOT NULL COMMENT 'Server timestamp saat quiz dimulai',
    waktu_selesai DATETIME COMMENT 'Server timestamp saat quiz selesai',
    waktu_batas DATETIME NOT NULL COMMENT 'Server timestamp batas waktu pengerjaan',
    current_soal_index INT DEFAULT 0 COMMENT 'Index soal terakhir yang dikerjakan',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Session masih aktif atau sudah selesai',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (kumpulan_soal_id) REFERENCES kumpulan_soal(kumpulan_soal_id) ON DELETE CASCADE,
    UNIQUE KEY unique_session (nama_peserta, kumpulan_soal_id, pin_code),
    INDEX idx_active (is_active),
    INDEX idx_peserta (nama_peserta, kumpulan_soal_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel Hasil Quiz (untuk leaderboard dan tracking hasil peserta)
CREATE TABLE IF NOT EXISTS hasil_quiz (
    hasil_id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT COMMENT 'Reference ke quiz_session',
    nama_peserta VARCHAR(255) NOT NULL,
    kumpulan_soal_id INT NOT NULL,
    skor INT DEFAULT 0,
    jawaban_benar INT DEFAULT 0,
    total_soal INT DEFAULT 0,
    waktu_pengerjaan INT COMMENT 'Total waktu pengerjaan dalam detik',
    pin_code CHAR(6),
    completed_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES quiz_session(session_id) ON DELETE SET NULL,
    FOREIGN KEY (kumpulan_soal_id) REFERENCES kumpulan_soal(kumpulan_soal_id) ON DELETE CASCADE,
    INDEX idx_session (session_id),
    INDEX idx_kumpulan (kumpulan_soal_id),
    INDEX idx_completed (completed_at, skor DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel User Answers (untuk tracking jawaban peserta)
CREATE TABLE IF NOT EXISTS user_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hasil_id INT COMMENT 'Reference to hasil_quiz for peserta results',
    soal_id INT NOT NULL,
    jawaban TEXT NOT NULL,
    is_correct BOOLEAN,
    points_earned DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hasil_id) REFERENCES hasil_quiz(hasil_id) ON DELETE CASCADE,
    FOREIGN KEY (soal_id) REFERENCES soal(soal_id) ON DELETE CASCADE,
    INDEX idx_hasil (hasil_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

DELIMITER //

-- Function: Generate unique 6-digit PIN untuk kumpulan_soal
CREATE FUNCTION generate_unique_pin()
RETURNS CHAR(6)
DETERMINISTIC
BEGIN
    DECLARE new_pin CHAR(6);
    DECLARE pin_exists INT;
    DECLARE attempts INT DEFAULT 0;
    DECLARE max_attempts INT DEFAULT 100;
    
    REPEAT
        -- Generate random 6-digit PIN (100000-999999)
        SET new_pin = LPAD(FLOOR(100000 + RAND() * 900000), 6, '0');
        
        -- Check if PIN already exists
        SELECT COUNT(*) INTO pin_exists 
        FROM kumpulan_soal 
        WHERE pin_code = new_pin;
        
        SET attempts = attempts + 1;
        
        -- Prevent infinite loop
        IF attempts >= max_attempts THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Gagal generate PIN unik setelah 100 percobaan';
        END IF;
        
    UNTIL pin_exists = 0 END REPEAT;
    
    RETURN new_pin;
END //

DELIMITER ;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DELIMITER //

-- Trigger: Auto-generate PIN saat insert kumpulan_soal (jika NULL)
CREATE TRIGGER before_insert_kumpulan_soal_generate_pin
BEFORE INSERT ON kumpulan_soal
FOR EACH ROW
BEGIN
    -- Generate PIN jika belum ada
    IF NEW.pin_code IS NULL OR NEW.pin_code = '' THEN
        SET NEW.pin_code = generate_unique_pin();
    END IF;
END //

-- Trigger: Validasi jawaban_benar sebelum INSERT
CREATE TRIGGER before_insert_soal_validate_jawaban
BEFORE INSERT ON soal
FOR EACH ROW
BEGIN
    -- Validasi: jawaban_benar tidak boleh NULL, kosong, atau hanya berisi whitespace/dash
    IF NEW.jawaban_benar IS NULL 
       OR TRIM(NEW.jawaban_benar) = '' 
       OR TRIM(NEW.jawaban_benar) = '-' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Jawaban benar tidak boleh kosong atau invalid. Silakan isi dengan jawaban yang valid.';
    END IF;
    
    -- Validasi: Untuk pilihan ganda, jawaban_benar harus salah satu dari pilihan A/B/C/D
    IF NEW.pilihan_a IS NOT NULL AND NEW.pilihan_b IS NOT NULL THEN
        IF NEW.jawaban_benar NOT IN (NEW.pilihan_a, NEW.pilihan_b, COALESCE(NEW.pilihan_c, ''), COALESCE(NEW.pilihan_d, '')) THEN
            IF NEW.pilihan_c IS NOT NULL OR NEW.pilihan_d IS NOT NULL THEN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Untuk soal pilihan ganda, jawaban benar harus salah satu dari pilihan yang tersedia.';
            END IF;
        END IF;
    END IF;
END //

-- Trigger: Validasi jawaban_benar sebelum UPDATE
CREATE TRIGGER before_update_soal_validate_jawaban
BEFORE UPDATE ON soal
FOR EACH ROW
BEGIN
    -- Validasi: jawaban_benar tidak boleh NULL, kosong, atau hanya berisi whitespace/dash
    IF NEW.jawaban_benar IS NULL 
       OR TRIM(NEW.jawaban_benar) = '' 
       OR TRIM(NEW.jawaban_benar) = '-' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Jawaban benar tidak boleh kosong atau invalid. Silakan isi dengan jawaban yang valid.';
    END IF;
    
    -- Validasi: Untuk pilihan ganda, jawaban_benar harus salah satu dari pilihan A/B/C/D
    IF NEW.pilihan_a IS NOT NULL AND NEW.pilihan_b IS NOT NULL THEN
        IF NEW.jawaban_benar NOT IN (NEW.pilihan_a, NEW.pilihan_b, COALESCE(NEW.pilihan_c, ''), COALESCE(NEW.pilihan_d, '')) THEN
            IF NEW.pilihan_c IS NOT NULL OR NEW.pilihan_d IS NOT NULL THEN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Untuk soal pilihan ganda, jawaban benar harus salah satu dari pilihan yang tersedia.';
            END IF;
        END IF;
    END IF;
END //

-- Trigger: Update jumlah_soal after inserting soal
CREATE TRIGGER after_soal_insert
AFTER INSERT ON soal
FOR EACH ROW
BEGIN
    UPDATE kumpulan_soal
    SET jumlah_soal = (
        SELECT COUNT(*) 
        FROM soal 
        WHERE kumpulan_soal_id = NEW.kumpulan_soal_id
    )
    WHERE kumpulan_soal_id = NEW.kumpulan_soal_id;
END //

-- Trigger: Update jumlah_soal after deleting soal
CREATE TRIGGER after_soal_delete
AFTER DELETE ON soal
FOR EACH ROW
BEGIN
    UPDATE kumpulan_soal
    SET jumlah_soal = (
        SELECT COUNT(*) 
        FROM soal 
        WHERE kumpulan_soal_id = OLD.kumpulan_soal_id
    )
    WHERE kumpulan_soal_id = OLD.kumpulan_soal_id;
END //

DELIMITER ;

-- ============================================================================
-- VIEWS DASAR
-- ============================================================================

-- View: Active Quizzes
CREATE VIEW v_active_quizzes AS
SELECT 
    q.quiz_id,
    q.judul,
    q.deskripsi,
    q.tanggal_mulai,
    q.tanggal_selesai,
    q.pin_code,
    COALESCE(ks.judul, 'Tanpa Judul') as kumpulan_soal_judul,
    k.nama_kategori as kategori,
    COALESCE(u.nama, 'Unknown') as pembuat,
    q.durasi,
    ks.jumlah_soal
FROM quiz q
JOIN kumpulan_soal ks ON q.kumpulan_soal_id = ks.kumpulan_soal_id
JOIN kategori k ON ks.kategori_id = k.id
LEFT JOIN users u ON q.created_by = u.id
WHERE 
    q.status = 'active' AND
    q.tanggal_mulai <= NOW() AND
    q.tanggal_selesai >= NOW();

-- View: Leaderboard Results
CREATE VIEW v_leaderboard AS
SELECT 
    hq.hasil_id,
    hq.nama_peserta,
    hq.skor,
    hq.jawaban_benar,
    hq.total_soal,
    hq.waktu_pengerjaan,
    hq.completed_at,
    k.nama_kategori as kategori,
    m.judul as materi,
    ks.judul as kumpulan_soal_judul
FROM hasil_quiz hq
JOIN kumpulan_soal ks ON hq.kumpulan_soal_id = ks.kumpulan_soal_id
JOIN kategori k ON ks.kategori_id = k.id
LEFT JOIN materi m ON ks.materi_id = m.materi_id
WHERE hq.completed_at IS NOT NULL
ORDER BY hq.skor DESC, hq.waktu_pengerjaan ASC;

-- ============================================================================
-- DATA INITIAL
-- ============================================================================

-- Insert initial admin user
-- Password: Admin123! (hash ini contoh, ganti dengan hash yang sesuai saat production)
INSERT INTO users (nama, email, password, role, is_verified) 
VALUES (
    'Admin QuizMaster',
    'admin@gmail.com',
    '$2a$10$KgC7z.6gqQYE8xqPc8kHVOvB5yWZ3q4lWvK3YqT5zJ8xN9oL6pE5K',
    'admin',
    true
);

-- ============================================================================
-- DATA CLEANUP (jika ada data lama dengan jawaban invalid)
-- ============================================================================

-- Delete soal with invalid jawaban_benar
DELETE FROM soal 
WHERE 
    jawaban_benar IS NULL 
    OR jawaban_benar = '' 
    OR jawaban_benar = '-'
    OR LENGTH(TRIM(jawaban_benar)) = 0;

-- Update jumlah_soal untuk semua kumpulan_soal setelah cleanup
UPDATE kumpulan_soal ks
SET jumlah_soal = (
    SELECT COUNT(*)
    FROM soal s
    WHERE s.kumpulan_soal_id = ks.kumpulan_soal_id
);

-- ============================================================================
-- SETUP COMPLETE
-- ✅ Database dan semua tabel berhasil dibuat
-- ✅ Functions, triggers, dan views berhasil dibuat
-- ✅ Indexes untuk performa optimal
-- ✅ Data initial admin berhasil diinsert
-- ✅ Cleanup data invalid
-- ============================================================================
