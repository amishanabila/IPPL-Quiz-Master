const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env.local') });
dotenv.config({ path: path.join(__dirname, '.env') });

async function setupDatabase() {
    try {
        console.log('🔄 Starting database setup...');
        console.log(`📊 Connecting to ${process.env.DB_HOST} as ${process.env.DB_USER}`);

        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true
        });

        console.log('✅ Connected to MySQL');

        // Read SQL file
        const sqlFile = path.join(__dirname, 'database', '01_setup.sql');
        let sql = fs.readFileSync(sqlFile, 'utf8');

        // Split by DELIMITER blocks and regular statements
        const parts = sql.split(/DELIMITER\s+(.+?)\s*\n/);
        let successCount = 0;
        let skipCount = 0;

        for (let i = 0; i < parts.length; i++) {
            let part = parts[i].trim();
            if (!part) continue;

            // If this is a delimiter (odd indices after split)
            if (i % 2 === 1) {
                const currentDelimiter = part;
                i++; // Move to the content
                if (i >= parts.length) break;

                const content = parts[i];
                // Split content by current delimiter
                const delimiterBlocks = content.split(new RegExp(`${currentDelimiter}\\s*$`, 'm'));

                for (let block of delimiterBlocks) {
                    block = block.trim();
                    if (!block) continue;

                    // Reset delimiter back to ;
                    try {
                        await connection.query(block);
                        successCount++;
                    } catch (error) {
                        // Skip errors for already-existing objects
                        if (error.code !== 'ER_TABLE_EXISTS_ERROR' && 
                            error.code !== 'ER_DUP_KEYNAME' &&
                            !error.message.includes('already exists')) {
                            console.error(`⚠️  Warning: ${error.message.substring(0, 80)}`);
                        }
                        skipCount++;
                    }
                }
            } else {
                // Regular statements (split by ;)
                const statements = part.split(';').filter(s => s.trim());
                
                for (let stmt of statements) {
                    stmt = stmt.trim();
                    if (!stmt) continue;

                    try {
                        await connection.query(stmt);
                        successCount++;
                    } catch (error) {
                        // Skip errors for already-existing objects
                        if (error.code !== 'ER_TABLE_EXISTS_ERROR' && 
                            error.code !== 'ER_DUP_KEYNAME' &&
                            !error.message.includes('already exists')) {
                            console.error(`⚠️  Warning: ${error.message.substring(0, 80)}`);
                        }
                        skipCount++;
                    }
                }
            }
        }

        console.log('✅ Database setup completed successfully');
        console.log(`📊 Executed: ${successCount} statements`);
        console.log(`📦 Database: ${process.env.DB_NAME || 'quiz_master'}`);

        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Database connection error:', error.message);
        process.exit(1);
    }
}

setupDatabase();
