#!/usr/bin/env node
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

async function setupDatabase() {
    let connection;
    try {
        console.log('\n========================================');
        console.log('🔌 Database Setup Started');
        console.log('========================================\n');

        console.log('📋 Configuration:');
        console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
        console.log(`   Port: ${process.env.DB_PORT || 3306}`);
        console.log(`   User: ${process.env.DB_USER || 'root'}`);
        console.log(`   Database: ${process.env.DB_NAME || 'quiz_master'}\n`);

        console.log('🔌 Connecting to database...');
        
        const connectionConfig = {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'quiz_master',
            multipleStatements: true,
            connectionLimit: 1,
            waitForConnections: true,
            enableKeepAlive: true,
            connectTimeout: 10000
        };

        connection = await mysql.createConnection(connectionConfig);
        console.log('✅ Connected to database!\n');

        // Check if tables exist
        const [tables] = await connection.query('SHOW TABLES');
        console.log(`📊 Existing tables: ${tables.length}`);

        if (tables.length > 0) {
            console.log('✅ Database already initialized. Skipping schema import.\n');
            tables.forEach(row => {
                const tableName = Object.values(row)[0];
                console.log(`   - ${tableName}`);
            });
        } else {
            console.log('📝 No tables found. Importing schema...\n');
            
            let sqlContent = fs.readFileSync(
                path.join(__dirname, 'database', 'quiz_master.sql'),
                'utf8'
            );

            // Clean up SQL
            sqlContent = sqlContent
                .replace(/DELIMITER \$\$/gi, '')
                .replace(/DELIMITER ;/gi, '')
                .replace(/\$\$/g, ';')
                .replace(/DEFINER=`[^`]+`@`[^`]+`/g, '')
                .split(';')
                .filter(statement => statement.trim().length > 0)
                .map(statement => statement.trim() + ';');

            let successCount = 0;
            let errorCount = 0;
            let skipCount = 0;

            for (const statement of sqlContent) {
                try {
                    await connection.query(statement);
                    successCount++;
                } catch (err) {
                    if (err.message.includes('already exists') || 
                        err.message.includes('Duplicate') ||
                        err.message.includes('already defined')) {
                        skipCount++;
                    } else {
                        errorCount++;
                    }
                }
            }

            console.log(`✅ Executed ${successCount} statements`);
            if (skipCount > 0) console.log(`⏭️  Skipped ${skipCount} (already exist)`);
            if (errorCount > 0) console.log(`⚠️  ${errorCount} errors\n`);
        }

        // Final verification
        const [finalTables] = await connection.query('SHOW TABLES');
        console.log(`\n✅ Final table count: ${finalTables.length}`);
        console.log('========================================\n');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Database Setup Failed!\n');
        console.error('Error:', error.message);
        console.error('\n📋 Troubleshooting:');
        console.error('   1. Check if MySQL is running');
        console.error('   2. Verify DB_HOST is correct (localhost or Railway host)');
        console.error('   3. Verify DB_PORT is correct (3306 or 43358)');
        console.error('   4. Check DB_USER and DB_PASSWORD');
        console.error('   5. Ensure DB_NAME exists\n');
        
        // Don't exit, let server start anyway
        console.warn('⚠️  Continuing without database... (may fail at first request)\n');
        process.exit(0);
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (err) {
                // Ignore close errors
            }
        }
    }
}

// Handle async errors
process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection:', err);
    process.exit(0); // Don't crash, let server start
});

setupDatabase();

