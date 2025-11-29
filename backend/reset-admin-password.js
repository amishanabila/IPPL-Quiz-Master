const db = require('./src/config/db');
const bcryptjs = require('bcryptjs');

async function resetAdminPassword() {
  try {
    const adminEmail = 'admin@gmail.com';
    const newPassword = 'Admin123!';
    
    console.log('\n=== RESETTING ADMIN PASSWORD ===');
    console.log('Email:', adminEmail);
    console.log('New Password:', newPassword);
    
    // Hash password baru
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(newPassword, salt);
    
    // Update password
    const [result] = await db.query(
      'UPDATE users SET password = ? WHERE email = ? AND role = ?',
      [hashedPassword, adminEmail, 'admin']
    );
    
    console.log('\n✅ Password updated successfully!');
    console.log('Rows affected:', result.affectedRows);
    
    // Verify
    const [users] = await db.query('SELECT id, nama, email, role FROM users WHERE email = ?', [adminEmail]);
    console.log('\n=== UPDATED ADMIN ===');
    console.log(JSON.stringify(users[0], null, 2));
    
    // Test password
    const [userWithPass] = await db.query('SELECT password FROM users WHERE email = ?', [adminEmail]);
    const isValid = await bcryptjs.compare(newPassword, userWithPass[0].password);
    console.log('\n🔐 Password verification:', isValid ? '✅ VALID' : '❌ INVALID');
    
    await db.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await db.end();
  }
}

resetAdminPassword();
