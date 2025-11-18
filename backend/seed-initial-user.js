const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seedInitialUser() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('✅ Connected to database');

    // Check if users exist
    const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
    
    if (users[0].count > 0) {
      console.log('ℹ️  Users already exist, skipping seed');
      await connection.end();
      return;
    }

    // Hash password for admin
    const adminPassword = await bcrypt.hash('Admin123!', 10);

    // Insert admin user
    await connection.query(`
      INSERT INTO users (nama, email, password, role, is_verified) 
      VALUES (?, ?, ?, ?, ?)
    `, ['Admin QuizMaster', 'admin@gmail.com', adminPassword, 'admin', true]);

    console.log('✅ Admin user created');
    console.log('   Email: admin@gmail.com');
    console.log('   Password: Admin123!');

    await connection.end();
    console.log('\n🎉 Initial seed completed!');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedInitialUser();
