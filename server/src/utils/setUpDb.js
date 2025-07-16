// server/src/utils/setupDb.js
const { Pool, Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_NAME = 'live_collab_db';
const SCHEMA_FILE = path.join(__dirname, '../../db/schema.sql');
const COMMENTS_SCHEMA_FILE = path.join(__dirname, '../../db/comments-schema.sql');
const ATTACHMENTS_SCHEMA_FILE = path.join(__dirname, '../../db/attachments-schema.sql');

async function setupDatabase() {
  // Connect to default "postgres" DB to manage DB creation
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  try {
    await client.connect();

    // Check if database exists
    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname='${DB_NAME}';`);
    if (res.rowCount === 0) {
      console.log(`Database "${DB_NAME}" does not exist. Creating...`);
      await client.query(`CREATE DATABASE ${DB_NAME};`);
      console.log(`Database "${DB_NAME}" created.`);
    } else {
      console.log(`Database "${DB_NAME}" exists.`);
    }

    await client.end();

    // Now connect to the target DB to run schema and seed
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    const schemaSql = fs.readFileSync(SCHEMA_FILE, 'utf8'); console.log('Running schema.sql...');
    await pool.query(schemaSql);
    console.log('schema.sql executed.');

    // Run comments schema
    const commentsSchemaSql = fs.readFileSync(COMMENTS_SCHEMA_FILE, 'utf8');
    console.log('Running comments-schema.sql...');
    await pool.query(commentsSchemaSql);
    console.log('comments-schema.sql executed.');

    // Run attachments schema
    const attachmentsSchemaSql = fs.readFileSync(ATTACHMENTS_SCHEMA_FILE, 'utf8');
    console.log('Running attachments-schema.sql...');
    await pool.query(attachmentsSchemaSql);
    console.log('attachments-schema.sql executed.');

    // Check if ai_summary column exists
    console.log('Checking ai_summary column...');
    await ensureAISummaryColumn(pool);

    // Migrate to RBAC columns
    console.log('Checking RBAC columns...');
    await migrateToRBACColumns(pool);

    await pool.end();

    console.log('Database setup complete.');
  } catch (err) {
    console.error('Error setting up database:', err);
    process.exit(1);
  }
}

async function ensureAISummaryColumn(pool) {
  try {
    // Check if ai_summary column exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'issues' AND column_name = 'ai_summary';
    `);

    if (columnCheck.rows.length === 0) {
      console.log('ai_summary column does not exist. Adding it...');
      await pool.query('ALTER TABLE issues ADD COLUMN ai_summary TEXT;');
      console.log('ai_summary column added successfully!');
    } else {
      console.log('ai_summary column already exists.');
    }
  } catch (error) {
    console.error('Error ensuring ai_summary column:', error);
    throw error;
  }
}

async function migrateToRBACColumns(pool) {
  try {
    // Check if new RBAC columns exist
    const developerColumnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'issues' AND column_name = 'assigned_developer';
    `);

    const testerColumnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'issues' AND column_name = 'assigned_tester';
    `);

    if (developerColumnCheck.rows.length === 0) {
      console.log('RBAC columns do not exist. Adding them...');

      // Add new columns
      await pool.query('ALTER TABLE issues ADD COLUMN assigned_developer INTEGER REFERENCES users(id) ON DELETE SET NULL;');
      await pool.query('ALTER TABLE issues ADD COLUMN assigned_tester INTEGER REFERENCES users(id) ON DELETE SET NULL;');

      // Migrate existing assigned_to data to assigned_developer
      const existingAssignments = await pool.query('SELECT id, assigned_to FROM issues WHERE assigned_to IS NOT NULL;');

      for (const issue of existingAssignments.rows) {
        // Check if assigned user is a developer
        const userRole = await pool.query('SELECT role FROM users WHERE id = $1', [issue.assigned_to]);
        if (userRole.rows.length > 0) {
          const role = userRole.rows[0].role;
          if (role === 'developer') {
            await pool.query('UPDATE issues SET assigned_developer = $1 WHERE id = $2', [issue.assigned_to, issue.id]);
          } else if (role === 'tester') {
            await pool.query('UPDATE issues SET assigned_tester = $1 WHERE id = $2', [issue.assigned_to, issue.id]);
          }
        }
      }

      // Drop old column after migration
      await pool.query('ALTER TABLE issues DROP COLUMN IF EXISTS assigned_to;');

      console.log('RBAC columns added and data migrated successfully!');
    } else {
      console.log('RBAC columns already exist.');
    }
  } catch (error) {
    console.error('Error migrating to RBAC columns:', error);
    throw error;
  }
}

module.exports = setupDatabase;
