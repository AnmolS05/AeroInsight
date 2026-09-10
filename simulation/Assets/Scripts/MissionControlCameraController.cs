using System.Collections;
using UnityEngine;

namespace AeroInsight.Simulation
{
    public enum CameraViewMode
    {
        Overview,
        ChaseDrone,
        FocusWaypoint,
        OrbitAnomaly
    }

    /// <summary>
    /// Dual-screen mission control camera controller.
    /// Bridges AeroInsight web UI selection events directly to the Unity Editor viewport.
    /// Implements Concept 4 (3D Interactive Mission Control).
    /// </summary>
    public class MissionControlCameraController : MonoBehaviour
    {
        [Header("Target & Mode")]
        public CameraViewMode currentMode = CameraViewMode.Overview;
        public Transform targetDrone;
        public Vector3 focusPosition = Vector3.zero;

        [Header("Tuning Parameters")]
        public float smoothSpeed = 3.0f;
        public Vector3 chaseOffset = new Vector3(0f, 6f, -12f);
        public float orbitDistance = 8.0f;
        public float orbitSpeedDegPerSec = 20.0f;

        private float _currentOrbitAngle = 0f;
        private Coroutine _transitionCoroutine;

        private void LateUpdate()
        {
            switch (currentMode)
            {
                case CameraViewMode.ChaseDrone:
                    if (targetDrone != null)
                    {
                        Vector3 desiredPos = targetDrone.position + targetDrone.TransformDirection(chaseOffset);
                        transform.position = Vector3.Lerp(transform.position, desiredPos, Time.deltaTime * smoothSpeed);
                        transform.LookAt(targetDrone.position + Vector3.up * 1.5f);
                    }
                    break;

                case CameraViewMode.OrbitAnomaly:
                    _currentOrbitAngle += orbitSpeedDegPerSec * Time.deltaTime;
                    float rad = _currentOrbitAngle * Mathf.Deg2Rad;
                    Vector3 orbitOffset = new Vector3(Mathf.Sin(rad) * orbitDistance, 4f, Mathf.Cos(rad) * orbitDistance);
                    transform.position = Vector3.Lerp(transform.position, focusPosition + orbitOffset, Time.deltaTime * smoothSpeed);
                    transform.LookAt(focusPosition);
                    break;

                case CameraViewMode.FocusWaypoint:
                    transform.position = Vector3.Lerp(transform.position, focusPosition + new Vector3(0f, 15f, -20f), Time.deltaTime * smoothSpeed);
                    transform.LookAt(focusPosition);
                    break;

                case CameraViewMode.Overview:
                    // Overview remains at fixed or smoothly guided position looking down
                    break;
            }
        }

        /// <summary>
        /// Focuses camera onto a selected anomaly position and initiates 360-degree orbit inspection.
        /// </summary>
        /// <param name="anomalyWorldPos">3D coordinate of the anomaly marker</param>
        public void FocusOnAnomaly(Vector3 anomalyWorldPos)
        {
            focusPosition = anomalyWorldPos;
            currentMode = CameraViewMode.OrbitAnomaly;
            _currentOrbitAngle = 0f;
            Debug.Log($"[AeroInsight] Mission Control Camera focused on anomaly at {anomalyWorldPos}");
        }

        /// <summary>
        /// Sets camera to chase the flying drone along its trajectory.
        /// </summary>
        public void ChaseDrone()
        {
            currentMode = CameraViewMode.ChaseDrone;
        }

        /// <summary>
        /// Returns camera to global mission overview.
        /// </summary>
        /// <param name="centerPoint">Center coordinate of the flight path</param>
        /// <param name="boundsSize">Bounding radius of the mission</param>
        public void SetOverview(Vector3 centerPoint, float boundsSize = 50f)
        {
            focusPosition = centerPoint;
            currentMode = CameraViewMode.Overview;
            Vector3 overviewPos = centerPoint + new Vector3(0f, boundsSize * 1.2f, -boundsSize * 0.8f);
            StartCoroutine(SmoothGlideTo(overviewPos, centerPoint));
        }

        private IEnumerator SmoothGlideTo(Vector3 targetPos, Vector3 lookTarget)
        {
            float elapsed = 0f;
            float duration = 1.2f;
            Vector3 startPos = transform.position;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = Mathf.SmoothStep(0f, 1f, elapsed / duration);
                transform.position = Vector3.Lerp(startPos, targetPos, t);
                transform.LookAt(lookTarget);
                yield return null;
            }
        }
    }
}
