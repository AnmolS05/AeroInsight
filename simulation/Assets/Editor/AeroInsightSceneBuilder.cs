#if UNITY_EDITOR
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
using AeroInsight.Simulation;

namespace AeroInsight.Editor
{
    /// <summary>
    /// Automated scene builder and environment bootstrapper for AeroInsight 3D Digital Twin.
    /// Provides one-click scene setup from Unity Editor menu.
    /// </summary>
    public static class AeroInsightSceneBuilder
    {
        [MenuItem("Tools/AeroInsight/Bootstrap Simulation Scene", false, 10)]
        public static void BootstrapScene()
        {
            // 1. Create or verify active scene
            Scene currentScene = EditorSceneManager.GetActiveScene();
            Undo.IncrementCurrentGroup();
            Undo.SetCurrentGroupName("Bootstrap AeroInsight Scene");

            // 2. Setup Lighting & Sun
            Light sunLight = Object.FindFirstObjectByType<Light>();
            GameObject sunObj;
            if (sunLight == null)
            {
                sunObj = new GameObject("Directional Light (Sun)");
                sunLight = sunObj.AddComponent<Light>();
                sunLight.type = LightType.Directional;
                sunLight.color = new Color(1f, 0.96f, 0.88f);
                sunLight.intensity = 1.25f;
                sunLight.shadows = LightShadows.Soft;
                sunObj.transform.rotation = Quaternion.Euler(50f, -30f, 0f);
                Undo.RegisterCreatedObjectUndo(sunObj, "Create Sun Light");
            }

            // 3. Setup Ground Grid Plane
            GameObject ground = GameObject.Find("AeroInsight_GroundPlane");
            if (ground == null)
            {
                ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
                ground.name = "AeroInsight_GroundPlane";
                ground.transform.position = Vector3.zero;
                ground.transform.localScale = new Vector3(50f, 1f, 50f); // 500m x 500m coverage

                Material groundMat = new Material(Shader.Find("Standard"));
                groundMat.color = new Color(0.12f, 0.13f, 0.16f);
                groundMat.SetFloat("_Glossiness", 0.1f);
                ground.GetComponent<Renderer>().material = groundMat;
                Undo.RegisterCreatedObjectUndo(ground, "Create Ground Plane");
            }

            // 4. Setup Virtual Drone Root
            GameObject droneObj = GameObject.Find("AeroInsight_Drone");
            if (droneObj == null)
            {
                droneObj = GameObject.CreatePrimitive(PrimitiveType.Cube);
                droneObj.name = "AeroInsight_Drone";
                droneObj.transform.localScale = new Vector3(1.2f, 0.3f, 1.2f);
                droneObj.transform.position = new Vector3(0f, 20f, 0f);

                // Add aesthetic drone material (matte black with cyan LED accents)
                Material droneMat = new Material(Shader.Find("Standard"));
                droneMat.color = new Color(0.08f, 0.08f, 0.1f);
                droneMat.SetFloat("_Metallic", 0.8f);
                droneMat.SetFloat("_Glossiness", 0.6f);
                droneObj.GetComponent<Renderer>().material = droneMat;

                // Add 4 rotor arms
                for (int i = 0; i < 4; i++)
                {
                    GameObject arm = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                    arm.name = $"RotorArm_{i}";
                    arm.transform.SetParent(droneObj.transform);
                    float angle = i * 90f + 45f;
                    float rad = angle * Mathf.Deg2Rad;
                    arm.transform.localPosition = new Vector3(Mathf.Cos(rad) * 0.9f, 0.1f, Mathf.Sin(rad) * 0.9f);
                    arm.transform.localScale = new Vector3(0.35f, 0.02f, 0.35f);
                    arm.GetComponent<Renderer>().material.color = Color.cyan;
                }

                Undo.RegisterCreatedObjectUndo(droneObj, "Create Virtual Drone");
            }

            // 5. Setup Flight Reconstructor & Physics Simulator Components
            DroneFlightReconstructor reconstructor = droneObj.GetComponent<DroneFlightReconstructor>();
            if (reconstructor == null) reconstructor = droneObj.AddComponent<DroneFlightReconstructor>();
            reconstructor.droneObject = droneObj.transform;

            LineRenderer line = droneObj.GetComponent<LineRenderer>();
            if (line == null) line = droneObj.AddComponent<LineRenderer>();
            Material lineMat = new Material(Shader.Find("Sprites/Default"));
            lineMat.color = new Color(0f, 0.8f, 1f, 0.9f);
            line.material = lineMat;
            reconstructor.trajectoryLine = line;

            PhysicsAnomalySimulator simulator = droneObj.GetComponent<PhysicsAnomalySimulator>();
            if (simulator == null) simulator = droneObj.AddComponent<PhysicsAnomalySimulator>();

            // 6. Setup Mission Control Camera
            GameObject camObj = GameObject.Find("AeroInsight_MissionCamera");
            Camera missionCam;
            if (camObj == null)
            {
                camObj = new GameObject("AeroInsight_MissionCamera");
                missionCam = camObj.AddComponent<Camera>();
                camObj.tag = "MainCamera";
                camObj.transform.position = new Vector3(0f, 45f, -65f);
                camObj.transform.LookAt(droneObj.transform.position);
                Undo.RegisterCreatedObjectUndo(camObj, "Create Mission Camera");
            }
            else
            {
                missionCam = camObj.GetComponent<Camera>();
            }

            MissionControlCameraController camCtrl = camObj.GetComponent<MissionControlCameraController>();
            if (camCtrl == null) camCtrl = camObj.AddComponent<MissionControlCameraController>();
            camCtrl.targetDrone = droneObj.transform;
            camCtrl.SetOverview(Vector3.zero, 60f);

            // 7. Setup Procedural Environment Obstacle Generator
            GameObject envObj = GameObject.Find("AeroInsight_Environment");
            if (envObj == null)
            {
                envObj = new GameObject("AeroInsight_Environment");
                envObj.AddComponent<EnvironmentObstacleGenerator>();
                Undo.RegisterCreatedObjectUndo(envObj, "Create Environment Obstacle Generator");
            }

            // Mark scene dirty for saving
            EditorSceneManager.MarkSceneDirty(currentScene);
            Debug.Log("[AeroInsight] Simulation Scene successfully bootstrapped and configured for MCP integration!");
            EditorUtility.DisplayDialog("AeroInsight Digital Twin", "AeroInsight 3D Simulation Scene has been bootstrapped!\n\n- Virtual Drone initialized\n- LineRenderer Trajectory configured\n- PhysicsAnomalySimulator armed\n- MissionControl Camera calibrated\n- Procedural Environment Obstacle Generator active", "OK");
        }
    }
}
#endif
