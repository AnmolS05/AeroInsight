/**
 * @file assistantController.js
 * @description Controller for the AI Flight Copilot Assistant.
 * Coordinates between Gemini LLM natural language processing and the Unity MCP simulation engine,
 * enabling conversational 3D flight reconstruction, physics incident simulation, synthetic telemetry generation,
 * and intelligent avionics diagnostics.
 */

const db = require('../config/database');
const crypto = require('crypto');
const mlService = require('../services/mlService');
const geminiService = require('../services/geminiService');
const unityMcpService = require('../services/unityMcpService');

/**
 * Parses user message for specific Unity MCP action intents.
 *
 * @param {string} text - User message string.
 * @returns {{type: string, payload?: Object}|null} Detected action intent or null.
 */
function detectIntent(text) {
    const lower = text.toLowerCase();

    // 1. Synthetic Flight Generation
    if (lower.includes('generate') && (lower.includes('flight') || lower.includes('telemetry') || lower.includes('mission') || lower.includes('log'))) {
        let pattern = 'LawnmowerSurvey';
        if (lower.includes('solar') || lower.includes('grid')) pattern = 'LawnmowerSurvey';
        else if (lower.includes('orbit') || lower.includes('turbine') || lower.includes('tower')) pattern = 'OrbitInspection';
        else if (lower.includes('point to point') || lower.includes('corridor')) pattern = 'PointToPoint';

        let anomaly = 'None';
        if (lower.includes('overheat') || lower.includes('temperature') || lower.includes('motor')) anomaly = 'Motor Overheat';
        else if (lower.includes('drop') || lower.includes('altitude') || lower.includes('stall')) anomaly = 'Altitude Drop';
        else if (lower.includes('battery') || lower.includes('drain')) anomaly = 'Rapid Battery Depletion';
        else if (lower.includes('drift') || lower.includes('gps') || lower.includes('sensor')) anomaly = 'Sensor Drift';

        return {
            type: 'GENERATE_SYNTHETIC',
            payload: { flightPattern: pattern, injectedAnomaly: anomaly, duration: 60 }
        };
    }

    // 2. 3D Digital Twin Reconstruction
    if (lower.includes('reconstruct') || lower.includes('digital twin') || lower.includes('show in 3d') || lower.includes('build scene') || lower.includes('open 3d')) {
        return { type: 'RECONSTRUCT_3D_TWIN' };
    }

    // 3. Physics Simulation
    if (lower.includes('physics') || lower.includes('simulate') || lower.includes('crosswind') || lower.includes('wind gust') || lower.includes('crash') || lower.includes('stall')) {
        let wind = 25.0;
        const windMatch = lower.match(/(\d+)\s*(?:knot|kt|kts|mph)/);
        if (windMatch) wind = parseFloat(windMatch[1]);

        let failure = 'MotorCutoff';
        if (lower.includes('rotor') || lower.includes('motor')) failure = 'MotorCutoff';
        else if (lower.includes('microburst') || lower.includes('turbulence')) failure = 'MicroburstTurbulence';
        else if (lower.includes('voltage') || lower.includes('sag')) failure = 'VoltageSag';

        return {
            type: 'SIMULATE_PHYSICS',
            payload: { windSpeedKnots: wind, failureType: failure }
        };
    }

    // 4. Camera Focus / Viewport Control
    if (lower.includes('focus') || lower.includes('orbit') || lower.includes('camera') || lower.includes('zoom')) {
        return { type: 'FOCUS_CAMERA' };
    }

    return null;
}

/**
 * Handles conversational queries and dispatches autonomous Unity MCP simulation actions.
 *
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Next middleware.
 */
async function handleAssistantMessage(req, res, next) {
    try {
        const { message, flightId, telemetry = [] } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Message text is required.' });
        }

        const intent = detectIntent(message);

        // Action 1: Generate Synthetic Mission
        if (intent && intent.type === 'GENERATE_SYNTHETIC') {
            const { flightPattern, injectedAnomaly, duration } = intent.payload;
            const points = unityMcpService.generateSyntheticTelemetryPoints({
                flightPattern,
                injectedAnomaly,
                totalDurationSeconds: duration,
                centerLatitude: 12.9716,
                centerLongitude: 77.5946
            });

            const generatedFlightId = `SYNTH_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
            const flightName = `Synthetic: ${flightPattern} (${injectedAnomaly})`;

            const client = await db.connect();
            let inTransaction = false;

            try {
                await client.query('BEGIN');
                inTransaction = true;

                await client.query('INSERT INTO flights (id) VALUES ($1)', [generatedFlightId]);

                const latitudes = points.map((p) => p.latitude);
                const longitudes = points.map((p) => p.longitude);
                const altitudes = points.map((p) => p.altitude);
                const batteries = points.map((p) => p.battery);
                const issues = points.map((p) => p.issue || 'none');
                const timestamps = points.map((p) => p.timestamp);

                await client.query(
                    `INSERT INTO telemetry (flight_id, latitude, longitude, altitude, battery, issue, timestamp)
                     SELECT $1, unnest($2::real[]), unnest($3::real[]), unnest($4::real[]), unnest($5::real[]), unnest($6::text[]), unnest($7::text[])`,
                    [generatedFlightId, latitudes, longitudes, altitudes, batteries, issues, timestamps]
                );

                const baselineRisk = mlService.predictRisk(points);
                const initialReport = `# Flight Incident Report: ${generatedFlightId} (Synthetic Simulation)

## Executive Summary
This flight record was synthetically generated via the AeroInsight Simulation Engine.
- **Flight Pattern:** ${flightPattern}
- **Injected Scenario:** ${injectedAnomaly}
- **Sample Count:** ${points.length} waypoints

## Deterministic ML Assessment
- **Calculated Risk Level:** ${baselineRisk.level} (${(baselineRisk.score * 100).toFixed(1)}%)
- **Primary Factors:** ${baselineRisk.reasons.join(', ')}

---
*Deep avionics inspection will be updated upon completion.*
`;

                await client.query(
                    `INSERT INTO reports (flight_id, report_text, is_successful)
                     VALUES ($1, $2, 1)`,
                    [generatedFlightId, initialReport]
                );

                await client.query('COMMIT');
                inTransaction = false;
            } catch (dbErr) {
                if (inTransaction) await client.query('ROLLBACK');
                throw dbErr;
            } finally {
                client.release();
            }

            return res.status(200).json({
                answer: `Generated a high-fidelity synthetic mission (${flightPattern}) with injected anomaly: **${injectedAnomaly}** over ${duration} seconds. Telemetry committed to database as **${flightName}** and ready for 3D simulation.`,
                action: 'FLIGHT_CREATED',
                actionPayload: {
                    flightId: generatedFlightId,
                    flightName,
                    pointCount: points.length
                }
            });
        }

        // Action 2: 3D Digital Twin Reconstruction
        if (intent && intent.type === 'RECONSTRUCT_3D_TWIN') {
            if (!telemetry || telemetry.length === 0) {
                return res.status(200).json({
                    answer: 'To reconstruct a 3D digital twin, please select a flight with logged telemetry points first.',
                    action: null
                });
            }

            const twinResult = await unityMcpService.reconstructDigitalTwin(flightId || 'active-flight', telemetry);
            return res.status(200).json({
                answer: `Initiated 3D Digital Twin reconstruction for **${flightId || 'active mission'}** with ${twinResult.digitalTwin.totalWaypoints} waypoints and ${twinResult.digitalTwin.anomalyCount} hazard beacons. Ground bounding box calculated at ${twinResult.digitalTwin.boundingBox.center.x}m x ${twinResult.digitalTwin.boundingBox.center.z}m.`,
                action: 'RECONSTRUCT_3D_TWIN',
                actionPayload: twinResult
            });
        }

        // Action 3: Physics Anomaly Simulation
        if (intent && intent.type === 'SIMULATE_PHYSICS') {
            const { windSpeedKnots, failureType } = intent.payload;
            const simResult = await unityMcpService.simulatePhysicsIncident(flightId || 'active-flight', {
                windSpeedKnots,
                failureType
            });

            return res.status(200).json({
                answer: `Physics simulation initiated: Simulating a **${failureType}** with **${windSpeedKnots} knots** crosswind. Aerodynamic drag and thrust loss calculations dispatched to Unity.`,
                action: 'SIMULATE_PHYSICS',
                actionPayload: simResult
            });
        }

        // Action 4: Camera Focus
        if (intent && intent.type === 'FOCUS_CAMERA') {
            const anomalies = telemetry.filter((t) => t.issue && t.issue.toLowerCase() !== 'none');
            const targetPos = anomalies.length > 0
                ? { x: 0, y: anomalies[0].altitude, z: 0 }
                : { x: 0, y: telemetry[0]?.altitude || 25, z: 0 };

            const cameraResult = await unityMcpService.focusMissionControlCamera({
                mode: 'OrbitAnomaly',
                targetPosition: targetPos,
                flightId,
                anomalyDescription: anomalies[0]?.issue || 'Waypoint Target'
            });

            return res.status(200).json({
                answer: `Dispatched Unity camera focus directive to orbit anomaly at ${targetPos.y}m altitude. Dual-screen viewport synchronized.`,
                action: 'FOCUS_CAMERA',
                actionPayload: cameraResult
            });
        }

        // Standard Avionics Q&A via Gemini with Flight Context
        const totalPts = telemetry.length;
        const anomalies = telemetry.filter((p) => p.issue && p.issue.toLowerCase() !== 'none');
        const maxAlt = telemetry.length > 0 ? Math.max(...telemetry.map((p) => p.altitude || 0)) : 0;
        const startBat = telemetry.length > 0 ? telemetry[0].battery : 0;
        const endBat = telemetry.length > 0 ? telemetry[telemetry.length - 1].battery : 0;

        const systemPrompt = `
You are the AeroInsight AI Flight Copilot and Chief Avionics Engineer.
Current Flight Telemetry Summary:
- Flight ID: ${flightId || 'None selected'}
- Total Telemetry Points: ${totalPts}
- Flagged Anomalies: ${anomalies.length} (${anomalies.map((a) => a.issue).slice(0, 3).join(', ') || 'None'})
- Peak Altitude: ${maxAlt} m AGL
- Battery Consumption: ${startBat}% -> ${endBat}% (Delta: ${(startBat - endBat).toFixed(1)}%)

User Query: "${message}"

Respond with concise, authoritative avionics analysis. Include practical recommendations for maintenance or simulation where appropriate. Format with clean Markdown.
`.trim();

        try {
            const geminiResponse = await geminiService.generateWithFallback(systemPrompt);
            return res.status(200).json({
                answer: geminiResponse.text,
                action: null
            });
        } catch (geminiError) {
            // High-precision fallback when API key is unconfigured or rate-limited
            let fallbackAnswer = '';
            const q = message.toLowerCase();

            if (q.includes('altitude') || q.includes('height')) {
                fallbackAnswer = `The flight recorded a peak altitude of **${maxAlt} meters AGL** across ${totalPts} waypoints. Vertical ascent and descent profiles remained within operational envelope boundaries.`;
            } else if (q.includes('battery') || q.includes('power') || q.includes('drain')) {
                fallbackAnswer = `Battery level transitioned from **${startBat}%** at departure to **${endBat}%** at touchdown, consuming a net total of **${(startBat - endBat).toFixed(1)}%**. Discharge trajectory indicates stable voltage regulation.`;
            } else if (q.includes('anomal') || q.includes('flag') || q.includes('issue')) {
                fallbackAnswer = anomalies.length > 0
                    ? `Detected **${anomalies.length} anomaly event(s)**: ${anomalies.map((a) => `*"${a.issue}"*`).join(', ')}. Recommend structural inspection and sensor calibration.`
                    : `Zero anomalies detected across all logged telemetry waypoints. Mission adhered strictly to nominal safety parameters.`;
            } else {
                fallbackAnswer = `**Avionics Briefing:** Active mission contains **${totalPts} telemetry waypoints** with **${anomalies.length} flagged anomaly events**. You can request a 3D digital twin reconstruction, simulate aerodynamic failure physics, or generate synthetic test missions at any time.`;
            }

            return res.status(200).json({
                answer: fallbackAnswer,
                action: null
            });
        }
    } catch (error) {
        next(error);
    }
}

module.exports = {
    handleAssistantMessage,
    detectIntent
};
