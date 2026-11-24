/**
 * @file test_unity_mcp_pipeline.js
 * @description Verification test suite for Unity Model Context Protocol (MCP) Client
 * and the 4 Core Pillars from mcp_task_action.md.
 */

const unityMcpClient = require('../backend/src/services/unityMcpClient');
const unityMcpService = require('../backend/src/services/unityMcpService');

async function runMcpTestSuite() {
    console.log('====================================================');
    console.log('   AEROINSIGHT UNITY MCP PIPELINE VERIFICATION SUITE');
    console.log('====================================================\n');

    let passedTests = 0;
    const totalTests = 5;

    // Test 1: MCP Server Status & Tool Inventory Handshake
    console.log('[1/5] Testing MCP Server Handshake & Tool Inventory...');
    try {
        const status = await unityMcpClient.checkMcpStatus();
        console.log(`  -> MCP Configured: ${status.mcpServerConfigured}`);
        console.log(`  -> Available Tools Discovered: ${status.cachedToolsCount}`);
        console.log(`  -> Transport: stdio (JSON-RPC 2.0)`);
        if (status.cachedToolsCount >= 70) {
            console.log('  [PASS] Tool discovery verified.');
            passedTests++;
        } else {
            console.error('  [FAIL] Expected at least 70 tools from unity-mcp-server.');
        }
    } catch (err) {
        console.error(`  [FAIL] MCP Handshake error: ${err.message}`);
    }

    // Test 2: Concept 1 - 3D Digital Twin Scene Construction via MCP
    console.log('\n[2/5] Testing Concept 1: Digital Twin 3D Reconstructor via MCP...');
    try {
        const mockTelemetry = [
            { latitude: 12.9716, longitude: 77.5946, altitude: 25.0, battery: 98, issue: 'none' },
            { latitude: 12.9718, longitude: 77.5948, altitude: 35.0, battery: 92, issue: 'Motor Temperature Warning' },
            { latitude: 12.9720, longitude: 77.5950, altitude: 45.0, battery: 85, issue: 'none' },
        ];

        const twinResult = await unityMcpClient.constructDigitalTwinViaMcp('AERO-MCP-01', mockTelemetry);
        console.log(`  -> Mode: ${twinResult.mode}`);
        console.log(`  -> Root Hierarchy: ${twinResult.rootGameObject}`);
        console.log(`  -> Waypoints Processed: ${twinResult.totalWaypoints}`);
        console.log(`  -> Anomaly Hazard Markers: ${twinResult.anomaliesPlotted}`);
        console.log(`  -> Execution Steps: ${twinResult.executionLog.length}`);
        if (twinResult.success && twinResult.anomaliesPlotted === 1) {
            console.log('  [PASS] Concept 1 Digital Twin MCP pipeline verified.');
            passedTests++;
        }
    } catch (err) {
        console.error(`  [FAIL] Concept 1 error: ${err.message}`);
    }

    // Test 3: Concept 2 - Physics Crash Lab & Rigidbody Simulation via MCP
    console.log('\n[3/5] Testing Concept 2: Physics Crash Lab & Rigidbody Simulation via MCP...');
    try {
        const crashResult = await unityMcpClient.simulatePhysicsCrashViaMcp({
            flightId: 'CRASH-MCP-01',
            scenario: 'Microburst Convection Drop',
            windSpeedKnots: 28,
            altitudeDropMeters: 42.0,
        });

        console.log(`  -> Scenario: ${crashResult.scenario}`);
        console.log(`  -> Terminal Descent Rate: ${crashResult.metrics.terminalDescentRate} m/s`);
        console.log(`  -> Goodness-of-Fit R²: ${crashResult.metrics.goodnessOfFitR2}`);
        console.log(`  -> Trajectory RMSE: ${crashResult.metrics.simulatedTrajectoryRMSE} m`);
        console.log(`  -> Hypothesis Verified: ${crashResult.metrics.hypothesisVerified}`);
        if (crashResult.metrics.hypothesisVerified && crashResult.metrics.goodnessOfFitR2 > 0.9) {
            console.log('  [PASS] Concept 2 Physics Simulation MCP pipeline verified.');
            passedTests++;
        }
    } catch (err) {
        console.error(`  [FAIL] Concept 2 error: ${err.message}`);
    }

    // Test 4: Concept 4 - Dual-Screen Mission Control Viewport Focus via MCP
    console.log('\n[4/5] Testing Concept 4: Dual-Screen Mission Control Focus via MCP...');
    try {
        const focusResult = await unityMcpClient.focusMissionControlViaMcp({
            componentName: 'Flight_Twin_AERO-MCP-01/Motor_1_FR',
            position: { x: 10, y: 35, z: 15 },
            flightId: 'AERO-MCP-01',
        });

        console.log(`  -> Mode: ${focusResult.mode}`);
        console.log(`  -> Dispatched Steps: ${focusResult.executionLog.length}`);
        if (focusResult.success) {
            console.log('  [PASS] Concept 4 Mission Control MCP focus verified.');
            passedTests++;
        }
    } catch (err) {
        console.error(`  [FAIL] Concept 4 error: ${err.message}`);
    }

    // Test 5: Service Integration Layer
    console.log('\n[5/5] Testing unityMcpService Exported MCP API Layer...');
    try {
        const serviceMcpStatus = typeof unityMcpService.getMcpStatus === 'function';
        const serviceExecuteMcp = typeof unityMcpService.executeMcpTool === 'function';
        const serviceTwinMcp = typeof unityMcpService.constructDigitalTwinViaMcp === 'function';
        const serviceCrashMcp = typeof unityMcpService.simulatePhysicsCrashViaMcp === 'function';

        console.log(`  -> getMcpStatus exposed: ${serviceMcpStatus}`);
        console.log(`  -> executeMcpTool exposed: ${serviceExecuteMcp}`);
        console.log(`  -> constructDigitalTwinViaMcp exposed: ${serviceTwinMcp}`);
        console.log(`  -> simulatePhysicsCrashViaMcp exposed: ${serviceCrashMcp}`);

        if (serviceMcpStatus && serviceExecuteMcp && serviceTwinMcp && serviceCrashMcp) {
            console.log('  [PASS] Service integration layer verified.');
            passedTests++;
        }
    } catch (err) {
        console.error(`  [FAIL] Service layer error: ${err.message}`);
    }

    console.log('\n====================================================');
    console.log(`   MCP TEST RESULT: ${passedTests}/${totalTests} PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
    console.log('====================================================');

    process.exit(passedTests === totalTests ? 0 : 1);
}

runMcpTestSuite().catch((err) => {
    console.error('Fatal test suite exception:', err);
    process.exit(1);
});
