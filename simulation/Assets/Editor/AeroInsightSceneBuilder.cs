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
            Light sunLight = Object.FindAnyObjectByType<Light>();
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

                // Add 4 named motor rotors with directional orientation
                string[] motorNames = new string[] { "Motor_1_FR", "Motor_2_RL", "Motor_3_FL", "Motor_4_RR" };
                float[] motorAngles = new float[] { 45f, 225f, 135f, 315f };

                for (int i = 0; i < 4; i++)
                {
                    GameObject arm = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                    arm.name = motorNames[i];
                    arm.transform.SetParent(droneObj.transform);
                    float rad = motorAngles[i] * Mathf.Deg2Rad;
                    arm.transform.localPosition = new Vector3(Mathf.Cos(rad) * 0.9f, 0.12f, Mathf.Sin(rad) * 0.9f);
                    arm.transform.localScale = new Vector3(0.38f, 0.04f, 0.38f);

                    Material motorMat = new Material(Shader.Find("Standard"));
                    motorMat.color = new Color(0f, 0.85f, 1f); // Aero Cyan
                    motorMat.EnableKeyword("_EMISSION");
                    motorMat.SetColor("_EmissionColor", new Color(0f, 0.6f, 0.9f) * 0.8f);
                    arm.GetComponent<Renderer>().material = motorMat;
                }

                // Add Battery Pack Subsystem (Bottom Fuselage)
                GameObject battery = GameObject.CreatePrimitive(PrimitiveType.Cube);
                battery.name = "Battery_Pack";
                battery.transform.SetParent(droneObj.transform);
                battery.transform.localPosition = new Vector3(0f, -0.2f, 0f);
                battery.transform.localScale = new Vector3(0.5f, 0.22f, 0.8f);
                Material batMat = new Material(Shader.Find("Standard"));
                batMat.color = new Color(0.18f, 0.18f, 0.22f); // LiPo polymer dark gray
                battery.GetComponent<Renderer>().material = batMat;

                // Add Avionics IMU Flight Controller (Top Fuselage)
                GameObject avionics = GameObject.CreatePrimitive(PrimitiveType.Cube);
                avionics.name = "Avionics_IMU";
                avionics.transform.SetParent(droneObj.transform);
                avionics.transform.localPosition = new Vector3(0f, 0.18f, 0f);
                avionics.transform.localScale = new Vector3(0.35f, 0.1f, 0.35f);
                Material imuMat = new Material(Shader.Find("Standard"));
                imuMat.color = new Color(0.95f, 0.8f, 0.15f); // Gold avionics shield
                imuMat.EnableKeyword("_EMISSION");
                imuMat.SetColor("_EmissionColor", new Color(0.9f, 0.7f, 0.1f) * 0.5f);
                avionics.GetComponent<Renderer>().material = imuMat;

                // Add 4-in-1 ESC Speed Controller (Center Fuselage)
                GameObject esc = GameObject.CreatePrimitive(PrimitiveType.Cube);
                esc.name = "ESC_SpeedController";
                esc.transform.SetParent(droneObj.transform);
                esc.transform.localPosition = new Vector3(0f, 0.02f, 0f);
                esc.transform.localScale = new Vector3(0.45f, 0.08f, 0.45f);
                Material escMat = new Material(Shader.Find("Standard"));
                escMat.color = new Color(0.25f, 0.28f, 0.35f); // Aluminum heatsink
                esc.GetComponent<Renderer>().material = escMat;

                Undo.RegisterCreatedObjectUndo(droneObj, "Create Virtual Drone");
            }

            // 5. Setup Flight Reconstructor & Physics Simulator Components
            DroneFlightReconstructor reconstructor = droneObj.GetComponent<DroneFlightReconstructor>();
            if (reconstructor == null) reconstructor = droneObj.AddComponent<DroneFlightReconstructor>();
            reconstructor.droneObject = droneObj.transform;

            LineRenderer line = droneObj.GetComponent<LineRenderer>();
            if (line == null) line = droneObj.AddComponent<LineRenderer>();
            Material emissiveLineMat = AssetDatabase.LoadAssetAtPath<Material>("Assets/Materials/Motor_Cyan_Emissive.mat");
            if (emissiveLineMat != null)
            {
                line.material = emissiveLineMat;
            }
            else
            {
                Material lineMat = new Material(Shader.Find("Sprites/Default"));
                lineMat.color = new Color(0f, 0.8f, 1f, 0.9f);
                line.material = lineMat;
            }
            reconstructor.trajectoryLine = line;

            GameObject beaconPrefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Resources/AnomalyBeacon.prefab");
            if (beaconPrefab != null)
            {
                reconstructor.anomalyBeaconPrefab = beaconPrefab;
            }

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

            // 8. Auto-frame SceneView on Drone
            Selection.activeGameObject = droneObj;
            if (SceneView.lastActiveSceneView != null)
            {
                SceneView.lastActiveSceneView.FrameSelected();
                SceneView.lastActiveSceneView.Repaint();
            }

            // Mark scene dirty and save
            EditorSceneManager.MarkSceneDirty(currentScene);
            EditorSceneManager.SaveScene(currentScene);
            Debug.Log("[AeroInsight] Simulation Scene successfully bootstrapped, saved, and framed for MCP integration!");
        }
    }
}
#endif
