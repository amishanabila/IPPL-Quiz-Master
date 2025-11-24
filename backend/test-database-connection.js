// Test script to check database connection and query data
const db = require('./src/config/db');

async function testDatabase() {
  console.log('🔍 Testing Database Connection and Queries\n');
  
  try {
    // Test 1: Check connection
    console.log('1️⃣ Testing database connection...');
    const [connection] = await db.query('SELECT 1 as result');
    console.log('✅ Database connected successfully\n');
    
    // Test 2: Check materi table
    console.log('2️⃣ Checking materi table...');
    const [materiRows] = await db.query(`
      SELECT m.materi_id, m.judul, m.kategori_id, k.nama_kategori, m.created_at
      FROM materi m
      LEFT JOIN kategori k ON m.kategori_id = k.id
      ORDER BY m.created_at DESC
      LIMIT 10
    `);
    console.log(`📊 Found ${materiRows.length} materi:`);
    materiRows.forEach((m, i) => {
      console.log(`   ${i + 1}. ID: ${m.materi_id}, Judul: "${m.judul}", Kategori: ${m.nama_kategori}`);
    });
    console.log('');
    
    // Test 3: Check kumpulan_soal table
    console.log('3️⃣ Checking kumpulan_soal table...');
    const [kumpulanRows] = await db.query(`
      SELECT ks.kumpulan_soal_id, ks.judul, ks.materi_id, m.judul as materi_judul, 
             ks.kategori_id, k.nama_kategori, ks.jumlah_soal, ks.created_at
      FROM kumpulan_soal ks
      LEFT JOIN materi m ON ks.materi_id = m.materi_id
      LEFT JOIN kategori k ON ks.kategori_id = k.id
      ORDER BY ks.created_at DESC
      LIMIT 10
    `);
    console.log(`📊 Found ${kumpulanRows.length} kumpulan_soal:`);
    kumpulanRows.forEach((ks, i) => {
      console.log(`   ${i + 1}. ID: ${ks.kumpulan_soal_id}, Judul: "${ks.judul}", Materi ID: ${ks.materi_id} (${ks.materi_judul}), Jumlah: ${ks.jumlah_soal} soal`);
    });
    console.log('');
    
    // Test 4: Check soal table structure first
    console.log('4️⃣ Checking soal table structure...');
    const [tableStructure] = await db.query(`DESCRIBE soal`);
    console.log('📊 Soal table columns:');
    tableStructure.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type})`);
    });
    console.log('');
    
    // Now query soal table with correct columns
    console.log('4️⃣b Checking soal table data...');
    const [soalRows] = await db.query(`
      SELECT s.*
      FROM soal s
      ORDER BY s.soal_id DESC
      LIMIT 10
    `);
    console.log(`📊 Found ${soalRows.length} soal:`);
    soalRows.forEach((s, i) => {
      let jawabanDisplay = s.jawaban_benar;
      if (s.variasi_jawaban) {
        try {
          const parsed = JSON.parse(s.variasi_jawaban);
          jawabanDisplay = `[${parsed.join(', ')}]`;
        } catch (e) {
          jawabanDisplay = `⚠️ INVALID JSON: "${s.variasi_jawaban}"`;
        }
      }
      console.log(`   ${i + 1}. ID: ${s.soal_id}, Kumpulan ID: ${s.kumpulan_soal_id}, Jawaban: ${jawabanDisplay}`);
      console.log(`       Pertanyaan: "${s.pertanyaan.substring(0, 50)}${s.pertanyaan.length > 50 ? '...' : ''}"`);
      console.log(`       Pilihan A: ${s.pilihan_a || 'N/A'}, B: ${s.pilihan_b || 'N/A'}, C: ${s.pilihan_c || 'N/A'}, D: ${s.pilihan_d || 'N/A'}`);
    });
    console.log('');
    
    // Test 5: Check relationship between materi and kumpulan_soal
    console.log('5️⃣ Checking materi-kumpulan_soal relationships...');
    const [relationships] = await db.query(`
      SELECT m.materi_id, m.judul as materi_judul,
             ks.kumpulan_soal_id, ks.judul as kumpulan_judul, ks.jumlah_soal,
             COUNT(s.soal_id) as actual_soal_count
      FROM materi m
      LEFT JOIN kumpulan_soal ks ON m.materi_id = ks.materi_id
      LEFT JOIN soal s ON ks.kumpulan_soal_id = s.kumpulan_soal_id
      GROUP BY m.materi_id, ks.kumpulan_soal_id
      ORDER BY m.created_at DESC
      LIMIT 10
    `);
    console.log(`📊 Found ${relationships.length} relationships:`);
    relationships.forEach((r, i) => {
      if (r.kumpulan_soal_id) {
        console.log(`   ${i + 1}. Materi: "${r.materi_judul}" (ID: ${r.materi_id})`);
        console.log(`      → Kumpulan Soal ID: ${r.kumpulan_soal_id}, Jumlah Soal: ${r.actual_soal_count}/${r.jumlah_soal}`);
      } else {
        console.log(`   ${i + 1}. Materi: "${r.materi_judul}" (ID: ${r.materi_id}) → ⚠️ NO KUMPULAN_SOAL`);
      }
    });
    console.log('');
    
    // Test 6: Check quiz_sessions and hasil_quiz for data existence
    console.log('6️⃣ Checking quiz_sessions and hasil_quiz...');
    const [hasilRows] = await db.query(`
      SELECT h.hasil_id, h.user_id, u.nama, h.kumpulan_soal_id, 
             ks.judul as soal_title, h.score, h.created_at
      FROM hasil_quiz h
      LEFT JOIN user u ON h.user_id = u.id
      LEFT JOIN kumpulan_soal ks ON h.kumpulan_soal_id = ks.kumpulan_soal_id
      ORDER BY h.created_at DESC
      LIMIT 10
    `);
    console.log(`📊 Found ${hasilRows.length} quiz results:`);
    hasilRows.forEach((h, i) => {
      console.log(`   ${i + 1}. User: ${h.nama}, Kumpulan ID: ${h.kumpulan_soal_id}, Soal: "${h.soal_title}", Score: ${h.score}`);
    });
    console.log('');
    
    // Test 7: Identify orphaned soal (soal without valid kumpulan_soal_id)
    console.log('7️⃣ Checking for data integrity issues...');
    const [orphanedSoal] = await db.query(`
      SELECT s.soal_id, s.kumpulan_soal_id, s.pertanyaan
      FROM soal s
      LEFT JOIN kumpulan_soal ks ON s.kumpulan_soal_id = ks.kumpulan_soal_id
      WHERE ks.kumpulan_soal_id IS NULL
      LIMIT 10
    `);
    if (orphanedSoal.length > 0) {
      console.log(`⚠️ Found ${orphanedSoal.length} orphaned soal (soal tanpa kumpulan_soal):`);
      orphanedSoal.forEach((s, i) => {
        console.log(`   ${i + 1}. Soal ID: ${s.soal_id}, Kumpulan ID: ${s.kumpulan_soal_id} (TIDAK ADA)`);
      });
    } else {
      console.log('✅ No orphaned soal found');
    }
    console.log('');
    
    // Test 8: Check materi without kumpulan_soal
    console.log('8️⃣ Checking materi without kumpulan_soal...');
    const [materiWithoutSoal] = await db.query(`
      SELECT m.materi_id, m.judul
      FROM materi m
      LEFT JOIN kumpulan_soal ks ON m.materi_id = ks.materi_id
      WHERE ks.kumpulan_soal_id IS NULL
    `);
    if (materiWithoutSoal.length > 0) {
      console.log(`⚠️ Found ${materiWithoutSoal.length} materi without kumpulan_soal:`);
      materiWithoutSoal.forEach((m, i) => {
        console.log(`   ${i + 1}. Materi ID: ${m.materi_id}, Judul: "${m.judul}"`);
      });
    } else {
      console.log('✅ All materi have kumpulan_soal');
    }
    console.log('');
    
    console.log('✅ All database tests completed!\n');
    
  } catch (error) {
    console.error('❌ Database test error:', error);
    console.error('Error details:', error.message);
  } finally {
    process.exit(0);
  }
}

testDatabase();
