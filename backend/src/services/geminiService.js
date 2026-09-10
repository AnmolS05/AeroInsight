/**
 * @file geminiService.js
 * @description Production-grade Google Gemini AI integration service with multi-model fallback,
 * exponential backoff retry logic, and precise telemetry error diagnostics.
 */

const { GoogleGenAI } = require('@google/genai');

/**
 * Ordered list of candidate models used for resilient fallback.
 * If the primary model experiences transient capacity spikes (HTTP 503),
 * requests automatically cascade to secondary and tertiary candidates.
 */
const CANDIDATE_MODELS = [
    'gemini-3.6-flash',
    'gemini-3.7-flash',
    'gemini-flash-latest'
];

/**
 * Delays execution for a specified duration.
 *
 * @param {number} ms - Milliseconds to sleep.
 * @returns {Promise<void>} Resolves when duration elapses.
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Determines whether an error returned by Gemini or the network layer is retryable.
 *
 * @param {Error|Object} error - Error object or API response error.
 * @returns {boolean} True if the operation should be retried with exponential backoff.
 */
function isRetryableError(error) {
    if (!error) return false;
    const status = error.status || error.code || (error.error && error.error.code);
    const message = (error.message || '').toLowerCase();

    if (status === 503 || status === 429 || status === 500) return true;
    if (message.includes('high demand') || message.includes('unavailable') || message.includes('quota') || message.includes('rate limit')) return true;
    if (message.includes('econnreset') || message.includes('etimedout') || message.includes('fetch failed')) return true;

    return false;
}

/**
 * Categorizes an error and generates a user-facing diagnosis string.
 *
 * @param {Error|Object} error - Caught error object.
 * @returns {string} Explanatory markdown message tailored to the specific failure mode.
 */
function categorizeError(error) {
    if (!process.env.GEMINI_API_KEY) {
        return 'The `GEMINI_API_KEY` environment variable is not configured on the server. Please add your Gemini API key in your deployment environment variables.';
    }

    const message = (error && error.message) ? error.message : '';
    const status = error && (error.status || (error.error && error.error.code));

    if (status === 400 || status === 401 || status === 403 || message.includes('API_KEY_INVALID') || message.includes('API key')) {
        return 'The Gemini API key is invalid or unauthorized. Please verify the `GEMINI_API_KEY` environment variable in your Vercel project settings.';
    }

    if (status === 503 || message.includes('high demand') || message.includes('UNAVAILABLE')) {
        return 'The Google Gemini service is temporarily experiencing high demand across flash models. Spikes in demand are temporary; please click **Regenerate Report** to retry.';
    }

    if (status === 429 || message.includes('RESOURCE_EXHAUSTED') || message.includes('quota')) {
        return 'Gemini API rate limit or quota has been reached. Please wait a moment and click **Regenerate Report**.';
    }

    return `The Gemini AI service encountered an unexpected error (${message || 'Status ' + status}). Please click **Regenerate Report** to re-evaluate.`;
}

/**
 * Downsamples dense telemetry datasets to prevent excessive prompt token volume
 * while preserving critical start/end coordinates, anomalies, and extrema.
 *
 * @param {Array<Object>} telemetryData - Full array of telemetry data points.
 * @param {number} [maxPoints=60] - Target point budget for downsampled trajectory.
 * @returns {Array<Object>} Optimized telemetry points for LLM ingestion.
 */
function prepareTelemetryPromptPayload(telemetryData, maxPoints = 60) {
    if (!Array.isArray(telemetryData) || telemetryData.length <= maxPoints) {
        return telemetryData;
    }

    const flaggedPoints = telemetryData.filter((point) => point.issue && point.issue !== 'none');
    const step = Math.ceil(telemetryData.length / maxPoints);
    const sampledPoints = [];

    for (let i = 0; i < telemetryData.length; i += step) {
        sampledPoints.push(telemetryData[i]);
    }

    // Always guarantee inclusion of first and last points
    if (sampledPoints[0] !== telemetryData[0]) {
        sampledPoints.unshift(telemetryData[0]);
    }
    if (sampledPoints[sampledPoints.length - 1] !== telemetryData[telemetryData.length - 1]) {
        sampledPoints.push(telemetryData[telemetryData.length - 1]);
    }

    // Merge flagged issue points without duplicates
    const combined = [...sampledPoints];
    for (const fp of flaggedPoints) {
        if (!combined.some((p) => p.timestamp === fp.timestamp)) {
            combined.push(fp);
        }
    }

    // Sort chronologically if timestamps are valid
    combined.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    return combined;
}

/**
 * Builds the structured drone telemetry analysis prompt for Google Gemini.
 *
 * @param {Array<Object>} telemetryData - Full telemetry data array.
 * @param {Array<Object>} promptPayload - Optimized telemetry points subset.
 * @returns {string} Formatted prompt string.
 */
function buildAnalysisPrompt(telemetryData, promptPayload) {
    const totalPoints = telemetryData.length;
    const flaggedCount = telemetryData.filter((p) => p.issue && p.issue !== 'none').length;

    return `
You are an expert drone telemetry and avionics analyst. Analyze the following drone flight telemetry dataset:
- Total Logged Points: ${totalPoints}
- Flagged Anomaly Points: ${flaggedCount}

Telemetry Points:
${JSON.stringify(promptPayload, null, 2)}

Provide a rigorous avionics inspection briefing covering:
1. Flight Duration and Trajectory Summary.
2. Anomaly Analysis: Specific coordinates, altitudes, or timestamps where issues (e.g. structural cracks, battery drops, abnormal yaw/pitch) were detected.
3. Airworthiness Assessment and Recommended Maintenance Actions.

Format strictly in clean, professional Markdown with clear section headers.
`.trim();
}

/**
 * Executes a resilient generation request across candidate Gemini models
 * with exponential backoff retries.
 *
 * @param {string} prompt - Prompt to evaluate.
 * @returns {Promise<{ text: string, modelUsed: string }>} Generation result and model identifier.
 */
async function generateWithFallback(prompt) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        const error = new Error('GEMINI_API_KEY_MISSING');
        error.status = 401;
        throw error;
    }

    const ai = new GoogleGenAI({ apiKey });
    let lastError = null;

    for (const model of CANDIDATE_MODELS) {
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                const response = await ai.models.generateContent({
                    model,
                    contents: prompt
                });

                if (response && response.text) {
                    return { text: response.text, modelUsed: model };
                }
            } catch (err) {
                lastError = err;
                console.warn(`Gemini generation attempt ${attempt} for model '${model}' failed:`, err.message || err);

                if (isRetryableError(err) && attempt < 2) {
                    await sleep(attempt * 600);
                    continue;
                }
                break;
            }
        }
    }

    throw lastError;
}

/**
 * Analyzes flight telemetry data using Gemini AI with full resilience,
 * model cascading, and graceful fallback reporting.
 *
 * @param {Array<Object>} telemetryData - Raw telemetry point records.
 * @returns {Promise<{ reportText: string, isSuccessful: boolean, modelUsed?: string }>} Analysis result.
 */
async function analyzeFlightTelemetry(telemetryData) {
    if (!telemetryData || telemetryData.length === 0) {
        return {
            reportText: '### AI Analysis Unavailable\n\nTelemetry dataset is empty. No points available for analysis.',
            isSuccessful: false
        };
    }

    const promptPayload = prepareTelemetryPromptPayload(telemetryData);
    const prompt = buildAnalysisPrompt(telemetryData, promptPayload);

    try {
        const result = await generateWithFallback(prompt);
        return {
            reportText: result.text,
            isSuccessful: true,
            modelUsed: result.modelUsed
        };
    } catch (error) {
        console.error('All Gemini AI model attempts exhausted:', error);
        const diagnosticMessage = categorizeError(error);

        const fallbackReport = `### AI Analysis Temporarily Unavailable\n\n${diagnosticMessage}\n\n**Telemetry Overview:**\n- **Total Telemetry Points:** ${telemetryData.length}\n- **Points Analyzed in Sampling:** ${promptPayload.length}`;

        return {
            reportText: fallbackReport,
            isSuccessful: false
        };
    }
}

module.exports = {
    analyzeFlightTelemetry,
    generateWithFallback,
    prepareTelemetryPromptPayload,
    isRetryableError,
    categorizeError,
    CANDIDATE_MODELS
};
