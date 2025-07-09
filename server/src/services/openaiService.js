const OpenAI = require('openai');
const costMonitor = require('../utils/costMonitor');

class OpenAIService {
    constructor() {
        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
        });
    }

    /**
     * Generate a concise AI summary for an issue based on title and description
     * Uses gpt-4o-mini for cost efficiency (~$0.000150/1K tokens vs $0.03/1K for GPT-4)
     * @param {string} title - The issue title
     * @param {string} description - The issue description
     * @returns {Promise<string>} AI-generated summary
     */
    async generateIssueSummary(title, description) {
        try {
            if (!title && !description) {
                return null;
            }

            // Estimate cost for monitoring
            const estimatedCost = this.estimateRequestCost(title, description);

            const prompt = `Summarize this software issue in 1-2 concise sentences. MAKE SURE IT IS UNDER 300 CHARACTERS:

Title: ${title || 'No title'}
Description: ${description || 'No description'}

Focus on the core problem/feature. Be technical and clear:`;

            const response = await this.client.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 150,
                temperature: 0.1, // Reduced for more deterministic, concise responses
                top_p: 0.9, // Slightly reduced for efficiency
                frequency_penalty: 0.1, // Small penalty to avoid repetition
                presence_penalty: 0.0
            });

            const summary = response.choices[0]?.message?.content?.trim();

            if (!summary) {
                console.warn('OpenAI returned empty summary');
                return null;
            }



            // Record usage for cost monitoring
            costMonitor.recordRequest(estimatedCost);

            // Return the full summary without truncation
            return summary;

        } catch (error) {
            console.error('Error generating AI summary:', error);

            // Return null on error - we'll handle this gracefully in the controller
            return null;
        }
    }

    /**
     * Check if OpenAI service is properly configured
     * @returns {boolean} True if API key is configured
     */
    isConfigured() {
        return !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-api-key-here');
    }

    /**
     * Estimate the cost for a typical summary request
     * Based on gpt-4o-mini pricing: $0.000150/1K input tokens, $0.0006/1K output tokens
     * @param {string} title - Issue title
     * @param {string} description - Issue description
     * @returns {number} Estimated cost in USD
     */
    estimateRequestCost(title = '', description = '') {
        // Rough estimate: ~4 chars per token
        const inputTokens = Math.ceil((title.length + description.length + 100) / 4); // +100 for prompt
        const outputTokens = 25; // Max ~100 tokens, but typically much less

        const inputCost = (inputTokens / 1000) * 0.000150;
        const outputCost = (outputTokens / 1000) * 0.0006;

        return inputCost + outputCost;
    }

    /**
     * Get cost monitoring statistics
     * @returns {Object} Cost statistics
     */
    getCostStats() {
        return costMonitor.getStats();
    }

    /**
     * Reset cost monitoring statistics
     */
    resetCostStats() {
        costMonitor.resetStats();
    }
}

module.exports = new OpenAIService();
