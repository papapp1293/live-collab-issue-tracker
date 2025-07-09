// server/src/utils/seedUsersOnly.js
// Utility script to seed users manually
const seedUsers = require('./seedUsers');

async function seedUsersOnly() {
    try {
        console.log('👥 Seeding users...');
        await seedUsers();
        console.log('✅ Users seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding users:', error);
        process.exit(1);
    }
}

seedUsersOnly();
