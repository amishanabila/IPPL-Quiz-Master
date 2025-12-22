#!/usr/bin/env node
/**
 * Database Export and Import Script
 * Exports local database and imports to Railway
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

console.log('\n========================================');
console.log('📊 Database Export & Import Tool');
console.log('========================================\n');

async function main() {
    try {
        console.log('🔌 Connecting to LOCAL database...');
        const localConn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'quiz_master'
        });
        console.log('✅ Connected to LOCAL quiz_master\n');

        console.log('📤 Exporting database...');
        // Get all tables
        const [tables] = await localConn.query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='quiz_master'");
        console.log(`Found ${tables.length} tables\n`);

        let exportSQL = `-- Quiz Master Database Export\n-- Exported: ${new Date().toISOString()}\n\n`;
        exportSQL += `DROP DATABASE IF EXISTS railway;\n`;
        exportSQL += `CREATE DATABASE railway CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n`;
        exportSQL += `USE railway;\n\n`;

        // Export table structures
        for (const table of tables) {
            const tableName = table.TABLE_NAME;
            const [createTable] = await localConn.query(`SHOW CREATE TABLE \`${tableName}\``);
            exportSQL += createTable[0]['Create Table'] + ';\n\n';
        }

        // Export table data
        for (const table of tables) {
            const tableName = table.TABLE_NAME;
            const [rows] = await localConn.query(`SELECT * FROM \`${tableName}\``);
            
            if (rows.length > 0) {
                const columns = Object.keys(rows[0]);
                const columnList = columns.map(c => `\`${c}\``).join(', ');
                
                for (const row of rows) {
                    const values = columns.map(col => {
                        const val = row[col];
                        if (val === null) return 'NULL';
                        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                        if (Buffer.isBuffer(val)) return `0x${val.toString('hex')}`;
                        return val;
                    }).join(', ');
                    
                    exportSQL += `INSERT INTO \`${tableName}\` (${columnList}) VALUES (${values});\n`;
                }
            }
        }

        const exportPath = path.join(__dirname, '..', 'database-export.sql');
        fs.writeFileSync(exportPath, exportSQL);
        console.log(`✅ Exported to: ${exportPath}`);
        console.log(`   Size: ${(exportSQL.length / 1024).toFixed(2)} KB\n`);

        await localConn.end();

        console.log('========================================');
        console.log('📥 NEXT STEP: Import to Railway');
        console.log('========================================\n');
        console.log('Option 1: Via MySQL CLI (Windows need Laragon/MySQL installed)');
        console.log('  mysql -h shuttle.proxy.rlwy.net -u root -p');
        console.log('  -e "source database-export.sql"\n');
        console.log('Option 2: Via Railway Dashboard Browser');
        console.log('  1. Go to Railway → MySQL → Browser');
        console.log('  2. Open database-export.sql');
        console.log('  3. Copy-paste SQL content to browser');
        console.log('  4. Execute\n');
        console.log('Option 3: Via Node Script (create import-railway.js)');
        console.log('========================================\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();
