-- ============================================================================
-- PESERTA DATABASE - PLATFORM KUIS ONLINE
-- ============================================================================
-- File ini berisi stored procedures dan views untuk use case PESERTA:
-- 1. Memasukkan PIN dan nama peserta
-- 2. Mengerjakan soal quiz
-- 3. Melihat hasil akhir quiz
-- 4. Melihat leaderboard
-- ============================================================================
-- PREREQUISITES: Jalankan file 01_setup.sql terlebih dahulu
-- ============================================================================

USE quiz_master;

-- ============================================================================
-- STORED PROCEDURES UNTUK PESERTA
-- ============================================================================

DELIMITER //

-- Procedure: Validate PIN (peserta masukkan PIN untuk akses quiz)
DROP PROCEDURE IF EXISTS sp_peserta_validate_pin //
CREATE PROCEDURE sp_peserta_validate_pin(
    IN p_pin CHAR(6)
)
BEGIN
    SELECT 
        ks.kumpulan_soal_id,
        ks.judul,
        k.nama_kategori as kategori,
        m.judul as materi,
        ks.jumlah_soal,
        ks.waktu_per_soal,
        ks.waktu_keseluruhan,
        ks.tipe_waktu,
        ks.pin_code,
        u.nama as created_by
    FROM kumpulan_soal ks
    JOIN kategori k ON ks.kategori_id = k.id
    LEFT JOIN materi m ON ks.materi_id = m.materi_id
    LEFT JOIN users u ON ks.created_by = u.id
    WHERE ks.pin_code = p_pin;
END //

-- Procedure: Get soal by kumpulan_soal_id (peserta kerjakan soal)
DROP PROCEDURE IF EXISTS sp_peserta_get_soal //
CREATE PROCEDURE sp_peserta_get_soal(
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
        ks.waktu_keseluruhan,
        ks.tipe_waktu,
        ks.created_at
    FROM kumpulan_soal ks 
    JOIN kategori k ON ks.kategori_id = k.id
    LEFT JOIN materi m ON ks.materi_id = m.materi_id
    WHERE ks.kumpulan_soal_id = p_kumpulan_soal_id;
    
    -- Return soal list (tanpa jawaban_benar untuk keamanan, tapi dengan gambar)
    SELECT 
        s.soal_id,
        s.pertanyaan,
        s.gambar,
        s.pilihan_a,
        s.pilihan_b,
        s.pilihan_c,
        s.pilihan_d,
        s.created_at
    FROM soal s
    WHERE s.kumpulan_soal_id = p_kumpulan_soal_id
    ORDER BY s.soal_id;
END //

-- Procedure: Start Quiz Session (peserta mulai quiz)
DROP PROCEDURE IF EXISTS sp_peserta_start_session //
CREATE PROCEDURE sp_peserta_start_session(
    IN p_nama_peserta VARCHAR(255),
    IN p_kumpulan_soal_id INT,
    IN p_pin_code CHAR(6),
    IN p_waktu_mulai DATETIME,
    IN p_waktu_batas DATETIME
)
BEGIN
    DECLARE existing_session_id INT;
    
    -- Check existing active session
    SELECT session_id INTO existing_session_id
    FROM quiz_session
    WHERE nama_peserta = p_nama_peserta 
      AND kumpulan_soal_id = p_kumpulan_soal_id 
      AND pin_code = p_pin_code
      AND is_active = TRUE
    LIMIT 1;
    
    IF existing_session_id IS NOT NULL THEN
        -- Return existing session
        SELECT 
            session_id,
            nama_peserta,
            kumpulan_soal_id,
            pin_code,
            waktu_mulai,
            waktu_batas,
            current_soal_index,
            is_active,
            'existing' as status
        FROM quiz_session 
        WHERE session_id = existing_session_id;
    ELSE
        -- Create new session
        INSERT INTO quiz_session 
        (nama_peserta, kumpulan_soal_id, pin_code, waktu_mulai, waktu_batas, current_soal_index, is_active)
        VALUES 
        (p_nama_peserta, p_kumpulan_soal_id, p_pin_code, p_waktu_mulai, p_waktu_batas, 0, TRUE);
        
        -- Return new session
        SELECT 
            session_id,
            nama_peserta,
            kumpulan_soal_id,
            pin_code,
            waktu_mulai,
            waktu_batas,
            current_soal_index,
            is_active,
            'new' as status
        FROM quiz_session 
        WHERE session_id = LAST_INSERT_ID();
    END IF;
END //

-- Procedure: Update progress soal (peserta pindah ke soal berikutnya)
DROP PROCEDURE IF EXISTS sp_peserta_update_progress //
CREATE PROCEDURE sp_peserta_update_progress(
    IN p_session_id INT,
    IN p_current_soal_index INT
)
BEGIN
    UPDATE quiz_session 
    SET 
        current_soal_index = p_current_soal_index,
        updated_at = CURRENT_TIMESTAMP
    WHERE session_id = p_session_id
      AND is_active = TRUE;
    
    SELECT ROW_COUNT() as affected_rows;
END //

-- Procedure: Submit jawaban peserta
DROP PROCEDURE IF EXISTS sp_peserta_submit_jawaban //
CREATE PROCEDURE sp_peserta_submit_jawaban(
    IN p_hasil_id INT,
    IN p_soal_id INT,
    IN p_jawaban TEXT,
    IN p_is_correct BOOLEAN,
    IN p_points_earned DECIMAL(5,2)
)
BEGIN
    INSERT INTO user_answers 
    (hasil_id, soal_id, jawaban, is_correct, points_earned)
    VALUES
    (p_hasil_id, p_soal_id, p_jawaban, p_is_correct, p_points_earned);
    
    SELECT * FROM user_answers WHERE id = LAST_INSERT_ID();
END //

-- Procedure: Submit Quiz Result (peserta submit hasil akhir quiz)
DROP PROCEDURE IF EXISTS sp_peserta_submit_result //
CREATE PROCEDURE sp_peserta_submit_result(
    IN p_session_id INT,
    IN p_nama_peserta VARCHAR(255),
    IN p_kumpulan_soal_id INT,
    IN p_skor INT,
    IN p_jawaban_benar INT,
    IN p_total_soal INT,
    IN p_waktu_pengerjaan INT,
    IN p_pin_code CHAR(6)
)
BEGIN
    -- Deactivate session
    UPDATE quiz_session 
    SET 
        is_active = FALSE, 
        waktu_selesai = NOW(),
        updated_at = CURRENT_TIMESTAMP
    WHERE session_id = p_session_id;
    
    -- Insert result
    INSERT INTO hasil_quiz 
    (session_id, nama_peserta, kumpulan_soal_id, skor, jawaban_benar, total_soal, waktu_pengerjaan, pin_code, completed_at)
    VALUES
    (p_session_id, p_nama_peserta, p_kumpulan_soal_id, p_skor, p_jawaban_benar, p_total_soal, p_waktu_pengerjaan, p_pin_code, NOW());
    
    -- Return result dengan ranking
    SET @new_hasil_id = LAST_INSERT_ID();
    
    SELECT 
        hasil_id,
        nama_peserta,
        skor,
        jawaban_benar,
        total_soal,
        waktu_pengerjaan,
        completed_at,
        (SELECT COUNT(*) + 1 
         FROM hasil_quiz hq2
         WHERE hq2.kumpulan_soal_id = p_kumpulan_soal_id
           AND hq2.completed_at IS NOT NULL
           AND (hq2.skor > p_skor OR (hq2.skor = p_skor AND hq2.waktu_pengerjaan < p_waktu_pengerjaan))
        ) as ranking
    FROM hasil_quiz 
    WHERE hasil_id = @new_hasil_id;
END //

-- Procedure: Get hasil quiz by peserta (peserta lihat hasil akhir mereka)
DROP PROCEDURE IF EXISTS sp_peserta_get_hasil //
CREATE PROCEDURE sp_peserta_get_hasil(
    IN p_nama_peserta VARCHAR(255),
    IN p_kumpulan_soal_id INT
)
BEGIN
    SELECT 
        hq.hasil_id,
        hq.nama_peserta,
        hq.skor,
        hq.jawaban_benar,
        hq.total_soal,
        hq.waktu_pengerjaan,
        hq.completed_at,
        ks.judul as kumpulan_soal_judul,
        k.nama_kategori as kategori,
        m.judul as materi,
        (SELECT COUNT(*) + 1 
         FROM hasil_quiz hq2
         WHERE hq2.kumpulan_soal_id = hq.kumpulan_soal_id
           AND hq2.completed_at IS NOT NULL
           AND (hq2.skor > hq.skor OR (hq2.skor = hq.skor AND hq2.waktu_pengerjaan < hq.waktu_pengerjaan))
        ) as ranking
    FROM hasil_quiz hq
    JOIN kumpulan_soal ks ON hq.kumpulan_soal_id = ks.kumpulan_soal_id
    JOIN kategori k ON ks.kategori_id = k.id
    LEFT JOIN materi m ON ks.materi_id = m.materi_id
    WHERE hq.nama_peserta = p_nama_peserta
      AND hq.kumpulan_soal_id = p_kumpulan_soal_id
      AND hq.completed_at IS NOT NULL
    ORDER BY hq.completed_at DESC;
END //

-- Procedure: Get leaderboard (peserta lihat ranking)
DROP PROCEDURE IF EXISTS sp_peserta_get_leaderboard //
CREATE PROCEDURE sp_peserta_get_leaderboard(
    IN p_kumpulan_soal_id INT,
    IN p_limit INT
)
BEGIN
    IF p_limit IS NULL OR p_limit <= 0 THEN
        SET p_limit = 100;
    END IF;
    
    SET @rank = 0;
    
    SELECT 
        hq.hasil_id,
        hq.nama_peserta,
        hq.skor,
        hq.jawaban_benar,
        hq.total_soal,
        hq.waktu_pengerjaan,
        hq.completed_at,
        ks.judul as kumpulan_soal_judul,
        k.nama_kategori as kategori,
        m.judul as materi,
        (@rank := @rank + 1) as ranking
    FROM hasil_quiz hq
    JOIN kumpulan_soal ks ON hq.kumpulan_soal_id = ks.kumpulan_soal_id
    JOIN kategori k ON ks.kategori_id = k.id
    LEFT JOIN materi m ON ks.materi_id = m.materi_id
    WHERE hq.completed_at IS NOT NULL
      AND (p_kumpulan_soal_id IS NULL OR hq.kumpulan_soal_id = p_kumpulan_soal_id)
    ORDER BY hq.skor DESC, hq.waktu_pengerjaan ASC
    LIMIT p_limit;
END //

-- Procedure: Get leaderboard by kategori
DROP PROCEDURE IF EXISTS sp_peserta_get_leaderboard_by_kategori //
CREATE PROCEDURE sp_peserta_get_leaderboard_by_kategori(
    IN p_kategori_id INT,
    IN p_limit INT
)
BEGIN
    IF p_limit IS NULL OR p_limit <= 0 THEN
        SET p_limit = 100;
    END IF;
    
    SET @rank = 0;
    
    SELECT 
        hq.hasil_id,
        hq.nama_peserta,
        hq.skor,
        hq.jawaban_benar,
        hq.total_soal,
        hq.waktu_pengerjaan,
        hq.completed_at,
        ks.judul as kumpulan_soal_judul,
        k.nama_kategori as kategori,
        m.judul as materi,
        (@rank := @rank + 1) as ranking
    FROM hasil_quiz hq
    JOIN kumpulan_soal ks ON hq.kumpulan_soal_id = ks.kumpulan_soal_id
    JOIN kategori k ON ks.kategori_id = k.id
    LEFT JOIN materi m ON ks.materi_id = m.materi_id
    WHERE hq.completed_at IS NOT NULL
      AND ks.kategori_id = p_kategori_id
    ORDER BY hq.skor DESC, hq.waktu_pengerjaan ASC
    LIMIT p_limit;
END //

-- Procedure: Get active session (peserta cek session mereka yang masih aktif)
DROP PROCEDURE IF EXISTS sp_peserta_get_active_session //
CREATE PROCEDURE sp_peserta_get_active_session(
    IN p_nama_peserta VARCHAR(255),
    IN p_pin_code CHAR(6)
)
BEGIN
    SELECT 
        qs.session_id,
        qs.nama_peserta,
        qs.kumpulan_soal_id,
        qs.pin_code,
        qs.waktu_mulai,
        qs.waktu_batas,
        qs.current_soal_index,
        qs.is_active,
        ks.judul as kumpulan_soal_judul,
        ks.jumlah_soal,
        ks.waktu_per_soal,
        ks.waktu_keseluruhan,
        ks.tipe_waktu
    FROM quiz_session qs
    JOIN kumpulan_soal ks ON qs.kumpulan_soal_id = ks.kumpulan_soal_id
    WHERE qs.nama_peserta = p_nama_peserta
      AND qs.pin_code = p_pin_code
      AND qs.is_active = TRUE
    ORDER BY qs.created_at DESC
    LIMIT 1;
END //

DELIMITER ;

-- ============================================================================
-- TESTING QUERIES UNTUK PESERTA
-- ============================================================================

-- Test 1: Validate PIN
-- CALL sp_peserta_validate_pin('123456');

-- Test 2: Get Soal
-- CALL sp_peserta_get_soal(1);

-- Test 3: Start Session
-- CALL sp_peserta_start_session('John Doe', 1, '123456', NOW(), DATE_ADD(NOW(), INTERVAL 60 MINUTE));

-- Test 4: Submit Result
-- CALL sp_peserta_submit_result(1, 'John Doe', 1, 85, 17, 20, 300, '123456');

-- Test 5: Get Hasil
-- CALL sp_peserta_get_hasil('John Doe', 1);

-- Test 6: Get Leaderboard
-- CALL sp_peserta_get_leaderboard(NULL, 10);

-- Test 7: Get Leaderboard by Kategori
-- CALL sp_peserta_get_leaderboard_by_kategori(1, 10);

-- Test 8: Get Active Session
-- CALL sp_peserta_get_active_session('John Doe', '123456');

-- ============================================================================
-- PESERTA DATABASE COMPLETE
-- ✅ Stored procedures untuk use case peserta
-- ✅ Validate PIN dan akses quiz
-- ✅ Start session dan tracking progress
-- ✅ Submit jawaban dan hasil quiz
-- ✅ Lihat hasil akhir dan ranking
-- ✅ Lihat leaderboard (all/by kategori)
-- ============================================================================
