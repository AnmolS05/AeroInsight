const db = require('../config/database');
const { GoogleGenAI } = require('@google/genai');
const crypto = require('crypto');
const mlService = require('../services/mlService');

// Initialize Gemini SDK
// Pass the API key explicitly for Vercel Serverless compatibility
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

exports.uploadFlight = async (req, res) => {
    try {
        const telemetryData = req.body;
        if (!Array.isArray(telemetryData) || telemetryData.length === 0) {
            return res.status(400).json({ error: 'Invalid telemetry data' });
        }

        const flightId = crypto.randomUUID();

        // 1. Insert Flight Record
        await db.query('INSERT INTO flights (id) VALUES ($1)', [flightId]);

        // 2. Insert Telemetry points
        for (const point of telemetryData) {
            await db.query(
                'INSERT INTO telemetry (flight_id, latitude, longitude, altitude, battery, issue, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [flightId, point.latitude, point.longitude, point.altitude, point.battery, point.issue || 'none', point.timestamp]
            );
        }

        // 3. Trigger AI Analysis
        const prompt = `
You are an expert drone telemetry analyst. Analyze the following drone flight JSON data:
${JSON.stringify(telemetryData)}

Identify:
1. Total flight duration estimate.
2. Specific GPS coordinates where issues (like cracks, battery drops, structural anomalies) were flagged.
3. A professional assessment and recommended maintenance steps.

Provide the output strictly in clean Markdown format with headers.
`;

        let reportText = '';
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3.6-flash',
                contents: prompt,
            });
            reportText = response.text;
        } catch (aiError) {
            console.error('Gemini API Error (Fallback used):', JSON.stringify(aiError, null, 2), aiError.message, aiError.stack);
            reportText = `### AI Analysis Unavailable\n\nThe Gemini AI failed to process this log. This is usually because the \`GEMINI_API_KEY\` is missing or invalid in your \`.env\` file.\n\n**Raw Data Summary:**\n- **Total Data Points:** ${telemetryData.length}\n- **Issues Detected:** ${telemetryData.filter(d => d.issue && d.issue !== 'none').length}`;
        }
        
        // Append ML Risk Score
        const mlAnalysis = mlService.analyzeFlightRisk(telemetryData);
        if (mlAnalysis) {
            reportText += `\n\n### 🤖 ML Flight Risk Assessment\n- **Predicted Risk:** ${mlAnalysis.riskScore === 'High Risk' ? '**🔴 High Risk**' : '**🟢 Low Risk**'}\n- **Telemetry Factors:**\n  - Max Altitude: ${mlAnalysis.features.max_altitude.toFixed(1)}m\n  - Battery Drain: ${mlAnalysis.features.battery_drain.toFixed(1)}%\n  - Est. Duration: ${mlAnalysis.features.flight_duration.toFixed(1)} min\n`;
        }

        // 4. Save AI Report
        await db.query('INSERT INTO reports (flight_id, report_text) VALUES ($1, $2)', [flightId, reportText]);

        res.status(201).json({ message: 'Flight uploaded and analyzed successfully', flightId });
    } catch (error) {
        console.error('Error processing flight:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getFlights = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM flights ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

exports.getFlightData = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT * FROM telemetry WHERE flight_id = $1 ORDER BY timestamp ASC', [id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

exports.getFlightReport = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT report_text FROM reports WHERE flight_id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }
        res.json({ report: result.rows[0].report_text });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

exports.deleteFlight = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM telemetry WHERE flight_id = $1', [id]);
        await db.query('DELETE FROM reports WHERE flight_id = $1', [id]);
        const result = await db.query('DELETE FROM flights WHERE id = $1', [id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Flight not found' });
        }
        res.json({ message: 'Flight deleted successfully' });
    } catch (err) {
        console.error('Error deleting flight:', err);
        res.status(500).json({ error: 'Database error' });
    }
};
