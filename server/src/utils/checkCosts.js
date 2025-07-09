#!/usr/bin/env node

/**
 * Cost monitoring script for OpenAI API usage
 * Run with: node src/utils/checkCosts.js
 */

require('dotenv').config();
const openaiService = require('../services/openaiService');

async function checkCosts() {
    console.log('🤖 OpenAI API Cost Monitor\n');

    // Check if configured
    if (!openaiService.isConfigured()) {
        console.log('❌ OpenAI API not configured');
        console.log('   Add OPENAI_API_KEY to your .env file\n');
        return;
    }

    console.log('✅ OpenAI API configured\n');

    // Get current stats
    const stats = openaiService.getCostStats();

    console.log('📊 Usage Statistics:');
    console.log(`   Total Requests: ${stats.totalRequests}`);
    console.log(`   Total Cost: ${stats.totalEstimatedCostFormatted}`);
    console.log(`   Average/Request: ${stats.averageCostPerRequestFormatted}`);
    console.log(`   Tracking Since: ${stats.lastReset.toLocaleString()}\n`);

    // Example cost estimates
    console.log('💰 Cost Examples (gpt-4o-mini):');

    const examples = [
        { title: 'Short bug', desc: 'Button not working' },
        { title: 'Medium feature request', desc: 'Add user authentication with email verification and password reset functionality' },
        { title: 'Long technical issue', desc: 'The application crashes when processing large datasets (>10MB) due to memory constraints. Need to implement streaming or pagination. Error occurs in the data processing module specifically when parsing CSV files with more than 100,000 rows. Stack trace shows OutOfMemoryError in the transformer component.' }
    ];

    examples.forEach((example, i) => {
        const cost = openaiService.estimateRequestCost(example.title, example.desc);
        console.log(`   ${i + 1}. "${example.title}" - ${cost.toFixed(6)} USD`);
    });

    console.log('\n🎯 Model: gpt-4o-mini (optimized for cost)');
    console.log('   Input: $0.000150/1K tokens');
    console.log('   Output: $0.000600/1K tokens');
    console.log('   ~95% cheaper than GPT-4!\n');
}

// Run if called directly
if (require.main === module) {
    checkCosts().catch(console.error);
}

module.exports = checkCosts;
