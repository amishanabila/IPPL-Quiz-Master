-- Drop existing database if it exists
DROP DATABASE IF EXISTS quiz_master;

-- Create database
CREATE DATABASE IF NOT EXISTS quiz_master;
USE quiz_master;

-- Users table
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Kategori table
CREATE TABLE IF NOT EXISTS kategori (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_kategori VARCHAR(100) NOT NULL UNIQUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Materi table
CREATE TABLE IF NOT EXISTS materi (
    materi_id INT AUTO_INCREMENT PRIMARY KEY,
    judul VARCHAR(255) NOT NULL,
    isi_materi TEXT NOT NULL,
    kategori_id INT NOT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (kategori_id) REFERENCES kategori(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Kumpulan Soal table (memiliki materi_id untuk relasi dengan materi)
CREATE TABLE IF NOT EXISTS kumpulan_soal (
    kumpulan_soal_id INT AUTO_INCREMENT PRIMARY KEY,
    judul VARCHAR(255),
    kategori_id INT NOT NULL,
    materi_id INT,
    created_by INT,
    updated_by INT,
    jumlah_soal INT DEFAULT 0,
    waktu_per_soal INT DEFAULT 60 COMMENT 'Waktu per soal dalam detik (default 60 detik)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (kategori_id) REFERENCES kategori(id) ON DELETE CASCADE,
    FOREIGN KEY (materi_id) REFERENCES materi(materi_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Soal table (mendukung pilihan ganda, isian, dan essay)
CREATE TABLE IF NOT EXISTS soal (
    soal_id INT AUTO_INCREMENT PRIMARY KEY,
    kumpulan_soal_id INT NOT NULL,
    pertanyaan TEXT NOT NULL,
    pilihan_a TEXT,
    pilihan_b TEXT,
    pilihan_c TEXT,
    pilihan_d TEXT,
    jawaban_benar TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (kumpulan_soal_id) REFERENCES kumpulan_soal(kumpulan_soal_id) ON DELETE CASCADE
);

-- Quiz table
CREATE TABLE IF NOT EXISTS quiz (
    quiz_id INT AUTO_INCREMENT PRIMARY KEY,
    judul VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    kumpulan_soal_id INT NOT NULL,
    created_by INT NOT NULL,
    pin_code CHAR(6) NOT NULL UNIQUE,
    durasi INT NOT NULL, -- dalam menit
    tanggal_mulai DATETIME NOT NULL,
    tanggal_selesai DATETIME NOT NULL,
    status ENUM('draft', 'active', 'completed') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (kumpulan_soal_id) REFERENCES kumpulan_soal(kumpulan_soal_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- User Answers table (untuk tracking jawaban peserta)
CREATE TABLE IF NOT EXISTS user_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hasil_id INT COMMENT 'Reference to hasil_quiz for peserta results',
    soal_id INT NOT NULL,
    jawaban TEXT NOT NULL,
    is_correct BOOLEAN,
    points_earned DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hasil_id) REFERENCES hasil_quiz(hasil_id) ON DELETE CASCADE,
    FOREIGN KEY (soal_id) REFERENCES soal(soal_id) ON DELETE CASCADE
);

-- Hasil Quiz table (untuk leaderboard dan tracking hasil peserta)
CREATE TABLE IF NOT EXISTS hasil_quiz (
    hasil_id INT AUTO_INCREMENT PRIMARY KEY,
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
    FOREIGN KEY (kumpulan_soal_id) REFERENCES kumpulan_soal(kumpulan_soal_id) ON DELETE CASCADE
);

-- Create Stored Procedures

DELIMITER //

-- Procedure: Get user profile by ID
CREATE PROCEDURE get_user_profile(
    IN p_user_id INT
)
BEGIN
    SELECT 
        id,
        nama,
        email,
        role,
        telepon,
        foto,
        is_verified,
        created_at,
        updated_at
    FROM users
    WHERE id = p_user_id;
END //

-- Procedure: Update user profile
CREATE PROCEDURE update_user_profile(
    IN p_user_id INT,
    IN p_nama VARCHAR(255),
    IN p_email VARCHAR(255),
    IN p_telepon VARCHAR(20),
    IN p_foto LONGBLOB
)
BEGIN
    -- Update profile with foto if provided
    IF p_foto IS NOT NULL THEN
        UPDATE users
        SET 
            nama = p_nama,
            email = p_email,
            telepon = p_telepon,
            foto = p_foto,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_user_id;
    ELSE
        -- Update profile without changing foto
        UPDATE users
        SET 
            nama = p_nama,
            email = p_email,
            telepon = p_telepon,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_user_id;
    END IF;
    
    -- Return updated profile
    SELECT 
        id,
        nama,
        email,
        role,
        telepon,
        foto,
        is_verified,
        created_at,
        updated_at
    FROM users
    WHERE id = p_user_id;
END //

-- Procedure: Update user foto only
CREATE PROCEDURE update_user_foto(
    IN p_user_id INT,
    IN p_foto LONGBLOB
)
BEGIN
    UPDATE users
    SET 
        foto = p_foto,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_user_id;
    
    -- Return success status
    SELECT 
        id,
        nama,
        email,
        foto IS NOT NULL as has_foto
    FROM users
    WHERE id = p_user_id;
END //

-- Procedure: Delete user foto
CREATE PROCEDURE delete_user_foto(
    IN p_user_id INT
)
BEGIN
    UPDATE users
    SET 
        foto = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_user_id;
    
    SELECT ROW_COUNT() as affected_rows;
END //

-- Procedure: Verify user email
CREATE PROCEDURE verify_user_email(
    IN p_email VARCHAR(255),
    IN p_token VARCHAR(512)
)
BEGIN
    UPDATE users
    SET 
        is_verified = TRUE,
        verification_token = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE email = p_email 
    AND verification_token = p_token;
    
    SELECT ROW_COUNT() as affected_rows;
END //

-- Procedure: Set password reset token
CREATE PROCEDURE set_reset_token(
    IN p_email VARCHAR(255),
    IN p_token VARCHAR(512)
)
BEGIN
    UPDATE users
    SET 
        reset_token = p_token,
        updated_at = CURRENT_TIMESTAMP
    WHERE email = p_email;
    
    SELECT ROW_COUNT() as affected_rows;
END //

-- Procedure: Reset user password
CREATE PROCEDURE reset_user_password(
    IN p_email VARCHAR(255),
    IN p_new_password VARCHAR(255)
)
BEGIN
    UPDATE users
    SET 
        password = p_new_password,
        reset_token = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE email = p_email;
    
    SELECT ROW_COUNT() as affected_rows;
END //

-- Procedure: Get soal by kumpulan_soal_id (for quiz flow)
CREATE PROCEDURE get_soal_by_kumpulan(
    IN p_kumpulan_soal_id INT
)
BEGIN
    -- Return kumpulan_soal info
    SELECT 
        ks.kumpulan_soal_id,
        ks.judul,
        ks.kategori_id,
        k.nama_kategori,
        ks.materi_id,
        m.judul as materi_judul,
        ks.jumlah_soal,
        ks.waktu_per_soal,
        ks.created_at
    FROM kumpulan_soal ks 
    JOIN kategori k ON ks.kategori_id = k.id
    LEFT JOIN materi m ON ks.materi_id = m.materi_id
    WHERE ks.kumpulan_soal_id = p_kumpulan_soal_id;
    
    -- Return soal list
    SELECT 
        s.soal_id,
        s.pertanyaan,
        s.pilihan_a,
        s.pilihan_b,
        s.pilihan_c,
        s.pilihan_d,
        s.jawaban_benar,
        s.created_at
    FROM soal s
    WHERE s.kumpulan_soal_id = p_kumpulan_soal_id
    ORDER BY s.soal_id;
END //

-- Functions (No custom functions needed for current implementation)

-- Triggers

-- Trigger: Update jumlah_soal after inserting/deleting soal
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

-- Views

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
    q.tanggal_selesai >= NOW() //

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
ORDER BY hq.skor DESC, hq.waktu_pengerjaan ASC //

DELIMITER ;

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_verified ON users(is_verified);
CREATE INDEX idx_kategori_nama ON kategori(nama_kategori);
CREATE INDEX idx_materi_kategori ON materi(kategori_id);
CREATE INDEX idx_kumpulan_kategori ON kumpulan_soal(kategori_id);
CREATE INDEX idx_soal_kumpulan ON soal(kumpulan_soal_id);
CREATE INDEX idx_quiz_pin ON quiz(pin_code);
CREATE INDEX idx_quiz_status ON quiz(status);
CREATE INDEX idx_quiz_tanggal ON quiz(tanggal_mulai, tanggal_selesai);
CREATE INDEX idx_answers_hasil ON user_answers(hasil_id);
CREATE INDEX idx_hasil_kumpulan_soal ON hasil_quiz(kumpulan_soal_id);

-- Insert initial data
-- Kategori akan dibuat oleh kreator (tidak ada data default)

-- Insert initial admin user (password harus di-hash dengan bcrypt)
-- Password default: Admin123! (hash ini contoh, ganti dengan hash yang benar)
INSERT INTO users (nama, email, password, role, is_verified) 
VALUES (
    'Admin QuizMaster',
    'admin@gmail.com',
    '$2a$10$KgC7z.6gqQYE8xqPc8kHVOvB5yWZ3q4lWvK3YqT5zJ8xN9oL6pE5K',  -- Ganti dengan hash yang sesuai
    'admin',
    true
);