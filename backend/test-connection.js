const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function testConnection() {
    try {
        console.log('Attempting to connect with:');
        console.log('Host:', process.env.DB_HOST);
        console.log('Port:', process.env.DB_PORT || 3306);
        console.log('User:', process.env.DB_USER);
        console.log('Database:', process.env.DB_NAME);

        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        console.log('✅ Connection successful!');
        
        // Test query
        const [rows] = await connection.query('SHOW TABLES');
        console.log('Tables in database:', rows);

        await connection.end();
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
    }
}

testConnection();
