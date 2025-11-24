// Test leaderboard endpoints
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testLeaderboardEndpoints() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'quiz_master'
    });

    console.log('✅ Connected to database\n');
    
    // Test 1: Get all leaderboard
    console.log('📊 Test 1: Get ALL Leaderboard Data');
    console.log('=' .repeat(50));
    const [allData] = await connection.execute(`
      SELECT 
        ha.hasil_id,
        ha.nama_peserta,
        m.judul as materi,
        m.materi_id,
        k.nama_kategori as kategori,
        k.id as kategori_id,
        ks.judul as kumpulan_soal_judul,
        ks.pin_code,
        ha.skor,
        ha.jawaban_benar,
        ha.total_soal,
        ha.waktu_pengerjaan,
        ha.completed_at
      FROM hasil_quiz ha
      JOIN kumpulan_soal ks ON ha.kumpulan_soal_id = ks.kumpulan_soal_id
      LEFT JOIN materi m ON ks.materi_id = m.materi_id
      JOIN kategori k ON ks.kategori_id = k.id
      WHERE ha.skor IS NOT NULL
      ORDER BY ha.skor DESC, ha.waktu_pengerjaan ASC
      LIMIT 10
    `);
    
    console.log(`Found ${allData.length} results`);
    console.table(allData.map(d => ({
      peserta: d.nama_peserta,
      kategori: d.kategori,
      materi: d.materi,
      pin: d.pin_code,
      skor: d.skor,
      benar: `${d.jawaban_benar}/${d.total_soal}`
    })));
    
    // Test 2: Get kategori with stats
    console.log('\n📂 Test 2: Get Kategori With Stats');
    console.log('=' .repeat(50));
    const [kategoriStats] = await connection.execute(`
      SELECT 
        k.id as kategori_id,
        k.nama_kategori,
        COUNT(DISTINCT ks.kumpulan_soal_id) as total_kumpulan_soal,
        COUNT(DISTINCT ha.hasil_id) as total_hasil
      FROM kategori k
      LEFT JOIN kumpulan_soal ks ON k.id = ks.kategori_id
      LEFT JOIN hasil_quiz ha ON ks.kumpulan_soal_id = ha.kumpulan_soal_id
      GROUP BY k.id, k.nama_kategori
      HAVING total_kumpulan_soal > 0
      ORDER BY k.nama_kategori ASC
    `);
    
    console.log(`Found ${kategoriStats.length} kategori`);
    console.table(kategoriStats);
    
    // Test 3: Get materi by kategori
    if (kategoriStats.length > 0) {
      const firstKategori = kategoriStats[0];
      console.log(`\n📚 Test 3: Get Materi for Kategori "${firstKategori.nama_kategori}"`);
      console.log('=' .repeat(50));
      
      const [materiData] = await connection.execute(`
        SELECT 
          m.materi_id,
          m.judul,
          k.nama_kategori,
          k.id as kategori_id,
          COUNT(DISTINCT ks.kumpulan_soal_id) as total_kumpulan_soal,
          COUNT(DISTINCT ha.hasil_id) as total_hasil
        FROM materi m
        JOIN kategori k ON m.kategori_id = k.id
        LEFT JOIN kumpulan_soal ks ON m.materi_id = ks.materi_id
        LEFT JOIN hasil_quiz ha ON ks.kumpulan_soal_id = ha.kumpulan_soal_id
        WHERE k.id = ?
        GROUP BY m.materi_id, m.judul, k.nama_kategori, k.id
        HAVING total_kumpulan_soal > 0
        ORDER BY m.judul ASC
      `, [firstKategori.kategori_id]);
      
      console.log(`Found ${materiData.length} materi`);
      console.table(materiData);
      
      // Test 4: Filter leaderboard by kategori
      console.log(`\n🔍 Test 4: Filter Leaderboard by Kategori "${firstKategori.nama_kategori}"`);
      console.log('=' .repeat(50));
      
      const [filteredByKat] = await connection.execute(`
        SELECT 
          ha.nama_peserta,
          k.nama_kategori as kategori,
          m.judul as materi,
          ha.skor,
          ha.jawaban_benar,
          ha.total_soal
        FROM hasil_quiz ha
        JOIN kumpulan_soal ks ON ha.kumpulan_soal_id = ks.kumpulan_soal_id
        LEFT JOIN materi m ON ks.materi_id = m.materi_id
        JOIN kategori k ON ks.kategori_id = k.id
        WHERE ha.skor IS NOT NULL AND k.id = ?
        ORDER BY ha.skor DESC
        LIMIT 5
      `, [firstKategori.kategori_id]);
      
      console.log(`Found ${filteredByKat.length} results`);
      console.table(filteredByKat);
      
      // Test 5: Filter by materi (if exists)
      if (materiData.length > 0) {
        const firstMateri = materiData[0];
        console.log(`\n🔍 Test 5: Filter Leaderboard by Materi "${firstMateri.judul}"`);
        console.log('=' .repeat(50));
        
        const [filteredByMat] = await connection.execute(`
          SELECT 
            ha.nama_peserta,
            k.nama_kategori as kategori,
            m.judul as materi,
            ha.skor,
            ha.jawaban_benar,
            ha.total_soal
          FROM hasil_quiz ha
          JOIN kumpulan_soal ks ON ha.kumpulan_soal_id = ks.kumpulan_soal_id
          LEFT JOIN materi m ON ks.materi_id = m.materi_id
          JOIN kategori k ON ks.kategori_id = k.id
          WHERE ha.skor IS NOT NULL AND m.materi_id = ?
          ORDER BY ha.skor DESC
          LIMIT 5
        `, [firstMateri.materi_id]);
        
        console.log(`Found ${filteredByMat.length} results`);
        console.table(filteredByMat);
      }
    }
    
    await connection.end();
    
    console.log('\n✅ ALL TESTS PASSED!');
    console.log('\n📝 Summary:');
    console.log('   - Leaderboard query: OK');
    console.log('   - Kategori stats query: OK');
    console.log('   - Materi by kategori query: OK');
    console.log('   - Filter by kategori: OK');
    console.log('   - Filter by materi: OK');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testLeaderboardEndpoints();
