// ============================================================================
// TEST DATABASE CONNECTION
// ============================================================================
// Script untuk test koneksi database dan verifikasi struktur tabel
// Jalankan: node test-db-connection.js
// ============================================================================

require('dotenv').config();
const mysql = require('mysql2/promise');

async function testDatabaseConnection() {
  console.log('🔍 Testing Database Connection...\n');
  
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'quiz_master'
    });

    console.log('✅ Database connected successfully!\n');
    console.log('📊 Database Info:');
    console.log('   Host:', process.env.DB_HOST || 'localhost');
    console.log('   Database:', process.env.DB_NAME || 'quiz_master');
    console.log('   User:', process.env.DB_USER || 'root');
    console.log('');

    // Test 1: Check tables exist
    console.log('🔍 Test 1: Checking if tables exist...');
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`✅ Found ${tables.length} tables:`);
    tables.forEach((table) => {
      const tableName = Object.values(table)[0];
      console.log(`   - ${tableName}`);
    });
    console.log('');

    // Test 2: Check quiz_session structure
    console.log('🔍 Test 2: Checking quiz_session table structure...');
    const [columns] = await connection.query('DESCRIBE quiz_session');
    console.log('✅ quiz_session columns:');
    columns.forEach((col) => {
      console.log(`   - ${col.Field} (${col.Type})`);
    });
    
    // Check if email_peserta exists
    const hasEmailPeserta = columns.some(col => col.Field === 'email_peserta');
    if (hasEmailPeserta) {
      console.log('✅ Column email_peserta EXISTS');
    } else {
      console.log('⚠️  Column email_peserta NOT FOUND - Run migration script!');
    }
    console.log('');

    // Test 3: Check hasil_quiz structure
    console.log('🔍 Test 3: Checking hasil_quiz table structure...');
    const [hasilCols] = await connection.query('DESCRIBE hasil_quiz');
    const hasilColNames = hasilCols.map(col => col.Field);
    console.log('✅ hasil_quiz columns:', hasilColNames.join(', '));
    console.log('');

    // Test 4: Check kumpulan_soal count
    console.log('🔍 Test 4: Checking data...');
    const [kumpulanCount] = await connection.query('SELECT COUNT(*) as count FROM kumpulan_soal');
    const [usersCount] = await connection.query('SELECT COUNT(*) as count FROM users WHERE role = "kreator"');
    const [hasilCount] = await connection.query('SELECT COUNT(*) as count FROM hasil_quiz');
    
    console.log(`✅ Data Statistics:`);
    console.log(`   - Kumpulan Soal: ${kumpulanCount[0].count}`);
    console.log(`   - Kreator Users: ${usersCount[0].count}`);
    console.log(`   - Hasil Quiz: ${hasilCount[0].count}`);
    console.log('');

    // Test 5: Test export query
    console.log('🔍 Test 5: Testing export query...');
    const [testResult] = await connection.query(`
      SELECT 
        ks.kumpulan_soal_id,
        ks.judul,
        k.nama_kategori,
        ks.jumlah_soal,
        COUNT(DISTINCT qs.session_id) as total_peserta
      FROM kumpulan_soal ks
      LEFT JOIN kategori k ON ks.kategori_id = k.id
      LEFT JOIN quiz_session qs ON ks.kumpulan_soal_id = qs.kumpulan_soal_id
      GROUP BY ks.kumpulan_soal_id
      LIMIT 5
    `);
    console.log(`✅ Export query works! Found ${testResult.length} kumpulan soal`);
    if (testResult.length > 0) {
      console.log('   Sample data:', testResult[0]);
    }
    console.log('');

    console.log('✅ All tests passed!');
    console.log('🎉 Database is ready for export feature!\n');

  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('   1. Check if MySQL server is running');
    console.error('   2. Verify .env file settings:');
    console.error('      - DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
    console.error('   3. Check if database "quiz_master" exists');
    console.error('   4. Run: mysql -u root -p < backend/database/01_setup.sql');
    console.error('');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('📌 Connection closed');
    }
  }
}

// Run the test
testDatabaseConnection();
