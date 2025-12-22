#!/usr/bin/env node
/**
 * Railway Database Connection Troubleshooter
 * Helps diagnose and fix database connection issues
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

console.log('\n' + '='.repeat(60));
console.log('🔍 RAILWAY DATABASE CONNECTION TROUBLESHOOTER');
console.log('='.repeat(60) + '\n');

// Load .env
const envPath = path.join(__dirname, '.env');
const envContent = fs.existsSync(envPath) ? dotenv.parse(fs.readFileSync(envPath)) : {};

console.log('📋 Current Configuration:\n');

const config = {
    DB_HOST: process.env.DB_HOST || envContent.DB_HOST,
    DB_PORT: process.env.DB_PORT || envContent.DB_PORT,
    DB_USER: process.env.DB_USER || envContent.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD || envContent.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME || envContent.DB_NAME,
    NODE_ENV: process.env.NODE_ENV || envContent.NODE_ENV,
};

Object.entries(config).forEach(([key, value]) => {
    let display = value;
    if (key.includes('PASSWORD') || key.includes('SECRET')) {
        display = value ? value.substring(0, 8) + '...' : '(not set)';
    } else if (!value) {
        display = '❌ (not set)';
    }
    console.log(`  ${key}: ${display}`);
});

console.log('\n' + '='.repeat(60));
console.log('🧪 Testing Database Connection...\n');

testConnection();

async function testConnection() {
    try {
        const testConfig = {
            host: config.DB_HOST || 'localhost',
            port: parseInt(config.DB_PORT) || 3306,
            user: config.DB_USER || 'root',
            password: config.DB_PASSWORD || '',
            database: config.DB_NAME || 'quiz_master',
            connectTimeout: 5000
        };

        console.log('Attempting connection with:');
        console.log(`  Host: ${testConfig.host}`);
        console.log(`  Port: ${testConfig.port}`);
        console.log(`  User: ${testConfig.user}`);
        console.log(`  Database: ${testConfig.database}\n`);

        const connection = await mysql.createConnection(testConfig);
        console.log('✅ CONNECTION SUCCESSFUL!\n');

        const [tables] = await connection.query('SHOW TABLES');
        console.log(`📊 Tables in database: ${tables.length}`);
        if (tables.length > 0) {
            tables.forEach(row => {
                console.log(`   - ${Object.values(row)[0]}`);
            });
        }

        await connection.end();
        console.log('\n' + '='.repeat(60));
        console.log('✅ Database is working correctly!');
        console.log('='.repeat(60) + '\n');

        process.exit(0);

    } catch (error) {
        console.error('❌ CONNECTION FAILED!\n');
        console.error('Error:', error.message);
        console.error('Error Code:', error.code, '\n');

        console.log('='.repeat(60));
        console.log('🔧 TROUBLESHOOTING STEPS:\n');

        const solutions = {
            'ECONNREFUSED': [
                '1. Database server is not running or unreachable',
                '2. Wrong DB_HOST or DB_PORT',
                '3. Firewall blocking connection',
                '',
                'Solutions:',
                '- Check if MySQL is running',
                '- Verify DB_HOST (localhost for dev, mysql.railway.internal for Railway)',
                '- Verify DB_PORT (3306 for internal, 43358 for external proxy)',
                '- Check Railway firewall settings'
            ],
            'PROTOCOL_CONNECTION_LOST': [
                '1. Connection timeout',
                '2. Database closed connection',
                '',
                'Solutions:',
                '- Increase connectTimeout in config',
                '- Check database is running',
                '- Verify credentials are correct'
            ],
            'ER_ACCESS_DENIED_ERROR': [
                '1. Wrong username or password',
                '2. User permissions issue',
                '',
                'Solutions:',
                '- Verify DB_USER and DB_PASSWORD',
                '- Check Railway MySQL service credentials',
                '- Reset password if needed'
            ]
        };

        const solution = solutions[error.code] || [
            '1. Unknown error',
            '2. Check Railway logs for more details',
            '3. Verify all environment variables'
        ];

        solution.forEach(line => console.log(line));

        console.log('\n' + '='.repeat(60));
        console.log('📍 NEXT STEPS:\n');
        console.log('1. Go to Railway Dashboard');
        console.log('2. Select IPPL-Quiz-Master → Backend');
        console.log('3. Click Variables tab');
        console.log('4. Update these variables:\n');
        console.log('   Option A (Internal - Recommended):');
        console.log('     DB_HOST=mysql.railway.internal');
        console.log('     DB_PORT=3306\n');
        console.log('   Option B (External Proxy):');
        console.log('     DB_HOST=shuttle.proxy.rlwy.net');
        console.log('     DB_PORT=43358\n');
        console.log('5. Save and wait for redeploy');
        console.log('='.repeat(60) + '\n');

        process.exit(1);
    }
}
