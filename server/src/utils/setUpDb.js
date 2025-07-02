// server/src/utils/setupDb.js
const { Pool, Client } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const DB_NAME = 'live_collab_db';
const SCHEMA_FILE = path.join(__dirname, '../../db/schema.sql');
const SEED_FILE = path.join(__dirname, '../../db/seed.sql');

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

    const schemaSql = fs.readFileSync(SCHEMA_FILE, 'utf8');
    const seedSql = fs.readFileSync(SEED_FILE, 'utf8');

    console.log('Running schema.sql...');
    await pool.query(schemaSql);
    console.log('schema.sql executed.');

    console.log('Running seed.sql...');
    await pool.query(seedSql);
    console.log('seed.sql executed.');

    await pool.end();

    console.log('Database setup complete.');
  } catch (err) {
    console.error('Error setting up database:', err);
    process.exit(1);
  }
}

module.exports = setupDatabase;
