// Alternative database config that supports DATABASE_URL
const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

console.log('[DB Config] Initializing database connection...');

// Support both individual vars and DATABASE_URL
let dbConfig = {};

if (process.env.DATABASE_URL) {
    // Parse DATABASE_URL format: mysql://user:pass@host:port/dbname
    console.log('[DB Config] Using DATABASE_URL...');
    
    const url = new URL(process.env.DATABASE_URL);
    dbConfig = {
        host: url.hostname,
        port: url.port || 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1),
    };
} else {
    // Use individual environment variables
    console.log('[DB Config] Using individual DB_* variables...');
    
    dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'quiz_master',
    };
}

console.log('[DB Config] Connecting to:', dbConfig.host, ':', dbConfig.port);

const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelayMs: 0,
    charset: 'utf8mb4',
    connectTimeout: 10000
});

const promisePool = pool.promise();

pool.on('error', (err) => {
    console.error('[DB Error]', err.code, ':', err.message);
});

console.log('[DB Config] Database pool initialized!');

module.exports = promisePool;
