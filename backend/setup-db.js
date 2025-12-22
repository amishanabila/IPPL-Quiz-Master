#!/usr/bin/env node
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

async function setupDatabase() {
    let connection;
    try {
        console.log('🔌 Connecting to Railway MySQL...');
        console.log(`Host: ${process.env.DB_HOST}`);
        console.log(`Port: ${process.env.DB_PORT}`);
        console.log(`Database: ${process.env.DB_NAME}`);

        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            multipleStatements: true,
            connectionLimit: 1
        });

        console.log('✅ Connected to database!\n');

        // Check if tables exist
        const [tables] = await connection.query('SHOW TABLES');
        console.log(`📊 Existing tables: ${tables.length}\n`);

        if (tables.length === 0) {
            console.log('📝 No tables found. Importing schema...\n');
            
            let sqlContent = fs.readFileSync(
                path.join(__dirname, 'database', 'quiz_master.sql'),
                'utf8'
            );

            // Clean up SQL for compatibility
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

            for (const statement of sqlContent) {
                try {
                    if (statement.includes('CREATE') || statement.includes('INSERT') || statement.includes('ALTER')) {
                        await connection.query(statement);
                        successCount++;
                    }
                } catch (err) {
                    if (!err.message.includes('already exists')) {
                        errorCount++;
                        console.warn(`⚠️  Error executing statement: ${err.message.substring(0, 50)}...`);
                    }
                }
            }

            console.log(`✅ Executed ${successCount} statements successfully`);
            if (errorCount > 0) console.log(`⚠️  ${errorCount} statements had errors (may be expected)\n`);
        } else {
            console.log('✅ Database already has tables. Skipping schema import.\n');
        }

        // Verify tables
        const [finalTables] = await connection.query('SHOW TABLES');
        console.log('📋 Final tables in database:');
        finalTables.forEach(row => {
            const tableName = Object.values(row)[0];
            console.log(`   - ${tableName}`);
        });

        console.log('\n✅ Database setup complete!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error during setup:', error.message);
        console.error('\nTroubleshooting:');
        console.error('1. Verify .env credentials are correct');
        console.error('2. Check if Railway MySQL service is running');
        console.error('3. Ensure you have network access to the database');
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

setupDatabase();
