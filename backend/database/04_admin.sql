-- ============================================================================
-- ADMIN DATABASE - PLATFORM KUIS ONLINE
-- ============================================================================
-- File ini berisi stored procedures dan views untuk use case ADMIN:
-- 1. Monitoring sistem (statistik global, aktivitas user)
-- 2. Backup dan restore data
-- 3. Export data (hasil quiz, user, soal)
-- 4. Manajemen user (CRUD admin/kreator)
-- 5. System maintenance dan cleanup
-- ============================================================================
-- PREREQUISITES: Jalankan file 01_setup.sql terlebih dahulu
-- ============================================================================

USE quiz_master;

-- ============================================================================
-- VIEWS UNTUK ADMIN
-- ============================================================================

-- View: System Overview
DROP VIEW IF EXISTS v_admin_system_overview;
CREATE VIEW v_admin_system_overview AS
SELECT 
    (SELECT COUNT(*) FROM users WHERE role = 'admin') as total_admin,
    (SELECT COUNT(*) FROM users WHERE role = 'kreator') as total_kreator,
    (SELECT COUNT(*) FROM kategori) as total_kategori,
    (SELECT COUNT(*) FROM materi) as total_materi,
    (SELECT COUNT(*) FROM kumpulan_soal) as total_kumpulan_soal,
    (SELECT COUNT(*) FROM soal) as total_soal,
    (SELECT COUNT(*) FROM quiz_session) as total_quiz_sessions,
    (SELECT COUNT(*) FROM hasil_quiz WHERE completed_at IS NOT NULL) as total_quiz_completed,
    (SELECT COUNT(DISTINCT nama_peserta) FROM hasil_quiz) as total_unique_peserta;

-- View: User Activity
DROP VIEW IF EXISTS v_admin_user_activity;
CREATE VIEW v_admin_user_activity AS
SELECT 
    u.id,
    u.nama,
    u.email,
    u.role,
    u.is_verified,
    u.created_at,
    COUNT(DISTINCT ks.kumpulan_soal_id) as total_kumpulan_soal_created,
    COUNT(DISTINCT s.soal_id) as total_soal_created,
    COUNT(DISTINCT k.id) as total_kategori_created,
    COUNT(DISTINCT m.materi_id) as total_materi_created
FROM users u
LEFT JOIN kumpulan_soal ks ON u.id = ks.created_by
LEFT JOIN soal s ON ks.kumpulan_soal_id = s.kumpulan_soal_id
LEFT JOIN kategori k ON u.id = k.created_by
LEFT JOIN materi m ON u.id = m.created_by
GROUP BY u.id;

-- View: Quiz Activity Statistics
DROP VIEW IF EXISTS v_admin_quiz_activity;
CREATE VIEW v_admin_quiz_activity AS
SELECT 
    ks.kumpulan_soal_id,
    ks.judul as kumpulan_soal_judul,
    ks.pin_code,
    k.nama_kategori,
    u.nama as created_by_name,
    ks.jumlah_soal,
    COUNT(DISTINCT hq.hasil_id) as total_peserta,
    AVG(hq.skor) as rata_rata_skor,
    MAX(hq.skor) as skor_tertinggi,
    MIN(hq.skor) as skor_terendah,
    ks.created_at
FROM kumpulan_soal ks
JOIN kategori k ON ks.kategori_id = k.id
LEFT JOIN users u ON ks.created_by = u.id
LEFT JOIN hasil_quiz hq ON ks.kumpulan_soal_id = hq.kumpulan_soal_id AND hq.completed_at IS NOT NULL
GROUP BY ks.kumpulan_soal_id;

-- ============================================================================
-- STORED PROCEDURES UNTUK ADMIN - MONITORING SISTEM
-- ============================================================================

DELIMITER //

-- Procedure: Get System Overview
DROP PROCEDURE IF EXISTS sp_admin_get_system_overview //
CREATE PROCEDURE sp_admin_get_system_overview()
BEGIN
    SELECT * FROM v_admin_system_overview;
    
    -- Additional metrics
    SELECT 
        DATE(created_at) as tanggal,
        COUNT(*) as jumlah_quiz_completed
    FROM hasil_quiz
    WHERE completed_at IS NOT NULL
      AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    GROUP BY DATE(created_at)
    ORDER BY tanggal DESC;
END //

-- Procedure: Get User Activity Report
DROP PROCEDURE IF EXISTS sp_admin_get_user_activity //
CREATE PROCEDURE sp_admin_get_user_activity()
BEGIN
    SELECT * FROM v_admin_user_activity
    ORDER BY total_kumpulan_soal_created DESC;
END //

-- Procedure: Get Quiz Activity Report
DROP PROCEDURE IF EXISTS sp_admin_get_quiz_activity //
CREATE PROCEDURE sp_admin_get_quiz_activity(
    IN p_limit INT
)
BEGIN
    IF p_limit IS NULL OR p_limit <= 0 THEN
        SET p_limit = 50;
    END IF;
    
    SELECT * FROM v_admin_quiz_activity
    ORDER BY created_at DESC
    LIMIT p_limit;
END //

-- Procedure: Get Active Sessions
DROP PROCEDURE IF EXISTS sp_admin_get_active_sessions //
CREATE PROCEDURE sp_admin_get_active_sessions()
BEGIN
    SELECT 
        qs.session_id,
        qs.nama_peserta,
        ks.judul as kumpulan_soal_judul,
        ks.pin_code,
        qs.waktu_mulai,
        qs.waktu_batas,
        qs.current_soal_index,
        ks.jumlah_soal,
        CONCAT(ROUND((qs.current_soal_index / ks.jumlah_soal) * 100, 2), '%') as progress,
        TIMESTAMPDIFF(MINUTE, qs.waktu_mulai, NOW()) as durasi_menit
    FROM quiz_session qs
    JOIN kumpulan_soal ks ON qs.kumpulan_soal_id = ks.kumpulan_soal_id
    WHERE qs.is_active = TRUE
    ORDER BY qs.waktu_mulai DESC;
END //

-- Procedure: Get System Health Check
DROP PROCEDURE IF EXISTS sp_admin_system_health_check //
CREATE PROCEDURE sp_admin_system_health_check()
BEGIN
    -- Check soal tanpa jawaban benar (invalid)
    SELECT 
        'Invalid Soal' as check_type,
        COUNT(*) as count,
        CASE WHEN COUNT(*) > 0 THEN 'WARNING' ELSE 'OK' END as status
    FROM soal
    WHERE jawaban_benar IS NULL 
       OR jawaban_benar = '' 
       OR jawaban_benar = '-'
       OR LENGTH(TRIM(jawaban_benar)) = 0
    
    UNION ALL
    
    -- Check kumpulan_soal tanpa PIN
    SELECT 
        'Kumpulan Soal without PIN' as check_type,
        COUNT(*) as count,
        CASE WHEN COUNT(*) > 0 THEN 'WARNING' ELSE 'OK' END as status
    FROM kumpulan_soal
    WHERE pin_code IS NULL OR pin_code = ''
    
    UNION ALL
    
    -- Check expired sessions (more than 24 hours)
    SELECT 
        'Expired Active Sessions' as check_type,
        COUNT(*) as count,
        CASE WHEN COUNT(*) > 0 THEN 'WARNING' ELSE 'OK' END as status
    FROM quiz_session
    WHERE is_active = TRUE
      AND waktu_batas < NOW()
    
    UNION ALL
    
    -- Check users not verified
    SELECT 
        'Unverified Users' as check_type,
        COUNT(*) as count,
        CASE WHEN COUNT(*) > 0 THEN 'INFO' ELSE 'OK' END as status
    FROM users
    WHERE is_verified = FALSE;
END //

-- ============================================================================
-- STORED PROCEDURES UNTUK ADMIN - MANAJEMEN USER
-- ============================================================================

-- Procedure: Get All Users
DROP PROCEDURE IF EXISTS sp_admin_get_all_users //
CREATE PROCEDURE sp_admin_get_all_users(
    IN p_role VARCHAR(20)
)
BEGIN
    IF p_role IS NULL OR p_role = '' THEN
        SELECT 
            u.*,
            COUNT(DISTINCT ks.kumpulan_soal_id) as total_kumpulan_soal
        FROM users u
        LEFT JOIN kumpulan_soal ks ON u.id = ks.created_by
        GROUP BY u.id
        ORDER BY u.created_at DESC;
    ELSE
        SELECT 
            u.*,
            COUNT(DISTINCT ks.kumpulan_soal_id) as total_kumpulan_soal
        FROM users u
        LEFT JOIN kumpulan_soal ks ON u.id = ks.created_by
        WHERE u.role = p_role
        GROUP BY u.id
        ORDER BY u.created_at DESC;
    END IF;
END //

-- Procedure: Create User (Admin/Kreator)
DROP PROCEDURE IF EXISTS sp_admin_create_user //
CREATE PROCEDURE sp_admin_create_user(
    IN p_nama VARCHAR(255),
    IN p_email VARCHAR(255),
    IN p_password VARCHAR(255),
    IN p_role VARCHAR(20),
    IN p_is_verified BOOLEAN
)
BEGIN
    INSERT INTO users (nama, email, password, role, is_verified)
    VALUES (p_nama, p_email, p_password, p_role, COALESCE(p_is_verified, FALSE));
    
    SELECT * FROM users WHERE id = LAST_INSERT_ID();
END //

-- Procedure: Update User
DROP PROCEDURE IF EXISTS sp_admin_update_user //
CREATE PROCEDURE sp_admin_update_user(
    IN p_user_id INT,
    IN p_nama VARCHAR(255),
    IN p_email VARCHAR(255),
    IN p_role VARCHAR(20),
    IN p_telepon VARCHAR(20),
    IN p_is_verified BOOLEAN
)
BEGIN
    UPDATE users
    SET 
        nama = p_nama,
        email = p_email,
        role = p_role,
        telepon = COALESCE(p_telepon, telepon),
        is_verified = COALESCE(p_is_verified, is_verified),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_user_id;
    
    SELECT * FROM users WHERE id = p_user_id;
END //

-- Procedure: Delete User
DROP PROCEDURE IF EXISTS sp_admin_delete_user //
CREATE PROCEDURE sp_admin_delete_user(
    IN p_user_id INT
)
BEGIN
    -- Check if user has created content
    DECLARE has_content INT;
    SELECT COUNT(*) INTO has_content
    FROM kumpulan_soal
    WHERE created_by = p_user_id;
    
    IF has_content > 0 THEN
        SELECT 'warning' as status, 
               CONCAT('User has ', has_content, ' kumpulan soal. Delete will cascade.') as message;
    ELSE
        DELETE FROM users WHERE id = p_user_id;
        SELECT 'success' as status, ROW_COUNT() as affected_rows;
    END IF;
END //

-- Procedure: Reset User Password (Admin)
DROP PROCEDURE IF EXISTS sp_admin_reset_user_password //
CREATE PROCEDURE sp_admin_reset_user_password(
    IN p_user_id INT,
    IN p_new_password VARCHAR(255)
)
BEGIN
    UPDATE users
    SET 
        password = p_new_password,
        reset_token = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_user_id;
    
    SELECT 'success' as status, ROW_COUNT() as affected_rows;
END //

-- Procedure: Verify User Email (Admin)
DROP PROCEDURE IF EXISTS sp_admin_verify_user //
CREATE PROCEDURE sp_admin_verify_user(
    IN p_user_id INT
)
BEGIN
    UPDATE users
    SET 
        is_verified = TRUE,
        verification_token = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_user_id;
    
    SELECT 'success' as status, ROW_COUNT() as affected_rows;
END //

-- ============================================================================
-- STORED PROCEDURES UNTUK ADMIN - EXPORT DATA
-- ============================================================================

-- Procedure: Export All Users
DROP PROCEDURE IF EXISTS sp_admin_export_users //
CREATE PROCEDURE sp_admin_export_users()
BEGIN
    SELECT 
        id,
        nama,
        email,
        role,
        telepon,
        is_verified,
        created_at,
        updated_at
    FROM users
    ORDER BY created_at DESC;
END //

-- Procedure: Export All Hasil Quiz
DROP PROCEDURE IF EXISTS sp_admin_export_hasil_quiz //
CREATE PROCEDURE sp_admin_export_hasil_quiz(
    IN p_start_date DATE,
    IN p_end_date DATE
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
        ks.pin_code,
        k.nama_kategori,
        m.judul as materi,
        u.nama as created_by_kreator
    FROM hasil_quiz hq
    JOIN kumpulan_soal ks ON hq.kumpulan_soal_id = ks.kumpulan_soal_id
    JOIN kategori k ON ks.kategori_id = k.id
    LEFT JOIN materi m ON ks.materi_id = m.materi_id
    LEFT JOIN users u ON ks.created_by = u.id
    WHERE hq.completed_at IS NOT NULL
      AND (p_start_date IS NULL OR DATE(hq.completed_at) >= p_start_date)
      AND (p_end_date IS NULL OR DATE(hq.completed_at) <= p_end_date)
    ORDER BY hq.completed_at DESC;
END //

-- Procedure: Export All Soal
DROP PROCEDURE IF EXISTS sp_admin_export_soal //
CREATE PROCEDURE sp_admin_export_soal()
BEGIN
    SELECT 
        s.soal_id,
        ks.judul as kumpulan_soal_judul,
        k.nama_kategori,
        s.pertanyaan,
        s.pilihan_a,
        s.pilihan_b,
        s.pilihan_c,
        s.pilihan_d,
        s.jawaban_benar,
        s.variasi_jawaban,
        u.nama as created_by_kreator,
        s.created_at
    FROM soal s
    JOIN kumpulan_soal ks ON s.kumpulan_soal_id = ks.kumpulan_soal_id
    JOIN kategori k ON ks.kategori_id = k.id
    LEFT JOIN users u ON ks.created_by = u.id
    ORDER BY s.created_at DESC;
END //

-- Procedure: Export Kumpulan Soal
DROP PROCEDURE IF EXISTS sp_admin_export_kumpulan_soal //
CREATE PROCEDURE sp_admin_export_kumpulan_soal()
BEGIN
    SELECT 
        ks.kumpulan_soal_id,
        ks.judul,
        ks.pin_code,
        k.nama_kategori,
        m.judul as materi,
        ks.jumlah_soal,
        ks.waktu_per_soal,
        ks.waktu_keseluruhan,
        ks.tipe_waktu,
        u.nama as created_by_kreator,
        ks.created_at,
        ks.updated_at,
        COUNT(DISTINCT hq.hasil_id) as total_peserta_mengerjakan
    FROM kumpulan_soal ks
    JOIN kategori k ON ks.kategori_id = k.id
    LEFT JOIN materi m ON ks.materi_id = m.materi_id
    LEFT JOIN users u ON ks.created_by = u.id
    LEFT JOIN hasil_quiz hq ON ks.kumpulan_soal_id = hq.kumpulan_soal_id
    GROUP BY ks.kumpulan_soal_id
    ORDER BY ks.created_at DESC;
END //

-- ============================================================================
-- STORED PROCEDURES UNTUK ADMIN - SYSTEM MAINTENANCE
-- ============================================================================

-- Procedure: Cleanup Expired Sessions
DROP PROCEDURE IF EXISTS sp_admin_cleanup_expired_sessions //
CREATE PROCEDURE sp_admin_cleanup_expired_sessions()
BEGIN
    -- Deactivate expired sessions
    UPDATE quiz_session
    SET 
        is_active = FALSE,
        updated_at = CURRENT_TIMESTAMP
    WHERE is_active = TRUE
      AND waktu_batas < NOW();
    
    SELECT 
        'success' as status,
        ROW_COUNT() as sessions_closed,
        'Expired sessions have been deactivated' as message;
END //

-- Procedure: Delete Old Sessions (older than X days)
DROP PROCEDURE IF EXISTS sp_admin_delete_old_sessions //
CREATE PROCEDURE sp_admin_delete_old_sessions(
    IN p_days INT
)
BEGIN
    IF p_days IS NULL OR p_days < 30 THEN
        SET p_days = 30; -- Minimum 30 days
    END IF;
    
    -- Delete old inactive sessions
    DELETE FROM quiz_session
    WHERE is_active = FALSE
      AND waktu_selesai < DATE_SUB(NOW(), INTERVAL p_days DAY);
    
    SELECT 
        'success' as status,
        ROW_COUNT() as sessions_deleted,
        CONCAT('Sessions older than ', p_days, ' days have been deleted') as message;
END //

-- Procedure: Cleanup Invalid Soal
DROP PROCEDURE IF EXISTS sp_admin_cleanup_invalid_soal //
CREATE PROCEDURE sp_admin_cleanup_invalid_soal()
BEGIN
    DECLARE deleted_count INT;
    
    -- Delete soal with invalid jawaban_benar
    DELETE FROM soal 
    WHERE jawaban_benar IS NULL 
       OR jawaban_benar = '' 
       OR jawaban_benar = '-'
       OR LENGTH(TRIM(jawaban_benar)) = 0;
    
    SET deleted_count = ROW_COUNT();
    
    -- Update jumlah_soal untuk semua kumpulan_soal
    UPDATE kumpulan_soal ks
    SET jumlah_soal = (
        SELECT COUNT(*)
        FROM soal s
        WHERE s.kumpulan_soal_id = ks.kumpulan_soal_id
    );
    
    SELECT 
        'success' as status,
        deleted_count as soal_deleted,
        'Invalid soal have been deleted and counts updated' as message;
END //

-- Procedure: Generate Backup Info
DROP PROCEDURE IF EXISTS sp_admin_generate_backup_info //
CREATE PROCEDURE sp_admin_generate_backup_info()
BEGIN
    SELECT 
        'quiz_master' as database_name,
        NOW() as backup_time,
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM kategori) as total_kategori,
        (SELECT COUNT(*) FROM materi) as total_materi,
        (SELECT COUNT(*) FROM kumpulan_soal) as total_kumpulan_soal,
        (SELECT COUNT(*) FROM soal) as total_soal,
        (SELECT COUNT(*) FROM quiz_session) as total_sessions,
        (SELECT COUNT(*) FROM hasil_quiz) as total_hasil_quiz,
        (SELECT COUNT(*) FROM user_answers) as total_user_answers,
        DATABASE() as current_database,
        VERSION() as mysql_version;
END //

DELIMITER ;

-- ============================================================================
-- TESTING QUERIES UNTUK ADMIN
-- ============================================================================

-- Test 1: System Overview
-- CALL sp_admin_get_system_overview();

-- Test 2: User Activity
-- CALL sp_admin_get_user_activity();

-- Test 3: Quiz Activity
-- CALL sp_admin_get_quiz_activity(20);

-- Test 4: Active Sessions
-- CALL sp_admin_get_active_sessions();

-- Test 5: System Health Check
-- CALL sp_admin_system_health_check();

-- Test 6: Export Hasil Quiz
-- CALL sp_admin_export_hasil_quiz('2024-01-01', '2024-12-31');

-- Test 7: Cleanup Expired Sessions
-- CALL sp_admin_cleanup_expired_sessions();

-- Test 8: Generate Backup Info
-- CALL sp_admin_generate_backup_info();

-- ============================================================================
-- ADMIN DATABASE COMPLETE
-- ✅ Views untuk monitoring sistem dan aktivitas
-- ✅ Stored procedures untuk statistik dan laporan
-- ✅ Stored procedures untuk manajemen user (CRUD)
-- ✅ Stored procedures untuk export data
-- ✅ Stored procedures untuk system maintenance
-- ✅ Stored procedures untuk backup info
-- ============================================================================
