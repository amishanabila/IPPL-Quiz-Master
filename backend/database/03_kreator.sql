-- ============================================================================
-- KREATOR DATABASE - PLATFORM KUIS ONLINE
-- ============================================================================
-- File ini berisi stored procedures dan views untuk use case KREATOR:
-- 1. Membuat dan mengelola soal (CRUD)
-- 2. Mengatur waktu quiz (per soal / keseluruhan)
-- 3. Mengelola kategori dan materi
-- 4. Melihat leaderboard dan hasil quiz peserta
-- 5. Mengelola pengaturan akun kreator
-- ============================================================================
-- PREREQUISITES: Jalankan file 01_setup.sql terlebih dahulu
-- ============================================================================

USE quiz_master;

-- ============================================================================
-- VIEWS UNTUK KREATOR
-- ============================================================================

-- View: Kreator's Kumpulan Soal
DROP VIEW IF EXISTS v_kreator_kumpulan_soal;
CREATE VIEW v_kreator_kumpulan_soal AS
SELECT 
    ks.kumpulan_soal_id,
    ks.judul,
    ks.pin_code,
    ks.jumlah_soal,
    ks.waktu_per_soal,
    ks.waktu_keseluruhan,
    ks.tipe_waktu,
    k.nama_kategori,
    m.judul as materi_judul,
    u.nama as created_by_name,
    ks.created_by,
    ks.created_at,
    ks.updated_at
FROM kumpulan_soal ks
JOIN kategori k ON ks.kategori_id = k.id
LEFT JOIN materi m ON ks.materi_id = m.materi_id
LEFT JOIN users u ON ks.created_by = u.id;

-- ============================================================================
-- STORED PROCEDURES UNTUK KREATOR - KATEGORI & MATERI
-- ============================================================================

DELIMITER //

-- Procedure: Create Kategori
DROP PROCEDURE IF EXISTS sp_kreator_create_kategori //
CREATE PROCEDURE sp_kreator_create_kategori(
    IN p_nama_kategori VARCHAR(100),
    IN p_created_by INT
)
BEGIN
    INSERT INTO kategori (nama_kategori, created_by)
    VALUES (p_nama_kategori, p_created_by);
    
    SELECT * FROM kategori WHERE id = LAST_INSERT_ID();
END //

-- Procedure: Get All Kategori
DROP PROCEDURE IF EXISTS sp_kreator_get_all_kategori //
CREATE PROCEDURE sp_kreator_get_all_kategori()
BEGIN
    SELECT 
        k.id,
        k.nama_kategori,
        k.created_by,
        u.nama as created_by_name,
        k.created_at,
        COUNT(DISTINCT ks.kumpulan_soal_id) as jumlah_kumpulan_soal
    FROM kategori k
    LEFT JOIN users u ON k.created_by = u.id
    LEFT JOIN kumpulan_soal ks ON k.id = ks.kategori_id
    GROUP BY k.id
    ORDER BY k.nama_kategori;
END //

-- Procedure: Update Kategori
DROP PROCEDURE IF EXISTS sp_kreator_update_kategori //
CREATE PROCEDURE sp_kreator_update_kategori(
    IN p_kategori_id INT,
    IN p_nama_kategori VARCHAR(100)
)
BEGIN
    UPDATE kategori 
    SET 
        nama_kategori = p_nama_kategori,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_kategori_id;
    
    SELECT * FROM kategori WHERE id = p_kategori_id;
END //

-- Procedure: Delete Kategori
DROP PROCEDURE IF EXISTS sp_kreator_delete_kategori //
CREATE PROCEDURE sp_kreator_delete_kategori(
    IN p_kategori_id INT
)
BEGIN
    DELETE FROM kategori WHERE id = p_kategori_id;
    SELECT ROW_COUNT() as affected_rows;
END //

-- Procedure: Create Materi
DROP PROCEDURE IF EXISTS sp_kreator_create_materi //
CREATE PROCEDURE sp_kreator_create_materi(
    IN p_judul VARCHAR(255),
    IN p_isi_materi TEXT,
    IN p_kategori_id INT,
    IN p_created_by INT
)
BEGIN
    INSERT INTO materi (judul, isi_materi, kategori_id, created_by)
    VALUES (p_judul, p_isi_materi, p_kategori_id, p_created_by);
    
    SELECT 
        m.*,
        k.nama_kategori
    FROM materi m
    JOIN kategori k ON m.kategori_id = k.id
    WHERE m.materi_id = LAST_INSERT_ID();
END //

-- Procedure: Get Materi by Kategori
DROP PROCEDURE IF EXISTS sp_kreator_get_materi_by_kategori //
CREATE PROCEDURE sp_kreator_get_materi_by_kategori(
    IN p_kategori_id INT
)
BEGIN
    SELECT 
        m.*,
        k.nama_kategori,
        u.nama as created_by_name
    FROM materi m
    JOIN kategori k ON m.kategori_id = k.id
    LEFT JOIN users u ON m.created_by = u.id
    WHERE m.kategori_id = p_kategori_id
    ORDER BY m.created_at DESC;
END //

-- Procedure: Update Materi
DROP PROCEDURE IF EXISTS sp_kreator_update_materi //
CREATE PROCEDURE sp_kreator_update_materi(
    IN p_materi_id INT,
    IN p_judul VARCHAR(255),
    IN p_isi_materi TEXT,
    IN p_kategori_id INT
)
BEGIN
    UPDATE materi 
    SET 
        judul = p_judul,
        isi_materi = p_isi_materi,
        kategori_id = p_kategori_id,
        updated_at = CURRENT_TIMESTAMP
    WHERE materi_id = p_materi_id;
    
    SELECT * FROM materi WHERE materi_id = p_materi_id;
END //

-- Procedure: Delete Materi
DROP PROCEDURE IF EXISTS sp_kreator_delete_materi //
CREATE PROCEDURE sp_kreator_delete_materi(
    IN p_materi_id INT
)
BEGIN
    DELETE FROM materi WHERE materi_id = p_materi_id;
    SELECT ROW_COUNT() as affected_rows;
END //

-- ============================================================================
-- STORED PROCEDURES UNTUK KREATOR - KUMPULAN SOAL
-- ============================================================================

-- Procedure: Create Kumpulan Soal
DROP PROCEDURE IF EXISTS sp_kreator_create_kumpulan_soal //
CREATE PROCEDURE sp_kreator_create_kumpulan_soal(
    IN p_judul VARCHAR(255),
    IN p_kategori_id INT,
    IN p_materi_id INT,
    IN p_created_by INT,
    IN p_waktu_per_soal INT,
    IN p_waktu_keseluruhan INT,
    IN p_tipe_waktu VARCHAR(20)
)
BEGIN
    INSERT INTO kumpulan_soal 
    (judul, kategori_id, materi_id, created_by, waktu_per_soal, waktu_keseluruhan, tipe_waktu)
    VALUES 
    (p_judul, p_kategori_id, p_materi_id, p_created_by, p_waktu_per_soal, p_waktu_keseluruhan, p_tipe_waktu);
    
    SELECT 
        ks.*,
        k.nama_kategori,
        m.judul as materi_judul
    FROM kumpulan_soal ks
    JOIN kategori k ON ks.kategori_id = k.id
    LEFT JOIN materi m ON ks.materi_id = m.materi_id
    WHERE ks.kumpulan_soal_id = LAST_INSERT_ID();
END //

-- Procedure: Get Kumpulan Soal by Kreator
DROP PROCEDURE IF EXISTS sp_kreator_get_kumpulan_soal //
CREATE PROCEDURE sp_kreator_get_kumpulan_soal(
    IN p_created_by INT
)
BEGIN
    SELECT 
        ks.kumpulan_soal_id,
        ks.judul,
        ks.pin_code,
        ks.jumlah_soal,
        ks.waktu_per_soal,
        ks.waktu_keseluruhan,
        ks.tipe_waktu,
        k.nama_kategori,
        m.judul as materi_judul,
        ks.created_at,
        ks.updated_at,
        COUNT(DISTINCT hq.hasil_id) as total_peserta_mengerjakan
    FROM kumpulan_soal ks
    JOIN kategori k ON ks.kategori_id = k.id
    LEFT JOIN materi m ON ks.materi_id = m.materi_id
    LEFT JOIN hasil_quiz hq ON ks.kumpulan_soal_id = hq.kumpulan_soal_id
    WHERE ks.created_by = p_created_by
    GROUP BY ks.kumpulan_soal_id
    ORDER BY ks.created_at DESC;
END //

-- Procedure: Update Kumpulan Soal
DROP PROCEDURE IF EXISTS sp_kreator_update_kumpulan_soal //
CREATE PROCEDURE sp_kreator_update_kumpulan_soal(
    IN p_kumpulan_soal_id INT,
    IN p_judul VARCHAR(255),
    IN p_waktu_per_soal INT,
    IN p_waktu_keseluruhan INT,
    IN p_tipe_waktu VARCHAR(20),
    IN p_updated_by INT
)
BEGIN
    -- Verify ownership
    DECLARE owner_id INT;
    SELECT created_by INTO owner_id 
    FROM kumpulan_soal 
    WHERE kumpulan_soal_id = p_kumpulan_soal_id;
    
    IF owner_id = p_updated_by THEN
        UPDATE kumpulan_soal 
        SET 
            judul = p_judul,
            waktu_per_soal = p_waktu_per_soal,
            waktu_keseluruhan = p_waktu_keseluruhan,
            tipe_waktu = p_tipe_waktu,
            updated_by = p_updated_by,
            updated_at = CURRENT_TIMESTAMP
        WHERE kumpulan_soal_id = p_kumpulan_soal_id;
        
        SELECT * FROM kumpulan_soal WHERE kumpulan_soal_id = p_kumpulan_soal_id;
    ELSE
        SELECT 'error' as status, 'Unauthorized' as message;
    END IF;
END //

-- Procedure: Delete Kumpulan Soal
DROP PROCEDURE IF EXISTS sp_kreator_delete_kumpulan_soal //
CREATE PROCEDURE sp_kreator_delete_kumpulan_soal(
    IN p_kumpulan_soal_id INT,
    IN p_created_by INT
)
BEGIN
    -- Verify ownership
    DECLARE owner_id INT;
    SELECT created_by INTO owner_id 
    FROM kumpulan_soal 
    WHERE kumpulan_soal_id = p_kumpulan_soal_id;
    
    IF owner_id = p_created_by THEN
        DELETE FROM kumpulan_soal WHERE kumpulan_soal_id = p_kumpulan_soal_id;
        SELECT 'success' as status, ROW_COUNT() as affected_rows;
    ELSE
        SELECT 'error' as status, 'Unauthorized' as message;
    END IF;
END //

-- ============================================================================
-- STORED PROCEDURES UNTUK KREATOR - SOAL (CRUD)
-- ============================================================================

-- Procedure: Create Soal
DROP PROCEDURE IF EXISTS sp_kreator_create_soal //
CREATE PROCEDURE sp_kreator_create_soal(
    IN p_kumpulan_soal_id INT,
    IN p_pertanyaan TEXT,
    IN p_gambar LONGTEXT,
    IN p_pilihan_a TEXT,
    IN p_pilihan_b TEXT,
    IN p_pilihan_c TEXT,
    IN p_pilihan_d TEXT,
    IN p_jawaban_benar TEXT,
    IN p_variasi_jawaban JSON
)
BEGIN
    INSERT INTO soal 
    (kumpulan_soal_id, pertanyaan, gambar, pilihan_a, pilihan_b, pilihan_c, pilihan_d, jawaban_benar, variasi_jawaban)
    VALUES 
    (p_kumpulan_soal_id, p_pertanyaan, p_gambar, p_pilihan_a, p_pilihan_b, p_pilihan_c, p_pilihan_d, p_jawaban_benar, p_variasi_jawaban);
    
    SELECT * FROM soal WHERE soal_id = LAST_INSERT_ID();
END //

-- Procedure: Get Soal by Kumpulan (dengan gambar dan variasi_jawaban)
DROP PROCEDURE IF EXISTS sp_kreator_get_soal_by_kumpulan //
CREATE PROCEDURE sp_kreator_get_soal_by_kumpulan(
    IN p_kumpulan_soal_id INT
)
BEGIN
    SELECT 
        s.soal_id,
        s.kumpulan_soal_id,
        s.pertanyaan,
        s.gambar,
        s.pilihan_a,
        s.pilihan_b,
        s.pilihan_c,
        s.pilihan_d,
        s.jawaban_benar,
        s.variasi_jawaban,
        s.created_at,
        s.updated_at,
        ks.judul as kumpulan_soal_judul
    FROM soal s
    JOIN kumpulan_soal ks ON s.kumpulan_soal_id = ks.kumpulan_soal_id
    WHERE s.kumpulan_soal_id = p_kumpulan_soal_id
    ORDER BY s.soal_id;
END //

-- Procedure: Update Soal
DROP PROCEDURE IF EXISTS sp_kreator_update_soal //
CREATE PROCEDURE sp_kreator_update_soal(
    IN p_soal_id INT,
    IN p_pertanyaan TEXT,
    IN p_gambar LONGTEXT,
    IN p_pilihan_a TEXT,
    IN p_pilihan_b TEXT,
    IN p_pilihan_c TEXT,
    IN p_pilihan_d TEXT,
    IN p_jawaban_benar TEXT,
    IN p_variasi_jawaban JSON
)
BEGIN
    UPDATE soal 
    SET 
        pertanyaan = p_pertanyaan,
        gambar = p_gambar,
        pilihan_a = p_pilihan_a,
        pilihan_b = p_pilihan_b,
        pilihan_c = p_pilihan_c,
        pilihan_d = p_pilihan_d,
        jawaban_benar = p_jawaban_benar,
        variasi_jawaban = p_variasi_jawaban,
        updated_at = CURRENT_TIMESTAMP
    WHERE soal_id = p_soal_id;
    
    SELECT * FROM soal WHERE soal_id = p_soal_id;
END //

-- Procedure: Delete Soal
DROP PROCEDURE IF EXISTS sp_kreator_delete_soal //
CREATE PROCEDURE sp_kreator_delete_soal(
    IN p_soal_id INT
)
BEGIN
    DELETE FROM soal WHERE soal_id = p_soal_id;
    SELECT ROW_COUNT() as affected_rows;
END //

-- ============================================================================
-- STORED PROCEDURES UNTUK KREATOR - MONITORING & STATISTICS
-- ============================================================================

-- Procedure: Get Statistics for Kreator
DROP PROCEDURE IF EXISTS sp_kreator_get_statistics //
CREATE PROCEDURE sp_kreator_get_statistics(
    IN p_created_by INT
)
BEGIN
    SELECT 
        COUNT(DISTINCT ks.kumpulan_soal_id) as total_kumpulan_soal,
        COUNT(DISTINCT s.soal_id) as total_soal,
        COUNT(DISTINCT hq.hasil_id) as total_quiz_taken,
        COUNT(DISTINCT hq.nama_peserta) as total_unique_peserta,
        AVG(hq.skor) as rata_rata_skor,
        MAX(hq.skor) as skor_tertinggi,
        MIN(hq.skor) as skor_terendah
    FROM kumpulan_soal ks
    LEFT JOIN soal s ON ks.kumpulan_soal_id = s.kumpulan_soal_id
    LEFT JOIN hasil_quiz hq ON ks.kumpulan_soal_id = hq.kumpulan_soal_id
    WHERE ks.created_by = p_created_by;
END //

-- Procedure: Get Quiz Results by Kumpulan Soal (kreator lihat hasil peserta)
DROP PROCEDURE IF EXISTS sp_kreator_get_results_by_kumpulan //
CREATE PROCEDURE sp_kreator_get_results_by_kumpulan(
    IN p_kumpulan_soal_id INT,
    IN p_created_by INT
)
BEGIN
    -- Verify ownership
    DECLARE owner_id INT;
    SELECT created_by INTO owner_id 
    FROM kumpulan_soal 
    WHERE kumpulan_soal_id = p_kumpulan_soal_id;
    
    IF owner_id = p_created_by THEN
        SET @rank = 0;
        
        SELECT 
            hq.hasil_id,
            hq.nama_peserta,
            hq.skor,
            hq.jawaban_benar,
            hq.total_soal,
            hq.waktu_pengerjaan,
            hq.completed_at,
            (@rank := @rank + 1) as ranking
        FROM hasil_quiz hq
        WHERE hq.kumpulan_soal_id = p_kumpulan_soal_id
          AND hq.completed_at IS NOT NULL
        ORDER BY hq.skor DESC, hq.waktu_pengerjaan ASC;
    ELSE
        SELECT 'error' as status, 'Unauthorized' as message;
    END IF;
END //

-- Procedure: Get Detail Jawaban Peserta (kreator lihat jawaban detail peserta)
DROP PROCEDURE IF EXISTS sp_kreator_get_detail_jawaban //
CREATE PROCEDURE sp_kreator_get_detail_jawaban(
    IN p_hasil_id INT,
    IN p_created_by INT
)
BEGIN
    -- Verify ownership
    DECLARE owner_id INT;
    SELECT ks.created_by INTO owner_id 
    FROM hasil_quiz hq
    JOIN kumpulan_soal ks ON hq.kumpulan_soal_id = ks.kumpulan_soal_id
    WHERE hq.hasil_id = p_hasil_id;
    
    IF owner_id = p_created_by THEN
        SELECT 
            ua.id,
            ua.soal_id,
            s.pertanyaan,
            ua.jawaban as jawaban_peserta,
            s.jawaban_benar,
            ua.is_correct,
            ua.points_earned,
            ua.created_at
        FROM user_answers ua
        JOIN soal s ON ua.soal_id = s.soal_id
        WHERE ua.hasil_id = p_hasil_id
        ORDER BY ua.soal_id;
    ELSE
        SELECT 'error' as status, 'Unauthorized' as message;
    END IF;
END //

-- ============================================================================
-- STORED PROCEDURES UNTUK KREATOR - PROFILE & ACCOUNT
-- ============================================================================

-- Procedure: Get user profile by ID
DROP PROCEDURE IF EXISTS sp_kreator_get_profile //
CREATE PROCEDURE sp_kreator_get_profile(
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
DROP PROCEDURE IF EXISTS sp_kreator_update_profile //
CREATE PROCEDURE sp_kreator_update_profile(
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

DELIMITER ;

-- ============================================================================
-- TESTING QUERIES UNTUK KREATOR
-- ============================================================================

-- Test 1: Create Kategori
-- CALL sp_kreator_create_kategori('Matematika', 1);

-- Test 2: Create Kumpulan Soal
-- CALL sp_kreator_create_kumpulan_soal('Quiz Matematika Dasar', 1, NULL, 1, 60, NULL, 'per_soal');

-- Test 3: Create Soal
-- CALL sp_kreator_create_soal(1, 'Berapa 2+2?', '3', '4', '5', '6', '4', NULL);

-- Test 4: Get Kumpulan Soal
-- CALL sp_kreator_get_kumpulan_soal(1);

-- Test 5: Get Statistics
-- CALL sp_kreator_get_statistics(1);

-- Test 6: Get Results
-- CALL sp_kreator_get_results_by_kumpulan(1, 1);

-- ============================================================================
-- KREATOR DATABASE COMPLETE
-- ✅ Stored procedures untuk CRUD kategori dan materi
-- ✅ Stored procedures untuk CRUD kumpulan soal dan soal
-- ✅ Stored procedures untuk monitoring dan statistics
-- ✅ Stored procedures untuk melihat hasil quiz peserta
-- ✅ Stored procedures untuk pengaturan akun kreator
-- ✅ Views untuk kemudahan akses data kreator
-- ============================================================================
