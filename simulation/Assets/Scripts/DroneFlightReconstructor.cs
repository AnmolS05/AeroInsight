using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace AeroInsight.Simulation
{
    /// <summary>
    /// Telemetry data point structure matching AeroInsight's database and API payload.
    /// </summary>
    [Serializable]
    public class TelemetryPoint
    {
        public float latitude;
        public float longitude;
        public float altitude;
        public float battery;
        public string issue;
        public string timestamp;
    }

    /// <summary>
    /// Top-level flight container for deserialization.
    /// </summary>
    [Serializable]
    public class FlightDataContainer
    {
        public string flightId;
        public TelemetryPoint[] telemetry;
    }

    /// <summary>
    /// Reconstructs 2D/3D flight telemetry paths and visualizes anomalies inside Unity.
    /// Acts as the core Digital Twin agent interface for AeroInsight MCP interactions.
    /// </summary>
    [RequireComponent(typeof(LineRenderer))]
    public class DroneFlightReconstructor : MonoBehaviour
    {
        [Header("Flight Visuals")]
        [Tooltip("LineRenderer used to render the 3D flight trajectory ribbon")]
        public LineRenderer trajectoryLine;

        [Tooltip("Prefab instantiated at anomaly coordinates")]
        public GameObject anomalyBeaconPrefab;

        [Tooltip("Prefab instantiated at normal waypoint coordinates")]
        public GameObject waypointPrefab;

        [Tooltip("Transform representing the virtual drone")]
        public Transform droneObject;

        [Header("Path Scaling & Geography")]
        [Tooltip("Origin latitude for local UTM coordinate translation")]
        public double originLatitude = 0.0;

        [Tooltip("Origin longitude for local UTM coordinate translation")]
        public double originLongitude = 0.0;

        [Tooltip("Scale multiplier from meters to Unity world units")]
        public float coordinateScale = 1.0f;

        [Tooltip("Altitude scale multiplier")]
        public float altitudeScale = 1.0f;

        [Header("Playback Settings")]
        [Range(0.1f, 10f)]
        public float playbackSpeed = 1.0f;
        public bool loopPlayback = true;

        private List<Vector3> _worldWaypoints = new List<Vector3>();
        private List<TelemetryPoint> _telemetryPoints = new List<TelemetryPoint>();
        private Coroutine _playbackCoroutine;

        private void Awake()
        {
            if (trajectoryLine == null)
            {
                trajectoryLine = GetComponent<LineRenderer>();
            }

            ConfigureLineRendererDefaults();
        }

        /// <summary>
        /// Configures aesthetic default styling for the LineRenderer ribbon.
        /// </summary>
        private void ConfigureLineRendererDefaults()
        {
            if (trajectoryLine == null) return;

            trajectoryLine.startWidth = 0.4f;
            trajectoryLine.endWidth = 0.4f;
            trajectoryLine.useWorldSpace = true;
            trajectoryLine.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            trajectoryLine.receiveShadows = false;
        }

        /// <summary>
        /// Loads and reconstructs a flight trajectory from raw JSON string.
        /// Exposed directly to Unity MCP tools (unity_execute_code / unity_component_set_property).
        /// </summary>
        /// <param name="jsonContent">Serialized FlightDataContainer or raw array of TelemetryPoint</param>
        public void LoadFlightFromJson(string jsonContent)
        {
            try
            {
                TelemetryPoint[] points;

                if (jsonContent.Contains("\"telemetry\""))
                {
                    FlightDataContainer container = JsonUtility.FromJson<FlightDataContainer>(jsonContent);
                    points = container.telemetry;
                }
                else
                {
                    // Wrapper for raw JSON array
                    string wrapped = "{\"telemetry\":" + jsonContent + "}";
                    FlightDataContainer container = JsonUtility.FromJson<FlightDataContainer>(wrapped);
                    points = container.telemetry;
                }

                if (points == null || points.Length == 0)
                {
                    Debug.LogWarning("[AeroInsight] Received empty telemetry data.");
                    return;
                }

                BuildDigitalTwinPath(points);
            }
            catch (Exception ex)
            {
                Debug.LogError($"[AeroInsight] Failed to parse flight JSON: {ex.Message}");
            }
        }

        /// <summary>
        /// Builds 3D spline points, spawns anomaly beacons, and initializes playback.
        /// </summary>
        /// <param name="points">List of telemetry points</param>
        public void BuildDigitalTwinPath(TelemetryPoint[] points)
        {
            _worldWaypoints.Clear();
            _telemetryPoints.Clear();

            // Establish geographic origin from initial waypoint
            originLatitude = points[0].latitude;
            originLongitude = points[0].longitude;

            // Clear previous anomaly markers
            foreach (Transform child in transform)
            {
                Destroy(child.gameObject);
            }

            for (int i = 0; i < points.Length; i++)
            {
                TelemetryPoint pt = points[i];
                _telemetryPoints.Add(pt);

                // Simple flat-earth equirectangular approximation for local coordinates in meters:
                // 1 deg lat ~= 111,139 meters
                // 1 deg lon ~= 111,139 * cos(lat) meters
                double latDiff = (pt.latitude - originLatitude) * 111139.0;
                double lonDiff = (pt.longitude - originLongitude) * (111139.0 * Math.Cos(originLatitude * Math.PI / 180.0));

                float x = (float)lonDiff * coordinateScale;
                float y = pt.altitude * altitudeScale;
                float z = (float)latDiff * coordinateScale;

                Vector3 pos = new Vector3(x, y, z);
                _worldWaypoints.Add(pos);

                // Spawn anomaly indicator if an issue was recorded
                if (!string.IsNullOrEmpty(pt.issue) && !pt.issue.Equals("None", StringComparison.OrdinalIgnoreCase))
                {
                    SpawnAnomalyBeacon(pos, pt.issue, i);
                }
            }

            // Generate smooth spline path if enabled
            if (useSplineSmoothing && _worldWaypoints.Count > 2)
            {
                _splinePositions = GenerateSplinePath(_worldWaypoints, splineSubdivisions);
            }
            else
            {
                _splinePositions = new List<Vector3>(_worldWaypoints);
            }

            // Update LineRenderer with smoothed trajectory ribbon
            if (trajectoryLine != null)
            {
                var renderPositions = _splinePositions.Count > 0 ? _splinePositions : _worldWaypoints;
                trajectoryLine.positionCount = renderPositions.Count;
                trajectoryLine.SetPositions(renderPositions.ToArray());
            }

            // Start drone animation along path
            if (droneObject != null && _worldWaypoints.Count > 1)
            {
                if (_playbackCoroutine != null) StopCoroutine(_playbackCoroutine);
                _playbackCoroutine = StartCoroutine(AnimateDronePlayback());
            }

            Debug.Log($"[AeroInsight] 3D Digital Twin constructed with {_worldWaypoints.Count} waypoints.");
        }

        /// <summary>
        /// Instantiates a glowing 3D beacon marking an anomaly location.
        /// </summary>
        private void SpawnAnomalyBeacon(Vector3 position, string issueDescription, int waypointIndex)
        {
            GameObject marker;
            if (anomalyBeaconPrefab != null)
            {
                marker = Instantiate(anomalyBeaconPrefab, position, Quaternion.identity, transform);
            }
            else
            {
                // Procedural fallback primitive
                marker = GameObject.CreatePrimitive(PrimitiveType.Sphere);
                marker.transform.SetParent(transform);
                marker.transform.position = position;
                marker.transform.localScale = Vector3.one * 1.5f;

                Renderer rend = marker.GetComponent<Renderer>();
                if (rend != null)
                {
                    rend.material.color = Color.red;
                }
            }

            marker.name = $"Anomaly_{waypointIndex}_{issueDescription.Replace(" ", "_")}";
        }

        [Tooltip("Enable smooth aerodynamic Catmull-Rom spline interpolation")]
        public bool useSplineSmoothing = true;

        [Range(2, 10)]
        [Tooltip("Spline interpolation subdivision points per waypoint leg")]
        public int splineSubdivisions = 5;

        private List<Vector3> _splinePositions = new List<Vector3>();

        /// <summary>
        /// Evaluates a Catmull-Rom spline point at parameter t in [0, 1] between p1 and p2.
        /// </summary>
        public static Vector3 EvaluateCatmullRom(Vector3 p0, Vector3 p1, Vector3 p2, Vector3 p3, float t)
        {
            float t2 = t * t;
            float t3 = t2 * t;

            return 0.5f * (
                (2.0f * p1) +
                (-p0 + p2) * t +
                (2.0f * p0 - 5.0f * p1 + 4.0f * p2 - p3) * t2 +
                (-p0 + 3.0f * p1 - 3.0f * p2 + p3) * t3
            );
        }

        /// <summary>
        /// Generates a smooth Catmull-Rom spline path through all world waypoints.
        /// </summary>
        private List<Vector3> GenerateSplinePath(List<Vector3> waypoints, int subdivisions)
        {
            List<Vector3> spline = new List<Vector3>();
            if (waypoints.Count < 2) return new List<Vector3>(waypoints);

            for (int i = 0; i < waypoints.Count - 1; i++)
            {
                Vector3 p0 = i > 0 ? waypoints[i - 1] : waypoints[i];
                Vector3 p1 = waypoints[i];
                Vector3 p2 = waypoints[i + 1];
                Vector3 p3 = i < waypoints.Count - 2 ? waypoints[i + 2] : p2;

                for (int s = 0; s < subdivisions; s++)
                {
                    float t = (float)s / subdivisions;
                    spline.Add(EvaluateCatmullRom(p0, p1, p2, p3, t));
                }
            }

            spline.Add(waypoints[waypoints.Count - 1]);
            return spline;
        }

        /// <summary>
        /// Coroutine to animate drone smoothly through waypoints or spline points with aerodynamic banking.
        /// </summary>
        private IEnumerator AnimateDronePlayback()
        {
            List<Vector3> trajectoryPath = (useSplineSmoothing && _splinePositions.Count > 1) 
                ? _splinePositions 
                : _worldWaypoints;

            while (true)
            {
                for (int i = 0; i < trajectoryPath.Count - 1; i++)
                {
                    Vector3 start = trajectoryPath[i];
                    Vector3 end = trajectoryPath[i + 1];
                    float duration = Vector3.Distance(start, end) / (6.0f * playbackSpeed);
                    if (duration < 0.02f) duration = 0.02f;

                    float elapsed = 0f;
                    while (elapsed < duration)
                    {
                        elapsed += Time.deltaTime;
                        float t = elapsed / duration;
                        droneObject.position = Vector3.Lerp(start, end, t);

                        Vector3 direction = (end - start).normalized;
                        if (direction != Vector3.zero)
                        {
                            Quaternion targetRot = Quaternion.LookRotation(direction);

                            // Calculate aerodynamic bank angle (roll) proportional to yaw rate
                            if (i < trajectoryPath.Count - 2)
                            {
                                Vector3 nextDir = (trajectoryPath[i + 2] - end).normalized;
                                float turnAngle = Vector3.SignedAngle(direction, nextDir, Vector3.up);
                                float rollAngle = Mathf.Clamp(-turnAngle * 1.8f, -30f, 30f);
                                targetRot *= Quaternion.Euler(0f, 0f, rollAngle);
                            }

                            droneObject.rotation = Quaternion.Slerp(droneObject.rotation, targetRot, Time.deltaTime * 8f);
                        }

                        yield return null;
                    }
                }

                if (!loopPlayback) break;
                yield return new WaitForSeconds(1.0f);
            }
        }
    }
}
