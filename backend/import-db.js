const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

async function importDatabase() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true
    });

    console.log('Connected to Railway MySQL');

    // Read SQL file
    let sqlFile = fs.readFileSync(
        path.join(__dirname, 'database', 'quiz_master.sql'),
        'utf8'
    );

    console.log('Processing SQL file...');
    
    // Remove DELIMITER commands and replace $$ with ;
    sqlFile = sqlFile
        .replace(/DELIMITER \$\$/gi, '')
        .replace(/DELIMITER ;/gi, '')
        .replace(/\$\$/g, ';')
        .replace(/DEFINER=`[^`]+`@`[^`]+`/g, ''); // Remove DEFINER clauses

    console.log('Importing database...');
    
    try {
        await connection.query(sqlFile);
        console.log('✅ Database imported successfully!');
    } catch (error) {
        console.error('❌ Error importing database:', error.message);
        console.error('Full error:', error);
    }

    await connection.end();
}

importDatabase();
