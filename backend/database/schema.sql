-- Create database
CREATE DATABASE IF NOT EXISTS quiz_master;
USE quiz_master;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    verification_token VARCHAR(512),
    reset_token VARCHAR(512),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Kategori table
CREATE TABLE IF NOT EXISTS kategori (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL UNIQUE,
    deskripsi TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Materi table
CREATE TABLE IF NOT EXISTS materi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    judul VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    konten TEXT NOT NULL,
    kategori_id INT NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (kategori_id) REFERENCES kategori(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Kumpulan Soal table
CREATE TABLE IF NOT EXISTS kumpulan_soal (
    id INT AUTO_INCREMENT PRIMARY KEY,
    judul VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    materi_id INT NOT NULL,
    kategori_id INT NOT NULL,
    created_by INT NOT NULL,
    jumlah_soal INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (materi_id) REFERENCES materi(id) ON DELETE CASCADE,
    FOREIGN KEY (kategori_id) REFERENCES kategori(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Soal table
CREATE TABLE IF NOT EXISTS soal (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kumpulan_id INT NOT NULL,
    urutan INT NOT NULL,
    jenis ENUM('pilihan_ganda', 'isian_singkat', 'essay') NOT NULL,
    pertanyaan TEXT NOT NULL,
    gambar_url VARCHAR(512),
    poin INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (kumpulan_id) REFERENCES kumpulan_soal(id) ON DELETE CASCADE
);

-- Opsi Jawaban table (untuk pilihan ganda)
CREATE TABLE IF NOT EXISTS opsi_jawaban (
    id INT AUTO_INCREMENT PRIMARY KEY,
    soal_id INT NOT NULL,
    urutan INT NOT NULL,
    teks TEXT NOT NULL,
    benar BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (soal_id) REFERENCES soal(id) ON DELETE CASCADE
);

-- Jawaban table (untuk isian singkat dan essay)
CREATE TABLE IF NOT EXISTS jawaban (
    id INT AUTO_INCREMENT PRIMARY KEY,
    soal_id INT NOT NULL,
    teks TEXT NOT NULL,
    keterangan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (soal_id) REFERENCES soal(id) ON DELETE CASCADE
);

-- Quiz table
CREATE TABLE IF NOT EXISTS quiz (
    id INT AUTO_INCREMENT PRIMARY KEY,
    judul VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    kumpulan_soal_id INT NOT NULL,
    created_by INT NOT NULL,
    durasi INT NOT NULL, -- dalam menit
    tanggal_mulai DATETIME NOT NULL,
    tanggal_selesai DATETIME NOT NULL,
    status ENUM('draft', 'active', 'completed') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (kumpulan_soal_id) REFERENCES kumpulan_soal(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Quiz Attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    user_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    score DECIMAL(5,2),
    status ENUM('in_progress', 'completed', 'timed_out') DEFAULT 'in_progress',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quiz(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User Answers table
CREATE TABLE IF NOT EXISTS user_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    soal_id INT NOT NULL,
    jawaban TEXT NOT NULL,
    is_correct BOOLEAN,
    points_earned DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (soal_id) REFERENCES soal(id) ON DELETE CASCADE
);

-- Create Stored Procedures

DELIMITER //

-- Procedure: Create new quiz attempt
CREATE PROCEDURE create_quiz_attempt(
    IN p_quiz_id INT,
    IN p_user_id INT
)
BEGIN
    DECLARE quiz_duration INT;
    
    -- Get quiz duration
    SELECT durasi INTO quiz_duration FROM quiz WHERE id = p_quiz_id;
    
    -- Create attempt
    INSERT INTO quiz_attempts (quiz_id, user_id, start_time, status)
    VALUES (p_quiz_id, p_user_id, NOW(), 'in_progress');
    
    -- Return attempt details
    SELECT 
        qa.id as attempt_id,
        q.judul,
        q.durasi,
        qa.start_time,
        DATE_ADD(qa.start_time, INTERVAL q.durasi MINUTE) as expected_end_time
    FROM quiz_attempts qa
    JOIN quiz q ON qa.quiz_id = q.id
    WHERE qa.id = LAST_INSERT_ID();
END //

-- Procedure: Submit quiz answer
CREATE PROCEDURE submit_quiz_answer(
    IN p_attempt_id INT,
    IN p_soal_id INT,
    IN p_jawaban TEXT
)
BEGIN
    DECLARE v_is_correct BOOLEAN;
    DECLARE v_points DECIMAL(5,2);
    DECLARE v_soal_type VARCHAR(20);
    DECLARE v_correct_answer TEXT;
    
    -- Get soal type
    SELECT jenis, poin INTO v_soal_type, v_points
    FROM soal WHERE id = p_soal_id;
    
    -- Check answer correctness based on soal type
    IF v_soal_type = 'pilihan_ganda' THEN
        SELECT benar INTO v_is_correct
        FROM opsi_jawaban
        WHERE soal_id = p_soal_id AND teks = p_jawaban;
    ELSE
        SELECT TRUE INTO v_is_correct
        FROM jawaban
        WHERE soal_id = p_soal_id AND teks = p_jawaban;
    END IF;
    
    -- Calculate points
    SET v_points = IF(v_is_correct, v_points, 0);
    
    -- Insert or update answer
    INSERT INTO user_answers (attempt_id, soal_id, jawaban, is_correct, points_earned)
    VALUES (p_attempt_id, p_soal_id, p_jawaban, v_is_correct, v_points)
    ON DUPLICATE KEY UPDATE
        jawaban = p_jawaban,
        is_correct = v_is_correct,
        points_earned = v_points;
END //

-- Procedure: Complete quiz attempt
CREATE PROCEDURE complete_quiz_attempt(
    IN p_attempt_id INT
)
BEGIN
    DECLARE total_points DECIMAL(5,2);
    
    -- Calculate total score
    SELECT SUM(points_earned) INTO total_points
    FROM user_answers
    WHERE attempt_id = p_attempt_id;
    
    -- Update attempt
    UPDATE quiz_attempts
    SET 
        end_time = NOW(),
        score = total_points,
        status = 'completed'
    WHERE id = p_attempt_id;
    
    -- Return results
    SELECT 
        qa.score,
        q.judul,
        COUNT(ua.id) as total_questions,
        SUM(IF(ua.is_correct, 1, 0)) as correct_answers
    FROM quiz_attempts qa
    JOIN quiz q ON qa.quiz_id = q.id
    LEFT JOIN user_answers ua ON qa.id = ua.attempt_id
    WHERE qa.id = p_attempt_id
    GROUP BY qa.id;
END //

-- Functions

-- Function: Calculate user's average score
CREATE FUNCTION calculate_user_average_score(p_user_id INT)
RETURNS DECIMAL(5,2)
DETERMINISTIC
BEGIN
    DECLARE avg_score DECIMAL(5,2);
    
    SELECT AVG(score) INTO avg_score
    FROM quiz_attempts
    WHERE user_id = p_user_id AND status = 'completed';
    
    RETURN COALESCE(avg_score, 0);
END //

-- Function: Get user quiz completion rate
CREATE FUNCTION get_user_completion_rate(p_user_id INT)
RETURNS DECIMAL(5,2)
DETERMINISTIC
BEGIN
    DECLARE total_attempts INT;
    DECLARE completed_attempts INT;
    
    SELECT 
        COUNT(*),
        SUM(IF(status = 'completed', 1, 0))
    INTO total_attempts, completed_attempts
    FROM quiz_attempts
    WHERE user_id = p_user_id;
    
    IF total_attempts = 0 THEN
        RETURN 0;
    END IF;
    
    RETURN (completed_attempts / total_attempts) * 100;
END //

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
        WHERE kumpulan_id = NEW.kumpulan_id
    )
    WHERE id = NEW.kumpulan_id;
END //

CREATE TRIGGER after_soal_delete
AFTER DELETE ON soal
FOR EACH ROW
BEGIN
    UPDATE kumpulan_soal
    SET jumlah_soal = (
        SELECT COUNT(*) 
        FROM soal 
        WHERE kumpulan_id = OLD.kumpulan_id
    )
    WHERE id = OLD.kumpulan_id;
END //

-- Views

-- View: Active Quizzes
CREATE VIEW v_active_quizzes AS
SELECT 
    q.id,
    q.judul,
    q.deskripsi,
    q.tanggal_mulai,
    q.tanggal_selesai,
    ks.judul as kumpulan_soal_judul,
    k.nama as kategori,
    u.nama as pembuat,
    q.durasi,
    ks.jumlah_soal
FROM quiz q
JOIN kumpulan_soal ks ON q.kumpulan_soal_id = ks.id
JOIN kategori k ON ks.kategori_id = k.id
JOIN users u ON q.created_by = u.id
WHERE 
    q.status = 'active' AND
    q.tanggal_mulai <= NOW() AND
    q.tanggal_selesai >= NOW() //

-- View: Quiz Results Summary
CREATE VIEW v_quiz_results AS
SELECT 
    qa.id as attempt_id,
    q.judul as quiz_judul,
    u.nama as user_nama,
    qa.score,
    qa.start_time,
    qa.end_time,
    TIMESTAMPDIFF(MINUTE, qa.start_time, COALESCE(qa.end_time, NOW())) as duration_minutes,
    qa.status,
    COUNT(ua.id) as total_questions,
    SUM(IF(ua.is_correct, 1, 0)) as correct_answers
FROM quiz_attempts qa
JOIN quiz q ON qa.quiz_id = q.id
JOIN users u ON qa.user_id = u.id
LEFT JOIN user_answers ua ON qa.id = ua.attempt_id
GROUP BY qa.id //

-- View: User Statistics
CREATE VIEW v_user_statistics AS
SELECT 
    u.id as user_id,
    u.nama,
    COUNT(DISTINCT qa.id) as total_attempts,
    SUM(IF(qa.status = 'completed', 1, 0)) as completed_quizzes,
    AVG(qa.score) as average_score,
    MAX(qa.score) as highest_score
FROM users u
LEFT JOIN quiz_attempts qa ON u.id = qa.user_id
GROUP BY u.id //

DELIMITER ;

-- Insert initial admin user
INSERT INTO users (nama, email, password, role, is_verified) 
VALUES (
    'Admin',
    'admin@gmail.com',
    '$2a$10$your_hashed_password',  -- Ganti dengan hash yang sesuai
    'admin',
    true
);