// Script untuk cek detail PIN 461994
const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkPin() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'quiz_master'
    });

    console.log('✅ Connected to database\n');
    
    // Check PIN 461994
    const testPin = '461994';
    console.log(`🔍 Searching for PIN: ${testPin}`);
    
    const [results] = await connection.execute(
      'SELECT * FROM kumpulan_soal WHERE pin_code = ?',
      [testPin]
    );
    
    if (results.length > 0) {
      console.log('✅ PIN FOUND:');
      console.table(results);
    } else {
      console.log('❌ PIN NOT FOUND in kumpulan_soal table');
    }
    
    console.log('\n📋 All available PINs:');
    const [allPins] = await connection.execute(
      `SELECT 
        ks.kumpulan_soal_id, 
        ks.pin_code, 
        ks.judul,
        k.nama_kategori,
        ks.jumlah_soal,
        ks.created_at
      FROM kumpulan_soal ks
      JOIN kategori k ON ks.kategori_id = k.id
      ORDER BY ks.created_at DESC`
    );
    
    console.table(allPins);
    
    // Check if PIN exists in quiz table (old system)
    console.log('\n🔍 Checking old quiz table...');
    try {
      const [quizPins] = await connection.execute(
        'SELECT quiz_id, pin_code, judul, kumpulan_soal_id FROM quiz WHERE pin_code = ?',
        [testPin]
      );
      
      if (quizPins.length > 0) {
        console.log('⚠️  PIN FOUND in OLD quiz table:');
        console.table(quizPins);
        console.log('\n💡 SOLUTION: PIN masih di tabel quiz (sistem lama)');
        console.log('   Seharusnya pakai PIN dari kumpulan_soal table!');
      } else {
        console.log('❌ PIN not found in quiz table either');
      }
    } catch (err) {
      console.log('⚠️  Quiz table might not exist');
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkPin();
