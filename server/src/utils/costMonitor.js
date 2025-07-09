/**
 * Simple cost monitoring utility for OpenAI API usage
 * Tracks estimated costs and usage statistics
 */

class CostMonitor {
    constructor() {
        this.resetStats();
    }

    /**
     * Reset all tracking statistics
     */
    resetStats() {
        this.stats = {
            totalRequests: 0,
            totalEstimatedCost: 0,
            averageCostPerRequest: 0,
            lastReset: new Date()
        };
    }

    /**
     * Record an AI summary generation request
     * @param {number} estimatedCost - Estimated cost in USD
     */
    recordRequest(estimatedCost = 0) {
        this.stats.totalRequests++;
        this.stats.totalEstimatedCost += estimatedCost;
        this.stats.averageCostPerRequest = this.stats.totalEstimatedCost / this.stats.totalRequests;
    }

    /**
     * Get current usage statistics
     * @returns {Object} Usage statistics
     */
    getStats() {
        return {
            ...this.stats,
            totalEstimatedCostFormatted: `$${this.stats.totalEstimatedCost.toFixed(6)}`,
            averageCostPerRequestFormatted: `$${this.stats.averageCostPerRequest.toFixed(6)}`,
            uptime: Date.now() - this.stats.lastReset.getTime()
        };
    }

    /**
     * Log current statistics to console
     */
    logStats() {
        const stats = this.getStats();
        console.log('\n=== OpenAI API Usage Stats ===');
        console.log(`Total Requests: ${stats.totalRequests}`);
        console.log(`Total Estimated Cost: ${stats.totalEstimatedCostFormatted}`);
        console.log(`Average Cost/Request: ${stats.averageCostPerRequestFormatted}`);
        console.log(`Tracking Since: ${stats.lastReset.toISOString()}`);
        console.log('===============================\n');
    }

    /**
     * Check if usage exceeds threshold and warn
     * @param {number} dailyThreshold - Daily cost threshold in USD
     */
    checkThreshold(dailyThreshold = 1.0) {
        const uptimeHours = (Date.now() - this.stats.lastReset.getTime()) / (1000 * 60 * 60);
        const estimatedDailyCost = (this.stats.totalEstimatedCost / uptimeHours) * 24;

        if (estimatedDailyCost > dailyThreshold) {
            console.warn(`⚠️  WARNING: Estimated daily OpenAI cost ($${estimatedDailyCost.toFixed(4)}) exceeds threshold ($${dailyThreshold})`);
            return true;
        }
        return false;
    }
}

// Create singleton instance
const costMonitor = new CostMonitor();

module.exports = costMonitor;
