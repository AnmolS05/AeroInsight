using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace AeroInsight.Simulation
{
    /// <summary>
    /// Configuration parameters for environmental physics and anomaly simulation.
    /// </summary>
    [Serializable]
    public class PhysicsSimulationConfig
    {
        public string flightId;
        public float windSpeedKnots = 15f;
        public Vector3 windDirection = new Vector3(1f, 0f, 0.5f);
        public float airDensity = 1.225f; // kg/m^3
        public float droneMassKg = 2.5f;
        public float dragCoefficient = 0.45f;
        public float crossSectionalArea = 0.12f; // m^2
        public float thrustDegradationPercent = 0f;
        public string failureType = "None"; // "MotorCutoff", "WindShear", "BatterySag", "Turbulence"
        public int triggerSecond = 10;
        public float durationSeconds = 30f;
    }

    /// <summary>
    /// Telemetry log entry captured during physical simulation.
    /// </summary>
    [Serializable]
    public class SimulatedTelemetryFrame
    {
        public float timeOffset;
        public Vector3 position;
        public Vector3 velocity;
        public Vector3 acceleration;
        public float simulatedAltitude;
        public float simulatedBattery;
        public string simulatedIssue;
    }

    /// <summary>
    /// Simulates aerodynamic and environmental physics on a drone during anomaly occurrences.
    /// Implements Concept 2 (Physics-Based Anomaly Reconstruction & Crash Analysis).
    /// </summary>
    [RequireComponent(typeof(Rigidbody))]
    public class PhysicsAnomalySimulator : MonoBehaviour
    {
        [Header("Physics Configuration")]
        public PhysicsSimulationConfig config = new PhysicsSimulationConfig();

        [Header("Runtime Telemetry Output")]
        public List<SimulatedTelemetryFrame> recordedFrames = new List<SimulatedTelemetryFrame>();

        [Header("Drone State")]
        public float currentThrustNewtons = 24.525f; // Neutral hover thrust for 2.5kg (m * g)
        public float currentBatteryLevel = 100f;
        public bool isSimulating = false;

        /// <summary>
        /// Convenience property for live bridge access.
        /// </summary>
        public float windShearSpeed
        {
            get => config.windSpeedKnots;
            set => config.windSpeedKnots = value;
        }

        /// <summary>
        /// Convenience property for motor rotor cutoff loss percentage.
        /// </summary>
        public float motorRotorCutoffLossPercent
        {
            get => config.thrustDegradationPercent;
            set => config.thrustDegradationPercent = value;
        }

        private Rigidbody _rb;
        private float _simulationTimer = 0f;
        private const float GRAVITY = 9.81f;

        /// <summary>
        /// Triggers an immediate physics failure scenario in the active scene.
        /// </summary>
        public void TriggerFailure()
        {
            config.triggerSecond = 0; // Trigger immediately
            StartPhysicsReconstruction(null);
        }

        private void Awake()
        {
            _rb = GetComponent<Rigidbody>();
            if (_rb == null) _rb = gameObject.AddComponent<Rigidbody>();

            _rb.mass = config.droneMassKg;
            _rb.useGravity = true;
            _rb.drag = 0.1f;
            _rb.angularDrag = 0.2f;
        }

        /// <summary>
        /// Initiates a physics reconstruction run with designated environmental and anomaly parameters.
        /// </summary>
        /// <param name="configJson">JSON string representing PhysicsSimulationConfig</param>
        public void StartPhysicsReconstruction(string configJson)
        {
            if (!string.IsNullOrEmpty(configJson))
            {
                config = JsonUtility.FromJson<PhysicsSimulationConfig>(configJson);
            }

            _rb.mass = config.droneMassKg;
            _rb.linearVelocity = Vector3.zero;
            _rb.angularVelocity = Vector3.zero;
            transform.position = new Vector3(0f, 25f, 0f); // Default 25m hover

            currentBatteryLevel = 100f;
            currentThrustNewtons = config.droneMassKg * GRAVITY;
            recordedFrames.Clear();
            _simulationTimer = 0f;
            isSimulating = true;

            Debug.Log($"[AeroInsight] Physics simulation started: {config.failureType} with {config.windSpeedKnots} knots wind.");
        }

        private void FixedUpdate()
        {
            if (!isSimulating) return;

            _simulationTimer += Time.fixedDeltaTime;

            // 1. Calculate wind forces (Drag = 0.5 * rho * v^2 * Cd * A)
            float windSpeedMps = config.windSpeedKnots * 0.514444f;
            Vector3 relativeWind = (config.windDirection.normalized * windSpeedMps) - _rb.linearVelocity;
            float speedSq = relativeWind.sqrMagnitude;
            Vector3 dragForce = 0.5f * config.airDensity * speedSq * config.dragCoefficient * config.crossSectionalArea * relativeWind.normalized;
            _rb.AddForce(dragForce, ForceMode.Force);

            // 2. Anomaly Injection Logic
            string activeIssue = "Normal";
            if (_simulationTimer >= config.triggerSecond)
            {
                switch (config.failureType)
                {
                    case "MotorCutoff":
                        currentThrustNewtons = (config.droneMassKg * GRAVITY) * (1f - (config.thrustDegradationPercent / 100f));
                        activeIssue = "Critical Motor Failure: Severe Thrust Loss";
                        break;

                    case "WindShear":
                        Vector3 gust = Vector3.Cross(config.windDirection, Vector3.up).normalized * (windSpeedMps * 2.2f);
                        _rb.AddForce(gust, ForceMode.Impulse);
                        activeIssue = "Severe Wind Shear Incursion";
                        break;

                    case "BatterySag":
                        currentBatteryLevel -= Time.fixedDeltaTime * 4.5f; // Rapid depletion
                        currentThrustNewtons *= 0.985f;
                        activeIssue = "Cell Overheat & Rapid Voltage Sag";
                        break;

                    case "Turbulence":
                        Vector3 turbulence = new Vector3(
                            Mathf.PerlinNoise(_simulationTimer * 5f, 0f) - 0.5f,
                            Mathf.PerlinNoise(0f, _simulationTimer * 5f) - 0.5f,
                            Mathf.PerlinNoise(_simulationTimer * 5f, _simulationTimer * 5f) - 0.5f
                        ) * 15f;
                        _rb.AddForce(turbulence, ForceMode.Force);
                        activeIssue = "Microburst Atmospheric Turbulence";
                        break;
                }
            }
            else
            {
                // Standard flight battery consumption
                currentBatteryLevel -= Time.fixedDeltaTime * 0.2f;
            }

            // 3. Apply active vertical thrust
            _rb.AddForce(Vector3.up * currentThrustNewtons, ForceMode.Force);

            // 4. Record simulation frame
            SimulatedTelemetryFrame frame = new SimulatedTelemetryFrame
            {
                timeOffset = _simulationTimer,
                position = transform.position,
                velocity = _rb.linearVelocity,
                acceleration = _rb.linearVelocity / Time.fixedDeltaTime,
                simulatedAltitude = Mathf.Max(0f, transform.position.y),
                simulatedBattery = Mathf.Clamp(currentBatteryLevel, 0f, 100f),
                simulatedIssue = activeIssue
            };
            recordedFrames.Add(frame);

            // Stop simulation when duration reached or drone hits ground
            if (_simulationTimer >= config.durationSeconds || transform.position.y <= 0f)
            {
                isSimulating = false;
                Debug.Log($"[AeroInsight] Physics simulation completed with {recordedFrames.Count} recorded frames.");
            }
        }

        /// <summary>
        /// Serializes recorded simulation frames into a JSON payload compatible with AeroInsight.
        /// </summary>
        /// <returns>JSON string array of telemetry frames</returns>
        public string ExportSimulatedTelemetryJson()
        {
            List<TelemetryPoint> points = new List<TelemetryPoint>();
            double baseLat = 12.9716;
            double baseLon = 77.5946;

            foreach (var frame in recordedFrames)
            {
                double lat = baseLat + (frame.position.z / 111139.0);
                double lon = baseLon + (frame.position.x / (111139.0 * Math.Cos(baseLat * Math.PI / 180.0)));

                points.Add(new TelemetryPoint
                {
                    latitude = (float)lat,
                    longitude = (float)lon,
                    altitude = frame.simulatedAltitude,
                    battery = frame.simulatedBattery,
                    issue = frame.simulatedIssue,
                    timestamp = DateTime.UtcNow.AddSeconds(frame.timeOffset).ToString("o")
                });
            }

            FlightDataContainer container = new FlightDataContainer
            {
                flightId = string.IsNullOrEmpty(config.flightId) ? $"SIM_{Guid.NewGuid().ToString().Substring(0, 8)}" : config.flightId,
                telemetry = points.ToArray()
            };

            return JsonUtility.ToJson(container);
        }

        private void OnDrawGizmos()
        {
            if (!Application.isPlaying && !isSimulating) return;

            // Draw Wind Shear Vector Arrow in SceneView
            Gizmos.color = Color.cyan;
            Vector3 dronePos = transform.position;
            Vector3 windVector = config.windDirection.normalized * (config.windSpeedKnots * 0.25f);
            Gizmos.DrawRay(dronePos, windVector);
            Gizmos.DrawWireSphere(dronePos + windVector, 0.4f);

            // Draw Failure Hazard Sphere if anomaly active
            if (_simulationTimer >= config.triggerSecond && config.failureType != "None")
            {
                Gizmos.color = new Color(1f, 0.2f, 0.2f, 0.45f);
                Gizmos.DrawWireSphere(dronePos, 2.5f);
            }
        }
    }
}
