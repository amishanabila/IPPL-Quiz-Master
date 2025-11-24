// Script untuk drop tabel quiz (backup dulu)
const mysql = require('mysql2/promise');
require('dotenv').config();

async function dropQuizTable() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'quiz_master'
    });

    console.log('✅ Connected to database\n');
    
    // Backup tabel quiz
    console.log('📦 Creating backup: quiz_backup...');
    await connection.execute('DROP TABLE IF EXISTS quiz_backup');
    await connection.execute('CREATE TABLE quiz_backup AS SELECT * FROM quiz');
    console.log('✅ Backup created: quiz_backup\n');
    
    // Drop tabel quiz
    console.log('🗑️  Dropping table: quiz...');
    await connection.execute('DROP TABLE IF EXISTS quiz');
    console.log('✅ Table quiz dropped!\n');
    
    // Verify
    const [tables] = await connection.execute("SHOW TABLES LIKE 'quiz%'");
    console.log('📋 Remaining tables:');
    console.table(tables);
    
    console.log('\n✅ CLEANUP COMPLETE!');
    console.log('   - Tabel quiz sudah dihapus');
    console.log('   - Backup tersimpan di quiz_backup');
    console.log('   - PIN sekarang hanya ada di kumpulan_soal');
    console.log('\n📌 PIN yang valid sekarang:');
    
    const [pins] = await connection.execute(
      `SELECT 
        ks.kumpulan_soal_id,
        ks.pin_code,
        ks.judul,
        k.nama_kategori,
        ks.jumlah_soal
      FROM kumpulan_soal ks
      JOIN kategori k ON ks.kategori_id = k.id
      ORDER BY ks.created_at DESC`
    );
    
    console.table(pins);
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

dropQuizTable();
