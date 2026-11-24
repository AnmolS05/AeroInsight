const { handleAssistantMessage } = require('../backend/src/controllers/assistantController');

async function testAssistantFDR() {
    console.log('Testing Assistant FDR Intent Handling...');

    const sampleTelemetry = [
        { latitude: 12.9716, longitude: 77.5946, altitude: 35.0, battery: 98.0, issue: 'None', timestamp: new Date(Date.now() - 30000).toISOString() },
        { latitude: 12.9718, longitude: 77.5948, altitude: 36.2, battery: 96.5, issue: 'None', timestamp: new Date(Date.now() - 25000).toISOString() },
        { latitude: 12.9722, longitude: 77.5952, altitude: 22.0, battery: 84.0, issue: 'Critical Motor Failure: Severe Thrust Loss', timestamp: new Date(Date.now() - 15000).toISOString() },
    ];

    let responseData = null;
    let statusCode = 200;

    const req = {
        body: {
            message: 'Please interrogate the black box flight data recorder and find the probable cause',
            flightId: 'TEST_FLIGHT_COPILOT',
            telemetry: sampleTelemetry
        }
    };

    const res = {
        status(code) {
            statusCode = code;
            return this;
        },
        json(data) {
            responseData = data;
            return this;
        }
    };

    await handleAssistantMessage(req, res, (err) => { throw err; });

    console.log('Status code:', statusCode);
    console.log('Action returned:', responseData.action);
    console.log('Answer excerpt:', responseData.answer.substring(0, 180));

    if (responseData.action === 'OPEN_BLACKBOX' && responseData.actionPayload) {
        console.log('>>> TEST PASSED: Assistant Black Box intent handled successfully! <<<');
    } else {
        throw new Error('Action was not OPEN_BLACKBOX');
    }
}

testAssistantFDR().catch((err) => {
    console.error('Test Failed:', err);
    process.exit(1);
});
