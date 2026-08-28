const fs = require('fs');
const path = require('path');

let modelData = null;

try {
    modelData = require('../ml_models/risk_model.json');
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

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const toRadians = (deg) => (deg * Math.PI) / 180;
    const φ1 = toRadians(lat1);
    const φ2 = toRadians(lat2);
    const Δφ = toRadians(lat2 - lat1);
    const Δλ = toRadians(lon2 - lon1);

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
}

function analyzeFlightRisk(telemetryData) {
    if (!telemetryData || telemetryData.length === 0) return null;
    
    const max_altitude = Math.max(...telemetryData.map(d => Number(d.altitude) || 0));
    
    // Estimate flight duration in minutes
    const startTime = new Date(telemetryData[0].timestamp).getTime();
    const endTime = new Date(telemetryData[telemetryData.length - 1].timestamp).getTime();
    const flight_duration = Math.max(0.1, (endTime - startTime) / 60000);
    
    // Calculate actual average speed using Haversine formula
    let totalDistanceMeters = 0;
    for (let i = 1; i < telemetryData.length; i++) {
        const prev = telemetryData[i - 1];
        const curr = telemetryData[i];
        if (prev.latitude && prev.longitude && curr.latitude && curr.longitude) {
            totalDistanceMeters += calculateDistance(
                Number(prev.latitude), Number(prev.longitude),
                Number(curr.latitude), Number(curr.longitude)
            );
        }
    }
    
    const flight_duration_seconds = flight_duration * 60;
    const avg_speed = totalDistanceMeters / flight_duration_seconds;
    
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
