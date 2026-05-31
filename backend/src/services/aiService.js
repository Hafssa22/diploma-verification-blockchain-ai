require('dotenv').config();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';

/**
 * Send diploma data to the AI microservice for fraud detection.
 * The AI service (Task 3 - Python/Scikit-learn) returns:
 *   { status: "valid" | "suspect" | "fraudulent", score: float, details: string[] }
 *
 * @param {Object} diplomaData
 * @returns {Promise<Object>} AI analysis result
 */
async function analyzeDiploma(diplomaData) {
  try {
    console.log(`[AI] Sending diploma to AI service: ${AI_SERVICE_URL}/analyze`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(`${AI_SERVICE_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(diplomaData),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI service responded with ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log(`[AI] Analysis result: ${result.status} (score: ${result.score})`);

    return result;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('[AI] AI service timeout - returning default valid status');
    } else {
      console.warn('[AI] AI service unavailable:', error.message);
    }

    // Graceful degradation: if AI service is down, don't block diploma operations
    return {
      status: 'unknown',
      score: null,
      details: ['AI service temporarily unavailable'],
      aiAvailable: false,
    };
  }
}

/**
 * Check AI service health
 * @returns {Promise<boolean>}
 */
async function checkAIHealth() {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

module.exports = {
  analyzeDiploma,
  checkAIHealth,
};
