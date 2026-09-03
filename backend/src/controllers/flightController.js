const db = require('../config/database');
const { GoogleGenAI } = require('@google/genai');
const crypto = require('crypto');
const mlService = require('../services/mlService');
const { z } = require('zod');

// Schema to validate incoming telemetry data arrays
const telemetrySchema = z.array(
    z.object({
        latitude: z.number(),
        longitude: z.number(),
        altitude: z.number(),
        battery: z.number(),
        issue: z.string().max(500).optional(),
        timestamp: z.string()
    })
).max(100000); // Prevent ridiculously huge arrays from crashing memory

// Initialize Gemini SDK
// Pass the API key explicitly for Vercel Serverless compatibility
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

exports.uploadFlight = async (req, res, next) => {
    const client = await db.connect();
    try {
        const parsedBody = telemetrySchema.safeParse(req.body);
        if (!parsedBody.success) {
            const err = new Error('Invalid telemetry data: ' + JSON.stringify(parsedBody.error.errors));
            err.statusCode = 400;
            return next(err);
        }
        const telemetryData = parsedBody.data;

        if (telemetryData.length === 0) {
            const err = new Error('Telemetry data is empty');
            err.statusCode = 400;
            return next(err);
        }

        const flightId = crypto.randomUUID();

        // Start ACID Transaction
        await client.query('BEGIN');

        // 1. Insert Flight Record
        await client.query('INSERT INTO flights (id) VALUES ($1)', [flightId]);

        // 2. Insert Telemetry points via Bulk Insert (UNNEST) to prevent pool exhaustion and speed up insertion
        const latitudes = telemetryData.map(p => p.latitude);
        const longitudes = telemetryData.map(p => p.longitude);
        const altitudes = telemetryData.map(p => p.altitude);
        const batteries = telemetryData.map(p => p.battery);
        const issues = telemetryData.map(p => p.issue || 'none');
        const timestamps = telemetryData.map(p => p.timestamp);

        await client.query(`
            INSERT INTO telemetry (flight_id, latitude, longitude, altitude, battery, issue, timestamp)
            SELECT $1, unnest($2::real[]), unnest($3::real[]), unnest($4::real[]), unnest($5::real[]), unnest($6::text[]), unnest($7::text[])
        `, [flightId, latitudes, longitudes, altitudes, batteries, issues, timestamps]);

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
        await client.query('INSERT INTO reports (flight_id, report_text) VALUES ($1, $2)', [flightId, reportText]);

        // Commit transaction
        await client.query('COMMIT');

        res.status(201).json({ message: 'Flight uploaded and analyzed successfully', flightId });
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
};

exports.getFlights = async (req, res, next) => {
    try {
        const result = await db.query('SELECT * FROM flights ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
};

exports.getFlightData = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT * FROM telemetry WHERE flight_id = $1 ORDER BY timestamp ASC', [id]);
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
};

exports.getFlightReport = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT report_text FROM reports WHERE flight_id = $1', [id]);
        if (result.rows.length === 0) {
            const err = new Error('Report not found');
            err.statusCode = 404;
            return next(err);
        }
        res.json({ report: result.rows[0].report_text });
    } catch (err) {
        next(err);
    }
};

exports.regenerateFlightReport = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // 1. Fetch telemetry data
        const telemetryResult = await db.query('SELECT * FROM telemetry WHERE flight_id = $1 ORDER BY timestamp ASC', [id]);
        if (telemetryResult.rows.length === 0) {
            const err = new Error('Flight telemetry not found');
            err.statusCode = 404;
            return next(err);
        }
        const telemetryData = telemetryResult.rows;

        // 2. Trigger AI Analysis
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
            console.error('Gemini API Error during regeneration:', aiError);
            reportText = `### AI Analysis Unavailable\n\nThe Gemini AI failed to process this log. Please check your API key.\n\n**Raw Data Summary:**\n- **Total Data Points:** ${telemetryData.length}`;
        }
        
        // Append ML Risk Score
        const mlAnalysis = mlService.analyzeFlightRisk(telemetryData);
        if (mlAnalysis) {
            reportText += `\n\n### 🤖 ML Flight Risk Assessment\n- **Predicted Risk:** ${mlAnalysis.riskScore === 'High Risk' ? '**🔴 High Risk**' : '**🟢 Low Risk**'}\n- **Telemetry Factors:**\n  - Max Altitude: ${mlAnalysis.features.max_altitude.toFixed(1)}m\n  - Battery Drain: ${mlAnalysis.features.battery_drain.toFixed(1)}%\n  - Est. Duration: ${mlAnalysis.features.flight_duration.toFixed(1)} min\n`;
        }

        // 3. Update AI Report in Database
        await db.query('UPDATE reports SET report_text = $1 WHERE flight_id = $2', [reportText, id]);

        res.json({ report: reportText });
    } catch (err) {
        next(err);
    }
};

exports.deleteFlight = async (req, res, next) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM telemetry WHERE flight_id = $1', [id]);
        await db.query('DELETE FROM reports WHERE flight_id = $1', [id]);
        const result = await db.query('DELETE FROM flights WHERE id = $1', [id]);
        
        if (result.rowCount === 0) {
            const err = new Error('Flight not found');
            err.statusCode = 404;
            return next(err);
        }
        res.json({ message: 'Flight deleted successfully' });
    } catch (err) {
        next(err);
    }
};
