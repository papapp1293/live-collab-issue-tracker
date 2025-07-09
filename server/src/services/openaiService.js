const OpenAI = require('openai');

class OpenAIService {
    constructor() {
        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
        });
    }

    /**
     * Generate a concise AI summary for an issue based on title and description
     * @param {string} title - The issue title
     * @param {string} description - The issue description
     * @returns {Promise<string>} AI-generated summary
     */
    async generateIssueSummary(title, description) {
        try {
            if (!title && !description) {
                return null;
            }

            const prompt = `You are an AI assistant helping to summarize software issues from a quality management perspective. 
Create a concise, professional 1-2 sentence summary of the following issue:

Title: ${title || 'No title provided'}
Description: ${description || 'No description provided'}

Summary should be:
- Clear and technical
- Focus on the core problem or feature
- Comprehensive yet concise
- Max 200 words

Summary:`;

            const response = await this.client.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 200,
                temperature: 0.3,
                top_p: 1.0,
                frequency_penalty: 0.0,
                presence_penalty: 0.0
            });

            const summary = response.choices[0]?.message?.content?.trim();

            if (!summary) {
                console.warn('OpenAI returned empty summary');
                return null;
            }

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
}

module.exports = new OpenAIService();
