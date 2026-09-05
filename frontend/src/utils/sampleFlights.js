/**
 * @file sampleFlights.js
 * @description Curated flight missions with realistic telemetry and AI safety evaluation reports.
 * Used for offline demonstration, fallback resilience, and immediate preview.
 */

export const SAMPLE_FLIGHTS = [
  {
    id: "flt-blr-001",
    name: "Bengaluru Urban Survey",
    created_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    telemetry: [
      { timestamp: "2026-09-05T14:00:00Z", latitude: 12.9716, longitude: 77.5946, altitude: 15.0, battery: 100, issue: "none" },
      { timestamp: "2026-09-05T14:00:05Z", latitude: 12.9720, longitude: 77.5950, altitude: 22.5, battery: 97, issue: "none" },
      { timestamp: "2026-09-05T14:00:10Z", latitude: 12.9725, longitude: 77.5955, altitude: 35.0, battery: 93, issue: "High wind shear detected (32 km/h)" },
      { timestamp: "2026-09-05T14:00:15Z", latitude: 12.9730, longitude: 77.5960, altitude: 40.2, battery: 88, issue: "none" },
      { timestamp: "2026-09-05T14:00:20Z", latitude: 12.9735, longitude: 77.5965, altitude: 38.0, battery: 82, issue: "Motor #3 temperature threshold warning (68°C)" },
      { timestamp: "2026-09-05T14:00:25Z", latitude: 12.9740, longitude: 77.5970, altitude: 25.0, battery: 75, issue: "none" },
      { timestamp: "2026-09-05T14:00:30Z", latitude: 12.9742, longitude: 77.5975, altitude: 10.0, battery: 70, issue: "none" }
    ],
    report: `### Flight Mission Intelligence Brief

**Mission ID:** FLT-BLR-001  
**Airframe:** Quadrotor Alpha-X  
**Operational Status:** Mission Completed with Alerts  

---

#### 1. Executive Summary
The aircraft executed a semi-autonomous urban perimeter survey across central Bengaluru. Total mission duration was **30 seconds** across **7 telemetry checkpoints**, spanning an altitude envelope between **10.0m and 40.2m**. Overall mission integrity was maintained, but two thermal and atmospheric events were flagged for technician review.

#### 2. Anomaly Analysis & Geospatial Coordinates
- **High Wind Shear Incident:**  
  *Coordinates:* \`12.9725° N, 77.5955° E\` at \`T+10s\` (Altitude: 35.0m)  
  *Observation:* Encountered localized crosswinds of 32 km/h. Flight controller stabilized attitude with a transient 4% battery delta spike.
- **Motor #3 Thermal Elevation:**  
  *Coordinates:* \`12.9735° N, 77.5965° E\` at \`T+20s\` (Altitude: 38.0m)  
  *Observation:* Core motor temperature hit 68°C, exceeding nominal threshold (65°C). Escaped thermal runaway due to rapid descent initiation.

#### 3. Power Consumption & Efficiency
- **Initial Charge:** 100.0%
- **Landing Charge:** 70.0%
- **Net Consumption:** 30.0% over 0.5 minutes (1.0% / sec during climb phase)
- **Cell Health Metric:** Nominal (Voltage stability maintained across all 4S LiPo cells).

#### 4. Actionable Maintenance Protocol
1. Perform physical bearing inspection and spin-test on **Motor #3** prior to next flight clearance.
2. Verify propeller pitch calibration on front-starboard rotor.
3. Review meteorological boundary layer data for subsequent low-altitude urban corridors.`
  },
  {
    id: "flt-sfo-002",
    name: "Bay Area Coastal Patrol",
    created_at: new Date(Date.now() - 3600 * 1000 * 8).toISOString(),
    telemetry: [
      { timestamp: "2026-09-05T09:00:00Z", latitude: 37.7749, longitude: -122.4194, altitude: 0.0, battery: 100, issue: "none" },
      { timestamp: "2026-09-05T09:00:10Z", latitude: 37.7750, longitude: -122.4192, altitude: 20.0, battery: 99, issue: "none" },
      { timestamp: "2026-09-05T09:00:20Z", latitude: 37.7752, longitude: -122.4188, altitude: 50.0, battery: 97, issue: "none" },
      { timestamp: "2026-09-05T09:00:30Z", latitude: 37.7755, longitude: -122.4183, altitude: 80.0, battery: 95, issue: "none" },
      { timestamp: "2026-09-05T09:00:40Z", latitude: 37.7758, longitude: -122.4178, altitude: 100.0, battery: 92, issue: "none" },
      { timestamp: "2026-09-05T09:00:50Z", latitude: 37.7760, longitude: -122.4170, altitude: 100.0, battery: 90, issue: "none" },
      { timestamp: "2026-09-05T09:01:00Z", latitude: 37.7762, longitude: -122.4162, altitude: 105.0, battery: 87, issue: "Sustained high wind resistance detected" },
      { timestamp: "2026-09-05T09:01:10Z", latitude: 37.7765, longitude: -122.4150, altitude: 110.0, battery: 82, issue: "Rapid battery drain anomaly (-5% in 10s)" },
      { timestamp: "2026-09-05T09:01:20Z", latitude: 37.7768, longitude: -122.4140, altitude: 90.0, battery: 78, issue: "none" },
      { timestamp: "2026-09-05T09:01:30Z", latitude: 37.7770, longitude: -122.4130, altitude: 60.0, battery: 74, issue: "none" },
      { timestamp: "2026-09-05T09:01:40Z", latitude: 37.7772, longitude: -122.4120, altitude: 30.0, battery: 71, issue: "none" },
      { timestamp: "2026-09-05T09:01:50Z", latitude: 37.7774, longitude: -122.4110, altitude: 5.0, battery: 68, issue: "none" }
    ],
    report: `### Flight Mission Intelligence Brief

**Mission ID:** FLT-SFO-002  
**Airframe:** Stratos Recon-7  
**Operational Status:** Flight Completed · Battery Anomaly Noted  

---

#### 1. Executive Summary
High-altitude coastal waypoint surveillance completed over 110 seconds across 12 tracking intervals. Cruise ceiling achieved at **110.0m AGL**. The airframe maintained stable waypoint precision within a ±0.4m corridor.

#### 2. Telemetry & Anomaly Analysis
- **Wind Shear Encounter:**  
  *Coordinates:* \`37.7762° N, -122.4162° W\` at \`T+60s\` (Altitude: 105.0m)  
  *Observation:* Marine layer turbulence encountered at the 100m inflection layer.
- **Abnormal Discharge Rate:**  
  *Coordinates:* \`37.7765° N, -122.4150° W\` at \`T+70s\` (Altitude: 110.0m)  
  *Observation:* Power consumption increased by 2.5x during gust stabilization, depleting 5% within 10 seconds.

#### 3. Flight Envelope Metrics
- **Peak Altitude:** 110.0 m
- **Average Cruise Speed:** 14.8 m/s
- **Total Distance Covered:** ~940 m
- **End of Mission Battery:** 68.0%

#### 4. Recommended Actions
1. Inspect battery connector contacts for impedance anomalies.
2. Calibrate barometric altimeter against GNSS altitude variance.
3. Airframe certified for return-to-service upon battery pack cycle log review.`
  }
];
