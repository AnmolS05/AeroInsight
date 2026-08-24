const db = require('../config/database');
const { GoogleGenAI } = require('@google/genai');
const crypto = require('crypto');

// Initialize Gemini SDK
// Note: SDK looks for GEMINI_API_KEY environment variable automatically.
const ai = new GoogleGenAI({});

exports.uploadFlight = async (req, res) => {
    try {
        const telemetryData = req.body;
        if (!Array.isArray(telemetryData) || telemetryData.length === 0) {
            return res.status(400).json({ error: 'Invalid telemetry data' });
        }

        const flightId = crypto.randomUUID();

        // 1. Insert Flight Record
        await new Promise((resolve, reject) => {
            db.run('INSERT INTO flights (id) VALUES (?)', [flightId], function(err) {
                if (err) reject(err);
                resolve();
            });
        });

        // 2. Insert Telemetry points
        const stmt = db.prepare('INSERT INTO telemetry (flight_id, latitude, longitude, altitude, battery, issue, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)');
        for (const point of telemetryData) {
            stmt.run(flightId, point.latitude, point.longitude, point.altitude, point.battery, point.issue || 'none', point.timestamp);
        }
        stmt.finalize();

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
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            reportText = response.text;
        } catch (aiError) {
            console.error('Gemini API Error (Fallback used):', aiError.message);
            reportText = `### AI Analysis Unavailable\n\nThe Gemini AI failed to process this log. This is usually because the \`GEMINI_API_KEY\` is missing or invalid in your \`.env\` file.\n\n**Raw Data Summary:**\n- **Total Data Points:** ${telemetryData.length}\n- **Issues Detected:** ${telemetryData.filter(d => d.issue && d.issue !== 'none').length}`;
        }

        // 4. Save AI Report
        await new Promise((resolve, reject) => {
            db.run('INSERT INTO reports (flight_id, report_text) VALUES (?, ?)', [flightId, reportText], function(err) {
                if (err) reject(err);
                resolve();
            });
        });

        res.status(201).json({ message: 'Flight uploaded and analyzed successfully', flightId });
    } catch (error) {
        console.error('Error processing flight:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getFlights = (req, res) => {
    db.all('SELECT * FROM flights ORDER BY created_at DESC', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
};

exports.getFlightData = (req, res) => {
    const { id } = req.params;
    db.all('SELECT * FROM telemetry WHERE flight_id = ? ORDER BY timestamp ASC', [id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
};

exports.getFlightReport = (req, res) => {
    const { id } = req.params;
    db.get('SELECT report_text FROM reports WHERE flight_id = ?', [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Report not found' });
        }
        res.json({ report: row.report_text });
    });
};
