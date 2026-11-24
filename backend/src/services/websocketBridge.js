/**
 * @file websocketBridge.js
 * @description WebSocket server providing live bidirectional viewport sync
 * between the AeroInsight web dashboard and the Unity Editor HTTP bridge.
 *
 * Runs alongside the Express HTTP bridge on the Unity Editor side.
 * For web → Unity sync, the backend proxies WebSocket frames to HTTP bridge calls.
 */

const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');

const UNITY_BRIDGE_HOST = process.env.UNITY_BRIDGE_HOST || '127.0.0.1';
const UNITY_BRIDGE_PORT = parseInt(process.env.UNITY_BRIDGE_PORT || '7890', 10);
const WS_PORT = parseInt(process.env.WS_PORT || '8765', 10);

const clients = new Set();
let unityBridgeReady = false;

/**
 * Proxies a WebSocket message to the Unity HTTP bridge and broadcasts response.
 */
async function dispatchToUnity(message) {
    try {
        const body = JSON.parse(message.data);
        const endpoint = body.endpoint || '/api/ping';
        const method = body.method || 'GET';

        const res = await fetch(`http://${UNITY_BRIDGE_HOST}:${UNITY_BRIDGE_PORT}${endpoint}`, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: method === 'GET' ? undefined : JSON.stringify(body.payload || {}),
        });

        const text = await res.text();
        const wsMsg = JSON.stringify({
            type: 'unity_response',
            endpoint,
            status: res.status,
            data: text,
        });

        broadcast(wsMsg);
    } catch (err) {
        broadcast(JSON.stringify({ type: 'error', message: err.message }));
    }
}

function broadcast(data) {
    for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    }
}

function createServer() {
    const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            service: 'AeroInsight WebSocket Viewport Bridge',
            port: WS_PORT,
            connectedClients: clients.size,
            unityBridge: unityBridgeReady ? 'active' : 'standby',
        }));
    });

    const wss = new WebSocketServer({ server, path: '/ws/viewport' });

    wss.on('connection', (ws) => {
        clients.add(ws);
        ws.send(JSON.stringify({ type: 'connected', port: WS_PORT, bridgeHost: UNITY_BRIDGE_HOST }));

        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data);
                if (msg.type === 'unity_command') {
                    dispatchToUnity({ data });
                } else if (msg.type === 'ping') {
                    ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                } else if (msg.type === 'focus_waypoint') {
                    // Optimized: dispatch camera focus directly without round-trip
                    fetch(`http://${UNITY_BRIDGE_HOST}:${UNITY_BRIDGE_PORT}/api/camera-focus`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            mode: 'FocusWaypoint',
                            targetPosition: msg.position,
                            flightId: msg.flightId,
                            anomalyDescription: msg.description,
                        }),
                    }).then(r => r.json()).then(json => {
                        ws.send(JSON.stringify({ type: 'focus_result', success: json.success, data: json }));
                    }).catch(err => {
                        ws.send(JSON.stringify({ type: 'error', message: err.message }));
                    });
                } else if (msg.type === 'reconstruct_flight') {
                    fetch(`http://${UNITY_BRIDGE_HOST}:${UNITY_BRIDGE_PORT}/api/reconstruct-flight`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(msg.payload),
                    }).then(r => r.json()).then(json => {
                        ws.send(JSON.stringify({ type: 'reconstruct_result', data: json }));
                    }).catch(err => {
                        ws.send(JSON.stringify({ type: 'error', message: err.message }));
                    });
                }
            } catch {
                ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON message' }));
            }
        });

        ws.on('close', () => clients.delete(ws));
        ws.on('error', () => clients.delete(ws));
    });

    return server;
}

module.exports = { createServer, broadcast };
