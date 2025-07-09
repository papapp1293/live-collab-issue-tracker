// server/src/utils/resetDatabase.js
// Run this script when you want to completely reset the database
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const seedUsers = require('./seedUsers');
const seedIssues = require('./seedIssues');

// Reset AI cost monitoring when database is reset
const openaiService = require('../services/openaiService');

const RESET_SCHEMA_FILE = path.join(__dirname, '../../db/reset-schema.sql');

async function resetDatabase() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        const resetSql = fs.readFileSync(RESET_SCHEMA_FILE, 'utf8');

        console.log('🗑️  Dropping all tables and recreating...');
        console.log('   - Users table (with auth data)');
        console.log('   - Issues table (with AI summaries)');
        await pool.query(resetSql);
        console.log('✅ Database reset complete.');

        console.log('👥 Seeding users...');
        await seedUsers();
        console.log('✅ Users seeded.');

        console.log('📋 Seeding sample issues...');
        await seedIssues();
        console.log('✅ Issues seeded.');

        // Reset AI cost monitoring stats
        if (openaiService.isConfigured()) {
            openaiService.resetCostStats();
            console.log('🤖 AI cost monitoring reset.');
        }

        console.log('🎉 Database reset and seeding complete!');

    } catch (error) {
        console.error('❌ Error resetting database:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

resetDatabase();
