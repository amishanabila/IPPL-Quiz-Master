#!/usr/bin/env node
/**
 * Railway Debug Script
 * Helps diagnose Railway backend issues
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('\n========================================');
console.log('🔍 Railway Backend Debug Information');
console.log('========================================\n');

// Load .env
const envPath = path.join(__dirname, 'backend', '.env');
const envLocal = fs.existsSync(envPath) ? dotenv.parse(fs.readFileSync(envPath)) : {};

console.log('📋 Environment Variables Status:\n');

const requiredVars = [
    'PORT',
    'NODE_ENV',
    'DB_HOST',
    'DB_PORT',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'JWT_SECRET',
    'FRONTEND_URL'
];

requiredVars.forEach(varName => {
    const value = process.env[varName] || envLocal[varName];
    const status = value ? '✅' : '❌';
    const displayValue = value ? 
        (varName.includes('PASSWORD') || varName.includes('SECRET') ? 
            value.substring(0, 10) + '...' : value) 
        : '(not set)';
    
    console.log(`${status} ${varName}: ${displayValue}`);
});

console.log('\n⚠️  Important Check List:\n');

const checks = [
    {
        name: 'Environment Variables in Railway Dashboard',
        tips: [
            '1. Go to https://railway.app',
            '2. Select project: IPPL-Quiz-Master',
            '3. Select service: Backend (Node.js)',
            '4. Click tab: Variables (NOT Settings)',
            '5. Add all variables mentioned above',
            '6. Click Deploy to redeploy'
        ]
    },
    {
        name: 'Database Connection',
        tips: [
            'After setting variables, backend will:',
            '1. Load variables from Railway Dashboard',
            '2. Run setup-db.js to check/create tables',
            '3. Start Express server on PORT 5000'
        ]
    },
    {
        name: 'Verify Backend is Running',
        tips: [
            'Test health endpoint:',
            'curl https://ippl-quiz-master-production.up.railway.app/health',
            '',
            'Should return:',
            '{"status":"ok","database":"connected",...}'
        ]
    }
];

checks.forEach(check => {
    console.log(`📌 ${check.name}:`);
    check.tips.forEach(tip => console.log(`   ${tip}`));
    console.log();
});

console.log('========================================\n');
console.log('❓ If backend still not working:');
console.log('   1. Check Railway Logs → Backend Service → Logs');
console.log('   2. Look for error messages');
console.log('   3. Verify DB_HOST and DB_PORT are correct');
console.log('   4. Try accessing /health endpoint\n');
