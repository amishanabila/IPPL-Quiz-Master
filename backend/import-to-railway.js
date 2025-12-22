#!/usr/bin/env node
/**
 * Import quiz_master.sql to Railway MySQL
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function importToRailway() {
    try {
        console.log('\n========================================');
        console.log('📥 Import quiz_master.sql to Railway');
        console.log('========================================\n');

        const sqlFile = path.join(__dirname, 'database', 'quiz_master.sql');
        
        if (!fs.existsSync(sqlFile)) {
            console.error('❌ File not found:', sqlFile);
            process.exit(1);
        }

        console.log('📄 Reading SQL file...');
        let sqlContent = fs.readFileSync(sqlFile, 'utf8');
        console.log(`✅ Loaded ${(sqlContent.length / 1024 / 1024).toFixed(2)} MB of SQL\n`);

        // Clean up SQL
        sqlContent = sqlContent
            .replace(/DELIMITER \$\$/gi, '')
            .replace(/DELIMITER ;/gi, '')
            .replace(/\$\$/g, ';')
            .replace(/DEFINER=`[^`]+`@`[^`]+`/g, '');

        console.log('🔌 Connecting to Railway MySQL...');
        const connection = await mysql.createConnection({
            host: 'shuttle.proxy.rlwy.net',
            port: 43358,
            user: 'root',
            password: 'wKdNtcTjTLGpGzQyIAmhxyEsAyLlSBGC',
            database: 'railway',
            multipleStatements: true,
            connectTimeout: 10000
        });
        console.log('✅ Connected to Railway!\n');

        console.log('⏳ Executing SQL (this may take a moment)...');
        const startTime = Date.now();
        
        await connection.query(sqlContent);
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ SQL executed successfully in ${duration}s!\n`);

        // Verify tables
        const [tables] = await connection.query('SHOW TABLES');
        console.log(`📊 Tables in Railway database: ${tables.length}`);
        tables.forEach(row => {
            const tableName = Object.values(row)[0];
            console.log(`   ✓ ${tableName}`);
        });

        await connection.end();

        console.log('\n========================================');
        console.log('✅ DATABASE IMPORT SUCCESSFUL!');
        console.log('========================================\n');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('\nTroubleshooting:');
        console.error('1. Make sure Railway MySQL is running');
        console.error('2. Check credentials: root / wKdNtcTjTLGpGzQyIAmhxyEsAyLlSBGC');
        console.error('3. Verify host: shuttle.proxy.rlwy.net:43358');
        console.error('4. Database: railway\n');
        process.exit(1);
    }
}

importToRailway();
