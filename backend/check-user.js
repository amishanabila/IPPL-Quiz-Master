const mysql = require('mysql2/promise');

async function checkUser() {
    const connection = await mysql.createConnection({
        host: 'shuttle.proxy.rlwy.net',
        port: 43358,
        user: 'root',
        password: 'wKdNtcTjTLGpGzQyIAmhxyEsAyLlSBGC',
        database: 'railway'
    });

    console.log('✅ Connected to Railway MySQL');

    // Check if users table exists
    const [tables] = await connection.query("SHOW TABLES LIKE 'users'");
    console.log('Tables:', tables);

    // Check users
    const [users] = await connection.query('SELECT id, nama, email, role FROM users LIMIT 5');
    console.log('Users in database:', users);

    await connection.end();
}

checkUser().catch(console.error);
