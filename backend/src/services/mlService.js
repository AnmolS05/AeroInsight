const fs = require('fs');
const path = require('path');

let modelData = null;

try {
    const modelPath = path.join(__dirname, '../ml_models/risk_model.json');
    if (fs.existsSync(modelPath)) {
        modelData = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
    }
} catch (e) {
    console.error("Could not load ML model:", e);
}

function predictRisk(features) {
    if (!modelData || !modelData.tree) return null;
    
    const tree = modelData.tree;
    let node = 0;
    
    // Simple decision tree traversal
    while (tree.children_left[node] !== -1 && tree.children_right[node] !== -1) {
        const featureIndex = tree.feature[node];
        const threshold = tree.threshold[node];
        const featureName = modelData.feature_names[featureIndex];
        
        const value = features[featureName] || 0;
        
        if (value <= threshold) {
            node = tree.children_left[node];
        } else {
            node = tree.children_right[node];
        }
    }
    
    // Return the predicted class (0 = Low Risk, 1 = High Risk)
    // The value array shape is [1, num_classes] for each node
    const classValues = tree.value[node][0];
    const riskClass = classValues[1] > classValues[0] ? 1 : 0;
    
    return riskClass;
}

function analyzeFlightRisk(telemetryData) {
    if (!telemetryData || telemetryData.length === 0) return null;
    
    const max_altitude = Math.max(...telemetryData.map(d => Number(d.altitude) || 0));
    
    let avg_speed = 15; // default since we don't have speed easily calculable without time parsing
    
    // Estimate flight duration in minutes
    const startTime = new Date(telemetryData[0].timestamp).getTime();
    const endTime = new Date(telemetryData[telemetryData.length - 1].timestamp).getTime();
    const flight_duration = Math.max(1, (endTime - startTime) / 60000);
    
    const start_battery = telemetryData[0].battery || 100;
    const end_battery = telemetryData[telemetryData.length - 1].battery || 0;
    const battery_drain = start_battery - end_battery;
    
    const features = {
        max_altitude,
        avg_speed,
        flight_duration,
        battery_drain
    };
    
    const riskLabel = predictRisk(features);
    
    return {
        features,
        riskScore: riskLabel === 1 ? 'High Risk' : 'Low Risk'
    };
}

module.exports = {
    analyzeFlightRisk
};
