#!/usr/bin/env node

// Script to set up the comments table in the database
const db = require('./src/utils/db');
const fs = require('fs');
const path = require('path');

async function setupCommentsTable() {
    try {
        console.log('🔧 Setting up comments table...');

        // Read the comments schema file
        const schemaPath = path.join(__dirname, 'db', 'comments-schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Execute the schema
        await db.query(schema);

        console.log('✅ Comments table created successfully!');
        console.log('📝 The comments table supports:');
        console.log('   - Threaded discussions (parent_comment_id for replies)');
        console.log('   - User attribution (user_id with user info)');
        console.log('   - Soft deletion (is_deleted flag)');
        console.log('   - Timestamps (created_at, updated_at)');
        console.log('   - Performance indexes');

    } catch (error) {
        console.error('❌ Error setting up comments table:', error);
        process.exit(1);
    }
}

// Run the setup if this script is executed directly
if (require.main === module) {
    setupCommentsTable()
        .then(() => {
            console.log('🎉 Comments table setup complete!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Setup failed:', error);
            process.exit(1);
        });
}

module.exports = { setupCommentsTable };
