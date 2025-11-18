const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateSchema() {
  try {
    // Connect to MySQL server (without database)
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      multipleStatements: true
    });

    console.log('✅ Connected to MySQL server');

    // Drop and recreate database
    console.log('🗑️  Dropping old database...');
    await connection.query('DROP DATABASE IF EXISTS quiz_master');
    
    console.log('🏗️  Creating new database...');
    await connection.query('CREATE DATABASE quiz_master');
    await connection.query('USE quiz_master');

    // Create tables with updated schema
    console.log('📋 Creating tables...');

    // Users table
    await connection.query(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') DEFAULT 'user',
        telepon VARCHAR(20),
        foto LONGBLOB,
        verification_token VARCHAR(512),
        reset_token VARCHAR(512),
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');

    // Kategori table
    await connection.query(`
      CREATE TABLE kategori (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama_kategori VARCHAR(100) NOT NULL UNIQUE,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Kategori table created');

    // Materi table
    await connection.query(`
      CREATE TABLE materi (
        materi_id INT AUTO_INCREMENT PRIMARY KEY,
        judul VARCHAR(255) NOT NULL,
        isi_materi TEXT NOT NULL,
        kategori_id INT NOT NULL,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (kategori_id) REFERENCES kategori(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Materi table created');

    // Kumpulan Soal table
    await connection.query(`
      CREATE TABLE kumpulan_soal (
        kumpulan_soal_id INT AUTO_INCREMENT PRIMARY KEY,
        judul VARCHAR(255),
        kategori_id INT NOT NULL,
        materi_id INT,
        created_by INT,
        updated_by INT,
        jumlah_soal INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (kategori_id) REFERENCES kategori(id) ON DELETE CASCADE,
        FOREIGN KEY (materi_id) REFERENCES materi(materi_id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Kumpulan_soal table created');

    // Soal table (UPDATED - supports all question types)
    await connection.query(`
      CREATE TABLE soal (
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
      )
    `);
    console.log('✅ Soal table created (with TEXT support for jawaban_benar)');

    // Quiz table
    await connection.query(`
      CREATE TABLE quiz (
        quiz_id INT AUTO_INCREMENT PRIMARY KEY,
        judul VARCHAR(255) NOT NULL,
        deskripsi TEXT,
        kumpulan_soal_id INT NOT NULL,
        created_by INT NOT NULL,
        pin_code CHAR(6) NOT NULL UNIQUE,
        durasi INT NOT NULL,
        tanggal_mulai DATETIME NOT NULL,
        tanggal_selesai DATETIME NOT NULL,
        status ENUM('draft', 'active', 'completed') DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (kumpulan_soal_id) REFERENCES kumpulan_soal(kumpulan_soal_id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Quiz table created');

    // Quiz Attempts table
    await connection.query(`
      CREATE TABLE quiz_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quiz_id INT NOT NULL,
        user_id INT NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME,
        score DECIMAL(5,2),
        status ENUM('in_progress', 'completed', 'timed_out') DEFAULT 'in_progress',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (quiz_id) REFERENCES quiz(quiz_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Quiz_attempts table created');

    // User Answers table
    await connection.query(`
      CREATE TABLE user_answers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        attempt_id INT NOT NULL,
        soal_id INT NOT NULL,
        jawaban TEXT NOT NULL,
        is_correct BOOLEAN,
        points_earned DECIMAL(5,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
        FOREIGN KEY (soal_id) REFERENCES soal(soal_id) ON DELETE CASCADE
      )
    `);
    console.log('✅ User_answers table created');

    // Hasil Quiz table
    await connection.query(`
      CREATE TABLE hasil_quiz (
        hasil_id INT AUTO_INCREMENT PRIMARY KEY,
        nama_peserta VARCHAR(255) NOT NULL,
        kumpulan_soal_id INT NOT NULL,
        skor INT DEFAULT 0,
        jawaban_benar INT DEFAULT 0,
        total_soal INT DEFAULT 0,
        waktu_selesai TIME,
        pin_code CHAR(6),
        completed_at DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (kumpulan_soal_id) REFERENCES kumpulan_soal(kumpulan_soal_id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Hasil_quiz table created');

    // Create indexes
    console.log('📊 Creating indexes...');
    await connection.query('CREATE INDEX idx_users_email ON users(email)');
    await connection.query('CREATE INDEX idx_kategori_nama ON kategori(nama_kategori)');
    await connection.query('CREATE INDEX idx_materi_kategori ON materi(kategori_id)');
    await connection.query('CREATE INDEX idx_kumpulan_kategori ON kumpulan_soal(kategori_id)');
    await connection.query('CREATE INDEX idx_soal_kumpulan ON soal(kumpulan_soal_id)');
    await connection.query('CREATE INDEX idx_quiz_pin ON quiz(pin_code)');
    console.log('✅ Indexes created');

    console.log('\n🎉 Database schema updated successfully!');
    console.log('📌 Key changes:');
    console.log('   - jawaban_benar changed from ENUM to TEXT');
    console.log('   - pilihan_a/b/c/d changed to nullable TEXT');
    console.log('   - Now supports multiple choice, fill-in, and essay questions');

    await connection.end();
  } catch (error) {
    console.error('❌ Error updating schema:', error);
    process.exit(1);
  }
}

updateSchema();
