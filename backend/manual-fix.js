// Direct manual fix using raw SQL
const db = require('./src/config/db');

async function manualFix() {
  console.log('🔧 Manual fix for variasi_jawaban\n');
  
  try {
    // Check current data
    console.log('1️⃣ Current data:');
    const [before] = await db.query('SELECT soal_id, variasi_jawaban FROM soal WHERE soal_id = 1');
    console.log(before[0]);
    console.log(`Type: ${typeof before[0].variasi_jawaban}`);
    console.log(`Value: ${before[0].variasi_jawaban}`);
    console.log('');
    
    // Fix with direct JSON_ARRAY
    console.log('2️⃣ Fixing with JSON_ARRAY...');
    await db.query(`UPDATE soal SET variasi_jawaban = JSON_ARRAY('insang', 'Insang') WHERE soal_id = 1`);
    console.log('✅ Updated\n');
    
    // Check after fix
    console.log('3️⃣ After fix:');
    const [after] = await db.query('SELECT soal_id, variasi_jawaban FROM soal WHERE soal_id = 1');
    console.log(after[0]);
    console.log(`Type: ${typeof after[0].variasi_jawaban}`);
    console.log(`Value: ${after[0].variasi_jawaban}`);
    console.log('');
    
    // Try to parse
    console.log('4️⃣ Parsing test:');
    try {
      const parsed = JSON.parse(after[0].variasi_jawaban);
      console.log('✅ Parsed successfully:', parsed);
    } catch (e) {
      console.log('❌ Parse error:', e.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

manualFix();
