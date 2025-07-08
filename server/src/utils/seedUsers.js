// server/src/utils/seedUsers.js
const bcrypt = require('bcrypt');
const db = require('./db');

async function seedUsers() {
    const users = [
        ['papapp1293@gmail.com', 'Papapp', 'developer', 'password'],
        ['alice@example.com', 'Alice', 'manager', 'password'],
        ['bob@example.com', 'Bob', 'developer', 'password'],
    ];

    for (const [email, name, role, plainPassword] of users) {
        const hashed = await bcrypt.hash(plainPassword, 10);
        await db.query(
            `INSERT INTO users (email, name, role, password) VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
            [email, name, role, hashed]
        );
    }

    console.log('✅ Users seeded with hashed passwords');
}

module.exports = seedUsers;
