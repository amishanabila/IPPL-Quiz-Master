// Script to fix invalid JSON data in variasi_jawaban column
const db = require('./src/config/db');

async function fixVariasiJawabanData() {
  console.log('🔧 Fixing variasi_jawaban data in database\n');
  
  try {
    // Step 1: Find all soal with variasi_jawaban
    console.log('1️⃣ Finding soal with variasi_jawaban...');
    const [soalRows] = await db.query(`
      SELECT soal_id, pertanyaan, jawaban_benar, variasi_jawaban
      FROM soal
      WHERE variasi_jawaban IS NOT NULL
    `);
    
    console.log(`📊 Found ${soalRows.length} soal with variasi_jawaban\n`);
    
    if (soalRows.length === 0) {
      console.log('✅ No soal to fix');
      return;
    }
    
    let fixedCount = 0;
    let alreadyValidCount = 0;
    let errorCount = 0;
    
    // Step 2: Check and fix each soal
    console.log('2️⃣ Checking and fixing invalid JSON...\n');
    
    for (const soal of soalRows) {
      try {
        // Try to parse as JSON
        JSON.parse(soal.variasi_jawaban);
        console.log(`✅ Soal ${soal.soal_id}: Already valid JSON`);
        alreadyValidCount++;
      } catch (e) {
        // Invalid JSON, need to fix
        console.log(`❌ Soal ${soal.soal_id}: Invalid JSON - "${soal.variasi_jawaban}"`);
        
        // Parse the string and convert to array
        let variasiArray;
        console.log(`   Type: ${typeof soal.variasi_jawaban}, Value: "${soal.variasi_jawaban}"`);
        
        if (typeof soal.variasi_jawaban === 'string') {
          // Split by comma and trim each value
          variasiArray = soal.variasi_jawaban
            .split(',')
            .map(v => v.trim())
            .filter(v => v.length > 0);
        } else {
          variasiArray = [soal.jawaban_benar];
        }
        
        console.log(`   Parsed array:`, variasiArray);
        
        // Convert to proper JSON string
        const validJson = JSON.stringify(variasiArray);
        
        console.log(`   → Fixing to: ${validJson}`);
        
        // Update database - MySQL will automatically convert JSON string to JSON type
        await db.query(
          'UPDATE soal SET variasi_jawaban = CAST(? AS JSON) WHERE soal_id = ?',
          [validJson, soal.soal_id]
        );
        
        console.log(`   ✅ Fixed!\n`);
        fixedCount++;
      }
    }
    
    // Step 3: Verify all fixes
    console.log('3️⃣ Verifying fixes...\n');
    const [verifyRows] = await db.query(`
      SELECT soal_id, variasi_jawaban
      FROM soal
      WHERE variasi_jawaban IS NOT NULL
    `);
    
    let allValid = true;
    for (const soal of verifyRows) {
      try {
        const parsed = JSON.parse(soal.variasi_jawaban);
        console.log(`✅ Soal ${soal.soal_id}: ${JSON.stringify(parsed)}`);
      } catch (e) {
        console.log(`❌ Soal ${soal.soal_id}: Still invalid!`);
        allValid = false;
        errorCount++;
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`   - Already valid: ${alreadyValidCount}`);
    console.log(`   - Fixed: ${fixedCount}`);
    console.log(`   - Errors: ${errorCount}`);
    console.log(`   - Total: ${soalRows.length}`);
    
    if (allValid) {
      console.log('\n✅ All variasi_jawaban data is now valid JSON!\n');
    } else {
      console.log('\n⚠️ Some data still has issues. Manual intervention may be needed.\n');
    }
    
  } catch (error) {
    console.error('❌ Error fixing data:', error);
    console.error('Error details:', error.message);
  } finally {
    process.exit(0);
  }
}

fixVariasiJawabanData();
