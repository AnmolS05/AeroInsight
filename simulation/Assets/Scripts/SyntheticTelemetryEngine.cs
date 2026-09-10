using System;
using System.Collections.Generic;
using UnityEngine;

namespace AeroInsight.Simulation
{
    /// <summary>
    /// Pattern profile for synthetic flight generation.
    /// </summary>
    public enum FlightPatternType
    {
        LawnmowerSurvey,
        OrbitInspection,
        PointToPoint,
        PerimeterPatrol
    }

    /// <summary>
    /// Configuration for synthetic telemetry generation.
    /// </summary>
    [Serializable]
    public class SyntheticGenerationRequest
    {
        public string flightId;
        public string flightPattern = "LawnmowerSurvey"; // LawnmowerSurvey, OrbitInspection, PointToPoint, PerimeterPatrol
        public double centerLatitude = 12.9716;
        public double centerLongitude = 77.5946;
        public float baseAltitudeMeters = 35.0f;
        public int totalDurationSeconds = 60;
        public float samplingIntervalSeconds = 1.0f;
        public string injectedAnomaly = "Motor Overheat"; // "None", "Motor Overheat", "Sensor Drift", "Rapid Battery Depletion", "Sudden Altitude Drop"
        public int anomalyStartSecond = 40;
    }

    /// <summary>
    /// Engine for generating synthetic drone telemetry logs using simulated flight paths.
    /// Implements Concept 3 (Synthetic Telemetry Generator: Simulation to Dashboard).
    /// </summary>
    public class SyntheticTelemetryEngine : MonoBehaviour
    {
        /// <summary>
        /// Generates a complete synthetic flight telemetry log from requested configuration.
        /// </summary>
        /// <param name="requestJson">Serialized SyntheticGenerationRequest</param>
        /// <returns>AeroInsight-compliant flight JSON string</returns>
        public static string GenerateSyntheticFlightJson(string requestJson)
        {
            SyntheticGenerationRequest request;
            try
            {
                request = JsonUtility.FromJson<SyntheticGenerationRequest>(requestJson);
            }
            catch
            {
                request = new SyntheticGenerationRequest();
            }

            if (string.IsNullOrEmpty(request.flightId))
            {
                request.flightId = $"SYNTH_{DateTime.UtcNow:yyyyMMdd_HHmmss}";
            }

            List<TelemetryPoint> points = new List<TelemetryPoint>();
            DateTime startTime = DateTime.UtcNow.AddMinutes(-10);

            float currentBattery = 98.5f;
            float currentAlt = request.baseAltitudeMeters;
            float speedMps = 8.0f; // ~28 km/h cruise speed

            int totalSteps = Mathf.Max(10, (int)(request.totalDurationSeconds / request.samplingIntervalSeconds));
            double latMetersToDeg = 1.0 / 111139.0;
            double lonMetersToDeg = 1.0 / (111139.0 * Math.Cos(request.centerLatitude * Math.PI / 180.0));

            for (int step = 0; step < totalSteps; step++)
            {
                float timeSec = step * request.samplingIntervalSeconds;
                DateTime timestamp = startTime.AddSeconds(timeSec);

                double offsetX = 0;
                double offsetZ = 0;

                // Compute path coordinates based on pattern
                if (request.flightPattern.Equals("OrbitInspection", StringComparison.OrdinalIgnoreCase))
                {
                    float radius = 40.0f;
                    float angle = (timeSec / request.totalDurationSeconds) * Mathf.PI * 2f;
                    offsetX = Mathf.Cos(angle) * radius;
                    offsetZ = Mathf.Sin(angle) * radius;
                }
                else if (request.flightPattern.Equals("PointToPoint", StringComparison.OrdinalIgnoreCase))
                {
                    offsetX = (timeSec / request.totalDurationSeconds) * 200.0f;
                    offsetZ = Mathf.Sin(timeSec * 0.1f) * 15.0f;
                }
                else // Default: Lawnmower Survey
                {
                    float legDuration = request.totalDurationSeconds / 4.0f;
                    int leg = (int)(timeSec / legDuration);
                    float legProgress = (timeSec % legDuration) / legDuration;

                    float laneWidth = 30.0f;
                    float laneLength = 120.0f;

                    if (leg % 2 == 0)
                    {
                        offsetX = leg * laneWidth;
                        offsetZ = legProgress * laneLength;
                    }
                    else
                    {
                        offsetX = leg * laneWidth;
                        offsetZ = (1.0f - legProgress) * laneLength;
                    }
                }

                // Altitude baseline with gentle micro-fluctuations
                float altNoise = Mathf.PerlinNoise(timeSec * 0.2f, 0f) * 0.8f - 0.4f;
                currentAlt = request.baseAltitudeMeters + altNoise;

                // Normal battery consumption (~0.12% per second during active flight)
                currentBattery -= request.samplingIntervalSeconds * 0.12f;

                // Anomaly Injection
                string issue = "None";
                if (timeSec >= request.anomalyStartSecond && !string.IsNullOrEmpty(request.injectedAnomaly) && !request.injectedAnomaly.Equals("None", StringComparison.OrdinalIgnoreCase))
                {
                    issue = request.injectedAnomaly;

                    if (issue.Contains("Altitude Drop"))
                    {
                        currentAlt = Mathf.Max(2.0f, currentAlt - (timeSec - request.anomalyStartSecond) * 3.5f);
                    }
                    else if (issue.Contains("Battery"))
                    {
                        currentBattery -= request.samplingIntervalSeconds * 2.5f; // Rapid drain
                    }
                    else if (issue.Contains("Sensor Drift"))
                    {
                        offsetX += (timeSec - request.anomalyStartSecond) * 4.0f;
                    }
                }

                double lat = request.centerLatitude + (offsetZ * latMetersToDeg);
                double lon = request.centerLongitude + (offsetX * lonMetersToDeg);

                points.Add(new TelemetryPoint
                {
                    latitude = (float)lat,
                    longitude = (float)lon,
                    altitude = (float)Math.Round(currentAlt, 2),
                    battery = (float)Math.Round(Mathf.Clamp(currentBattery, 0f, 100f), 1),
                    issue = issue.Equals("None") ? null : issue,
                    timestamp = timestamp.ToString("yyyy-MM-ddTHH:mm:ssZ")
                });
            }

            FlightDataContainer container = new FlightDataContainer
            {
                flightId = request.flightId,
                telemetry = points.ToArray()
            };

            return JsonUtility.ToJson(container);
        }
    }
}
