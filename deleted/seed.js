const db = require('./config/database');
const crypto = require('crypto');

async function seedDatabase() {
    const flightId = crypto.randomUUID();

    await new Promise((resolve) => {
        db.run('INSERT INTO flights (id) VALUES (?)', [flightId], resolve);
    });

    const telemetry = [
        { lat: 37.7749, lng: -122.4194, alt: 100, bat: 95, iss: 'none', t: '2026-08-24T10:00:00Z' },
        { lat: 37.7755, lng: -122.4180, alt: 110, bat: 92, iss: 'none', t: '2026-08-24T10:02:00Z' },
        { lat: 37.7760, lng: -122.4170, alt: 105, bat: 89, iss: 'none', t: '2026-08-24T10:04:00Z' },
        { lat: 37.7765, lng: -122.4160, alt: 90, bat: 85, iss: 'sudden altitude drop', t: '2026-08-24T10:05:00Z' },
        { lat: 37.7770, lng: -122.4150, alt: 115, bat: 80, iss: 'none', t: '2026-08-24T10:07:00Z' },
        { lat: 37.7775, lng: -122.4140, alt: 120, bat: 75, iss: 'none', t: '2026-08-24T10:09:00Z' },
        { lat: 37.7780, lng: -122.4130, alt: 118, bat: 70, iss: 'none', t: '2026-08-24T10:11:00Z' },
        { lat: 37.7785, lng: -122.4120, alt: 115, bat: 62, iss: 'rapid battery drain', t: '2026-08-24T10:12:00Z' },
        { lat: 37.7790, lng: -122.4110, alt: 110, bat: 60, iss: 'none', t: '2026-08-24T10:14:00Z' },
    ];

    const stmt = db.prepare('INSERT INTO telemetry (flight_id, latitude, longitude, altitude, battery, issue, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)');
    for (const p of telemetry) {
        stmt.run(flightId, p.lat, p.lng, p.alt, p.bat, p.iss, p.t);
    }
    stmt.finalize();

    const reportText = `
# Gemini Anomaly Report (Mock)

## Overview
The flight lasted for 14 minutes, covering a linear path across the target zone. Two critical anomalies were detected during the operation.

## Detected Issues

### 1. Sudden Altitude Drop
- **Time:** 10:05:00Z
- **Coordinates:** 37.7765, -122.4160
- **Details:** The drone experienced a sudden drop from 105m to 90m within 60 seconds. This may indicate a temporary loss of propulsion or strong downdrafts.

### 2. Rapid Battery Drain
- **Time:** 10:12:00Z
- **Coordinates:** 37.7785, -122.4120
- **Details:** Battery level dropped from 70% to 62% in one minute, which is significantly faster than the expected discharge rate.

## Recommendations
- Inspect the rotors and motors for potential debris or wear that could cause propulsion loss.
- Perform a battery health cycle test to ensure the cell integrity is not compromised.
    `;

    await new Promise((resolve) => {
        db.run('INSERT INTO reports (flight_id, report_text) VALUES (?, ?)', [flightId, reportText], resolve);
    });

    console.log('Database seeded with a mock flight.');
}

seedDatabase();
