// Script untuk check schema kumpulan_soal
const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSchema() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'quiz_master'
    });

    console.log('✅ Connected to database');
    
    // Check table structure
    const [columns] = await connection.execute('DESCRIBE kumpulan_soal');
    
    console.log('\n📊 Table structure:');
    console.table(columns);
    
    // Check if pin_code column exists
    const hasPinCode = columns.some(col => col.Field === 'pin_code');
    
    if (hasPinCode) {
      console.log('\n✅ Column pin_code EXISTS');
      
      // Check existing PINs
      const [pins] = await connection.execute(
        'SELECT kumpulan_soal_id, pin_code, judul FROM kumpulan_soal LIMIT 5'
      );
      
      console.log('\n📌 Existing PINs:');
      console.table(pins);
    } else {
      console.log('\n❌ Column pin_code DOES NOT EXIST');
      console.log('⚠️  Need to run migration.sql!');
    }
    
    // Check functions
    try {
      const [functions] = await connection.execute(
        "SHOW FUNCTION STATUS WHERE Db = 'quiz_master'"
      );
      console.log('\n🔧 Functions:');
      console.table(functions.map(f => ({ name: f.Name, type: f.Type })));
    } catch (err) {
      console.log('\n⚠️  No functions found');
    }
    
    // Check triggers
    try {
      const [triggers] = await connection.execute(
        "SHOW TRIGGERS WHERE `Table` = 'kumpulan_soal'"
      );
      console.log('\n⚡ Triggers:');
      console.table(triggers.map(t => ({ trigger: t.Trigger, event: t.Event, table: t.Table })));
    } catch (err) {
      console.log('\n⚠️  No triggers found');
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkSchema();
