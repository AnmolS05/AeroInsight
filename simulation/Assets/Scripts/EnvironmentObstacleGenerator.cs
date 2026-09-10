using System.Collections.Generic;
using UnityEngine;

namespace AeroInsight.Simulation
{
    /// <summary>
    /// Procedural obstacle and environment asset generator for Unity Digital Twin scenarios.
    /// Supports dynamic spawning of buildings, wind turbines, solar panel arrays, and foliage
    /// around flight paths to support Concept 2 (Physics-Based Crash Analysis & Obstacle Avoidance).
    /// </summary>
    public class EnvironmentObstacleGenerator : MonoBehaviour
    {
        [Header("Materials & Styling")]
        public Material buildingMaterial;
        public Material turbineMaterial;
        public Material solarMaterial;
        public Material foliageMaterial;

        private readonly List<GameObject> _spawnedObstacles = new List<GameObject>();

        private void EnsureMaterials()
        {
            if (buildingMaterial == null)
            {
                buildingMaterial = new Material(Shader.Find("Standard"));
                buildingMaterial.color = new Color(0.25f, 0.28f, 0.35f);
                buildingMaterial.SetFloat("_Glossiness", 0.3f);
            }

            if (turbineMaterial == null)
            {
                turbineMaterial = new Material(Shader.Find("Standard"));
                turbineMaterial.color = new Color(0.92f, 0.92f, 0.95f);
                turbineMaterial.SetFloat("_Metallic", 0.5f);
            }

            if (solarMaterial == null)
            {
                solarMaterial = new Material(Shader.Find("Standard"));
                solarMaterial.color = new Color(0.05f, 0.12f, 0.35f);
                solarMaterial.SetFloat("_Metallic", 0.8f);
                solarMaterial.SetFloat("_Glossiness", 0.85f);
            }

            if (foliageMaterial == null)
            {
                foliageMaterial = new Material(Shader.Find("Standard"));
                foliageMaterial.color = new Color(0.12f, 0.38f, 0.16f);
            }
        }

        /// <summary>
        /// Clears all dynamically spawned procedural obstacles in the scene.
        /// </summary>
        public void ClearObstacles()
        {
            foreach (var obj in _spawnedObstacles)
            {
                if (obj != null) DestroyImmediate(obj);
            }
            _spawnedObstacles.Clear();
            Debug.Log("[AeroInsight] Procedural environment cleared.");
        }

        /// <summary>
        /// Spawns a cluster of 3D architectural building obstacles around a coordinate.
        /// </summary>
        /// <param name="center">World center position</param>
        /// <param name="count">Number of buildings</param>
        /// <param name="radius">Cluster radius</param>
        /// <param name="minHeight">Minimum building height</param>
        /// <param name="maxHeight">Maximum building height</param>
        public void SpawnBuildingCluster(Vector3 center, int count = 6, float radius = 50f, float minHeight = 15f, float maxHeight = 45f)
        {
            EnsureMaterials();
            GameObject root = new GameObject("Environment_BuildingCluster");
            root.transform.SetParent(transform);
            _spawnedObstacles.Add(root);

            for (int i = 0; i < count; i++)
            {
                float angle = (float)i / count * Mathf.PI * 2f + Random.Range(-0.2f, 0.2f);
                float dist = Random.Range(10f, radius);
                float x = center.x + Mathf.Cos(angle) * dist;
                float z = center.z + Mathf.Sin(angle) * dist;

                float height = Random.Range(minHeight, maxHeight);
                float width = Random.Range(12f, 24f);
                float depth = Random.Range(12f, 24f);

                GameObject bldg = GameObject.CreatePrimitive(PrimitiveType.Cube);
                bldg.name = $"Building_{i + 1}";
                bldg.transform.SetParent(root.transform);
                bldg.transform.position = new Vector3(x, height / 2f, z);
                bldg.transform.localScale = new Vector3(width, height, depth);

                Renderer rend = bldg.GetComponent<Renderer>();
                if (rend != null) rend.material = buildingMaterial;

                // Add box collider for physics anomaly collisions
                BoxCollider col = bldg.GetComponent<BoxCollider>();
                if (col == null) bldg.AddComponent<BoxCollider>();
            }

            Debug.Log($"[AeroInsight] Spawned {count} buildings around {center}.");
        }

        /// <summary>
        /// Spawns an industrial wind turbine hazard obstacle with tower and rotating blades.
        /// </summary>
        /// <param name="position">Base position</param>
        /// <param name="towerHeight">Hub height in meters</param>
        /// <param name="bladeRadius">Blade length in meters</param>
        public void SpawnWindTurbine(Vector3 position, float towerHeight = 50f, float bladeRadius = 25f)
        {
            EnsureMaterials();
            GameObject turbine = new GameObject("Environment_WindTurbine");
            turbine.transform.SetParent(transform);
            turbine.transform.position = position;
            _spawnedObstacles.Add(turbine);

            // Tower Mast
            GameObject mast = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            mast.name = "Turbine_Tower";
            mast.transform.SetParent(turbine.transform);
            mast.transform.position = position + new Vector3(0f, towerHeight / 2f, 0f);
            mast.transform.localScale = new Vector3(2.5f, towerHeight / 2f, 2.5f);
            mast.GetComponent<Renderer>().material = turbineMaterial;

            // Nacelle Hub
            GameObject nacelle = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            nacelle.name = "Turbine_Nacelle";
            nacelle.transform.SetParent(turbine.transform);
            Vector3 hubPos = position + new Vector3(0f, towerHeight, 0f);
            nacelle.transform.position = hubPos;
            nacelle.transform.localScale = new Vector3(3f, 3f, 5f);
            nacelle.GetComponent<Renderer>().material = turbineMaterial;

            // Blades
            for (int b = 0; b < 3; b++)
            {
                float rotAngle = b * 120f;
                GameObject blade = GameObject.CreatePrimitive(PrimitiveType.Cube);
                blade.name = $"Turbine_Blade_{b + 1}";
                blade.transform.SetParent(nacelle.transform);
                blade.transform.position = hubPos;
                blade.transform.rotation = Quaternion.Euler(0f, 0f, rotAngle);
                blade.transform.position += blade.transform.up * (bladeRadius / 2f);
                blade.transform.localScale = new Vector3(0.6f, bladeRadius, 0.15f);
                blade.GetComponent<Renderer>().material = turbineMaterial;
            }

            Debug.Log($"[AeroInsight] Spawned Wind Turbine ({towerHeight}m) at {position}.");
        }

        /// <summary>
        /// Spawns a commercial solar panel array ground grid for agricultural/facility inspection simulations.
        /// </summary>
        /// <param name="corner">Grid corner position</param>
        /// <param name="rows">Row count</param>
        /// <param name="cols">Column count</param>
        /// <param name="spacing">Inter-panel spacing in meters</param>
        public void SpawnSolarPanelArray(Vector3 corner, int rows = 5, int cols = 8, float spacing = 6f)
        {
            EnsureMaterials();
            GameObject arrayRoot = new GameObject("Environment_SolarArray");
            arrayRoot.transform.SetParent(transform);
            _spawnedObstacles.Add(arrayRoot);

            for (int r = 0; r < rows; r++)
            {
                for (int c = 0; c < cols; c++)
                {
                    Vector3 pos = corner + new Vector3(c * spacing, 1.2f, r * spacing);
                    GameObject panel = GameObject.CreatePrimitive(PrimitiveType.Cube);
                    panel.name = $"SolarPanel_{r}_{c}";
                    panel.transform.SetParent(arrayRoot.transform);
                    panel.transform.position = pos;
                    panel.transform.rotation = Quaternion.Euler(25f, 0f, 0f); // 25 degree tilt toward sun
                    panel.transform.localScale = new Vector3(3.5f, 0.1f, 2.2f);
                    panel.GetComponent<Renderer>().material = solarMaterial;
                }
            }

            Debug.Log($"[AeroInsight] Spawned Solar Array ({rows}x{cols} = {rows * cols} panels).");
        }
    }
}
