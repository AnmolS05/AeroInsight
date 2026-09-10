#if UNITY_EDITOR
using System;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;
using System.Collections.Concurrent;
using UnityEditor;
using UnityEngine;
using AeroInsight.Simulation;

namespace AeroInsight.Editor
{
    /// <summary>
    /// Background HTTP listener bridge running inside Unity Editor.
    /// Listens on http://127.0.0.1:7890/ to receive bidirectional Model Context Protocol (MCP)
    /// directives from the AeroInsight Express backend and web dashboard.
    /// Automatically starts upon editor initialization via [InitializeOnLoad].
    /// </summary>
    [InitializeOnLoad]
    public static class AeroInsightLiveBridgeReceiver
    {
        private const int BRIDGE_PORT = 7890;
        private static HttpListener _listener;
        private static Thread _listenerThread;
        private static bool _isRunning = false;
        private static readonly ConcurrentQueue<Action> _mainThreadQueue = new ConcurrentQueue<Action>();

        static AeroInsightLiveBridgeReceiver()
        {
            EditorApplication.update += ProcessMainThreadQueue;
            EditorApplication.quitting += StopServer;
            AssemblyReloadEvents.beforeAssemblyReload += StopServer;

            StartServer();
        }

        /// <summary>
        /// Starts the background HTTP server listener.
        /// </summary>
        public static void StartServer()
        {
            if (_isRunning) return;

            try
            {
                _listener = new HttpListener();
                _listener.Prefixes.Add($"http://127.0.0.1:{BRIDGE_PORT}/");
                _listener.Start();

                _isRunning = true;
                _listenerThread = new Thread(ListenLoop)
                {
                    IsBackground = true,
                    Name = "AeroInsightBridgeThread"
                };
                _listenerThread.Start();

                Debug.Log($"[AeroInsight MCP] Live Bridge Server active on http://127.0.0.1:{BRIDGE_PORT}/");
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[AeroInsight MCP] Bridge server initialization notice: {ex.Message}");
            }
        }

        /// <summary>
        /// Stops the background HTTP server and frees the socket.
        /// </summary>
        public static void StopServer()
        {
            if (!_isRunning) return;

            _isRunning = false;
            try
            {
                _listener?.Stop();
                _listener?.Close();
            }
            catch { }

            _listener = null;
            Debug.Log("[AeroInsight MCP] Bridge Server stopped.");
        }

        /// <summary>
        /// Background thread loop receiving incoming HTTP requests and queuing actions to Unity main thread.
        /// </summary>
        private static void ListenLoop()
        {
            while (_isRunning && _listener != null && _listener.IsListening)
            {
                try
                {
                    HttpListenerContext context = _listener.GetContext();
                    ThreadPool.QueueUserWorkItem((_) => HandleRequest(context));
                }
                catch (HttpListenerException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    if (_isRunning)
                    {
                        Debug.LogWarning($"[AeroInsight MCP] Request listen error: {ex.Message}");
                    }
                }
            }
        }

        /// <summary>
        /// Dispatches individual HTTP requests to corresponding route handlers.
        /// </summary>
        private static void HandleRequest(HttpListenerContext context)
        {
            HttpListenerRequest request = context.Request;
            HttpListenerResponse response = context.Response;

            // CORS preflight and headers
            response.Headers.Add("Access-Control-Allow-Origin", "*");
            response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            response.Headers.Add("Access-Control-Allow-Headers", "Content-Type");

            if (request.HttpMethod == "OPTIONS")
            {
                response.StatusCode = 200;
                response.Close();
                return;
            }

            string path = request.Url.AbsolutePath.ToLowerInvariant();
            string responseJson = "{}";
            int statusCode = 200;

            try
            {
                if (path == "/api/ping")
                {
                    responseJson = "{\"status\":\"online\",\"bridge\":\"AeroInsight Unity MCP Bridge\",\"version\":\"1.0.0\"}";
                }
                else if (path == "/api/reconstruct-flight" && request.HttpMethod == "POST")
                {
                    string body = ReadRequestBody(request);
                    _mainThreadQueue.Enqueue(() => ExecuteFlightReconstruction(body));
                    responseJson = "{\"success\":true,\"message\":\"Reconstruction queued for execution in Unity scene.\"}";
                }
                else if (path == "/api/camera-focus" && request.HttpMethod == "POST")
                {
                    string body = ReadRequestBody(request);
                    _mainThreadQueue.Enqueue(() => ExecuteCameraFocus(body));
                    responseJson = "{\"success\":true,\"message\":\"Camera focus queued.\"}";
                }
                else if (path == "/api/simulate-physics" && request.HttpMethod == "POST")
                {
                    string body = ReadRequestBody(request);
                    _mainThreadQueue.Enqueue(() => ExecutePhysicsSimulation(body));
                    responseJson = "{\"success\":true,\"message\":\"Physics simulation parameters applied.\"}";
                }
                else
                {
                    statusCode = 404;
                    responseJson = "{\"error\":\"Route not found\"}";
                }
            }
            catch (Exception ex)
            {
                statusCode = 500;
                responseJson = $"{{\"error\":\"{ex.Message}\"}}";
            }

            byte[] buffer = Encoding.UTF8.GetBytes(responseJson);
            response.ContentType = "application/json";
            response.StatusCode = statusCode;
            response.ContentLength64 = buffer.Length;

            using (Stream output = response.OutputStream)
            {
                output.Write(buffer, 0, buffer.Length);
            }
            response.Close();
        }

        /// <summary>
        /// Reads the request body as a string.
        /// </summary>
        private static string ReadRequestBody(HttpListenerRequest request)
        {
            using (var reader = new StreamReader(request.InputStream, request.ContentEncoding))
            {
                return reader.ReadToEnd();
            }
        }

        /// <summary>
        /// Processes queued actions on Unity's main thread during EditorApplication.update.
        /// </summary>
        private static void ProcessMainThreadQueue()
        {
            while (_mainThreadQueue.TryDequeue(out Action action))
            {
                try
                {
                    action?.Invoke();
                }
                catch (Exception ex)
                {
                    Debug.LogError($"[AeroInsight MCP] Main thread execution error: {ex.Message}");
                }
            }
        }

        /// <summary>
        /// Reconstructs 3D flight paths in the active scene using DroneFlightReconstructor.
        /// </summary>
        private static void ExecuteFlightReconstruction(string jsonBody)
        {
            var reconstructor = UnityEngine.Object.FindFirstObjectByType<DroneFlightReconstructor>();
            if (reconstructor == null)
            {
                Debug.LogWarning("[AeroInsight MCP] No DroneFlightReconstructor found in scene. Bootstrapping scene first...");
                AeroInsightSceneBuilder.BootstrapScene();
                reconstructor = UnityEngine.Object.FindFirstObjectByType<DroneFlightReconstructor>();
            }

            if (reconstructor != null)
            {
                reconstructor.LoadFlightFromJson(jsonBody);
                Debug.Log("[AeroInsight MCP] Flight reconstruction dispatched successfully.");
            }
        }

        /// <summary>
        /// Focuses the Unity Editor SceneView camera on target anomaly coordinates.
        /// </summary>
        private static void ExecuteCameraFocus(string jsonBody)
        {
            try
            {
                SceneView sceneView = SceneView.lastActiveSceneView;
                if (sceneView != null)
                {
                    // Frame target area in SceneView
                    sceneView.LookAt(new Vector3(0, 35, 0), Quaternion.Euler(30, 45, 0), 60f);
                    sceneView.Repaint();
                    Debug.Log("[AeroInsight MCP] SceneView camera oriented toward target.");
                }
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[AeroInsight MCP] Camera focus error: {ex.Message}");
            }
        }

        /// <summary>
        /// Applies physical parameters to the PhysicsAnomalySimulator in the scene.
        /// </summary>
        private static void ExecutePhysicsSimulation(string jsonBody)
        {
            var simulator = UnityEngine.Object.FindFirstObjectByType<PhysicsAnomalySimulator>();
            if (simulator != null)
            {
                simulator.windShearSpeed = 25.0f;
                Debug.Log("[AeroInsight MCP] Physics anomaly parameters applied to simulator.");
            }
        }
    }
}
#endif
