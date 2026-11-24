/**
 * @file unityRoutes.js
 * @description Express routing definitions for Unity 3D Digital Twin,
 * Physics Simulation, Synthetic Telemetry Generator, and Camera Controls.
 */

const express = require('express');
const router = express.Router();
const unityController = require('../controllers/unityController');
const { validateFlightId } = require('../middlewares/validate');

// Status & Bridge Health
router.get('/status', unityController.getBridgeStatus);

// Digital Twin 3D Scene Reconstruction
router.post('/reconstruct/:id', validateFlightId, unityController.reconstructFlight);

// Mission Control Camera Focus
router.post('/focus', unityController.focusCamera);

// Physics Incident Simulation
router.post('/simulate/:id', validateFlightId, unityController.simulatePhysics);

// Synthetic Telemetry Generation
router.post('/generate-synthetic', unityController.createSyntheticFlight);
router.post('/generate-swarm', unityController.createSwarmFlight);

// Black Box Flight Data Recorder (FDR) Reconstruction & Investigation
router.post('/blackbox/:id', validateFlightId, unityController.generateBlackBoxReport);
router.post('/blackbox', unityController.generateBlackBoxReport);

// Subsystem Component Diagnostics & Unity Inspection
router.post('/component-inspect', unityController.inspectComponent);

// Model Context Protocol (MCP) Direct Tool Execution & Pipeline
router.get('/mcp-status', unityController.getMcpStatus);
router.post('/mcp-execute', unityController.executeMcpTool);
router.post('/mcp-twin/:id', validateFlightId, unityController.reconstructMcpTwin);
router.post('/mcp-crash/:id', validateFlightId, unityController.simulateMcpCrash);
router.post('/mcp-generate', unityController.generateSyntheticViaMcp);

module.exports = router;

