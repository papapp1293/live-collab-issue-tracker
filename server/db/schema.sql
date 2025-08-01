-- server/db/schema.sql

-- Users table (only drop if doing a full reset)
-- DROP TABLE IF EXISTS issues CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'developer' NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Issues table
CREATE TABLE IF NOT EXISTS issues (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    ai_summary TEXT,
    status VARCHAR(50) DEFAULT 'open' NOT NULL,
    assigned_developer INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_tester INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

