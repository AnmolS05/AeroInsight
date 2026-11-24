/**
 * Scratch test script to verify Black Box FDR interrogation and aerodynamic vector decomposition.
 */
const { generateBlackBoxFDRReport } = require('../backend/src/services/unityMcpService');

async function testBlackBox() {
    console.log('Testing Black Box FDR Analysis Engine...');

    const sampleTelemetry = [
        { latitude: 12.9716, longitude: 77.5946, altitude: 35.0, battery: 98.0, issue: 'None', timestamp: new Date(Date.now() - 30000).toISOString() },
        { latitude: 12.9718, longitude: 77.5948, altitude: 36.2, battery: 96.5, issue: 'None', timestamp: new Date(Date.now() - 25000).toISOString() },
        { latitude: 12.9720, longitude: 77.5950, altitude: 34.8, battery: 95.0, issue: 'None', timestamp: new Date(Date.now() - 20000).toISOString() },
        { latitude: 12.9722, longitude: 77.5952, altitude: 22.0, battery: 84.0, issue: 'Critical Motor Failure: Severe Thrust Loss', timestamp: new Date(Date.now() - 15000).toISOString() },
        { latitude: 12.9723, longitude: 77.5953, altitude: 11.5, battery: 81.0, issue: 'Critical Motor Failure: Severe Thrust Loss', timestamp: new Date(Date.now() - 10000).toISOString() },
        { latitude: 12.9724, longitude: 77.5954, altitude: 2.1, battery: 78.0, issue: 'Ground Proximity / Descent Incursion', timestamp: new Date(Date.now() - 5000).toISOString() },
    ];

    const result = await generateBlackBoxFDRReport('TEST_FLIGHT_BB_01', sampleTelemetry);

    console.log('Classification:', result.incidentClassification);
    console.log('Aerodynamic Vectors:', result.aerodynamicFailureVectors);
    console.log('Incident Coordinates:', result.incidentCoordinates);
    console.log('Sequence of Events count:', result.sequenceOfEvents.length);
    console.log('Airworthiness recommendations:', result.airworthinessRecommendations.length);

    if (result.incidentClassification.criticalityLevel.includes('CRITICAL_C4') &&
        result.incidentClassification.icaoTaxonomy.includes('SCF-PP') &&
        result.aerodynamicFailureVectors.peakDescentRateMps > 0) {
        console.log('>>> TEST PASSED: Black Box FDR Engine verified successfully! <<<');
    } else {
        throw new Error('Unexpected FDR result values.');
    }
}

testBlackBox().catch((err) => {
    console.error('Test Failed:', err);
    process.exit(1);
});
