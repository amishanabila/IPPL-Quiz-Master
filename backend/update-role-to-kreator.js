const mysql = require('mysql2/promise');

async function updateRoleToKreator() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'quiz_master'
    });

    console.log('📡 Connected to MySQL - quiz_master database');

    // 1. Modify ENUM to add 'kreator' alongside 'user'
    await connection.query(`
      ALTER TABLE users 
      MODIFY role ENUM('admin', 'user', 'kreator') DEFAULT 'kreator'
    `);
    console.log('✅ Column role updated to include \'kreator\'');

    // 2. Update existing users from 'user' to 'kreator'
    const [updateResult] = await connection.query(`
      UPDATE users 
      SET role = 'kreator' 
      WHERE role = 'user'
    `);
    console.log(`✅ Updated ${updateResult.affectedRows} users from 'user' to 'kreator'`);

    // 3. Remove 'user' from ENUM, keep only 'admin' and 'kreator'
    await connection.query(`
      ALTER TABLE users 
      MODIFY role ENUM('admin', 'kreator') DEFAULT 'kreator'
    `);
    console.log('✅ Column role finalized to ENUM(\'admin\', \'kreator\')');

    // 4. Show current users
    console.log('\n📊 Current users:');
    const [users] = await connection.query('SELECT id, nama, email, role FROM users');
    console.table(users);

    console.log('\n✅ Role successfully changed to "kreator"!');

  } catch (error) {
    console.error('❌ Error updating role:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the update
updateRoleToKreator();
