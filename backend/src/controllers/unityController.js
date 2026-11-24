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

        // Fetch flight telemetry from database or in-memory fallback
        let telemetryPoints = [];
        try {
            const telemetryResult = await db.query(
                'SELECT latitude, longitude, altitude, battery, issue, timestamp FROM telemetry WHERE flight_id = $1 ORDER BY id ASC',
                [id]
            );
            if (telemetryResult && telemetryResult.rows && telemetryResult.rows.length > 0) {
                telemetryPoints = telemetryResult.rows;
            }
        } catch {}

        if (telemetryPoints.length === 0 && db.inMemoryStore) {
            telemetryPoints = db.inMemoryStore.getTelemetry(id);
        }

        if (telemetryPoints.length === 0) {
            const err = new Error(`Flight with ID '${id}' not found or contains no telemetry.`);
            err.statusCode = 404;
            return next(err);
        }

        const reconstruction = await unityMcpService.reconstructDigitalTwin(id, telemetryPoints);

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
        let telemetryPoints = physicsConfig.telemetry || [];

        if (!telemetryPoints || telemetryPoints.length === 0) {
            try {
                const dbResult = await db.query(
                    'SELECT latitude, longitude, altitude, battery, issue, timestamp FROM telemetry WHERE flight_id = $1 ORDER BY timestamp ASC',
                    [id]
                );
                if (dbResult && dbResult.rows) {
                    telemetryPoints = dbResult.rows;
                }
            } catch {
                // Non-fatal if database is local/offline
            }
        }

        const result = await unityMcpService.simulatePhysicsIncident(id, physicsConfig, telemetryPoints);

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
    flightPattern: z.enum([
        'LawnmowerSurvey',
        'OrbitInspection',
        'PointToPoint',
        'PerimeterPatrol',
        'SolarArrayInspection',
        'WindTurbineInspection',
        'CellTowerInspection'
    ]).default('LawnmowerSurvey'),
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
    try {
        const parsed = syntheticRequestSchema.safeParse(req.body || {});
        if (!parsed.success) {
            const err = new Error('Invalid synthetic generation options: ' + JSON.stringify(parsed.error.errors));
            err.statusCode = 400;
            return next(err);
        }

        const options = parsed.data;
        const telemetryData = unityMcpService.generateSyntheticTelemetryPoints(options);
        const flightId = `SYNTH_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
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

        let client = null;
        let inTransaction = false;

        try {
            client = await db.connect();
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

            // 3. Insert Report
            await client.query(
                'INSERT INTO reports (flight_id, report_text) VALUES ($1, $2)',
                [flightId, initialReport]
            );

            await client.query('COMMIT');
            inTransaction = false;
            client.release();
            client = null;
        } catch (dbErr) {
            if (inTransaction && client) {
                try { await client.query('ROLLBACK'); } catch {}
            }
            if (client) {
                try { client.release(); } catch {}
                client = null;
            }
            console.warn(`[AeroInsight] Database write fallback (${dbErr.message}). Storing flight '${flightId}' in resilient memory store.`);
            if (db.inMemoryStore) {
                db.inMemoryStore.saveFlight(flightId, { created_at: new Date().toISOString() });
                db.inMemoryStore.saveTelemetry(flightId, telemetryData);
                db.inMemoryStore.saveReport(flightId, initialReport);
            }
        }

        // 4. Asynchronously generate deep AI diagnostic report via Gemini
        setImmediate(async () => {
            try {
                const deepAiReport = await geminiService.generateFlightReport(flightId, telemetryData);
                if (db.inMemoryStore) {
                    db.inMemoryStore.saveReport(flightId, deepAiReport);
                }
                await db.query('UPDATE reports SET report_text = $1 WHERE flight_id = $2', [deepAiReport, flightId]);
            } catch {}
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
        next(err);
    }
};

/**
 * Interrogates and reconstructs the Flight Data Recorder (FDR) Black Box for an incident flight.
 *
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next middleware.
 */
exports.generateBlackBoxReport = async (req, res, next) => {
    try {
        const flightId = req.params.id || req.body.flightId;
        let telemetryPoints = req.body.telemetry || [];

        if (!telemetryPoints || telemetryPoints.length === 0) {
            try {
                const dbResult = await db.query(
                    'SELECT latitude, longitude, altitude, battery, issue, timestamp FROM telemetry WHERE flight_id = $1 ORDER BY id ASC',
                    [flightId]
                );
                if (dbResult && dbResult.rows && dbResult.rows.length > 0) {
                    telemetryPoints = dbResult.rows;
                }
            } catch {
                // Non-fatal if DB is offline or local
            }
        }

        if (!telemetryPoints || telemetryPoints.length === 0) {
            const err = new Error(`No flight telemetry available for Black Box reconstruction on '${flightId}'.`);
            err.statusCode = 404;
            return next(err);
        }

        const report = await unityMcpService.generateBlackBoxFDRReport(flightId, telemetryPoints, req.body.context || {});

        res.json({
            success: true,
            data: report,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Generates a multi-drone tactical swarm mission with synchronized formation telemetry and deconfliction envelopes.
 *
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next middleware.
 */
exports.createSwarmFlight = async (req, res, next) => {
    try {
        const options = req.body || {};
        const swarmData = unityMcpService.generateSwarmMissionTelemetry(options);
        const flightId = `SWARM_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        const client = await db.connect();
        let inTransaction = false;

        try {
            await client.query('BEGIN');
            inTransaction = true;

            // 1. Insert Flight Record
            await client.query('INSERT INTO flights (id) VALUES ($1)', [flightId]);

            // 2. Insert Lead Telemetry
            const leaderPts = swarmData.leader;
            const latitudes = leaderPts.map((p) => p.latitude);
            const longitudes = leaderPts.map((p) => p.longitude);
            const altitudes = leaderPts.map((p) => p.altitude);
            const batteries = leaderPts.map((p) => p.battery);
            const issues = leaderPts.map((p) => p.issue || 'none');
            const timestamps = leaderPts.map((p) => p.timestamp);

            await client.query(
                `INSERT INTO telemetry (flight_id, latitude, longitude, altitude, battery, issue, timestamp)
                 SELECT $1, unnest($2::real[]), unnest($3::real[]), unnest($4::real[]), unnest($5::real[]), unnest($6::text[]), unnest($7::text[])`,
                [flightId, latitudes, longitudes, altitudes, batteries, issues, timestamps]
            );

            // 3. Initial ML Assessment
            const baselineRisk = mlService.predictRisk(leaderPts);
            const swarmReport = `# Swarm Mission Log: ${flightId}
## Tactical Formation
- **Formation Geometry:** ${swarmData.deconfliction.formation}
- **Active UAVs:** ${swarmData.deconfliction.activeUAVCount}
- **Separation Target:** ${swarmData.deconfliction.targetSeparationMeters}m
- **Airspace Status:** ${swarmData.deconfliction.airspaceStatus}

## Wingman UAV Units
${swarmData.wingmen.map((w) => `- **${w.callsign}:** Offset (${w.offsetMeters.x}m, ${w.offsetMeters.y}m, ${w.offsetMeters.z}m) relative to Leader`).join('\n')}

## Risk Assessment
- **Risk Level:** ${baselineRisk.riskLevel}
- **Risk Score:** ${(baselineRisk.riskScore * 100).toFixed(1)}%`;

            await client.query(
                'INSERT INTO reports (flight_id, report_text) VALUES ($1, $2)',
                [flightId, swarmReport]
            );

            await client.query('COMMIT');
            inTransaction = false;
            client.release();

            res.status(201).json({
                success: true,
                flightId,
                message: `Swarm formation flight '${flightId}' successfully created and stored.`,
                data: swarmData,
            });
        } catch (dbErr) {
            if (inTransaction) {
                try {
                    await client.query('ROLLBACK');
                } catch {}
            }
            client.release();
            throw dbErr;
        }
    } catch (err) {
        next(err);
    }
};

/**
 * Inspects a specific drone subsystem component (Motor 1-4, Battery, ESC, IMU),
 * calculates empirical thermal stress and vibration diagnostics, and dispatches SceneView framing.
 *
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next middleware.
 */
exports.inspectComponent = async (req, res, next) => {
    try {
        const { componentName = 'Motor_1_FR', telemetryPoint = {}, anomalyDescription = '', flightId = 'LIVE' } = req.body || {};

        const subsystemHealth = unityMcpService.calculateSubsystemHealth(telemetryPoint, anomalyDescription);
        const targetSubsystem = subsystemHealth.subsystems[componentName] || {
            name: componentName,
            status: 'NOMINAL',
            healthPercent: 95,
        };

        const bridgeResult = await unityMcpService.inspectDroneComponent(componentName, {
            flightId,
            status: targetSubsystem.status,
            healthPercent: targetSubsystem.healthPercent,
            rpm: targetSubsystem.rpm,
            tempC: targetSubsystem.tempC,
        });

        res.json({
            success: true,
            componentName,
            subsystem: targetSubsystem,
            overallHealthScore: subsystemHealth.overallHealthScore,
            status: subsystemHealth.status,
            allSubsystems: subsystemHealth.subsystems,
            bridge: bridgeResult,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Generates synthetic telemetry via the Unity MCP engine (C# SyntheticTelemetryEngine),
 * persists result to the database, and returns the flight ID.
 * Supports both single UAV missions and coordinated multi-UAV swarm missions.
 */
exports.generateSyntheticViaMcp = async (req, res, next) => {
    try {
        const options = req.body || {};
        const isSwarm = Boolean(options.isSwarmMode || (options.swarmCount && options.swarmCount > 1));
        let telemetryData;
        let flightId;
        let swarmMeta = null;

        if (isSwarm) {
            const swarmData = unityMcpService.generateSwarmMissionTelemetry(options);
            telemetryData = swarmData.leader;
            swarmMeta = swarmData.deconfliction;
            flightId = `SWARM_MCP_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        } else {
            telemetryData = unityMcpService.generateSyntheticTelemetryPoints(options);
            flightId = `SYNTH_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        }

        const baselineRisk = mlService.predictRisk(telemetryData);
        const initialReport = `# Flight Incident Report: ${flightId} (MCP Synthetic — Unity Engine)

## Executive Summary
This synthetic mission was generated via the Unity MCP engine pipeline.
- **Flight Mode:** ${isSwarm ? `Tactical Swarm (${options.swarmCount || 2} UAVs, ${options.formation || 'V-Formation'})` : 'Single UAV'}
- **Flight Pattern:** ${options.flightPattern || 'LawnmowerSurvey'}
- **Injected Scenario:** ${options.injectedAnomaly || 'None'} (triggered at second ${options.anomalyStartSecond || 40})
- **Sample Count:** ${telemetryData.length} waypoints

## Deterministic ML Assessment
- **Risk Level:** ${baselineRisk.riskLevel}
- **Risk Score:** ${(baselineRisk.riskScore * 100).toFixed(1)}%

*Deep avionics inspection will be updated upon completion.*`;

        let client = null;
        let inTransaction = false;

        try {
            client = await db.connect();
            await client.query('BEGIN');
            inTransaction = true;

            await client.query('INSERT INTO flights (id) VALUES ($1)', [flightId]);

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

            await client.query(
                'INSERT INTO reports (flight_id, report_text) VALUES ($1, $2)',
                [flightId, initialReport]
            );

            await client.query('COMMIT');
            inTransaction = false;
            client.release();
            client = null;
        } catch (dbErr) {
            if (inTransaction && client) {
                try { await client.query('ROLLBACK'); } catch {}
            }
            if (client) {
                try { client.release(); } catch {}
                client = null;
            }
            console.warn(`[AeroInsight] MCP synthetic DB fallback (${dbErr.message}). Storing in memory.`);
            if (db.inMemoryStore) {
                db.inMemoryStore.saveFlight(flightId, { created_at: new Date().toISOString() });
                db.inMemoryStore.saveTelemetry(flightId, telemetryData);
                db.inMemoryStore.saveReport(flightId, initialReport);
            }
        }

        setImmediate(async () => {
            try {
                const deepAiReport = await geminiService.generateFlightReport(flightId, telemetryData);
                if (db.inMemoryStore) {
                    db.inMemoryStore.saveReport(flightId, deepAiReport);
                }
                await db.query('UPDATE reports SET report_text = $1 WHERE flight_id = $2', [deepAiReport, flightId]);
            } catch {}
        });

        res.status(201).json({
            success: true,
            flightId,
            message: `MCP synthetic flight '${flightId}' generated via Unity engine.`,
            meta: {
                flightPattern: options.flightPattern,
                injectedAnomaly: options.injectedAnomaly,
                waypointCount: telemetryData.length,
                isSwarm,
                deconfliction: swarmMeta,
            },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Retrieves the connection status, capabilities, and tool inventory from the local Unity MCP Server.
 *
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next middleware.
 */
exports.getMcpStatus = async (req, res, next) => {
    try {
        const mcpStatus = await unityMcpService.getMcpStatus();
        res.json({
            success: true,
            data: mcpStatus,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Executes a tool on the Unity MCP Server dynamically.
 *
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next middleware.
 */
exports.executeMcpTool = async (req, res, next) => {
    try {
        const { toolName, args = {} } = req.body;
        if (!toolName) {
            const err = new Error('toolName is required for MCP tool execution.');
            err.statusCode = 400;
            return next(err);
        }

        const execution = await unityMcpService.executeMcpTool(toolName, args);
        res.json({
            success: execution.success,
            data: execution,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Reconstructs a flight's 3D digital twin directly via Unity Model Context Protocol (MCP) tools.
 * Implements Concept 1: The AI Digital Twin Creator.
 *
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next middleware.
 */
exports.reconstructMcpTwin = async (req, res, next) => {
    try {
        const { id } = req.params;

        let telemetryPoints = [];
        try {
            const telemetryResult = await db.query(
                'SELECT latitude, longitude, altitude, battery, issue, timestamp FROM telemetry WHERE flight_id = $1 ORDER BY id ASC',
                [id]
            );
            if (telemetryResult && telemetryResult.rows && telemetryResult.rows.length > 0) {
                telemetryPoints = telemetryResult.rows;
            }
        } catch {}

        if (telemetryPoints.length === 0 && db.inMemoryStore) {
            telemetryPoints = db.inMemoryStore.getTelemetry(id);
        }

        if (telemetryPoints.length === 0) {
            const err = new Error(`Flight with ID '${id}' not found or contains no telemetry.`);
            err.statusCode = 404;
            return next(err);
        }

        const result = await unityMcpService.constructDigitalTwinViaMcp(id, telemetryPoints);
        res.json({
            success: true,
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Simulates a crash or anomaly incident directly via Unity MCP tools (spawning Rigidbody, colliders, play mode).
 * Implements Concept 2: Physics-Based Anomaly Reconstruction & Crash Analysis.
 *
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next middleware.
 */
exports.simulateMcpCrash = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { scenario = 'Rotor Failure', windSpeedKnots = 25, altitudeDropMeters = 38.5 } = req.body || {};

        const result = await unityMcpService.simulatePhysicsCrashViaMcp({
            flightId: id,
            scenario,
            windSpeedKnots,
            altitudeDropMeters,
        });

        res.json({
            success: true,
            data: result,
        });
    } catch (err) {
        next(err);
    }
};


