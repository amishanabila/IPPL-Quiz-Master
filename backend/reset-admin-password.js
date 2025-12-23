const bcryptjs = require('bcryptjs');
const db = require('./src/config/db');

async function resetAdminPassword() {
  try {
    const newPassword = 'Admin123!';
    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    
    console.log('Generated hash:', hashedPassword);
    
    // Update admin password
    const [result] = await db.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, 'admin@gmail.com']
    );
    
    console.log('✅ Password updated successfully!');
    console.log('Email: admin@gmail.com');
    console.log('New password: Admin123!');
    console.log('Rows affected:', result.affectedRows);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetAdminPassword();
