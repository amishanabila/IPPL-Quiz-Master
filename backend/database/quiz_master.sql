-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Dec 22, 2025 at 10:11 AM
-- Server version: 5.7.33
-- PHP Version: 7.4.19

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `quiz_master`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_admin_cleanup_expired_sessions` ()   BEGIN
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_admin_cleanup_invalid_soal` ()   BEGIN
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_admin_create_user` (IN `p_nama` VARCHAR(255), IN `p_email` VARCHAR(255), IN `p_password` VARCHAR(255), IN `p_role` VARCHAR(20), IN `p_is_verified` BOOLEAN)   BEGIN
    INSERT INTO users (nama, email, password, role, is_verified)
    VALUES (p_nama, p_email, p_password, p_role, COALESCE(p_is_verified, FALSE));
    
    SELECT * FROM users WHERE id = LAST_INSERT_ID();
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_admin_delete_old_sessions` (IN `p_days` INT)   BEGIN
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_admin_delete_user` (IN `p_user_id` INT)   BEGIN
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_admin_export_hasil_quiz` ()   BEGIN
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
    ORDER BY hq.completed_at DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_admin_export_hasil_quiz_filtered` (IN `p_start_date` DATE, IN `p_end_date` DATE)   BEGIN
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_admin_export_kumpulan_soal` ()   BEGIN
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_admin_export_soal` ()   BEGIN
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_admin_export_users` ()   BEGIN
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_admin_fix_missing_creators` ()   BEGIN
    -- Update semua data yang tidak punya created_by
    -- Coba assign ke user kreator pertama (sebagai default)
    DECLARE first_kreator_id INT;
    DECLARE rows_kumpulan_soal INT DEFAULT 0;
    DECLARE rows_materi INT DEFAULT 0;
    DECLARE rows_kategori INT DEFAULT 0;
    
    SELECT id INTO first_kreator_id 
    FROM users 
    WHERE role = 'kreator' 
    ORDER BY created_at ASC 
    LIMIT 1;
    
    IF first_kreator_id IS NOT NULL THEN
        -- Fix kumpulan_soal
        UPDATE kumpulan_soal 
        SET created_by = first_kreator_id,
            updated_by = first_kreator_id
        WHERE created_by IS NULL;
        SET rows_kumpulan_soal = ROW_COUNT();
        
        -- Fix materi
        UPDATE materi 
        SET created_by = first_kreator_id
        WHERE created_by IS NULL;
        SET rows_materi = ROW_COUNT();
        
        -- Fix kategori
        UPDATE kategori 
        SET created_by = first_kreator_id
        WHERE created_by IS NULL;
        SET rows_kategori = ROW_COUNT();
        
        SELECT 
            rows_kumpulan_soal as kumpulan_soal_updated,
            rows_materi as materi_updated,
            rows_kategori as kategori_updated,
            (rows_kumpulan_soal + rows_materi + rows_kategori) as total_updated,
            first_kreator_id as assigned_to_kreator_id,
            (SELECT nama FROM users WHERE id = first_kreator_id) as kreator_nama;
    ELSE
        SELECT 
            0 as kumpulan_soal_updated,
            0 as materi_updated,
            0 as kategori_updated,
            0 as total_updated,
            'No kreator found in system' as message;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_admin_generate_backup_info` ()   BEGIN
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_admin_get_active_sessions` ()   BEGIN
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_admin_get_all_users` (IN `p_role` VARCHAR(20))   BEGIN
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_admin_get_all_users_with_peserta` ()   BEGIN
    -- Get admin and kreator from users table
    SELECT 
        u.id,
        u.nama,
        u.email,
        u.telepon,
        u.role,
        u.is_verified,
        u.created_at,
        u.updated_at,
        COUNT(DISTINCT ks.kumpulan_soal_id) as total_kumpulan_soal
    FROM users u
    LEFT JOIN kumpulan_soal ks ON u.id = ks.created_by
    GROUP BY u.id, u.nama, u.email, u.telepon, u.role, u.is_verified, u.created_at, u.updated_at
    
    UNION ALL
    
    -- Get peserta from quiz_session (peserta don't have user_id)
    SELECT 
        NULL as id,
        nama_peserta as nama,
        NULL as email,
        NULL as telepon,
        'peserta' as role,
        TRUE as is_verified,
        MIN(created_at) as created_at,
        MAX(created_at) as updated_at,
        COUNT(DISTINCT kumpulan_soal_id) as total_kumpulan_soal
    FROM quiz_session
    GROUP BY nama_peserta
    
    ORDER BY created_at DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_admin_get_backup_info` ()   BEGIN
    SELECT 
        'quiz_master' as database_name,
        NOW() as last_backup_time,
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_admin_get_orphaned_data` ()   BEGIN
    -- Kumpulan soal without valid creator
    SELECT 
        'kumpulan_soal' as table_name,
        ks.kumpulan_soal_id as record_id,
        ks.judul as record_title,
        ks.created_by as creator_id,
        ks.created_at
    FROM kumpulan_soal ks
    LEFT JOIN users u ON ks.created_by = u.id
    WHERE ks.created_by IS NULL 
       OR u.id IS NULL
    
    UNION ALL
    
    -- Kategori without valid creator
    SELECT 
        'kategori' as table_name,
        k.id as record_id,
        k.nama_kategori as record_title,
        k.created_by as creator_id,
        k.created_at
    FROM kategori k
    LEFT JOIN users u ON k.created_by = u.id
    WHERE k.created_by IS NULL 
       OR u.id IS NULL
    
    UNION ALL
    
    -- Materi without valid creator
    SELECT 
        'materi' as table_name,
        m.materi_id as record_id,
        m.judul as record_title,
        m.created_by as creator_id,
        m.created_at
    FROM materi m
    LEFT JOIN users u ON m.created_by = u.id
    WHERE m.created_by IS NULL 
       OR u.id IS NULL
    
    ORDER BY created_at DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_admin_get_peserta_stats` ()   BEGIN
    SELECT 
        (@row_number := @row_number + 1) as id,
        nama_peserta as nama,
        'peserta' as role,
        NULL as email,
        NULL as telepon,
        TRUE as is_verified,
        first_attempt as created_at,
        last_attempt as updated_at,
        total_quiz_taken as total_kumpulan_soal
    FROM (
        SELECT 
            nama_peserta,
            MIN(created_at) as first_attempt,
            MAX(created_at) as last_attempt,
            COUNT(DISTINCT kumpulan_soal_id) as total_quiz_taken
        FROM quiz_session
        GROUP BY nama_peserta
    ) peserta_data,
    (SELECT @row_number := 0) as t
    ORDER BY first_attempt DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_admin_get_quiz_activity` (IN `p_days` INT, IN `p_limit` INT)   BEGIN
    IF p_days IS NULL OR p_days <= 0 THEN
        SET p_days = 30;
    END IF;
    
    IF p_limit IS NULL OR p_limit <= 0 THEN
        SET p_limit = 50;
    END IF;
    
    SELECT * FROM v_admin_quiz_activity
    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL p_days DAY)
    ORDER BY created_at DESC
    LIMIT p_limit;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_admin_get_system_overview` ()   BEGIN
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_admin_get_users` ()   BEGIN
    SELECT 
        u.id,
        u.nama,
        u.email,
        u.telepon,
        u.role,
        u.is_verified,
        u.created_at,
        u.updated_at,
        COUNT(DISTINCT ks.kumpulan_soal_id) as total_kumpulan_soal
    FROM users u
    LEFT JOIN kumpulan_soal ks ON u.id = ks.created_by
    GROUP BY u.id, u.nama, u.email, u.telepon, u.role, u.is_verified, u.created_at, u.updated_at
    ORDER BY u.created_at DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_admin_get_user_activity` ()   BEGIN
    SELECT * FROM v_admin_user_activity
    ORDER BY total_kumpulan_soal_created DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_admin_health_check` ()   BEGIN
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
    
    -- Check expired sessions (session aktif yang melewati batas waktu)
    SELECT 
        'Session Kadaluarsa' as check_type,
        COUNT(*) as count,
        CASE WHEN COUNT(*) > 0 THEN 'INFO' ELSE 'OK' END as status
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_admin_reset_user_password` (IN `p_user_id` INT, IN `p_new_password` VARCHAR(255))   BEGIN
    UPDATE users
    SET password = p_new_password,
        reset_token = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_user_id;
    
    SELECT 'success' as status, ROW_COUNT() as affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_admin_update_user` (IN `p_user_id` INT, IN `p_nama` VARCHAR(255), IN `p_email` VARCHAR(255), IN `p_role` VARCHAR(20), IN `p_telepon` VARCHAR(20), IN `p_is_verified` BOOLEAN)   BEGIN
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_admin_update_user_role` (IN `p_user_id` INT, IN `p_new_role` VARCHAR(20))   BEGIN
    UPDATE users
    SET 
        role = p_new_role,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_user_id;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_admin_verify_user` (IN `p_user_id` INT)   BEGIN
    UPDATE users
    SET 
        is_verified = TRUE,
        verification_token = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_user_id;
    
    SELECT 'success' as status, ROW_COUNT() as affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_check_orphaned_kreator_data` ()   BEGIN
    -- Materi without valid creator
    SELECT 
        'materi' as table_name,
        m.materi_id as record_id,
        m.judul as record_title,
        m.created_by as creator_id,
        m.created_at
    FROM materi m
    LEFT JOIN users u ON m.created_by = u.id
    WHERE m.created_by IS NULL 
       OR u.id IS NULL
    
    UNION ALL
    
    -- Kategori without valid creator
    SELECT 
        'kategori' as table_name,
        k.id as record_id,
        k.nama_kategori as record_title,
        k.created_by as creator_id,
        k.created_at
    FROM kategori k
    LEFT JOIN users u ON k.created_by = u.id
    WHERE k.created_by IS NULL 
       OR u.id IS NULL
    
    ORDER BY created_at DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_fix_materi_kategori_creator` ()   BEGIN
    DECLARE first_kreator_id INT;
    DECLARE rows_materi INT DEFAULT 0;
    DECLARE rows_kategori INT DEFAULT 0;
    
    -- Get first kreator (oldest by created_at)
    SELECT id INTO first_kreator_id 
    FROM users 
    WHERE role = 'kreator' 
    ORDER BY created_at ASC 
    LIMIT 1;
    
    IF first_kreator_id IS NOT NULL THEN
        -- Fix materi
        UPDATE materi 
        SET created_by = first_kreator_id
        WHERE created_by IS NULL;
        SET rows_materi = ROW_COUNT();
        
        -- Fix kategori
        UPDATE kategori 
        SET created_by = first_kreator_id
        WHERE created_by IS NULL;
        SET rows_kategori = ROW_COUNT();
        
        -- Return results
        SELECT 
            rows_materi as materi_updated,
            rows_kategori as kategori_updated,
            (rows_materi + rows_kategori) as total_updated,
            first_kreator_id as assigned_to_kreator_id,
            (SELECT nama FROM users WHERE id = first_kreator_id) as kreator_nama;
    ELSE
        SELECT 
            0 as materi_updated,
            0 as kategori_updated,
            0 as total_updated,
            'No kreator found in system' as message;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_kreator_create_kategori` (IN `p_nama_kategori` VARCHAR(100), IN `p_created_by` INT)   BEGIN
    INSERT INTO kategori (nama_kategori, created_by)
    VALUES (p_nama_kategori, p_created_by);
    
    SELECT * FROM kategori WHERE id = LAST_INSERT_ID();
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_kreator_create_kumpulan_soal` (IN `p_judul` VARCHAR(255), IN `p_kategori_id` INT, IN `p_materi_id` INT, IN `p_created_by` INT, IN `p_waktu_per_soal` INT, IN `p_waktu_keseluruhan` INT, IN `p_tipe_waktu` VARCHAR(20))   BEGIN
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_kreator_create_materi` (IN `p_judul` VARCHAR(255), IN `p_isi_materi` TEXT, IN `p_kategori_id` INT, IN `p_created_by` INT)   BEGIN
    INSERT INTO materi (judul, isi_materi, kategori_id, created_by)
    VALUES (p_judul, p_isi_materi, p_kategori_id, p_created_by);
    
    SELECT 
        m.*,
        k.nama_kategori
    FROM materi m
    JOIN kategori k ON m.kategori_id = k.id
    WHERE m.materi_id = LAST_INSERT_ID();
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_kreator_create_soal` (IN `p_kumpulan_soal_id` INT, IN `p_pertanyaan` TEXT, IN `p_gambar` LONGTEXT, IN `p_pilihan_a` TEXT, IN `p_pilihan_b` TEXT, IN `p_pilihan_c` TEXT, IN `p_pilihan_d` TEXT, IN `p_jawaban_benar` TEXT, IN `p_variasi_jawaban` JSON)   BEGIN
    INSERT INTO soal 
    (kumpulan_soal_id, pertanyaan, gambar, pilihan_a, pilihan_b, pilihan_c, pilihan_d, jawaban_benar, variasi_jawaban)
    VALUES 
    (p_kumpulan_soal_id, p_pertanyaan, p_gambar, p_pilihan_a, p_pilihan_b, p_pilihan_c, p_pilihan_d, p_jawaban_benar, p_variasi_jawaban);
    
    SELECT * FROM soal WHERE soal_id = LAST_INSERT_ID();
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_kreator_delete_kategori` (IN `p_kategori_id` INT)   BEGIN
    DELETE FROM kategori WHERE id = p_kategori_id;
    SELECT ROW_COUNT() as affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_kreator_delete_kumpulan_soal` (IN `p_kumpulan_soal_id` INT, IN `p_created_by` INT)   BEGIN
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_kreator_delete_materi` (IN `p_materi_id` INT)   BEGIN
    DELETE FROM materi WHERE materi_id = p_materi_id;
    SELECT ROW_COUNT() as affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_kreator_delete_soal` (IN `p_soal_id` INT)   BEGIN
    DELETE FROM soal WHERE soal_id = p_soal_id;
    SELECT ROW_COUNT() as affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_kreator_get_all_kategori` ()   BEGIN
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_kreator_get_detail_jawaban` (IN `p_hasil_id` INT, IN `p_created_by` INT)   BEGIN
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_kreator_get_kumpulan_soal` (IN `p_created_by` INT)   BEGIN
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_kreator_get_materi_by_kategori` (IN `p_kategori_id` INT)   BEGIN
    SELECT 
        m.*,
        k.nama_kategori,
        u.nama as created_by_name
    FROM materi m
    JOIN kategori k ON m.kategori_id = k.id
    LEFT JOIN users u ON m.created_by = u.id
    WHERE m.kategori_id = p_kategori_id
    ORDER BY m.created_at DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_kreator_get_profile` (IN `p_user_id` INT)   BEGIN
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_kreator_get_results_by_kumpulan` (IN `p_kumpulan_soal_id` INT, IN `p_created_by` INT)   BEGIN
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_kreator_get_soal_by_kumpulan` (IN `p_kumpulan_soal_id` INT)   BEGIN
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_kreator_get_statistics` (IN `p_created_by` INT)   BEGIN
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_kreator_update_kategori` (IN `p_kategori_id` INT, IN `p_nama_kategori` VARCHAR(100))   BEGIN
    UPDATE kategori 
    SET 
        nama_kategori = p_nama_kategori,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_kategori_id;
    
    SELECT * FROM kategori WHERE id = p_kategori_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_kreator_update_kumpulan_soal` (IN `p_kumpulan_soal_id` INT, IN `p_judul` VARCHAR(255), IN `p_waktu_per_soal` INT, IN `p_waktu_keseluruhan` INT, IN `p_tipe_waktu` VARCHAR(20), IN `p_updated_by` INT)   BEGIN
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_kreator_update_materi` (IN `p_materi_id` INT, IN `p_judul` VARCHAR(255), IN `p_isi_materi` TEXT, IN `p_kategori_id` INT)   BEGIN
    UPDATE materi 
    SET 
        judul = p_judul,
        isi_materi = p_isi_materi,
        kategori_id = p_kategori_id,
        updated_at = CURRENT_TIMESTAMP
    WHERE materi_id = p_materi_id;
    
    SELECT * FROM materi WHERE materi_id = p_materi_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_kreator_update_profile` (IN `p_user_id` INT, IN `p_nama` VARCHAR(255), IN `p_email` VARCHAR(255), IN `p_telepon` VARCHAR(20), IN `p_foto` LONGBLOB)   BEGIN
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_kreator_update_soal` (IN `p_soal_id` INT, IN `p_pertanyaan` TEXT, IN `p_gambar` LONGTEXT, IN `p_pilihan_a` TEXT, IN `p_pilihan_b` TEXT, IN `p_pilihan_c` TEXT, IN `p_pilihan_d` TEXT, IN `p_jawaban_benar` TEXT, IN `p_variasi_jawaban` JSON)   BEGIN
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_peserta_get_active_session` (IN `p_nama_peserta` VARCHAR(255), IN `p_pin_code` CHAR(6))   BEGIN
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_peserta_get_hasil` (IN `p_nama_peserta` VARCHAR(255), IN `p_kumpulan_soal_id` INT)   BEGIN
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_peserta_get_leaderboard` (IN `p_kumpulan_soal_id` INT, IN `p_limit` INT)   BEGIN
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
        ks.kategori_id,
        k.nama_kategori as kategori,
        ks.materi_id,
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_peserta_get_leaderboard_by_kategori` (IN `p_kategori_id` INT, IN `p_limit` INT)   BEGIN
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
        ks.kategori_id,
        k.nama_kategori as kategori,
        ks.materi_id,
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_peserta_get_soal` (IN `p_kumpulan_soal_id` INT)   BEGIN
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_peserta_start_session` (IN `p_nama_peserta` VARCHAR(255), IN `p_kumpulan_soal_id` INT, IN `p_pin_code` CHAR(6), IN `p_waktu_mulai` DATETIME, IN `p_waktu_batas` DATETIME)   BEGIN
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_peserta_submit_jawaban` (IN `p_hasil_id` INT, IN `p_soal_id` INT, IN `p_jawaban` TEXT, IN `p_is_correct` BOOLEAN, IN `p_points_earned` DECIMAL(5,2))   BEGIN
    INSERT INTO user_answers 
    (hasil_id, soal_id, jawaban, is_correct, points_earned)
    VALUES
    (p_hasil_id, p_soal_id, p_jawaban, p_is_correct, p_points_earned);
    
    SELECT * FROM user_answers WHERE id = LAST_INSERT_ID();
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_peserta_submit_result` (IN `p_session_id` INT, IN `p_nama_peserta` VARCHAR(255), IN `p_kumpulan_soal_id` INT, IN `p_skor` INT, IN `p_jawaban_benar` INT, IN `p_total_soal` INT, IN `p_waktu_pengerjaan` INT, IN `p_pin_code` CHAR(6))   BEGIN
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_peserta_update_progress` (IN `p_session_id` INT, IN `p_current_soal_index` INT)   BEGIN
    UPDATE quiz_session 
    SET 
        current_soal_index = p_current_soal_index,
        updated_at = CURRENT_TIMESTAMP
    WHERE session_id = p_session_id
      AND is_active = TRUE;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_peserta_validate_pin` (IN `p_pin` CHAR(6))   BEGIN
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
END$$

--
-- Functions
--
CREATE DEFINER=`root`@`localhost` FUNCTION `generate_unique_pin` () RETURNS CHAR(6) CHARSET latin1 DETERMINISTIC BEGIN
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
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `hasil_quiz`
--

CREATE TABLE `hasil_quiz` (
  `hasil_id` int(11) NOT NULL,
  `session_id` int(11) DEFAULT NULL COMMENT 'Reference ke quiz_session',
  `nama_peserta` varchar(255) NOT NULL,
  `kumpulan_soal_id` int(11) NOT NULL,
  `skor` int(11) DEFAULT '0',
  `jawaban_benar` int(11) DEFAULT '0',
  `total_soal` int(11) DEFAULT '0',
  `waktu_pengerjaan` int(11) DEFAULT NULL COMMENT 'Total waktu pengerjaan dalam detik',
  `pin_code` char(6) DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `hasil_quiz`
--

INSERT INTO `hasil_quiz` (`hasil_id`, `session_id`, `nama_peserta`, `kumpulan_soal_id`, `skor`, `jawaban_benar`, `total_soal`, `waktu_pengerjaan`, `pin_code`, `completed_at`, `created_at`, `updated_at`) VALUES
(1, 1, 'dini', 1, 100, 2, 2, 60, '418037', '2025-12-03 16:03:08', '2025-12-03 08:03:08', '2025-12-03 08:03:08'),
(2, 3, 'aji', 2, 50, 1, 2, 60, '183719', '2025-12-03 17:01:23', '2025-12-03 09:01:23', '2025-12-03 09:01:23'),
(3, 5, 'ira', 2, 100, 2, 2, 60, '183719', '2025-12-04 15:39:59', '2025-12-04 07:39:59', '2025-12-04 07:39:59'),
(4, 7, 'yogi', 1, 100, 2, 2, 60, '418037', '2025-12-22 16:52:23', '2025-12-22 08:52:23', '2025-12-22 08:52:23');

-- --------------------------------------------------------

--
-- Table structure for table `kategori`
--

CREATE TABLE `kategori` (
  `id` int(11) NOT NULL,
  `nama_kategori` varchar(100) NOT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `kategori`
--

INSERT INTO `kategori` (`id`, `nama_kategori`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'ipa', 3, '2025-12-03 07:48:40', '2025-12-03 07:48:40'),
(2, 'matematika', 3, '2025-12-03 09:00:03', '2025-12-03 09:00:03');

-- --------------------------------------------------------

--
-- Table structure for table `kumpulan_soal`
--

CREATE TABLE `kumpulan_soal` (
  `kumpulan_soal_id` int(11) NOT NULL,
  `judul` varchar(255) DEFAULT NULL,
  `kategori_id` int(11) NOT NULL,
  `materi_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `jumlah_soal` int(11) DEFAULT '0',
  `pin_code` char(6) DEFAULT NULL COMMENT 'PIN 6 digit untuk akses quiz - aktif selama soal ada',
  `waktu_per_soal` int(11) DEFAULT '60' COMMENT 'Waktu per soal dalam detik (default 60 detik)',
  `waktu_keseluruhan` int(11) DEFAULT NULL COMMENT 'Waktu keseluruhan quiz dalam detik (NULL = hanya waktu per soal)',
  `tipe_waktu` enum('per_soal','keseluruhan') DEFAULT 'per_soal' COMMENT 'Jenis pengaturan waktu',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `kumpulan_soal`
--

INSERT INTO `kumpulan_soal` (`kumpulan_soal_id`, `judul`, `kategori_id`, `materi_id`, `created_by`, `updated_by`, `jumlah_soal`, `pin_code`, `waktu_per_soal`, `waktu_keseluruhan`, `tipe_waktu`, `created_at`, `updated_at`) VALUES
(1, 'alat pernafasan hewan', 1, 1, 3, 3, 2, '418037', 30, NULL, 'per_soal', '2025-12-03 07:48:40', '2025-12-03 08:04:23'),
(2, 'bangun datar', 2, 2, 3, 3, 2, '183719', 60, 300, 'keseluruhan', '2025-12-03 09:00:03', '2025-12-03 09:00:03');

--
-- Triggers `kumpulan_soal`
--
DELIMITER $$
CREATE TRIGGER `before_insert_kumpulan_soal_generate_pin` BEFORE INSERT ON `kumpulan_soal` FOR EACH ROW BEGIN
    -- Generate PIN jika belum ada
    IF NEW.pin_code IS NULL OR NEW.pin_code = '' THEN
        SET NEW.pin_code = generate_unique_pin();
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `materi`
--

CREATE TABLE `materi` (
  `materi_id` int(11) NOT NULL,
  `judul` varchar(255) NOT NULL,
  `isi_materi` text NOT NULL,
  `kategori_id` int(11) NOT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `materi`
--

INSERT INTO `materi` (`materi_id`, `judul`, `isi_materi`, `kategori_id`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'alat pernafasan hewan', 'Materi ipa - alat pernafasan hewan', 1, 3, '2025-12-03 07:48:40', '2025-12-03 08:04:23'),
(2, 'bangun datar', 'Materi matematika - bangun datar', 2, 3, '2025-12-03 09:00:03', '2025-12-03 09:00:03');

-- --------------------------------------------------------

--
-- Table structure for table `quiz`
--

CREATE TABLE `quiz` (
  `quiz_id` int(11) NOT NULL,
  `judul` varchar(255) NOT NULL,
  `deskripsi` text,
  `kumpulan_soal_id` int(11) NOT NULL,
  `created_by` int(11) NOT NULL,
  `pin_code` char(6) NOT NULL,
  `durasi` int(11) NOT NULL COMMENT 'Durasi dalam menit',
  `tanggal_mulai` datetime NOT NULL,
  `tanggal_selesai` datetime NOT NULL,
  `status` enum('draft','active','completed') DEFAULT 'draft',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `quiz_session`
--

CREATE TABLE `quiz_session` (
  `session_id` int(11) NOT NULL,
  `nama_peserta` varchar(255) NOT NULL,
  `email_peserta` varchar(255) DEFAULT NULL COMMENT 'Email peserta untuk tracking',
  `kumpulan_soal_id` int(11) NOT NULL,
  `pin_code` char(6) DEFAULT NULL,
  `waktu_mulai` datetime NOT NULL COMMENT 'Server timestamp saat quiz dimulai',
  `waktu_selesai` datetime DEFAULT NULL COMMENT 'Server timestamp saat quiz selesai',
  `waktu_batas` datetime NOT NULL COMMENT 'Server timestamp batas waktu pengerjaan',
  `current_soal_index` int(11) DEFAULT '0' COMMENT 'Index soal terakhir yang dikerjakan',
  `is_active` tinyint(1) DEFAULT '1' COMMENT 'Session masih aktif atau sudah selesai',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `quiz_session`
--

INSERT INTO `quiz_session` (`session_id`, `nama_peserta`, `email_peserta`, `kumpulan_soal_id`, `pin_code`, `waktu_mulai`, `waktu_selesai`, `waktu_batas`, `current_soal_index`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'dini', NULL, 1, '418037', '2025-12-03 16:02:19', '2025-12-03 16:03:08', '2025-12-03 16:03:19', 1, 0, '2025-12-03 08:02:18', '2025-12-03 08:03:08'),
(3, 'aji', NULL, 2, '183719', '2025-12-03 17:00:35', '2025-12-03 17:01:23', '2025-12-03 17:05:35', 1, 0, '2025-12-03 09:00:35', '2025-12-03 09:01:23'),
(5, 'ira', NULL, 2, '183719', '2025-12-04 15:39:03', '2025-12-04 15:39:59', '2025-12-04 15:44:03', 1, 0, '2025-12-04 07:39:02', '2025-12-04 07:39:59'),
(7, 'yogi', NULL, 1, '418037', '2025-12-22 16:51:46', '2025-12-22 16:52:23', '2025-12-22 16:52:46', 1, 0, '2025-12-22 08:51:45', '2025-12-22 08:52:23');

-- --------------------------------------------------------

--
-- Table structure for table `soal`
--

CREATE TABLE `soal` (
  `soal_id` int(11) NOT NULL,
  `kumpulan_soal_id` int(11) NOT NULL,
  `pertanyaan` text NOT NULL,
  `gambar` longtext COMMENT 'Base64 encoded image data',
  `pilihan_a` text,
  `pilihan_b` text,
  `pilihan_c` text,
  `pilihan_d` text,
  `jawaban_benar` text NOT NULL,
  `variasi_jawaban` json DEFAULT NULL COMMENT 'Array of alternative correct answers for isian singkat (stored as JSON)',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `soal`
--

INSERT INTO `soal` (`soal_id`, `kumpulan_soal_id`, `pertanyaan`, `gambar`, `pilihan_a`, `pilihan_b`, `pilihan_c`, `pilihan_d`, `jawaban_benar`, `variasi_jawaban`, `created_at`, `updated_at`) VALUES
(3, 1, 'hewan pada gambar bernafas menggunakan...', 'data:image/webp;base64,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', 'trakea', 'hidung', 'paru-paru', 'mulut', 'trakea', NULL, '2025-12-03 07:51:14', '2025-12-03 07:51:14'),
(4, 1, 'hewan ini bernafas menggunakan?', 'data:image/jpeg;base64,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', NULL, NULL, NULL, NULL, 'insang', '[\"insang\", \"Insang\"]', '2025-12-03 07:51:14', '2025-12-03 07:51:14'),
(5, 2, 'berapa sisi persegi?', NULL, NULL, NULL, NULL, NULL, '4', '[\"4\", \"4 sisi\", \"empat sisi\", \"empat\"]', '2025-12-03 09:00:03', '2025-12-03 09:00:03');
INSERT INTO `soal` (`soal_id`, `kumpulan_soal_id`, `pertanyaan`, `gambar`, `pilihan_a`, `pilihan_b`, `pilihan_c`, `pilihan_d`, `jawaban_benar`, `variasi_jawaban`, `created_at`, `updated_at`) VALUES
(6, 2, 'balok ada berapa rusuk?', 'data:image/jpeg;base64,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', '12 rusuk', '14 rusuk', '16  rusuk', '20 rusuk', '12 rusuk', NULL, '2025-12-03 09:00:03', '2025-12-03 09:00:03');

--
-- Triggers `soal`
--
DELIMITER $$
CREATE TRIGGER `after_soal_delete` AFTER DELETE ON `soal` FOR EACH ROW BEGIN
    UPDATE kumpulan_soal
    SET jumlah_soal = (
        SELECT COUNT(*) 
        FROM soal 
        WHERE kumpulan_soal_id = OLD.kumpulan_soal_id
    )
    WHERE kumpulan_soal_id = OLD.kumpulan_soal_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `after_soal_insert` AFTER INSERT ON `soal` FOR EACH ROW BEGIN
    UPDATE kumpulan_soal
    SET jumlah_soal = (
        SELECT COUNT(*) 
        FROM soal 
        WHERE kumpulan_soal_id = NEW.kumpulan_soal_id
    )
    WHERE kumpulan_soal_id = NEW.kumpulan_soal_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_insert_soal_validate_jawaban` BEFORE INSERT ON `soal` FOR EACH ROW BEGIN
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
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_update_soal_validate_jawaban` BEFORE UPDATE ON `soal` FOR EACH ROW BEGIN
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
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `nama` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','kreator') DEFAULT 'kreator',
  `telepon` varchar(20) DEFAULT NULL,
  `foto` longblob,
  `verification_token` varchar(512) DEFAULT NULL,
  `reset_token` varchar(512) DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `nama`, `email`, `password`, `role`, `telepon`, `foto`, `verification_token`, `reset_token`, `is_verified`, `created_at`, `updated_at`) VALUES
(1, 'Admin QuizMaster', 'admin@gmail.com', '$2b$10$SS1gQJNiaAFjyBIKVL2YLO14eZPHYRS1OG7f6pw75aH1wlfPBUl2y', 'admin', NULL, NULL, NULL, NULL, 1, '2025-12-03 07:26:03', '2025-12-03 08:00:29'),
(3, 'Amisha', 'amishanabila37@gmail.com', '$2b$10$vfIaB70YLUGH3x069lN/zexUgWsfMF5dOlktdpWGtA0d4un0L9gAC', 'kreator', '081248855946', 0xffd8ffe000104a46494600010101006000600000ffdb0043000302020302020303030304030304050805050404050a070706080c0a0c0c0b0a0b0b0d0e12100d0e110e0b0b1016101113141515150c0f171816141812141514ffdb00430103040405040509050509140d0b0d1414141414141414141414141414141414141414141414141414141414141414141414141414141414141414141414141414ffc00011080162016203012200021101031101ffc4001f0000010501010101010100000000000000000102030405060708090a0bffc400b5100002010303020403050504040000017d01020300041105122131410613516107227114328191a1082342b1c11552d1f02433627282090a161718191a25262728292a3435363738393a434445464748494a535455565758595a636465666768696a737475767778797a838485868788898a92939495969798999aa2a3a4a5a6a7a8a9aab2b3b4b5b6b7b8b9bac2c3c4c5c6c7c8c9cad2d3d4d5d6d7d8d9dae1e2e3e4e5e6e7e8e9eaf1f2f3f4f5f6f7f8f9faffc4001f0100030101010101010101010000000000000102030405060708090a0bffc400b51100020102040403040705040400010277000102031104052131061241510761711322328108144291a1b1c109233352f0156272d10a162434e125f11718191a262728292a35363738393a434445464748494a535455565758595a636465666768696a737475767778797a82838485868788898a92939495969798999aa2a3a4a5a6a7a8a9aab2b3b4b5b6b7b8b9bac2c3c4c5c6c7c8c9cad2d3d4d5d6d7d8d9dae2e3e4e5e6e7e8e9eaf2f3f4f5f6f7f8f9faffda000c03010002110311003f00fd38a6eda7515c86a1451450014526ea5a0028a28a0028a28a0028a28a007d14514005145140051452eda00375264d145001bc7bd14b81eb4940051451400bba9699ba9dba80169bbc7bd3aa2a94c028a28ab60145149baa0b136d1b697751ba80b8da28a2801375252eda4a004dd4d6e68a28b13619451455082976d253e8b96328a28a902d6ea375368aa207d149ba96801bb69d4526ea003752d376d3a800a28a2800a28a2801f4526ea375002d149ba96800a5dd494500145149ba801326977536976d002eea5a653726801d4edd4cdd4b4ec03f78f7a65149ba95805a28a2800a6538b814cdd5362ee2d145145880a28a4dd41771699ba9dbaa3a2c1713751ba9b45505c28a28a080a7d329dbaa4b1b4514545d81628a09c519adac45c29dba92928b05c78e69942e4514807d145145c028a28a0028a28a0028a4dd4b40053cf151e450c73de980ede3de8de3dea3a28024de3de9bba8da7763f973498218af43e878fe74862eea42d8ef55b50d4acf498fccbfbcb7b14f5b99963fe66b9cbaf8a5e0eb67db278af4653ff5fa9fe35566c573aa0d9a37560d978efc337bff001efe23d266ff0076f63ff1adc89d278fcc8a449a3fef42c241ff008ee68b30b8fcd3b22a1c9ce00c9ee3d29558b8c8e47d68b86c4bba936d3378f7a5dd4ac03f7533752e6a3de3de900e6706903669b48ad8a00977526f1ef4dde3de9bba8024de3de8a8f753f754d805a8f753f754554014bb68db4ea0065145140052eda4a76ea92c4db452eea2a2c00cf9a764d302e6977574190fdf4fa877549bc7bd003e8a8f7d1bea1a2ae4bba8dd51ef1ef4bbaa4092932299ba99e6555c09e9322a1f3851be9d80909c5377d44f28a8fcd14582e58df49e6541e6533cf1ef54172eef155b55d56cf43d36eb50d46ea2b2b0b58ccd3dcccdb52341fc44fa545e7fd6be11ff00829efc6fbad1346d2be1be9f3bc29a8c02fb5368db05a02db561ce7a1aa84399d80ccf8ddff0552934dd56e6c3e1c6816977670c8631abeb00e24c7f12203c8fae2bc375ff00f829d7c5bf12452594d7d69a35bbff00cb5d22d8472afd0b135f206a7a934f330563f2ff0010efed54d3730ce493ed5ecd3c343a9e7ceb34f43e84d43e226a5e2f02f2fb5abcd5b7f01eeee5e5e7d319159136a2586edd9faf35e49a1eb72689739397b77e248c9e0fb8f7af4059d5d1648db3137439eb43a4a26d093923663d6648beeb15ff007323fad751e19f8c9e2df074c1f45f12eada691da1bc7c7e44d79db4c53ae69e1b3de93a7166973ed9f863ff00051ef1768f2c36be2fb1b6f1158a759e35f2671f975afb7fe12fc6bf09fc6bd25f51f0cdf2cd2447f7f63210b341eeeb93c7d09afc4986668fa935dc7c31f8a3af7c33f13daebba05f359dfdb9c8c7dc907a3aff0010ae79e1d3d869df73f6f3d3a53777bd79a7c05f8d9a5fc73f87f06bf6212daee32b0ea167bb779137a7d1bb1fe55e8bbfdebce9269d99adcb1bfde9b51093347995985c9b229b4dc9a378f7a02e3a8a3349ba80b8b4edd4da2801dba9b452d003a8a4dd46ea0077151d1cfb5140051451505dc28a5a28b85c6ab1149bc7bd45934bbab63226cd377d337d1400fdf46fa8f751914012eea5df5064d1bbde958ab9379bf5a6efa877526fa2c1724f33de93cca877fbd34b63bd30b8f6973de8f32abf994865c5162494cd8a88dc63d6a1796a17969d98167ed0304e703f9d7e37ff00c1417c632ebdfb4d78cc79a5e2b39e3d3e119e15628f0c3fefbafd7dd47568343d36f352b9602dece169e42dd02aaee35f897e23b09be2dfc68bfbdbc258ea57f2dece7de46ce3f2ade94952f7997183ab2e5471df0f7e0e7897e265c22e95685a0233e7bfca87f1c57d1de12fd86e216de6eafaac93cdfdc886d15f41fc3cf0f58786f46b6b3b28638638d70422edcd77f67b49c91cfd6bc9ad99d49cad1d0fa5a194d2846f25767cb177fb1a68b656e5a289e623fbe4d79278e3e1b0f01491451c4cb6e4e3a93b6bf45d42329528a41af10f8f5e005d6bc3b79e5c799c2931e077ad70f8b9b925364623031516e08f87a6eb4c59b153ceb862a46186723d3daaa37c9d6be9a2d35747cab4d3b32ceea9207d8d9cf154e2979c1cd4cad8ef5623df3f65bf8fb77f037e225aea0ce65d06f985aea9699e1a23ff002d00e9bd7b57eb569ba8db6b1a7dadf594cb736973109e29a3395643d0e6bf08ed66f2d86d38182082339f4afd17ff00827a7c703aff0086af7e1cea93efbbd2ff00d2f4e766c992dcfde8b3d78ed5e76229db5455cfb3d5b146fa80be28df5e758d0b5be9dbaaa097353ef1ef4580977d3830355fcd1e869564c51602d668cd41e70f7a76ff007a450fde3de937d3375379f6a0097cd1e869dbaa0a5ddef4013e6937547be9dba801f4669bbc7bd37268b00bbe8a6d1536023dd46ea66f1ef4bbab52476ea7ee1516ea6efa009734cdf4ddf485c0a009378f7a6e4d45ba8dd400bbe9a5f149ba98cd9a007efa63bd30923d2a3624d1601f934c76a696c77a8ddaac0246c5577969d2b66aabb5501e59fb58f8a24f0d7ecf3e2f9e1e259edd6d148ffa6af83fa57e6afc20b257f17f9e006618c67dabf41bf6dd43ff000ce3e222a47c92db11ff007f715f05fc05844de2324e0e3ad4d656a2da3d0c15bdaab9f58786e32615c035dad9da103245737e1ebab5b585774a80fa135d3aead0bc798d857c8f2bbdcfb74efb1a16f08dd83553c4da1a6a3a6c91f438214f7e6b2f53f11ff67c45830e2bce7c4bf1675412343691ee27d4715d34dd9ab99548e87c91f18fc26de10f1b5edb88fca866732a13d3e95e7f28cd7bbfc68b0d63c4d62351bd45f32239523a915e14e3f9915f6785a9cf0491f0d8ca6e9cd958128d9352ee6a8dd0d3c735de70125b4fbf38ec71cd7a9fc00f1fcff0fbe29f85fc4314de48b5be8d2761fc50b1c3035e4687cadfcf7cd6a69f2e04eb93f4f4e38fd6b1a8b9901fbb86556756560d1b0dc083c11807fa8a03e6b8ff00853aa3eb9f0a7c17a84ac5a6bbd1ace6763dd9a25ddfa835d621af18d899722a7dd55b78f7a76fa4058cd3eab87cd3f7d0049ba9fbea1dd4fdd5055c9b349baa3df4edd405c52e07ad337d23366936d004dba9e0e6a2dd423501726a293228c8a02e1ba8a6d1405caf4edd4cdd4b9ab2476ea6d19a33400535dc52eea8de801dba8dd4c240a8f7d0038e47a519a89e61ef5179b40123bd30b62a17987bd42d3e7d6ac09de4fad44f2d40d704d42f29a009e4940aaaf30a64b366aa3b9aa03cabf6b9b13aafece7e328d305a28239ce7d165c9fd2bf353e1a6a57906b2d6d684a492e3e6cd7ea8fc5dd24ebff0009fc5fa7a2f98d3e9570147b85dc2bf24bc2fab9d0b5c8eed50b88581709c9207a56925cd499be1e56a88fa934bd07c416d6bf68fb449328c72d919cfa5745e19f194c2f7ecb73bd24feeb0af25f127c5ff1de95a16977da25b42b6b739f32086d4cad1fa649aed7c2d6facf89f4f8b51f105945a7ea71a79b19886189f4600f02be6ab51925cd267d7e1eb479b911e9faf335c58b498257dab87b7d56c6c7fd22f0aa2e71823273e98f5af6ad37404bff00084529505b3839af34f1b7c3b7b296d752b6b4927f20644719e8deb8ef5c504aeae7a53bb5a1e4be3ff8f7e17bcf3f411a45f2dcab884c8515486fa66be6fd5a2f2efe65f2de31b8e15860d7d40df0ff0046f117899f57b8f0f19354660c5981c123b91eb54fe2e7c03960f0c4facc319172b962a076afa4c2d7a54a4a313e5f1586af38b94cf97dc5350d3e40467208209047d2a35e2be8ae7cd356dc89c2ee71dc0dd5634b979949e8dd2a85d4bb6598e0f1166a4b3976db03dcaeea5215cfdaafd9fe62ff00027e1eb31e4e8369fac5915e82927d6bcf7e0542d6ff00047e1ec671c6816278f7801feb5df21af1a5bb35893eea94383506ea7a1a8196578a507351ef1ef4e56028025dd4fcd454a093536024a76ea66ea5a4014fa653b75055c5a178a4dd4b41361f93464d26ea375003b7514ddd45022beea39a6d337d58c9326937fbd34c805465f140137982a2792a3f33dea36933400e794d45e61a63bd26ea00634a4d3771a6d04e28018e5bd6a3c9a7b1cd45baac00b0150bb53dcd42e68b00d77155dcd48e6a17354043716ff6db4b8b63c09e17888ed864c7f3afc96f873e1efed4f1b6a7a44aa0c892b43b48e8cac54fea0d7eb7c726d9031c6057e6669ba31f077ed6be2cd264f902ea972e807f71d8c89ff8eb0fd6a6adfd94ac7661146559267a9e97f0bbc416502416a55a11d24ce3f4aee74df09ffc235a53899fcdb876da58f3c7b57a069db61b7507007a01591e2eb980223caeb1c29f33b1e95f2927292bb3ef614d45688e8f429bc9f0d47181b406fe2a92c6faccc8caeca55ba826b957f8a9a4e9da2946f24db2fcc65dc2b988be25f85bc5d60cda1dd34d721f66d11b2e4fb6454a46fca8f618748d3e4b912471c6ec7f8828154fc71a3c175a2496a406ca10411c7358fa4dd5ce971a25c647b9ab9aa6ae2eaddb27b639ae88d4e5f539e74d48fcd8f8bbe133e0ff001bdf59852b048e658b1fdc35c56e15f487ed73a344c34fd55061d5cc4e47f74f4af997cd3eb5f6184a9ed69a67c1e3a92a559c4ada8ca434e47fcf11fa9c548afb46c07eec7cd54d41b73841d49507f3cd0b21779000796d83df9c576cb63cfb1fb73f05eef1f07fc080ff00d002c001e9fe8e82bbc89c37435e6bf0e55f4cf017862cdf86b7d2ed6120762b0a8fe86bb5b5bb271cf5af1e4f566891ba0e6a443552298374cd594715016260734fdd50a30a7eea0097753d5b15087069fba8026dd4bbc7bd43cfb53b754d80943034b51a9c53f7520169dba99ba9682ae3b752d328e7da80b8fa28a280b14f7534b01516fa46626ac91ccd9ef4c69334cdf49ba801d934ddd46ea6d0031e8dd43734da008cb0148ce0d0e29878a004dd51d389c53375580c7350bb8a7bb0a85b9aa01af5039a99cd5773400c2f8af81bf6b9b05f87ff00b57f877c4a1765aeb50432ccff00ed8cc5267f0c1afbd9cd7c7dff000527d2ece4f865e1cd5d8edd42db51686265fbc51d32df93555af171ee694a7c95148f44b3d7d648930c0e4039fad50f18693ff094681259ac9e5bc87a838e2bc7fe0af8e7fe12cf04585cb4a1eea2411cc01e430eff004ad5f1078eb5cd36e42e9ba44da9b0196d9d07d6be4dd16a6e2cfd069d6f6904d1a3a7fc169e1823852711d9a9f9d79c63f1cd7a8787bc03e1ef0f18ee62b589ee23390df7b27d703bd7ce52eb3f1035895e492ee2b18dfef44d7046dfd2ade89e19f13cae853c58e92b7f05a0240fae4d6ca8b4b567beb2c9ba3ed1c8fa4757f12db33b4659197b1cd7312eb3e6e42be54f7ae26c7e17ea8186a17fe28bdb9957a42a02a55e9266d36368d8723a9ae492b3d19e3a5c8ed73cbff694d97be0cbc07931e1d7dabe3c7b808704d7d47f1db5df3bc357f11eac9815f235ddc156c938afaccad374b53e333569d6d0b72ce1ee01e7e520fe55ade0bd38eb5e2fd034e073f69bc8d083df2f8ae66190b13cf26bd2ff0067bb586f3e38f83a3988f246a3106cfb735eccf4478713f5e6c2e5638d51785555503d0018adfb3b9e9ed5c7594d9e86ba0b39bdebc2bbb9a9d65b5c0f7ad18a5ddd335cf5acd9e86b5eda61ef5406a21a76ea8109f5a9378f7a09255e2a4dd506f1ef4bba8027de3de94303516ea729c50049cfb52e4d37752d40126f1ef5266abd4993400fdd46ea6eea5a02c3b9f6a28a2828c8c9a326928ab2428a29375001ba8dd49485b1400b51eea76f1ef51d0035cd46cd9a73b8a8c9c50035cd40491e952bb8aad2922a805639a8b752f3ed4c240abbdc047355dcd4cce0d4127009208c7a8a7b815dc9af82ff00e0a53e2295b57f08680ae45b25bcb7f229eedbcaaff235f7a4d88d773908beadc0fcebf3b7fe0a31e4dd7c4cd05e2b88a7dba4007ca70db0f9cc4838fa8ae8a506ddd8ae8f03f82df149fc01aeb5acd284b0b86c3e4f435f65783f5c4d59fcd5236c8319073babf383502c65322f19e48033835ec1f02be3cbf86b50b7d3356988b6ff009673b1c81f5ae1c6605cd73d3dcf73038d515ece47dbb79e054d6087590c3bba818e6b4fc3de028b49eb26e27f8bbd739a37c47b1b9b64963b9468fb306eb57cfc44b7438120fcebe5e7cf17668fb485673828f36877b716d1c706ccfe55c178b9218a29198eda8a7f8910143999723d6bc5fe367c70d3fc3fa5cc9e7235c37dc881cb1aaa3465567648e1c4558518ddb3cafe3df8aa2ccb68922f23695cf26be74b9bf37527070bef52f897c4d75e24bf96eeea4cc921ce01e17e959308f31f8cfe35f7b85c3fb1a763e131588f6f53991d0580259493d2bd57f670b46d47e36784d1074bf0e48ec1464d794593ec1935eabfb3bf8b6d7c0bf12744d5eee113471336e53d7046063deb5a9aa691cc8fd52b19caf7ae92ca6cf7ae1340d62db58d3a1beb39d67b494656543915d758487d6bc17a4b535dcea6ce4f7ad9b6987bd73567356cdacb9e954173a08e506a70735990b9abc8d576249f7549500606a5de3dea007eea7eea8778f7a7eea00943834fdd5021a97754d82c3e9dba99ba96905876ea7eea8a9dba8289378f7a2a3dd450066e69030351efa5538ab207eea6eea3753375031fba98cd9a37547bc7bd003a9a5c0f5a5dd5139a0047a63b8a6bc950b499a0057618cd425d4e79c81d4f4fe75cd7c43f88da1fc32f0e3eb1af5e0b6b61c2228cc921f455ee6be50f1b7edd5ab5cf9d1785f47874f56fbb73767cc7ff00be7a7eb5dd470952b6b14672a9181f67cf710dac2669e68e0847fcb595c2afe66bcdfc4bfb45fc39f0cc863bbf135abc83f86dc997f51c57e7cf8e7e2df8bbe224c5b5ed76eaf223ff002eeae521ff00be462b8a675008550b9feef03f2af629e56bedb396589ec7dc9e28fdbdfc1fa7f991e8fa45feab2afdd77db1afe79af21f157edf7e2fd410a68da1e9da493ff2d58b4adf91af9aeee4071d7dc5665cdd0b789a47e140e6bd4a797d086e8c5d7933d035ff008fde3bf1b5d3a6a9afdec8ac32d1c526c41f80c579d78a6f67bd991e692495b6eddcec589e738c9f7a5d26da4481a6901f36639233d0557f112f9567e6b1202f5ad311460a9fb882336e49b386bf84db5cb1503cb7eb9ed54eeb4d8a442ea4211d97902b766863be840560e1fae0e3f9d73d287b491a291c283d320f3f4e2bc1bf43b5c95ee8d6f0ff00c49f10783885b6ba69adbfe784c7701f435d65bfed19a879789ac7e6f690d79b489bb3d1f1fdd22a949664fdd07fefa1fe35c93c3519bbb89d10c5d682b4647a36adfb416bb751347676d1db03fc4cc58d799ea9abde6af76d737d72f733375693bff854f0d8b9fbc02fd587f8d5c86ca3886649227fc735a428d3a7ac1194f1152a69266220ddd89fa55ab45c3f4ada1a2dbbfddb474ffb69491f87c6772b161ed5af3332ba092442a02739f4ab965a9793ab59794729032bca4ff0ad32db41495549b83163d6b4f4bd26d2ce09600c6492e0f96eedd48ed44759ab8b5b1f587c08f8d2ff000df524b2d46432f87af0a8604eef209eebed5f71e8d7915fdac3756b325cdb4c3314d11cabfd0ff8d7e5b59ab47616f0b105a25da5877f4af53f84df1dfc49f0be78e1b79fedda413fbcd3e76cae3fd93daba31797fb5f7e998d3adcaeccfd19b3901c00724f6c56d59c95e1bf0e7f698f0478e8c36afa8a68ba9b8d9f65be6d9b9bd98f1fad7b758b078c48a4321e8cac0afe7d2be7a74674be2477a9c5ec6e424d5d8db35990bf239c8f5ed5a10b8a919694e2a40735583669eaf8a8026a977542181a7839a0099053b75225250512eea7d460669fbaa6c17168a28a4026ef63453b6514ec06353b752537753b8587eea66ea4de3de9bbc7bd326c3b78f7a8c9c51baa3726801fbbde98e4d337d46f2d021aed589e2af14e9de0cf0f5eeb5aace2decad233239fe23ec3d49ad4792be70fdb9b5992d3e1569d631b144bfd4552503fbaab9c7e55d586a7ed6aa81136e316cf96fe38fc6dd4fe3478985f4cad65a65ab6db2b3273b17fbc7fdaaf3524b74a4326f5c7434a95f790a51a714a28f1a52949913e6aa125ab41973552688af4157615ca3703358537fc4d752310cfd9e06e7fda6ff0adcba611c6eedd1464d73b69ac5be831c69770ce0ca031955015e7df352c227499f97a0040c0c565eb308bf85e060769e9576cb55b2d49736b731cfecadcfe5436c663b86dfa8a4ed25604edb9e74b732417524136fdca700175fcfe94fb810dfc61656624746e323f5ad4f1c69be5b47a8c4a18c6bb250101257dbdeb0629d5d43296507bee51fd6be76bd274e6cef84b99142e2c25b566276184ff00116c7f4a83c95c7588fb6f3ffc4d6c3df384c2c79ff68cb9fd3155dd44a77796037fb2e7fc2b03432de0745c84c7d549fe6a29374b1af0d2e3fbc0ed1ffa155c58995be76083da31fd69ac014ce5147f79e419fc80145c82a13320cf99f8027fc297ce9b6e0313f8ff00866ada40643b94176f76db4cfb316190a187a918fe79a6010bb39cbe71e84d6d68721b8d52d220371dc18fd075ac986c37c9967216ba1f06d9c03c40e114b79309249e992715a518dea214df2c59e891380b8ab309acf46ab11cbb7ae6be9d23ceb935caa15f990381c807a67e9dabb9f87bf1c3c67f0e1e33a27882e62b74e96772de745f93570570c4c608e73dab32e2f7ec72a228df3b7223ef8f5acea528cf745a9c96ccfd07f849fb6fe89af4b05878cad468778df775088eeb76ff007c751f8035f4ee91acd8ebb64979a6de437b68fd2685c32d7e39452b448ab9e3b8ea0d7a27c2ff008d7e27f85da84773a1ea4f144bf7ad25f9e17ff809e95e1e232bbfbd4ceba589b7c47eaeab01ee719c5480e6bc4fe097ed39e1cf8beb1d8cbb748f10a8c1b391f2931ff61bbfe38af660fb073f87bd7cdd5a52a32b48f422d4b62d21a9578a8118549bc7bd645132c98f5a901cd4039a950d051329c53f6d45baa4de3de82ac3a8a40c0d2d4d8561dba8a6e68aa0b18b9349ba8dd4cdd536106ea6d14138aa010b0150bb50c49a89f3400ede3dea17cfad389c544ed405863366be66fdbc1631f0cf4190ca8b3ff6980a84f2df260903d335f4a4b324113c92b08e3452cccc70140ee6bf38bf69bf8c12fc57f1b4a61933a369c5a1b18d7f8c0fe323d6bd7cbe9b9d5524736266a30b1e41136e04f4c54c8c300fad53dd846c11d3352abe140f4afb3bb3c82667dbd698ae64a8e66e334cb77dfd299363375eca58385fbd27ca3eb4d7b356288e030540b923d3daa4d5c6fbfb58bf841dedf4a92672d9551f38ed52d0de873779e16b2bbb9f3a1536b71ff3d2dced1f957416764d6d0a46f21948eacc39a9eded042bcf26ac98f1e94d4096dc8ceb8b6492231ba86423041af29d66ce5f0feaaf1e36d9c8331b0406bd8644dfd2b9df10f87e3d6ac9e07241277237f74d736228fb55736849c4e12374950f985ffe032819fc81a6bdb2e3e4858fb383fd6b2adefee74fbc96cddbca9a162876e14123f0ad68c4975f3a179fdf692bf992057ce5b5b1da569e368490c123c7a2a2ff008d57334bd0bb81ece47f2c559919a366c30c9ed1018fcc607eb50942e32a323b9ec3f1e94580819e65e847e59fe79a50b704e5df69fef31cd41757be436d27737a2f355c4b2cea5a591208c7f08196a4e56dc762eb5db438df2024f454e49fc2bb9f86d119ad2faf08c9926f2f3ec07f8d7979bd1167c95c13d646e5cfe3dabd8bc07686cfc296473f3ba991bea7a576607dfa9733adf09bc9d7152d558e4cb9f6ab55f4479f221bc79dad5d6dc8131e9bce0543a5e962c8191dbcfba7ff00592b77f61e82ae6054cb814021f4f55db55cbe3be7e95615c374aa25bb1aba36b173a4ddc5736d34904f136e8a58db0c87d8d7e86fecb9fb45bfc5ed364d1f5b544f1369f1e5a51c7dae3f5c766afce088915d97c2ef88975f0c7c73a4f88ad198b59cca65881ff5b19fbca6bccc661156837d4e9a355c5ad4fd6a56c1c54809354ac6f60d4acad6f6da459adae6149a37539cab2ee15711c57c4b8d9d99eca77572c2135321aae8e2a74accd1244b4edd4da282ec48a714fdd516ea76f1ef4087e07ad151efa280b98db853375332697751626c3b7535e41ef51e4d0dcd1610ddd4d73416c544d93405c6c848a81989a965706a86a7a841a3e9d757d74e23b6b589a695ff00baaa324d5c55e5640f4573e7efdb0fe2effc217e168bc2ba64bb756d614f9cca7e68adc7539ec4f6af81ef6e4bb63381d000318f5aee3e2efc41bbf891e36d575eb91b45cc9886227fd5c4bf717dbdebceee9f0ca73d2bed70b47d853496e78756a7b495c5b76f326619e08c558049ef542ddff7ad8edd6ae2135df16663a693e5c77a6da64753514c4d1692eee9eb8ab020bbcb6a4cc7a2a6daafa6dfac5a94b6770db27dd988b7f18f41ef56b6996e666ec0e2a1d53478b52b50b929329dc8e3aa1f634752246c71eb8a63126b3347d4da745b5ba5d97c837143fc43d47ad69039e9c8f5ad822349c54522efe98a95c536a59773c7be2368e2dbc48d70c7cb59c070474dddf3542c3522a98ba7120f5c331fd723f4af679fc2d6fe29ba86de688c8d8c0c0e4719a6eabfb3fe8d63a2deeaefa85ddbc3696ef70c176b0cf61f30af98c545d3a9a6c77539732478c5cea292c9bb202fab727f2e05412dec51905f731efd89faf6fd2aa5a2cd78e624854b01924f415b96ba0471a1337cee7afa572dcbb19b04b3df9096d0aa31fe322a74f0d4855a5b89773633815b9a55ba456a85142e46723ad4f7efe55ac87d14e71ed49ea51e7d1dbbcb22a28e59828fad7d03a7c0b6b610c4a30a9185fc45790f862c56f6fec931cb4a09cfb57b167038e95ed602972a72386b4f5512bc27e76f7abd54a342a726ae839af511ced854bbaa3db43baa0258e003c9a6495eff00505b478131f34cdb15475fa9f6ad18c6ceb5c8e965f5dd726bc7ff005109db10aeb4b8519a51bb09932552ba9992ea1407ef649ab919cd6748e24d631fdc8ba7b9a72d8981fa91fb23f891fc47f007c34d2c9e6cd6224b066ce49f2dbe5ffc76bd951c57c99ff04fbf150bbf05f88fc3d2150d6776b76983ced73838afabd0d7c162e1c95648f7e8be6822746ab48d5495b153a135c2745cba2507d6943035551aa442682ae4f4514503176d14ea2826c73f49ba9bcfb515655c293752938a8f78f7a5726cc6bb8a66ea18e6985c0a91d885c9af12fdaefc5efe18f83d756504a127d6a64d3c92707cbeae47e15edac096db8c1af843f6cff8903c4fe3b8341b59565b4d151964d872a2773f37e42bd3c052f6b597639f13554207ce77adbba563dda67bd6b49cf5e6b32e50f3ed5f69ca781129db4adf6d917b6037e75a519cd65c036ceac7fb814fe15a509a5135126e955aca4da483d9aa79d80aab6dff001f457b139aa02f59ae63dc472e7352900532cdcf911fb55968f3e95b452329191ac6986f634911bcaba88ef8a55eaadfd47b54ba46a0da8c0c645f2a6405258fd0f63f435a7b015c1ac6d4ed5ad275bd88371849917f897fc476a766b612668970fd29a78a6c524520428dbd5c65597a1f6a958034ac5731b9f0f7578748f1c6817770aaf6eb791a4cadd0c6cd86cd7adfedb1e11b1f0868fa3e91a48314baf333cb1838510467193f5ed5f3fcb07c87e62a4f71d460e47eb5d17c7af8b1ff000b3b53d2af0cb2799a7e8565a76d23fe5a85cccc3d89e87bfb57938f8ab731d546573c12cb4d5b0f30ab1dce79fa56863e53ef4d61938a79e14fb0cd788768cb01b6d6353d40c545ab13f62b83e88c6a6b1f9edd187423350eafc595c2f731b53024f86f67e75fc529c6d8a12c7ea7a57a51002e2b82f85f0b182e64ed80a3f0aee9f35f49858da9a3c8aaf9a6467838a9622586455528ecd918ab517eed39fd2ba47a1212476ac5f135eb476c6d613fbe97e4c0ec2b46eef05b465d812a3d2b36cb4d96e275bcb91891ce769ed50eec149234b48d3d34eb68e18fa28e4fa9ad161b97150c7f275a9b756e9591837764314ef083bf900678accb4b9125ddfdde78dc156b4ae7096f267a85e6b9db41e4d92c23ef3bee39ae79bb1b451f5efec13e2ab7d2be2b5dd8dc4e22fed6b168e1563856981c81f5afd075caf5e39c0f7afc77f09eab77a1ea3697f653b5bdddb48258655e0a30ef5fab1f0abc790fc48f87fa4788954432dcc004a80e76ca0e1b15f2998d169fb547ab8692b729db8e6a5426ab46d9a9d1c578af53b6c4ebc54a86a10735320a928b19a2a3c9a9282c76ea29b450073dba9734cdd499355722e23bd46580a737351b73526b70dd51b734bba9bdf0393e829d83ccf02fda9be3effc2abd0c691a4ccabafdea16693a9813fbdec6bf3af57f1a35c5c3cd323ef762ecedcb331ea49ef5eadfb45788a5f127c6af185d5c3f9c22d464b58fd0471b6dc0f6cd7985ddac12ae4a2b7d457db60f0feca926b767ced7a9cf26994ed75b86eb6ed90609c64d4d3b07562bc835c7dfe8b224acf6ac513390b9ab1a1eaf2a335adc9c4ebf91aece66b4663148d556c4db3bd69c07358be67fa58ec0d6adb138cd544b16e5c555b7c8bb43eb525ce6990733c6dd85585cb960dbc851d8679abbe67d6a85a7cb78c01e36d5b1c9c56d039db6f62c5413fcdd79cf5153d3644dfd2b5030e27fecbbc78c854b597ee9ed1b7b7b56b9f940cf1cfe5552fad96e2364750411d3deb2a0d65ec1d6cef4ed27e58e76fbafed9f5a8036e560462b8ef15c7e55cc1265b127cbc1c720ff008574ad29c804119e99ef597e25b7fb4690f201f3c443fe1deb9b154d4e9b36a52b491c79387a476fddb9f45a76e57604743dea2b83fb9971fdd35f2d63d525d3b8b284faad41ac38fb3cc3d51853f4f6dd6107fbb5575724c327b823f3a101d67c338445e1e5908e5c93c7b5750dcd73df0f30be18873d8915d0d7d5d156a48f1e7ac9b1aab8a9b6fcb8a66da7ee010b1e00abb3033af879fa85b5a8e570647f65f4fad6aed2793c91d2b33465371717378dc894e23f5da3a1c76cd6c100119e33edcfe556910d8dd94118a7e0fa1f6c8c6698e6ad9067eb9279761310792028fc6b3b4a8fed33873f854de2890a59c080fcd238007d28b365b389707915c35773a21b1d0dbe63c638c57de7fb0af8924bdf87babe9b290c9657ea533d84839fd6bf3c13559656c2f1f5afac3f620f8ada378635dd53c37ac5e2d9dc6ae636b2dfc23ba755cfad7998d8b9d2b2474d17c93d4fd00825535610d64c1295ebd700e3d78cd6a46c0d7c8dac7b572da5585e2abc7cd4e0e6a06ac3ea5cd57e7daa4c9a0a24a29bbc7bd1401ce526ea5a6504d90533753b754741430f15c2fc5ef8a9a6fc27f0bcba9dd3a3dfc8a56ced49f9e590f7c7a0ee6bacf106b767e1bd12f756d425105959c46695cf651fe3dabf2fbe357c65d47e2a78befb599cb241cc5656f9e208bd31ea7bd7a982c3fb59a9cb6472e22afb356472dad6a326a97d75773b86b9b891e691b3d598e4d67888b9eb91ed5cd5d6a174096ec7deabc3e259ede5f9cf15f6119a8ab1f3ed36ddcdd369f66b9657ced7fba7b0ae735f8144e24886d953f8877ada875b8efa3f29d471d0e6b075bbab5599e05b9437047099e69c9c5eb708a65bb3b85bb54933c1addb57053bd709e19d489bc92cdc60a82c01ef8f4aedac5c3a1c76f5a9a6ee6af4dc75d1c0cd32d3e675c53ae98321c76a86c1be75ae8b233bb346d917ed6c7fd9ab087e6cd55198ee18e472b522be3bd6a848ba181a5aac928a9d5c374ab111cb1e6b2b56d263d46dda3940627d7f9fb1ad9619ee2a1940353663472fa2ea125a5eae9b7a4b061fb899bae7d0fbd74935bc5344f1b8f95976907b7bd61ebda38bd8be525241cab8eaa7d6a5f0eea726a1135bddfc9776e76483b30f5a8ef163bad1a3cfe08e48d9e171cc4e636fa838a598fee243fecb568f88a0169e23bc51909232be3ea3fc6b3af148b5988ec84fe75f2b563c9368f5a0f9a298591c58438ecb55353919e2603af181566c5b758c43047cbde9da75a0bfd5ace06190640587b54d28f3494424ed1677ba1588d2b44b5871f304f9b1eb57f750cd8181f740c0a6d7d42568a48f2ae4d4d6b6b8bf9a0b2b48da7bab99045144832ccc4e1401efcfe468670a1893802bd73f664d22d9758d4fc5d72924f2e9889169aa89b8f9f3071e60070372462665071f36de99c852934b42e2aecd88fe12f847e1fc57163e25b8b9d6b5cb6b6f366d32d65305bc6c10b889594333b601e318cf7ab5a3fc3cf0278ead606b0d2f5ad024b8f30831cc668e208bb8961281918f7afb07e057c2d87c3bf09bc45f11b58d261d635b7b69ef6c22b84de04691b842323f8bf3aec3c43e38d02c3f677f06f8c751d2ecefecf5336115e471c4aa5d6e0ac4ea081d7737e86b9e78ea30fddc60e4ef6bdfa9d3ec252573f323c6ff000f26f09a41a8d95f43aef876e9f6c1a9d9a9085bfb9229e51bd3b1ec4d71d24814f3e99fd338afbb7f68bf8336bf04aeee6fb74537c3fd461686e6c5c1dcf10e9082a0e1d3fe59376af89bc63e19b8f08788efb49967fb4a5ab7eeae90605cc45774727e238fad75c6ac674d4d3d0e29c1c773cffc4b7cbfdb11c6c711c111207fb46aba5dbdd30da4906a96ac05febf7259b0aa42fe55a09abe97a6c6333c6587500e6bcf6ef27a9aa5ca5d8d8c6bc821bd2ae684f3ea3afd85cc6485b07332ca9c36f3dc1ac88a51aa665320b4b61d1cf56fa5765a7a45a7da2a5b6047fdeef56a2acd48d2faa3f5a7e1edfcba9782742bb9dfcd9a6b285d9fd495e6baf824cd788fecb5e2bff84abe08f872e3ccdf25ac7259499ea190ff00857b4db482be1eb7bb51a3da87bd14cd5849a9933504041ab09581a587d48066a3a910d0509453f8f7a28039bdd4da09c526ea0761a5b14cdd4adcd348233ec326816c7cc3fb7ef8e2e747f863a57866d18a4baf5d6272a704411fde15f9f93432d9b1de4902bebbfdb875a8f57f893a569a9209174bd3887c1fbaf23648fae2be63d42d3cf8c860031afb4c0e1f968a7dcf9fc4d5e6998d108274ea0d54d43c3b6f2c7b97ad433699756373988164f415a76ed27923cde09ec6bd35156d4e4b9c55cc13e987703c7b562dce9897ae6eade529760eedc7d6bd2eeec21b943bc0e3bd705e2b9ec3485296ec3ce3d90e6b92a4544de2f52b787249a6d6e37986d78e36dc40e4d77fa6b7ca47ad7997853507bcf11465890591857a3e9c76b6dcf35741df60a88b937dd23d6aad837ce3d8ed3534ed8aa7624876ff007f35d86669c9362e00f518a78981f5aa57afb5d0fa9c522486a883415c8ef562193deb27ce3eb5345311deaae06c6fa464cf422b2a7d592dd773938f6ab96b7693206ddc1ad5493026921122e2b9bd5eda4d26f61d46201b61c48a3f8c5746afbba5477102dc21561953d8d26aeee4238ef1d08a56d2f5087eecf1ba6eec703207d6b9dbc900b4987aa62b73c4f6ad6fe1cbd8f395b49e3b8881fe105b040ae61e7135bbf38c8c735f358d8daa1eae1e57812acbe55aa28ea179addf01c2b3df5ddd3f2625017ea6b989a6091727b638aed7c056660d0d6670434ee5bdf6f6a78487354b8abcad0b1d233034138a6b0d9d6abcf2f968589f941c71dfe95ef1e713645d4de48ce17ef57d05f027c4d61e13f026ada85e0b48e2935b82012debed8a366b4b800ee08e0b0072070383cd7cfd6519b4888620cadf79857b27c1bbeb3b9f0678d6daeec93546d2160f1125948892f991c3e641380ae082522b82df453e949c62eca46907a9fa37e37f890fe06f877e19d0acadda78d34d865d41d93114f6a6060ea8dfdf2c47a62be558be27dbbf82346f05dccaf75e17d32fd75a88c6159a2b42aa635c6724abb48703baf19afa93c113cdf1ff00f63a8638a55d1b51bfd0decfed12c24fd9dd57686c633efeb8ed5f3deabfb1b6a7a5fc18b5974ad4b4ad43c626e8ab411c9e4db8b5d8ab142add7313a99327a9761d2bf3cad5fea55ea53a93b3be87d5e1e7174d7bb73de7e2d78dedbe257ecffe2e7b8d35e0bbb1937595abc8cb24c8ae3c9978c63766bf35fe3a5ec7178874f645640ba5428a8e30ca8af26c0dee176d7e817ed4ba7e89f0eff672d3f4ebfb8b4f0deabab7d874ebcd474f011811879f61eb80509ce3a57e677c6cbf960f10dd5b5c4a649749d3edaca573d5de2b701bf12f9cd7d2e59cf1c1295477bb3c6c54a2ea3e447835c3ddea3a8cfe548d8790e3676cfad68470597878ab9517f7edf7771caa7f8d51835686cad88823c4ce396f7ad7d074a12badd5c292e7ee835d508f33d0e4949adcd7d034ebdd52533dfca427f0c60600fc2bbed2620d6e22dd9c7ad61493ae996bbd8fcde959b6fe324b495d97257d85745a3176667ab3eeefd803c4935b378b7c29752155468b51b6463d4138702bed1b66afcc5fd947e2fe9fe1ff008aba35e5fcc2de19f75a4b237030e38cfd0d7e9bdbb00579041190474af92cc29a855ba3d7c2c9b858dab626aea1acdb66ab884d798769641cd3d78a8d2a4a007d1451401cc3734ddd49934ddd415702715cef8f7c6763f0fbc17abf88af5b105840d204ea647ce15467b9ae81981af96bf6faf18be99e03d0fc3f1b63fb46e7ed3281dc44381f9d74e1a1ed2ac5331ad2e58367c5be39f89171ac6bba8eafa80927babe95a591ba807f840f6ae73fe130b2b82416191564ca974acbb42b8fe02339ae7351d16caf9982a0b794f61c57ddddc55a3d0f9bf89b6cd1b8f17d9c6a76f24773585a8f8e96de36750598fdd18ae7b51d0f50b27608be6a1fceb05da412299a36047b1ac25524528a34356f146a5aa121643121fee1ac43693cd26e0accdfde3cd685bbcb2ffaab767ff809adab7b4d42381da58bc98d7ae4722b0943995d9b2959d9193e15b77b6d7a02cbd98715e896329130f7af3fd02e0cfe2383e6e32c3f1c66bbc84ed9548ae9a0acb433ab7b9a771c8cd518490af8ea0e6aec8729546d4e27915ba1aedea66b624bc2cf0230ec72735321a49d02a63b7b5363704669dc8119f675a4498fad36740a33d6aba4c338e6b3b9a5911ea921922208e951e97ab14654738c55f9edd64b73c726b98be8cc072720fb54bbc58591dc596a28c71baae4175be5fbc08af3db2bc757e5cd68c3a94b13655aad551f29a7e38448fc33a9371968f9fc1b8af30fb479b619ce0e715d978a7596b9f0e5ec4f8dccbb47a75cd7011b84b20a7392735e2e365cf511d74572c4d08d0dd5d242bf79ce0035ec36f1c76d0450a8c220c62bccfc0d69f6cd67cf61948071f5af4599d86719e2bb7090e58f31cf59de49227972d9f41542df1752f9ae71047c22fa9a8353d4cc30ac51b0f3a43803d3eb509b8291c7147caa8eddcd77dd18f2335cce1ba1ae93e1c78e5fe1e78d74dd68422eeda36786f6d1beedc5b4a8d14f11f50c8c4fd40ae3e0461d6a703775a64a6d33ef1d0be22cde12866d2aefc4b7ff00f087f882486eac6f6d86d30fdc1015d98cab00de60ea38e0d7a3ea9a9ebabe1d818f8af4192dc27fc8453508247d98279c925b38393b6be14f877f151345d2d7c2fe278ae750f09c8fbd4da3ecbbd39ffbf6ec7f552403ed5ed10789fe12e8778dadc5e386ba982a32db41a0ca2e0050c3685660833919e6bc6cc329c063daab5d7bebf1368caa26f92564ceb7e3478eecfe20784e26f1b2a6b3a278512296322e7cb96e255e55597183e687550413c6738af837e2d78a2f7c4b0eb9aeea455b50d5eeccb214180acc7240f6db5e9bf14fe22c1e2d834ff0ef876da7d37c25a6ed4b682e5f7cf3e001e64cdddb8181c81eb5e2bf15a610699a75b03f3348d2b0f60302b494550c3f24748a368eb24ae711a4da2dc4ca1dd547fb4715e931b47a5c0b24a549fe05ef5e596d1b4d28249503b8aeaac63bad5a48a205a458fa39a8c3cdb45545a9affe93ae5d88c93b4fa57496ba159d84004a03b77c8a9b4cb24d3600a89971fc5dea68ade7b99f74c8163f426bbd53eacc64fb105ae8015fcd8898c6ede31c107b57eb17ecdfe27bbf15fc11f09ea3a81df78d686291dbab946dbbbf135f97b0b100f1803d6bf553e11787a1f09fc33f0c691061920b1858b7a961b8d7859b28c608eec25f99a3d1ad9c55f4ac9b56dd5ab19cd7ca9eab2c21a947350a54aad8ab024a293751401cad309c53b7531e801b9e715f18ff00c1426c259f57f05b283f3dbce573d09afa8fe2bfc44b0f853f0f757f13dfa8921b14dd1c29c798ec70a057e53fc5afda0bc6ff00187c4f2dfea0a5e152c2ded907c9083e86bd7c0526ea7b45b1c5899a50b15eeac23b448d8ca37af71deab5d4306a40171c9fe21c1ae46faf7568c06bc9edadd4f67979fd0566bf8bee6cd8296b6954768e5c9fd6bea554b743c78c4e87548e1b0ff597db1bbab9e45641d4aca693e6bf85bea95857d2693ab4af7125eccb2b755da4d668d096fc37d86e1ae0af7642b9fa54caa37b22945753ac6f1269b63d6e837fb82b9ef1278d9f50b6fb2dac7e543dd98fccdf5ae7eeb4dbab5389e175faad363d367980c44f83c8c8ebe9f9d70d6ad524ad6b1d308413b9defc2af0349e20b0f137885d8adb68568b3291d1a676da07f8d6db920861d057a3fc2bf875ac783bf678f885a8ead6d258ff00695b0f26da51862a983bb1f522bcd0b6f5c0abcbe6e6a570c4452b1b2e408c1f5aa319d970c4d4e92ee814f26aa970263c1e6bd8390bec772f350c4d8523d2a40c0a03eb50a1fbdef458cacc5670c95464f95b22ade78c55299c6715069135ad99658b1597ac5902338a9ec66c00bdcd4f724ba723354d7312b7387959e17e2ac5ade876da49cfbd4fa95a156c81c5636d292e4715ccd5b7352debec1b48b8009c919ae4f78fb3afae718ae83509b769b32b6492b599e1ed37fb4b53821232a3e66f4af3ab479aa248de9bf719dff8334c365a744d8019c64e7ad74571751db4723cac1540cfd6a189442808180a31c76ae53c4bab3ea3742d23ff0054a77647ad7b11b42091caf57764b0c8d7b74f381b998e47a0ae874fb211265f04d54d16c05a42a4804d6a160ab814e11eac972066cf4a7a11e86a2a99315ad88b93c796eb4a4ed18501474e3d3f1a48b835232e7a52e55d495e436d221bd988e3b57977c54b933788d62073e540063b66bd609f222dc7000ce7db15e49f147c3f7ba0f8e750b5d42368662639630c3868d977023f0af371cd28282ea75e1f57730349f2bed1b6693627a9aec2d3c49a6e930ec89b1f4eb5c7dbe9324e300923deb56c7c3f6c9869e5724f60b9ae6a3ed2292b1bcf9773a687e225b2c997560b5a10fc46d35ce3639fa8ac7b5d0ece34671641a35192f2f02aedbde68b6cbfbc9e1cfb2577a7523b9c8dc5ec76fa66b167ae40c2da505cff00091835fa4bfb287c4a6f885f0aeca0bb70756d180b0b853d4aa8f91ff2afca91e27d3ad25cdb6d5ff69462bed0fd813e23d8def8b757b079d21b9beb41b6327024914f007be2bcbcc22aad3d7a1db86938c8fbf2cdc569c049ac6b5253a9ad4b692be40f64d04352544952d500edd45368a00e5e91e9db691c505d8f1dfdab7c1ba878e3e0a6a767a65bb5d4f6d3c5786d9065a445396007735f9acf791cd0c91ac62d645383c630738afd8954d84f248e5467b83eb5f99bfb5ef81ec7c11f19759874c4f22dafd12fcc2a3023671caafb66be832bab66e99e56329e9cf73c0eeedac1885b892ddc0ffa67bab3af2c742906c317cffde11a8abb0e962e0e58607a9ab634fb6df8861f3bfda23815f46937b9e37335b1cd7fc23226563a6cf0ab7a3438feb59f7fa6788e08c0132baaff00cf31b4ff002adfd475e6b326deca1fb45c9ecabc7e75cfbb78864273228cff000eee694a09ec6d19773224d4f59b06cce8d20f574cd75bf09be2adaf833c7ba76a7aae8b06a76c8e13c861808c4e0360f5c7a5645adeea3f698e2bc0244ee48af43f867f042efe2a6bf15fc1736b6ba5e957117dad2404c8e09ce5463047d48af37151f6349c9bd0eaa2d4a6958fa5ff00695d6becbf0b75308c7174d15b8edc3329231d8601af906324d7d11fb586a6d1f86f47b342713de9623fd955c7f3af9d2106b3cad2f65cddcac4bf7ec6ada3036fcf3b7ad46f8f3735069d21df2a1f4cd4ce0efe95ef5ce3268df30afd7148869b11c4722f7ce4539055dc571036e27daa95c82ad9356df894b0fba7a545791f19a890222b36f9c7b56d05474ae7639763d6cd94dbd704f3445933d3628ea90fb0ae46ee3d8c4f1c577b7706f19c5725aa5b282c07159cd21c5dd1897447d924041e98adff00879a585b27b82a3cc76c0cf5c573e2da5bc9e2817255ce2bb03743c3f64641f280b88d47563ebf4aca34d39733e83e66972a2c6bfaafd851a053fbe6fbcbe958ba45833319186e63eb59fbe6bdb8695f2f23f526badd2612a9c802ad5e4ec56c8bf08db1851d4523939c52c8c14e0536360efcd749cc4a580507d6a68ceeec6abb10d205072055c071d2ac07a9c54f07cd54c12c7157e0c28c922828d6f0ee8e7c49e28d2f49eab7973142ff00ee96c9fd2be80fda47e0cd8fc48f879a9dcd9d921f10e9b17da2ce641f3304e7ca3ea0af4f7af29fd9f618afbe2ce9fbc64c304f2a03fde51806bea3f1778bb4af017862f75fd5a758ac6d519c927991b18080773ed5f1d9ad697b78c63d0f5b0704e9b6cfc9d8aeee6d89552c1c1c1520820fa5745a35eeb0086c23a8ff009eab8a93c63e2f8fc5be35d635cb7b18b4f8af6e5a68eda35c2c6bd8551fed4bb9d4247f29aefc3dd4539331a8efa1dcdaf882de585a3bb8847b86d68c55e8749d1efc0db1c0735e7f6fa15c5cb179ef44449ce73935acbe1f922657b1d5639a61fc0e401fa57a6a6d9caa0a276e9e1bd35860dbc6a3daa4f0d5d6a7f0afc5fa5f897492c86c6e52e136f438fbc0d714b3788f4f1f346b3ffb8f9ad4d2bc55acc4563b9d3656864ea0aee51f8f6acea284934d14b9a2d58fdb0f0deb56be25d134ed56c24f36cafedd2e6172319461919f7f5adeb692be68fd893e28dbf8d7e1641a09575bbd057c80b21cfee49f90fe55f4a5b57c3d7a7ecea389f434df341335639335681cd5180e6ad266b22ec494526ea280b1cd6ea46e6928a0a0af80ff006ecd398fc62b69768093e9b16d27bed3835f7e57c37fb794ca9f10b452e3022d3802477cb57af95e95ce1c5eb4d9f2acf651c47e73bffd9e82a1b8f2e4b6689484ddd48e2abcd74d7136e27e5a3ca339c62becee8f9d2bc7a625b1c4688a3d7bfe755af3475ba8f218249fde02ad0d327ef313f8d2b5aca8879271e95a59137313fb3de170b72bbb1fc63915d8fc16f8b70fc39f884fa74e17fb2754458ae1f3c46dd8fd2b9d903464b48fe5c7d81e735cc6b775a759ea4256895a76e39ebc7a8ae0c5d255a0e2ceba126a499eebfb586a606b1e1bb58dc3a98649c11d0824807f435e2965396eb5a3e3cf144be2883c297333b34b1e8a9112ddf13c8a0fe38ac8d3e404e2b9f0b4bd951491ad67cd36cd3b69156e108046460d5891cab8f738aa2cc12456ec2aecc32ca411d735e8ad8cc727561eb4e4714d3f7b2284eb8ab3262b8e14fa52ca81d2919b2949113b7069315d993382af576da561d0d4172bf3671490c823ea6b37a334b5f73a04944ab8fe75cc6b916c6908ed5a715d7a1acfd5d83a83ebd6ada4d6a42d0c6d0234b7966ba95f10c4b9c9ec69b737736b9722e640442a36c718ec29eda74ba8b791fea6ca25f3266cf04fa558b3b3fb548b1c60a45fad61adec8d34b5cbfa2d986dacea315d01558970a39aaf15b88a250bc62a0b8bc2a719cfd2ba12b1926d934d265f8e695dc450927a8a642a400efd0fe74e8603a84fe5affaa1d4d58ae4ba546648cdc3f119e84d5f0734cb831a858e30444bd16950d5903907cd9a91dc05c0cd460eceb4e452ca58f4150ca3d07f66d94bfc6eb3841fb9a6dcbb5697fc141353d4174af08d8c4aff00d972cd34d33afdc7987f01ae7bf652b84bdf8faecad9516170a077e2a8fed99e3b97c57f14e2f0c5bce24d3b4345578d471e7b0cb9fad7c8e229fb7c658f6693f6742e7ce1a5e917f7a034709da7f88f4ad45f08ea5e6a65b67d0d7556f24d636e3c850c80e302afdaeb56ecabe6fcac3d6bdda5848a8a4d9e73acdb39bb6f01492b7cf72e47d6a63a0dae944ab5edc607645cfeb8aee2da585c8d8c0e7d2ad246be712100cf4c8cd7546925f098ca72397d37c45616ea62916e2403f8e45c55cb18648f51fb50ccf116ca5c42e41c7fb63a1fcaba196ca1b852b246af9f602b3ec34f7d02edfcb3e65a3f584f6aca6997195cfbebf60bf0ec10782f5cf11a811cf7b71f63da071b13afe35f575b357cf1fb17da2db7c1785d7849afe6907d338afa0ed6415f0b8b77aeee7d151fe1a35ed8d5c43546d8d5d4ac0dc936d14b4502b9cbd145140c2be15ff828201ff09ae83c75d3f9ff00bea8a2bd6caffde11c589fe1b3e441c54b68c771e4d1457d944f9c34e3eb51c9f71a8a2ba3a10733a831371264938e99ed5e62ec65d5a62e4b9f5639a28af3b13b1dd44ec359005a78700000fec5b7e9f57a8b4d3f3d145451fe1a0a9f133426ab609f968a2bb2022d50bf7e8a2acc87ff00053128a2802b5c0e6b2e43c51456523525849cf5a2f799173cd14568b6225d0b5a8284f07c3b405deff363f8beb53e8aa3e5e0514564fe2097c25d73f2565af2fcf34515a931342e3eead5fb10174eca8c1f6a28ab3390c6e64a9128a2ac448f524bc5ab51454cb61f53a2fd8b067e3d367fe81f735e59e2f769be31f8ade462ecdab5ce598e49e68a2be663fef87ad2fe0224b227eccdcff1545a84481fee2fe54515f4503c724d0ddbcf5e4fe75d91242af345155129ec5c829d2807a8a28ac6a9503f43bf63dff920da4ffd7c5c7fe855eed6d4515f9fe2bf8d23ea287f0d1b16d57928a2b189a93d14514107ffd9, NULL, NULL, 1, '2025-12-03 07:41:52', '2025-12-03 07:45:49');

-- --------------------------------------------------------

--
-- Table structure for table `user_answers`
--

CREATE TABLE `user_answers` (
  `id` int(11) NOT NULL,
  `hasil_id` int(11) DEFAULT NULL COMMENT 'Reference to hasil_quiz for peserta results',
  `soal_id` int(11) NOT NULL,
  `jawaban` text NOT NULL,
  `is_correct` tinyint(1) DEFAULT NULL,
  `points_earned` decimal(5,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `user_answers`
--

INSERT INTO `user_answers` (`id`, `hasil_id`, `soal_id`, `jawaban`, `is_correct`, `points_earned`, `created_at`) VALUES
(1, 1, 3, 'trakea', 1, 0.00, '2025-12-03 08:03:08'),
(2, 1, 4, 'Insang', 1, 0.00, '2025-12-03 08:03:08'),
(3, 2, 5, 'EMPAT SISI', 1, 0.00, '2025-12-03 09:01:23'),
(4, 2, 6, '14 rusuk', 0, 0.00, '2025-12-03 09:01:23'),
(5, 3, 5, 'EMPAT', 1, 0.00, '2025-12-04 07:39:59'),
(6, 3, 6, '12 rusuk', 1, 0.00, '2025-12-04 07:39:59'),
(7, 4, 3, 'trakea', 1, 0.00, '2025-12-22 08:52:23'),
(8, 4, 4, 'INSANG', 1, 0.00, '2025-12-22 08:52:23');

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_active_quizzes`
-- (See below for the actual view)
--
CREATE TABLE `v_active_quizzes` (
`quiz_id` int(11)
,`judul` varchar(255)
,`deskripsi` text
,`tanggal_mulai` datetime
,`tanggal_selesai` datetime
,`pin_code` char(6)
,`kumpulan_soal_judul` varchar(255)
,`kategori` varchar(100)
,`pembuat` varchar(255)
,`durasi` int(11)
,`jumlah_soal` int(11)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_admin_quiz_activity`
-- (See below for the actual view)
--
CREATE TABLE `v_admin_quiz_activity` (
`kumpulan_soal_id` int(11)
,`kumpulan_soal_judul` varchar(255)
,`pin_code` char(6)
,`nama_kategori` varchar(100)
,`created_by_name` varchar(255)
,`created_by_id` int(11)
,`jumlah_soal` int(11)
,`total_peserta` bigint(21)
,`rata_rata_skor` decimal(13,2)
,`skor_tertinggi` int(11)
,`skor_terendah` int(11)
,`created_at` timestamp
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_admin_system_overview`
-- (See below for the actual view)
--
CREATE TABLE `v_admin_system_overview` (
`total_admin` bigint(21)
,`total_kreator` bigint(21)
,`total_kategori` bigint(21)
,`total_materi` bigint(21)
,`total_kumpulan_soal` bigint(21)
,`total_soal` bigint(21)
,`total_quiz_sessions` bigint(21)
,`total_quiz_completed` bigint(21)
,`total_unique_peserta` bigint(21)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_admin_user_activity`
-- (See below for the actual view)
--
CREATE TABLE `v_admin_user_activity` (
`id` int(11)
,`nama` varchar(255)
,`email` varchar(255)
,`role` enum('admin','kreator')
,`is_verified` tinyint(1)
,`created_at` timestamp
,`total_kumpulan_soal_created` bigint(21)
,`total_soal_created` bigint(21)
,`total_kategori_created` bigint(21)
,`total_materi_created` bigint(21)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_kreator_kumpulan_soal`
-- (See below for the actual view)
--
CREATE TABLE `v_kreator_kumpulan_soal` (
`kumpulan_soal_id` int(11)
,`judul` varchar(255)
,`pin_code` char(6)
,`jumlah_soal` int(11)
,`waktu_per_soal` int(11)
,`waktu_keseluruhan` int(11)
,`tipe_waktu` enum('per_soal','keseluruhan')
,`nama_kategori` varchar(100)
,`materi_judul` varchar(255)
,`created_by_name` varchar(255)
,`created_by` int(11)
,`created_at` timestamp
,`updated_at` timestamp
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_leaderboard`
-- (See below for the actual view)
--
CREATE TABLE `v_leaderboard` (
`hasil_id` int(11)
,`nama_peserta` varchar(255)
,`skor` int(11)
,`jawaban_benar` int(11)
,`total_soal` int(11)
,`waktu_pengerjaan` int(11)
,`completed_at` datetime
,`kategori` varchar(100)
,`materi` varchar(255)
,`kumpulan_soal_judul` varchar(255)
);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `hasil_quiz`
--
ALTER TABLE `hasil_quiz`
  ADD PRIMARY KEY (`hasil_id`),
  ADD KEY `idx_session` (`session_id`),
  ADD KEY `idx_kumpulan` (`kumpulan_soal_id`),
  ADD KEY `idx_completed` (`completed_at`,`skor`);

--
-- Indexes for table `kategori`
--
ALTER TABLE `kategori`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nama_kategori` (`nama_kategori`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_nama` (`nama_kategori`);

--
-- Indexes for table `kumpulan_soal`
--
ALTER TABLE `kumpulan_soal`
  ADD PRIMARY KEY (`kumpulan_soal_id`),
  ADD UNIQUE KEY `pin_code` (`pin_code`),
  ADD KEY `materi_id` (`materi_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `updated_by` (`updated_by`),
  ADD KEY `idx_kategori` (`kategori_id`),
  ADD KEY `idx_pin` (`pin_code`);

--
-- Indexes for table `materi`
--
ALTER TABLE `materi`
  ADD PRIMARY KEY (`materi_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_kategori` (`kategori_id`);

--
-- Indexes for table `quiz`
--
ALTER TABLE `quiz`
  ADD PRIMARY KEY (`quiz_id`),
  ADD UNIQUE KEY `pin_code` (`pin_code`),
  ADD KEY `kumpulan_soal_id` (`kumpulan_soal_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_pin` (`pin_code`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_tanggal` (`tanggal_mulai`,`tanggal_selesai`);

--
-- Indexes for table `quiz_session`
--
ALTER TABLE `quiz_session`
  ADD PRIMARY KEY (`session_id`),
  ADD UNIQUE KEY `unique_session` (`nama_peserta`,`kumpulan_soal_id`,`pin_code`),
  ADD KEY `kumpulan_soal_id` (`kumpulan_soal_id`),
  ADD KEY `idx_active` (`is_active`),
  ADD KEY `idx_peserta` (`nama_peserta`,`kumpulan_soal_id`),
  ADD KEY `idx_email` (`email_peserta`);

--
-- Indexes for table `soal`
--
ALTER TABLE `soal`
  ADD PRIMARY KEY (`soal_id`),
  ADD KEY `idx_kumpulan` (`kumpulan_soal_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`),
  ADD KEY `idx_is_verified` (`is_verified`);

--
-- Indexes for table `user_answers`
--
ALTER TABLE `user_answers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `soal_id` (`soal_id`),
  ADD KEY `idx_hasil` (`hasil_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `hasil_quiz`
--
ALTER TABLE `hasil_quiz`
  MODIFY `hasil_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `kategori`
--
ALTER TABLE `kategori`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `kumpulan_soal`
--
ALTER TABLE `kumpulan_soal`
  MODIFY `kumpulan_soal_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `materi`
--
ALTER TABLE `materi`
  MODIFY `materi_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `quiz`
--
ALTER TABLE `quiz`
  MODIFY `quiz_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `quiz_session`
--
ALTER TABLE `quiz_session`
  MODIFY `session_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `soal`
--
ALTER TABLE `soal`
  MODIFY `soal_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `user_answers`
--
ALTER TABLE `user_answers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

-- --------------------------------------------------------

--
-- Structure for view `v_active_quizzes`
--
DROP TABLE IF EXISTS `v_active_quizzes`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_active_quizzes`  AS SELECT `q`.`quiz_id` AS `quiz_id`, `q`.`judul` AS `judul`, `q`.`deskripsi` AS `deskripsi`, `q`.`tanggal_mulai` AS `tanggal_mulai`, `q`.`tanggal_selesai` AS `tanggal_selesai`, `q`.`pin_code` AS `pin_code`, coalesce(`ks`.`judul`,'Tanpa Judul') AS `kumpulan_soal_judul`, `k`.`nama_kategori` AS `kategori`, coalesce(`u`.`nama`,'Unknown') AS `pembuat`, `q`.`durasi` AS `durasi`, `ks`.`jumlah_soal` AS `jumlah_soal` FROM (((`quiz` `q` join `kumpulan_soal` `ks` on((`q`.`kumpulan_soal_id` = `ks`.`kumpulan_soal_id`))) join `kategori` `k` on((`ks`.`kategori_id` = `k`.`id`))) left join `users` `u` on((`q`.`created_by` = `u`.`id`))) WHERE ((`q`.`status` = 'active') AND (`q`.`tanggal_mulai` <= now()) AND (`q`.`tanggal_selesai` >= now())) ;

-- --------------------------------------------------------

--
-- Structure for view `v_admin_quiz_activity`
--
DROP TABLE IF EXISTS `v_admin_quiz_activity`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_admin_quiz_activity`  AS SELECT `ks`.`kumpulan_soal_id` AS `kumpulan_soal_id`, `ks`.`judul` AS `kumpulan_soal_judul`, `ks`.`pin_code` AS `pin_code`, `k`.`nama_kategori` AS `nama_kategori`, coalesce(`u`.`nama`,'Sistem') AS `created_by_name`, `ks`.`created_by` AS `created_by_id`, `ks`.`jumlah_soal` AS `jumlah_soal`, count(distinct `hq`.`hasil_id`) AS `total_peserta`, round(avg(`hq`.`skor`),2) AS `rata_rata_skor`, max(`hq`.`skor`) AS `skor_tertinggi`, min(`hq`.`skor`) AS `skor_terendah`, `ks`.`created_at` AS `created_at` FROM (((`kumpulan_soal` `ks` join `kategori` `k` on((`ks`.`kategori_id` = `k`.`id`))) left join `users` `u` on((`ks`.`created_by` = `u`.`id`))) left join `hasil_quiz` `hq` on(((`ks`.`kumpulan_soal_id` = `hq`.`kumpulan_soal_id`) and (`hq`.`completed_at` is not null)))) GROUP BY `ks`.`kumpulan_soal_id`, `ks`.`judul`, `ks`.`pin_code`, `k`.`nama_kategori`, `u`.`nama`, `ks`.`created_by`, `ks`.`jumlah_soal`, `ks`.`created_at` ;

-- --------------------------------------------------------

--
-- Structure for view `v_admin_system_overview`
--
DROP TABLE IF EXISTS `v_admin_system_overview`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_admin_system_overview`  AS SELECT (select count(0) from `users` where (`users`.`role` = 'admin')) AS `total_admin`, (select count(0) from `users` where (`users`.`role` = 'kreator')) AS `total_kreator`, (select count(0) from `kategori`) AS `total_kategori`, (select count(0) from `materi`) AS `total_materi`, (select count(0) from `kumpulan_soal`) AS `total_kumpulan_soal`, (select count(0) from `soal`) AS `total_soal`, (select count(0) from `quiz_session`) AS `total_quiz_sessions`, (select count(0) from `hasil_quiz` where (`hasil_quiz`.`completed_at` is not null)) AS `total_quiz_completed`, (select count(distinct `hasil_quiz`.`nama_peserta`) from `hasil_quiz`) AS `total_unique_peserta` ;

-- --------------------------------------------------------

--
-- Structure for view `v_admin_user_activity`
--
DROP TABLE IF EXISTS `v_admin_user_activity`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_admin_user_activity`  AS SELECT `u`.`id` AS `id`, `u`.`nama` AS `nama`, `u`.`email` AS `email`, `u`.`role` AS `role`, `u`.`is_verified` AS `is_verified`, `u`.`created_at` AS `created_at`, count(distinct `ks`.`kumpulan_soal_id`) AS `total_kumpulan_soal_created`, count(distinct `s`.`soal_id`) AS `total_soal_created`, count(distinct `k`.`id`) AS `total_kategori_created`, count(distinct `m`.`materi_id`) AS `total_materi_created` FROM ((((`users` `u` left join `kumpulan_soal` `ks` on((`u`.`id` = `ks`.`created_by`))) left join `soal` `s` on((`ks`.`kumpulan_soal_id` = `s`.`kumpulan_soal_id`))) left join `kategori` `k` on((`u`.`id` = `k`.`created_by`))) left join `materi` `m` on((`u`.`id` = `m`.`created_by`))) GROUP BY `u`.`id`, `u`.`nama`, `u`.`email`, `u`.`role`, `u`.`is_verified`, `u`.`created_at` ;

-- --------------------------------------------------------

--
-- Structure for view `v_kreator_kumpulan_soal`
--
DROP TABLE IF EXISTS `v_kreator_kumpulan_soal`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_kreator_kumpulan_soal`  AS SELECT `ks`.`kumpulan_soal_id` AS `kumpulan_soal_id`, `ks`.`judul` AS `judul`, `ks`.`pin_code` AS `pin_code`, `ks`.`jumlah_soal` AS `jumlah_soal`, `ks`.`waktu_per_soal` AS `waktu_per_soal`, `ks`.`waktu_keseluruhan` AS `waktu_keseluruhan`, `ks`.`tipe_waktu` AS `tipe_waktu`, `k`.`nama_kategori` AS `nama_kategori`, `m`.`judul` AS `materi_judul`, `u`.`nama` AS `created_by_name`, `ks`.`created_by` AS `created_by`, `ks`.`created_at` AS `created_at`, `ks`.`updated_at` AS `updated_at` FROM (((`kumpulan_soal` `ks` join `kategori` `k` on((`ks`.`kategori_id` = `k`.`id`))) left join `materi` `m` on((`ks`.`materi_id` = `m`.`materi_id`))) left join `users` `u` on((`ks`.`created_by` = `u`.`id`))) ;

-- --------------------------------------------------------

--
-- Structure for view `v_leaderboard`
--
DROP TABLE IF EXISTS `v_leaderboard`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_leaderboard`  AS SELECT `hq`.`hasil_id` AS `hasil_id`, `hq`.`nama_peserta` AS `nama_peserta`, `hq`.`skor` AS `skor`, `hq`.`jawaban_benar` AS `jawaban_benar`, `hq`.`total_soal` AS `total_soal`, `hq`.`waktu_pengerjaan` AS `waktu_pengerjaan`, `hq`.`completed_at` AS `completed_at`, `k`.`nama_kategori` AS `kategori`, `m`.`judul` AS `materi`, `ks`.`judul` AS `kumpulan_soal_judul` FROM (((`hasil_quiz` `hq` join `kumpulan_soal` `ks` on((`hq`.`kumpulan_soal_id` = `ks`.`kumpulan_soal_id`))) join `kategori` `k` on((`ks`.`kategori_id` = `k`.`id`))) left join `materi` `m` on((`ks`.`materi_id` = `m`.`materi_id`))) WHERE (`hq`.`completed_at` is not null) ORDER BY `hq`.`skor` DESC, `hq`.`waktu_pengerjaan` ASC ;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `hasil_quiz`
--
ALTER TABLE `hasil_quiz`
  ADD CONSTRAINT `hasil_quiz_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `quiz_session` (`session_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `hasil_quiz_ibfk_2` FOREIGN KEY (`kumpulan_soal_id`) REFERENCES `kumpulan_soal` (`kumpulan_soal_id`) ON DELETE CASCADE;

--
-- Constraints for table `kategori`
--
ALTER TABLE `kategori`
  ADD CONSTRAINT `kategori_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `kumpulan_soal`
--
ALTER TABLE `kumpulan_soal`
  ADD CONSTRAINT `kumpulan_soal_ibfk_1` FOREIGN KEY (`kategori_id`) REFERENCES `kategori` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `kumpulan_soal_ibfk_2` FOREIGN KEY (`materi_id`) REFERENCES `materi` (`materi_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `kumpulan_soal_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `kumpulan_soal_ibfk_4` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `materi`
--
ALTER TABLE `materi`
  ADD CONSTRAINT `materi_ibfk_1` FOREIGN KEY (`kategori_id`) REFERENCES `kategori` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `materi_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `quiz`
--
ALTER TABLE `quiz`
  ADD CONSTRAINT `quiz_ibfk_1` FOREIGN KEY (`kumpulan_soal_id`) REFERENCES `kumpulan_soal` (`kumpulan_soal_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `quiz_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `quiz_session`
--
ALTER TABLE `quiz_session`
  ADD CONSTRAINT `quiz_session_ibfk_1` FOREIGN KEY (`kumpulan_soal_id`) REFERENCES `kumpulan_soal` (`kumpulan_soal_id`) ON DELETE CASCADE;

--
-- Constraints for table `soal`
--
ALTER TABLE `soal`
  ADD CONSTRAINT `soal_ibfk_1` FOREIGN KEY (`kumpulan_soal_id`) REFERENCES `kumpulan_soal` (`kumpulan_soal_id`) ON DELETE CASCADE;

--
-- Constraints for table `user_answers`
--
ALTER TABLE `user_answers`
  ADD CONSTRAINT `user_answers_ibfk_1` FOREIGN KEY (`hasil_id`) REFERENCES `hasil_quiz` (`hasil_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_answers_ibfk_2` FOREIGN KEY (`soal_id`) REFERENCES `soal` (`soal_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
