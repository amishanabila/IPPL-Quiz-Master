// Script untuk cleanup PIN lama di tabel quiz
const mysql = require('mysql2/promise');
require('dotenv').config();

async function cleanupOldPins() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'quiz_master'
    });

    console.log('✅ Connected to database\n');
    
    // Check if quiz table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'quiz'"
    );
    
    if (tables.length === 0) {
      console.log('ℹ️  Tabel quiz tidak ditemukan. Tidak ada yang perlu di-cleanup.');
      await connection.end();
      return;
    }
    
    // Count old PINs in quiz table
    const [oldPins] = await connection.execute(
      'SELECT COUNT(*) as count FROM quiz'
    );
    
    const oldPinCount = oldPins[0].count;
    
    if (oldPinCount === 0) {
      console.log('✅ Tidak ada PIN lama di tabel quiz. Database sudah bersih!');
      await connection.end();
      return;
    }
    
    console.log(`⚠️  Ditemukan ${oldPinCount} entry PIN lama di tabel quiz`);
    console.log('\n📋 PIN lama:');
    
    const [quizList] = await connection.execute(
      'SELECT quiz_id, pin_code, judul, kumpulan_soal_id FROM quiz'
    );
    
    console.table(quizList);
    
    // Ask for confirmation (in production, you'd use readline)
    console.log('\n⚠️  PERHATIAN:');
    console.log('   - PIN sekarang sudah pindah ke tabel kumpulan_soal');
    console.log('   - Tabel quiz tidak diperlukan lagi untuk sistem PIN');
    console.log('   - Script ini akan MENGHAPUS tabel quiz');
    console.log('\n✅ Untuk cleanup, jalankan query berikut di database:');
    console.log('\n   DROP TABLE IF EXISTS quiz;');
    console.log('\n📝 Atau backup dulu sebelum hapus:');
    console.log('\n   CREATE TABLE quiz_backup AS SELECT * FROM quiz;');
    console.log('   DROP TABLE quiz;');
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanupOldPins();
