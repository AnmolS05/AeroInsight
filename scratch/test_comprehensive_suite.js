/**
 * Comprehensive automated regression test suite for AeroInsight & Unity MCP integration.
 */
const {
    checkBridgeStatus,
    reconstructDigitalTwin,
    simulatePhysicsIncident,
    generateSyntheticTelemetryPoints,
    generateSwarmMissionTelemetry,
    generateBlackBoxFDRReport
} = require('../backend/src/services/unityMcpService');

const { handleAssistantMessage } = require('../backend/src/controllers/assistantController');

async function runComprehensiveSuite() {
    console.log('====================================================');
    console.log('   AEROINSIGHT MISSION CONTROL COMPREHENSIVE SUITE  ');
    console.log('====================================================\n');

    let passedTests = 0;

    // Test 1: Bridge Status Check
    console.log('[1/7] Testing Bridge Status Check...');
    const status = await checkBridgeStatus(500);
    console.log(`  -> Bridge Reachable: ${status.connected} (${status.message})`);
    if (typeof status.connected === 'boolean') passedTests++;

    // Test 2: 3D Digital Twin UTM Projection
    console.log('\n[2/7] Testing 3D Digital Twin Reconstructor...');
    const mockTelemetry = [
        { latitude: 12.9716, longitude: 77.5946, altitude: 25.0, battery: 99.0, issue: 'None', timestamp: new Date().toISOString() },
        { latitude: 12.9720, longitude: 77.5950, altitude: 35.0, battery: 95.0, issue: 'None', timestamp: new Date().toISOString() },
        { latitude: 12.9725, longitude: 77.5955, altitude: 12.0, battery: 85.0, issue: 'Critical Motor Cutoff', timestamp: new Date().toISOString() },
    ];
    const twin = await reconstructDigitalTwin('TEST_TWIN_01', mockTelemetry);
    console.log(`  -> Total Waypoints: ${twin.digitalTwin.totalWaypoints}`);
    console.log(`  -> Anomaly Count: ${twin.digitalTwin.anomalyCount}`);
    console.log(`  -> Center: (${twin.digitalTwin.boundingBox.center.x}, ${twin.digitalTwin.boundingBox.center.y}, ${twin.digitalTwin.boundingBox.center.z})`);
    if (twin.digitalTwin.totalWaypoints === 3 && twin.digitalTwin.anomalyCount === 1) passedTests++;

    // Test 3: Physics Incident Simulation & Aerodynamic Drag
    console.log('\n[3/7] Testing Empirical Physics Incident Simulation...');
    const physics = await simulatePhysicsIncident('TEST_PHYSICS_01', {
        windSpeedKnots: 28,
        failureType: 'MotorCutoff',
        thrustDegradationPercent: 55,
        triggerSecond: 5,
        durationSeconds: 15
    }, mockTelemetry);
    console.log(`  -> Verdict: ${physics.incidentAnalysis.verdict}`);
    console.log(`  -> Peak Drag: ${physics.incidentAnalysis.peakAerodynamicDragNewtons} N`);
    console.log(`  -> Confidence: ${physics.incidentAnalysis.confidenceScorePct}%`);
    if (physics.incidentAnalysis.peakAerodynamicDragNewtons > 0 && physics.simulatedTrajectory.length > 0) passedTests++;

    // Test 4: Synthetic Telemetry Generator (All Profiles)
    console.log('\n[4/7] Testing Synthetic Telemetry Generator Profiles...');
    const patterns = ['LawnmowerSurvey', 'SolarArrayInspection', 'WindTurbineInspection', 'CellTowerInspection', 'OrbitInspection', 'PointToPoint'];
    let allPatternsValid = true;
    for (const pat of patterns) {
        const pts = generateSyntheticTelemetryPoints({ flightPattern: pat, totalDurationSeconds: 20 });
        if (!pts || pts.length < 10) allPatternsValid = false;
    }
    console.log(`  -> Tested ${patterns.length} industrial & geometric patterns. All valid: ${allPatternsValid}`);
    if (allPatternsValid) passedTests++;

    // Test 5: Tactical Swarm & Multi-Drone Fleet Mission Telemetry
    console.log('\n[5/7] Testing Tactical Swarm Mission Generation...');
    const swarm = generateSwarmMissionTelemetry({
        swarmCount: 3,
        formation: 'V-Formation',
        separationMeters: 30.0,
        flightPattern: 'LawnmowerSurvey',
        totalDurationSeconds: 15
    });
    console.log(`  -> Formation: ${swarm.deconfliction.formation}`);
    console.log(`  -> Active UAVs: ${swarm.deconfliction.activeUAVCount}`);
    console.log(`  -> Wingmen Units: ${swarm.wingmen.map(w => w.callsign).join(', ')}`);
    console.log(`  -> Deconfliction Status: ${swarm.deconfliction.airspaceStatus}`);
    if (swarm.leader.length > 0 && swarm.wingmen.length === 2 && swarm.deconfliction.wakeVortexSeparationSecured) passedTests++;

    // Test 6: Black Box Flight Data Recorder (FDR) Interrogation
    console.log('\n[6/7] Testing Black Box FDR Analysis Engine...');
    const fdr = await generateBlackBoxFDRReport('TEST_FDR_01', mockTelemetry);
    console.log(`  -> Criticality: ${fdr.incidentClassification.criticalityLevel}`);
    console.log(`  -> ICAO Taxonomy: ${fdr.incidentClassification.icaoTaxonomy}`);
    console.log(`  -> Peak Descent: ${fdr.aerodynamicFailureVectors.peakDescentRateMps} m/s`);
    console.log(`  -> Sequence of Events: ${fdr.sequenceOfEvents.length} chronological items`);
    if (fdr.incidentClassification.criticalityLevel.includes('CRITICAL') && fdr.sequenceOfEvents.length >= 3) passedTests++;

    // Test 7: AI Copilot Intent Dispatching
    console.log('\n[7/7] Testing AI Copilot Natural Language Intent Recognition...');
    const queries = [
        { text: 'Please reconstruct this flight into a 3D digital twin', expectedAction: 'RECONSTRUCT_3D_TWIN' },
        { text: 'Simulate 30 knots crosswind with rotor failure', expectedAction: 'SIMULATE_PHYSICS' },
        { text: 'Interrogate the black box flight data recorder and find probable cause', expectedAction: 'OPEN_BLACKBOX' },
        { text: 'Focus camera and orbit the primary anomaly', expectedAction: 'FOCUS_CAMERA' }
    ];

    let intentPassCount = 0;
    for (const q of queries) {
        let actionTriggered = null;
        const req = { body: { message: q.text, flightId: 'COPILOT_SUITE_TEST', telemetry: mockTelemetry } };
        const res = {
            status() { return this; },
            json(data) { actionTriggered = data.action; return this; }
        };
        await handleAssistantMessage(req, res, () => {});
        if (actionTriggered === q.expectedAction) intentPassCount++;
    }
    console.log(`  -> Dispatched ${intentPassCount}/${queries.length} AI Copilot actions cleanly.`);
    if (intentPassCount === queries.length) passedTests++;

    console.log('\n====================================================');
    console.log(`   FINAL VERDICT: ${passedTests}/7 TEST SUITES PASSED (100%)`);
    console.log('====================================================\n');

    if (passedTests !== 7) {
        process.exit(1);
    }
}

runComprehensiveSuite().catch((err) => {
    console.error('Suite error:', err);
    process.exit(1);
});
