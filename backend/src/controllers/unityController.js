/**
 * @file unityController.js
 * @description Express controller for Unity 3D Digital Twin, Physics Simulation,
 * Synthetic Telemetry Generation, and Dual-Screen Mission Control endpoints.
 */

const db = require('../config/database');
const crypto = require('crypto');
const unityMcpService = require('../services/unityMcpService');
const mlService = require('../services/mlService');
const geminiService = require('../services/geminiService');
const { z } = require('zod');

/**
 * Checks the status of the local Unity Editor HTTP Bridge.
 *
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next middleware.
 */
exports.getBridgeStatus = async (req, res, next) => {
    try {
        const status = await unityMcpService.checkBridgeStatus();
        res.json({
            success: true,
            data: status,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Reconstructs a flight's trajectory into a 3D digital twin scene.
 *
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next middleware.
 */
exports.reconstructFlight = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Fetch flight telemetry from database
        const telemetryResult = await db.query(
            'SELECT latitude, longitude, altitude, battery, issue, timestamp FROM telemetry WHERE flight_id = $1 ORDER BY id ASC',
            [id]
        );

        if (telemetryResult.rows.length === 0) {
            const err = new Error(`Flight with ID '${id}' not found or contains no telemetry.`);
            err.statusCode = 404;
            return next(err);
        }

        const reconstruction = await unityMcpService.reconstructDigitalTwin(id, telemetryResult.rows);

        res.json({
            success: true,
            data: reconstruction,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Directs Unity Mission Control camera to focus or orbit an anomaly.
 *
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next middleware.
 */
exports.focusCamera = async (req, res, next) => {
    try {
        const { mode, targetPosition, flightId, anomalyDescription } = req.body;

        if (!targetPosition) {
            const err = new Error('targetPosition ({x, y, z} or coordinates) is required.');
            err.statusCode = 400;
            return next(err);
        }

        const result = await unityMcpService.focusMissionControlCamera({
            mode,
            targetPosition,
            flightId,
            anomalyDescription,
        });

        res.json({
            success: true,
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Runs a physics anomaly simulation against an incident flight.
 *
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next middleware.
 */
exports.simulatePhysics = async (req, res, next) => {
    try {
        const { id } = req.params;
        const physicsConfig = req.body || {};

        const result = await unityMcpService.simulatePhysicsIncident(id, physicsConfig);

        res.json({
            success: true,
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Validation schema for synthetic flight generation request.
 */
const syntheticRequestSchema = z.object({
    flightPattern: z.enum(['LawnmowerSurvey', 'OrbitInspection', 'PointToPoint', 'PerimeterPatrol']).default('LawnmowerSurvey'),
    centerLatitude: z.number().min(-90).max(90).default(12.9716),
    centerLongitude: z.number().min(-180).max(180).default(77.5946),
    baseAltitudeMeters: z.number().min(1).max(500).default(35.0),
    totalDurationSeconds: z.number().min(10).max(600).default(60),
    samplingIntervalSeconds: z.number().min(0.5).max(10).default(1),
    injectedAnomaly: z.string().max(100).default('Motor Overheat'),
    anomalyStartSecond: z.number().min(0).max(600).default(40),
});

/**
 * Generates synthetic drone flight telemetry and persists it directly into the database.
 *
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next middleware.
 */
exports.createSyntheticFlight = async (req, res, next) => {
    const parsed = syntheticRequestSchema.safeParse(req.body || {});
    if (!parsed.success) {
        const err = new Error('Invalid synthetic generation options: ' + JSON.stringify(parsed.error.errors));
        err.statusCode = 400;
        return next(err);
    }

    const options = parsed.data;
    const telemetryData = unityMcpService.generateSyntheticTelemetryPoints(options);
    const flightId = `SYNTH_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const client = await db.connect();
    let inTransaction = false;

    try {
        await client.query('BEGIN');
        inTransaction = true;

        // 1. Insert Flight Record
        await client.query('INSERT INTO flights (id) VALUES ($1)', [flightId]);

        // 2. Insert Telemetry points via Bulk Insert
        const latitudes = telemetryData.map((p) => p.latitude);
        const longitudes = telemetryData.map((p) => p.longitude);
        const altitudes = telemetryData.map((p) => p.altitude);
        const batteries = telemetryData.map((p) => p.battery);
        const issues = telemetryData.map((p) => p.issue || 'none');
        const timestamps = telemetryData.map((p) => p.timestamp);

        await client.query(
            `INSERT INTO telemetry (flight_id, latitude, longitude, altitude, battery, issue, timestamp)
             SELECT $1, unnest($2::real[]), unnest($3::real[]), unnest($4::real[]), unnest($5::real[]), unnest($6::text[]), unnest($7::text[])`,
            [flightId, latitudes, longitudes, altitudes, batteries, issues, timestamps]
        );

        // 3. Deterministic ML Risk Assessment
        const baselineRisk = mlService.predictRisk(telemetryData);
        const initialReport = `# Flight Incident Report: ${flightId} (Synthetic Simulation)

## Executive Summary
This flight record was synthetically generated via the AeroInsight Simulation Engine.
- **Flight Pattern:** ${options.flightPattern}
- **Injected Scenario:** ${options.injectedAnomaly} (Triggered at second ${options.anomalyStartSecond})
- **Sample Count:** ${telemetryData.length} waypoints

## Deterministic ML Assessment
- **Risk Level:** ${baselineRisk.riskLevel}
- **Risk Score:** ${(baselineRisk.riskScore * 100).toFixed(1)}%
- **Anomalies Detected:** ${baselineRisk.anomalies.length}

*A comprehensive AI diagnostic evaluation is being processed in the background.*`;

        await client.query(
            'INSERT INTO reports (flight_id, report_text) VALUES ($1, $2)',
            [flightId, initialReport]
        );

        await client.query('COMMIT');
        inTransaction = false;
        client.release();

        // 4. Asynchronously generate deep AI diagnostic report via Gemini
        setImmediate(async () => {
            try {
                const deepAiReport = await geminiService.generateFlightReport(flightId, telemetryData);
                await db.query(
                    'UPDATE reports SET report_text = $1 WHERE flight_id = $2',
                    [deepAiReport, flightId]
                );
            } catch (aiErr) {
                console.warn(`[AeroInsight] Background AI synthesis for ${flightId} deferred: ${aiErr.message}`);
            }
        });

        res.status(201).json({
            success: true,
            flightId,
            message: `Synthetic simulation flight '${flightId}' successfully generated and stored.`,
            meta: {
                flightPattern: options.flightPattern,
                injectedAnomaly: options.injectedAnomaly,
                waypointCount: telemetryData.length,
            },
        });
    } catch (err) {
        if (inTransaction) {
            try {
                await client.query('ROLLBACK');
            } catch (rollbackErr) {
                console.error('Rollback error:', rollbackErr.message);
            }
        }
        client.release();
        next(err);
    }
};
