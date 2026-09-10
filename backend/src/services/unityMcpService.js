/**
 * @file unityMcpService.js
 * @description Service managing bidirectional communication between AeroInsight and the Unity MCP / Editor Bridge.
 * Implements the 4 core concepts:
 * 1. AI Digital Twin Creator (3D Flight Reconstructor)
 * 2. Physics-Based Anomaly Reconstruction & Crash Analysis
 * 3. Synthetic Telemetry Generator (Simulation to Dashboard)
 * 4. 3D Interactive Mission Control Bridge (Dual-Screen UI to Viewport Synchronizer)
 */

const http = require('http');
const crypto = require('crypto');

const UNITY_BRIDGE_HOST = process.env.UNITY_BRIDGE_HOST || '127.0.0.1';
const UNITY_BRIDGE_PORT = parseInt(process.env.UNITY_BRIDGE_PORT || '7890', 10);

/**
 * Checks connectivity to the local Unity Editor HTTP bridge.
 *
 * @param {number} [timeoutMs=2000] - Connection timeout in milliseconds.
 * @returns {Promise<{connected: boolean, host: string, port: number, latencyMs?: number, message: string}>}
 */
async function checkBridgeStatus(timeoutMs = 2000) {
    const startTime = Date.now();

    return new Promise((resolve) => {
        const req = http.request(
            {
                hostname: UNITY_BRIDGE_HOST,
                port: UNITY_BRIDGE_PORT,
                path: '/api/ping',
                method: 'GET',
                timeout: timeoutMs,
            },
            (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    const latencyMs = Date.now() - startTime;
                    if (res.statusCode === 200) {
                        resolve({
                            connected: true,
                            host: UNITY_BRIDGE_HOST,
                            port: UNITY_BRIDGE_PORT,
                            latencyMs,
                            message: 'Unity Editor HTTP Bridge is active and responsive.',
                        });
                    } else {
                        resolve({
                            connected: false,
                            host: UNITY_BRIDGE_HOST,
                            port: UNITY_BRIDGE_PORT,
                            latencyMs,
                            message: `Unity Bridge returned HTTP status ${res.statusCode}.`,
                        });
                    }
                });
            }
        );

        req.on('error', (err) => {
            resolve({
                connected: false,
                host: UNITY_BRIDGE_HOST,
                port: UNITY_BRIDGE_PORT,
                message: `Unity Editor Bridge is unreachable on ${UNITY_BRIDGE_HOST}:${UNITY_BRIDGE_PORT} (${err.code || err.message}). Ensure Unity is running with the unity-mcp-plugin installed.`,
            });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({
                connected: false,
                host: UNITY_BRIDGE_HOST,
                port: UNITY_BRIDGE_PORT,
                message: `Connection timed out after ${timeoutMs}ms. Unity Editor may be compiling scripts or busy.`,
            });
        });

        req.end();
    });
}

/**
 * Dispatches an HTTP command payload directly to the Unity Editor bridge.
 *
 * @param {string} endpoint - Bridge endpoint path (e.g. '/api/execute' or '/api/queue').
 * @param {Object} payload - Command payload object.
 * @param {number} [timeoutMs=10000] - Request timeout.
 * @returns {Promise<Object>} Response object from Unity bridge.
 */
async function dispatchBridgeCommand(endpoint, payload, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
        const payloadString = JSON.stringify(payload);

        const req = http.request(
            {
                hostname: UNITY_BRIDGE_HOST,
                port: UNITY_BRIDGE_PORT,
                path: endpoint,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payloadString),
                },
                timeout: timeoutMs,
            },
            (res) => {
                let responseBody = '';
                res.on('data', (chunk) => {
                    responseBody += chunk;
                });
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(responseBody);
                        resolve(parsed);
                    } catch (parseErr) {
                        resolve({ success: res.statusCode === 200, raw: responseBody });
                    }
                });
            }
        );

        req.on('error', (err) => {
            reject(new Error(`Unity Bridge dispatch failed: ${err.message}`));
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error(`Unity Bridge command timed out after ${timeoutMs}ms`));
        });

        req.write(payloadString);
        req.end();
    });
}

/**
 * Reconstructs a 3D digital twin flight scene inside Unity from telemetry points.
 * Implements Concept 1: The AI Digital Twin Creator.
 *
 * @param {string} flightId - Unique identifier of the flight.
 * @param {Array<Object>} telemetryPoints - Telemetry points with lat, lon, alt, battery, issue.
 * @returns {Promise<Object>} Status and metadata of the reconstructed digital twin.
 */
async function reconstructDigitalTwin(flightId, telemetryPoints) {
    if (!telemetryPoints || telemetryPoints.length === 0) {
        throw new Error('Telemetry data is required for 3D reconstruction.');
    }

    // Equirectangular local UTM coordinate transformation
    const origin = {
        lat: telemetryPoints[0].latitude,
        lon: telemetryPoints[0].longitude,
        alt: telemetryPoints[0].altitude,
    };

    const METERS_PER_DEG_LAT = 111139.0;
    const METERS_PER_DEG_LON = 111139.0 * Math.cos((origin.lat * Math.PI) / 180.0);

    const waypoints3D = telemetryPoints.map((pt, index) => {
        const x = (pt.longitude - origin.lon) * METERS_PER_DEG_LON;
        const y = pt.altitude;
        const z = (pt.latitude - origin.lat) * METERS_PER_DEG_LAT;
        const isAnomaly = Boolean(pt.issue && pt.issue.toLowerCase() !== 'none' && pt.issue.trim() !== '');

        return {
            index,
            position: { x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)), z: parseFloat(z.toFixed(2)) },
            latitude: pt.latitude,
            longitude: pt.longitude,
            altitude: pt.altitude,
            battery: pt.battery,
            issue: pt.issue,
            isAnomaly,
            timestamp: pt.timestamp,
        };
    });

    const anomalies = waypoints3D.filter((wp) => wp.isAnomaly);

    const reconstructionPayload = {
        flightId,
        origin,
        totalWaypoints: waypoints3D.length,
        anomalyCount: anomalies.length,
        waypoints: waypoints3D,
        anomalies,
        boundingBox: computeBoundingBox(waypoints3D),
    };

    // Attempt to dispatch to Unity if connected
    const bridgeStatus = await checkBridgeStatus(1000);
    let unityResponse = null;

    if (bridgeStatus.connected) {
        try {
            unityResponse = await dispatchBridgeCommand('/api/reconstruct-flight', reconstructionPayload, 5000);
        } catch (err) {
            unityResponse = { dispatched: false, error: err.message };
        }
    }

    return {
        success: true,
        bridgeConnected: bridgeStatus.connected,
        digitalTwin: reconstructionPayload,
        unityResponse,
    };
}

/**
 * Computes the 3D bounding box for the flight trajectory.
 *
 * @param {Array<Object>} waypoints - Array of 3D waypoints.
 * @returns {{min: {x: number, y: number, z: number}, max: {x: number, y: number, z: number}, center: {x: number, y: number, z: number}}}
 */
function computeBoundingBox(waypoints) {
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (const wp of waypoints) {
        const { x, y, z } = wp.position;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (z < minZ) minZ = z;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
        if (z > maxZ) maxZ = z;
    }

    return {
        min: { x: minX, y: minY, z: minZ },
        max: { x: maxX, y: maxY, z: maxZ },
        center: {
            x: parseFloat(((minX + maxX) / 2).toFixed(2)),
            y: parseFloat(((minY + maxY) / 2).toFixed(2)),
            z: parseFloat(((minZ + maxZ) / 2).toFixed(2)),
        },
    };
}

/**
 * Dispatches an interactive camera focus / orbit command to Unity Editor viewport.
 * Implements Concept 4: The 3D Interactive Mission Control.
 *
 * @param {Object} focusParams - Focus mode and target coordinate information.
 * @returns {Promise<Object>} Result of camera dispatch.
 */
async function focusMissionControlCamera(focusParams) {
    const { mode = 'OrbitAnomaly', targetPosition, flightId, anomalyDescription } = focusParams;

    const bridgeStatus = await checkBridgeStatus(1000);
    if (!bridgeStatus.connected) {
        return {
            dispatched: false,
            message: 'Unity Editor Bridge is currently offline. Launch Unity with the simulation project to enable dual-screen viewport tracking.',
            targetPosition,
        };
    }

    try {
        const response = await dispatchBridgeCommand(
            '/api/camera-focus',
            {
                mode,
                targetPosition,
                flightId,
                anomalyDescription,
                timestamp: new Date().toISOString(),
            },
            3000
        );

        return {
            dispatched: true,
            unityResponse: response,
        };
    } catch (err) {
        return {
            dispatched: false,
            error: err.message,
        };
    }
}

/**
 * Simulates physical aerodynamic forces and incident anomalies in Unity.
 * Implements Concept 2: Physics-Based Anomaly Reconstruction & Crash Analysis.
 *
 * @param {string} flightId - Flight ID.
 * @param {Object} physicsConfig - Wind speed, drag, thrust loss, and failure type.
 * @returns {Promise<Object>} Physics simulation setup and execution status.
 */
async function simulatePhysicsIncident(flightId, physicsConfig = {}) {
    const config = {
        flightId,
        windSpeedKnots: physicsConfig.windSpeedKnots || 20.0,
        windDirection: physicsConfig.windDirection || { x: 1.0, y: 0.0, z: 0.5 },
        droneMassKg: physicsConfig.droneMassKg || 2.5,
        thrustDegradationPercent: physicsConfig.thrustDegradationPercent || 45.0,
        failureType: physicsConfig.failureType || 'MotorCutoff',
        triggerSecond: physicsConfig.triggerSecond || 12,
        durationSeconds: physicsConfig.durationSeconds || 30,
    };

    const bridgeStatus = await checkBridgeStatus(1000);
    let simulationResult = null;

    if (bridgeStatus.connected) {
        try {
            simulationResult = await dispatchBridgeCommand('/api/simulate-physics', config, 15000);
        } catch (err) {
            simulationResult = { executed: false, error: err.message };
        }
    }

    return {
        flightId,
        config,
        bridgeConnected: bridgeStatus.connected,
        simulationResult,
        incidentAnalysis: {
            hypothesis: `At second ${config.triggerSecond}, a ${config.failureType} was introduced under ${config.windSpeedKnots} knots crosswind.`,
            expectedBehavior: config.thrustDegradationPercent > 30 ? 'Aerodynamic stall and unrecoverable altitude descent.' : 'Compensatory throttle increase with severe battery drain.',
        },
    };
}

/**
 * Generates synthetic flight telemetry logs representing various inspection patterns and failure edge cases.
 * Implements Concept 3: Synthetic Telemetry Generator.
 *
 * @param {Object} options - Pattern options, coordinates, durations, and injected anomalies.
 * @returns {Array<Object>} Generated telemetry point array.
 */
function generateSyntheticTelemetryPoints(options = {}) {
    const {
        flightPattern = 'LawnmowerSurvey',
        centerLatitude = 12.9716,
        centerLongitude = 77.5946,
        baseAltitudeMeters = 35.0,
        totalDurationSeconds = 60,
        samplingIntervalSeconds = 1,
        injectedAnomaly = 'Motor Overheat',
        anomalyStartSecond = 42,
    } = options;

    const points = [];
    const startTime = new Date(Date.now() - 15 * 60 * 1000); // 15 mins ago
    let currentBattery = 98.5;
    let currentAltitude = baseAltitudeMeters;

    const totalSteps = Math.max(10, Math.floor(totalDurationSeconds / samplingIntervalSeconds));
    const METERS_PER_DEG_LAT = 1.0 / 111139.0;
    const METERS_PER_DEG_LON = 1.0 / (111139.0 * Math.cos((centerLatitude * Math.PI) / 180.0));

    for (let step = 0; step < totalSteps; step++) {
        const timeSec = step * samplingIntervalSeconds;
        const timestamp = new Date(startTime.getTime() + timeSec * 1000).toISOString();

        let offsetX = 0;
        let offsetZ = 0;

        if (flightPattern === 'OrbitInspection') {
            const radius = 40.0;
            const angle = (timeSec / totalDurationSeconds) * Math.PI * 2;
            offsetX = Math.cos(angle) * radius;
            offsetZ = Math.sin(angle) * radius;
        } else if (flightPattern === 'PointToPoint') {
            offsetX = (timeSec / totalDurationSeconds) * 250.0;
            offsetZ = Math.sin(timeSec * 0.08) * 20.0;
        } else {
            // Default Lawnmower Grid
            const legDuration = totalDurationSeconds / 4.0;
            const leg = Math.floor(timeSec / legDuration);
            const legProgress = (timeSec % legDuration) / legDuration;
            const laneWidth = 35.0;
            const laneLength = 140.0;

            offsetX = leg * laneWidth;
            offsetZ = leg % 2 === 0 ? legProgress * laneLength : (1.0 - legProgress) * laneLength;
        }

        // Micro-altitude variations
        const altNoise = (Math.sin(timeSec * 0.4) + Math.cos(timeSec * 0.7)) * 0.35;
        currentAltitude = baseAltitudeMeters + altNoise;

        // Base consumption
        currentBattery -= samplingIntervalSeconds * 0.14;

        // Anomaly injection logic
        let issue = 'None';
        if (timeSec >= anomalyStartSecond && injectedAnomaly && injectedAnomaly !== 'None') {
            issue = injectedAnomaly;
            if (injectedAnomaly.includes('Altitude Drop')) {
                currentAltitude = Math.max(2.5, currentAltitude - (timeSec - anomalyStartSecond) * 3.2);
            } else if (injectedAnomaly.includes('Battery')) {
                currentBattery -= samplingIntervalSeconds * 2.8;
            } else if (injectedAnomaly.includes('Sensor Drift')) {
                offsetX += (timeSec - anomalyStartSecond) * 4.5;
            }
        }

        const lat = centerLatitude + offsetZ * METERS_PER_DEG_LAT;
        const lon = centerLongitude + offsetX * METERS_PER_DEG_LON;

        points.push({
            latitude: parseFloat(lat.toFixed(7)),
            longitude: parseFloat(lon.toFixed(7)),
            altitude: parseFloat(Math.max(1.0, currentAltitude).toFixed(2)),
            battery: parseFloat(Math.max(0.0, Math.min(100.0, currentBattery)).toFixed(1)),
            issue: issue === 'None' ? null : issue,
            timestamp,
        });
    }

    return points;
}

module.exports = {
    checkBridgeStatus,
    reconstructDigitalTwin,
    focusMissionControlCamera,
    simulatePhysicsIncident,
    generateSyntheticTelemetryPoints,
};
