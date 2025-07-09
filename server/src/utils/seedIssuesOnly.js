// server/src/utils/seedIssuesOnly.js
// Utility script to seed sample issues manually
const seedIssues = require('./seedIssues');

async function seedIssuesOnly() {
    try {
        console.log('📋 Seeding sample issues...');
        await seedIssues();
        console.log('✅ Sample issues seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding issues:', error);
        process.exit(1);
    }
}

seedIssuesOnly();
