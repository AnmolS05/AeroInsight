const db = require('../config/database');
const crypto = require('crypto');
const mlService = require('../services/mlService');
const geminiService = require('../services/geminiService');
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
).max(100000); // Prevent excessively large arrays from exhausting memory

/**
 * Handles drone flight telemetry upload, persists data transactionally,
 * and generates automated flight intelligence evaluations.
 *
 * @param {import('express').Request} req - Express HTTP request.
 * @param {import('express').Response} res - Express HTTP response.
 * @param {import('express').NextFunction} next - Express next middleware.
 */
exports.uploadFlight = async (req, res, next) => {
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

    const client = await db.connect();
    let inTransaction = false;

    try {
        const flightId = crypto.randomUUID();

        // Start ACID Transaction
        await client.query('BEGIN');
        inTransaction = true;

        // 1. Insert Flight Record
        await client.query('INSERT INTO flights (id) VALUES ($1)', [flightId]);

        // 2. Insert Telemetry points via Bulk Insert (UNNEST) to optimize throughput
        const latitudes = telemetryData.map((p) => p.latitude);
        const longitudes = telemetryData.map((p) => p.longitude);
        const altitudes = telemetryData.map((p) => p.altitude);
        const batteries = telemetryData.map((p) => p.battery);
        const issues = telemetryData.map((p) => p.issue || 'none');
        const timestamps = telemetryData.map((p) => p.timestamp);

        await client.query(`
            INSERT INTO telemetry (flight_id, latitude, longitude, altitude, battery, issue, timestamp)
            SELECT $1, unnest($2::real[]), unnest($3::real[]), unnest($4::real[]), unnest($5::real[]), unnest($6::text[]), unnest($7::text[])
        `, [flightId, latitudes, longitudes, altitudes, batteries, issues, timestamps]);

        // 3. Compute Deterministic ML Flight Risk Assessment immediately
        const mlAnalysis = mlService.analyzeFlightRisk(telemetryData);
        let mlSection = '';
        if (mlAnalysis) {
            mlSection = `\n\n### 🤖 ML Flight Risk Assessment\n- **Predicted Risk:** ${mlAnalysis.riskScore === 'High Risk' ? '**🔴 High Risk**' : '**🟢 Low Risk**'}\n- **Telemetry Profile:**\n  - Peak Altitude: **${mlAnalysis.features.max_altitude.toFixed(1)}m**\n  - Battery Depletion: **${mlAnalysis.features.battery_drain.toFixed(1)}%**\n  - Flight Duration: **${mlAnalysis.features.flight_duration.toFixed(1)} min**\n  - Average Velocity: **${mlAnalysis.features.avg_speed.toFixed(1)} m/s**\n`;
        }

        // 4. Synthesize AI Analysis with timeout race for Serverless execution guarantees
        let reportText = '';
        try {
            const aiResult = await Promise.race([
                geminiService.analyzeFlightTelemetry(telemetryData),
                new Promise((resolve) => setTimeout(() => resolve({
                    reportText: '### 🤖 Autonomous Mission Evaluation\n\nTelemetry points logged successfully. Real-time GenAI briefing scheduled.',
                    isSuccessful: false
                }), 6500))
            ]);
            reportText = (aiResult.reportText || '### 🤖 Autonomous Mission Evaluation') + mlSection;
        } catch (aiErr) {
            console.warn('Initial flight upload AI evaluation bypassed:', aiErr.message || aiErr);
            reportText = `### 🤖 Autonomous Mission Evaluation\n\nTelemetry points recorded successfully.${mlSection}\n\n*Click **Regenerate Report** to refresh the GenAI briefing.*`;
        }

        // 5. Save Initial Baseline Report & Commit Transaction
        await client.query('INSERT INTO reports (flight_id, report_text) VALUES ($1, $2)', [flightId, reportText]);
        await client.query('COMMIT');
        inTransaction = false;

        return res.status(201).json({ message: 'Flight uploaded and analyzed successfully', flightId });
    } catch (error) {
        if (inTransaction) {
            try {
                await client.query('ROLLBACK');
            } catch (rollbackErr) {
                console.error('Failed to rollback transaction:', rollbackErr.message);
            }
        }
        next(error);
    } finally {
        client.release();
    }
};

/**
 * Retrieves all registered flight missions ordered by creation timestamp.
 *
 * @param {import('express').Request} req - Express HTTP request.
 * @param {import('express').Response} res - Express HTTP response.
 * @param {import('express').NextFunction} next - Express next middleware.
 */
exports.getFlights = async (req, res, next) => {
    try {
        const result = await db.query('SELECT * FROM flights ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
};

/**
 * Retrieves chronological telemetry records for a given flight identifier.
 *
 * @param {import('express').Request} req - Express HTTP request.
 * @param {import('express').Response} res - Express HTTP response.
 * @param {import('express').NextFunction} next - Express next middleware.
 */
exports.getFlightData = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT * FROM telemetry WHERE flight_id = $1 ORDER BY timestamp ASC', [id]);
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
};

/**
 * Retrieves the stored evaluation report for a flight mission.
 *
 * @param {import('express').Request} req - Express HTTP request.
 * @param {import('express').Response} res - Express HTTP response.
 * @param {import('express').NextFunction} next - Express next middleware.
 */
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

/**
 * Re-analyzes flight telemetry data and updates the persistent evaluation report
 * using multi-model Gemini fallback, retry handling, and ML risk computation.
 *
 * @param {import('express').Request} req - Express HTTP request.
 * @param {import('express').Response} res - Express HTTP response.
 * @param {import('express').NextFunction} next - Express next middleware.
 */
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

        // 2. Trigger resilient AI Analysis with model fallback and retries
        const aiResult = await geminiService.analyzeFlightTelemetry(telemetryData);
        let reportText = aiResult.reportText;
        
        // Append ML Risk Score
        const mlAnalysis = mlService.analyzeFlightRisk(telemetryData);
        if (mlAnalysis) {
            reportText += `\n\n### 🤖 ML Flight Risk Assessment\n- **Predicted Risk:** ${mlAnalysis.riskScore === 'High Risk' ? '**🔴 High Risk**' : '**🟢 Low Risk**'}\n- **Telemetry Factors:**\n  - Max Altitude: ${mlAnalysis.features.max_altitude.toFixed(1)}m\n  - Battery Drain: ${mlAnalysis.features.battery_drain.toFixed(1)}%\n  - Est. Duration: ${mlAnalysis.features.flight_duration.toFixed(1)} min\n  - Average Velocity: ${mlAnalysis.features.avg_speed.toFixed(1)} m/s\n`;
        }

        // 3. Update AI Report in Database (upsert or update)
        const updateResult = await db.query('UPDATE reports SET report_text = $1 WHERE flight_id = $2', [reportText, id]);
        if (updateResult.rowCount === 0) {
            await db.query('INSERT INTO reports (flight_id, report_text) VALUES ($1, $2)', [id, reportText]);
        }

        res.json({ report: reportText });
    } catch (err) {
        next(err);
    }
};

/**
 * Deletes a flight mission along with its telemetry and report records.
 *
 * @param {import('express').Request} req - Express HTTP request.
 * @param {import('express').Response} res - Express HTTP response.
 * @param {import('express').NextFunction} next - Express next middleware.
 */
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
