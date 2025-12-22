#!/usr/bin/env node
/**
 * Import using Railway CLI (simpler method)
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

async function importUsingRailwayCLI() {
    try {
        console.log('\n========================================');
        console.log('📥 Import using Railway CLI');
        console.log('========================================\n');

        // Check if railway CLI is installed
        console.log('🔍 Checking Railway CLI...');
        try {
            await execAsync('railway --version');
            console.log('✅ Railway CLI found\n');
        } catch {
            console.error('❌ Railway CLI not installed');
            console.error('   Install: npm install -g @railway/cli\n');
            process.exit(1);
        }

        // Check SQL file
        const sqlFile = path.join(__dirname, 'database', 'quiz_master.sql');
        if (!fs.existsSync(sqlFile)) {
            console.error('❌ SQL file not found:', sqlFile);
            process.exit(1);
        }
        console.log('✅ SQL file found\n');

        // Run railway connect
        console.log('🔌 Connecting to Railway MySQL...');
        console.log('   Please authenticate with Railway when prompted\n');

        // This would require interactive authentication
        console.log('Run this command manually:');
        console.log('  railway connect MySQL');
        console.log('  Then use: mysql -e "source database/quiz_master.sql"\n');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

importUsingRailwayCLI();
