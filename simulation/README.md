# AeroInsight Unity Simulation Project

## Overview

This is the Unity 6 (6000.6.0f1) simulation project for AeroInsight's 3D Digital Twin and MCP Integration platform. It provides:

- **5 C# simulation scripts** in `Assets/Scripts/`
- **2 Editor tool scripts** in `Assets/Editor/`
- **6 custom materials** in `Assets/Materials/`
- **MCP Bridge** auto-starting on port 7890 via `[InitializeOnLoad]`

---

## Prerequisites

- **Unity Hub** + **Unity 6000.6.0f1** (or newer LTS)
- **PostgreSQL** running locally (for backend)
- **Node.js 18+** (for backend API)

---

## Opening the Project in Unity

### Step 1: Add to Unity Hub
1. Open **Unity Hub**
2. Click **Open** → **Add project from disk**
3. Navigate to `<repo-root>\simulation` (e.g. `C:\path\to\AeroInsight\simulation`)
4. Select the folder and click **Open**

### Step 2: Wait for Package Resolution
Unity will automatically resolve packages from `Packages/manifest.json`:
- `com.anklebreaker.unity-mcp` (local copy — already installed)
- Core Unity modules (AI, Animation, Audio, Physics, Terrain, UI)

**If packages show errors:**
- Go to **Window → Package Manager**
- Click **+** → **Add package from git URL**
- Enter: `https://github.com/AnkleBreaker-Studio/unity-mcp-plugin.git`

### Step 3: Bootstrap the Scene
Once the project loads and scripts compile:
1. Go to **Tools → AeroInsight → Bootstrap Simulation Scene**
2. A dialog confirms successful setup
3. This creates: sun light, 500m ground plane, drone hierarchy, mission camera, obstacle generator

### Step 4: Verify Live Bridge
Watch the Unity Console for:
```
[AeroInsight MCP] Live Bridge Server active on http://127.0.0.1:7890/
```

Test with a browser: `http://127.0.0.1:7890/api/ping`

---

## Backend Bridge Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ping` | GET | Health check |
| `/api/reconstruct-flight` | POST | Load flight telemetry into 3D scene |
| `/api/camera-focus` | POST | Frame SceneView on coordinates |
| `/api/simulate-physics` | POST | Trigger physics anomaly simulation |
| `/api/blackbox` | POST | Place FDR incident marker |
| `/api/component-inspect` | POST | Focus on drone subsystem |
| `/api/swarm-sync` | POST | Sync multi-drone formation |

---

## Backend API (Express)

The Node.js backend exposes these Unity MCP endpoints at `http://localhost:10000`:

```
GET  /api/unity/status            — Bridge health check
GET  /api/unity/mcp-status        — MCP server status & tool inventory
POST /api/unity/mcp-execute       — Execute arbitrary MCP tool
POST /api/unity/mcp-twin/:id      — Reconstruct flight via MCP
POST /api/unity/mcp-crash/:id     — Physics crash via MCP
POST /api/unity/reconstruct/:id   — Reconstruct flight (HTTP bridge)
POST /api/unity/focus             — Camera focus directive
POST /api/unity/simulate/:id      — Physics simulation
POST /api/unity/generate-synthetic — Generate synthetic telemetry
POST /api/unity/generate-swarm    — Generate swarm mission
POST /api/unity/blackbox/:id      — FDR black box analysis
POST /api/unity/component-inspect — Component inspection
POST /api/assistant/chat          — AI Copilot natural language
```

---

## Keyboard Shortcuts (In-Editor)

| Key | Action |
|-----|--------|
| `F` | Toggle Swarm Wingman visibility |
| `W` | Toggle atmospheric wind streamlines |
| `C` | Toggle Subsystem Diagnostics dock |

---

## Troubleshooting

### "Could not resolve package: com.anklebreaker.unity-mcp"
- The package is bundled locally in `Packages/com.anklebreaker.unity-mcp/`
- If Unity still can't find it, ensure the folder exists and hasn't been deleted

### "Port 7890 already in use"
- Another Unity project or process may be using the port
- Kill the conflicting process or restart Unity

### "Scripts not compiling"
- Check Console for C# errors
- Ensure all 5 script files are in `Assets/Scripts/`
- Ensure 2 editor files are in `Assets/Editor/`
- Force recompile: **Assets → Reimport All**

### "Backend can't connect to Unity Bridge"
- Ensure Unity Editor is open with this project
- Check Console for `[AeroInsight MCP] Live Bridge Server active`
- Test manually: `curl http://127.0.0.1:7890/api/ping`

### "PostgreSQL connection failed"
- Ensure PostgreSQL is running: `net start postgresql`
- Database `aeroinsight` must exist with user `aeroinsight`/`password`
- Create with:
  ```sql
  CREATE DATABASE aeroinsight;
  CREATE USER aeroinsight WITH PASSWORD 'password';
  GRANT ALL PRIVILEGES ON DATABASE aeroinsight TO aeroinsight;
  ```

---

## File Structure

```
simulation/
├── Assets/
│   ├── Scripts/                    # Runtime simulation scripts
│   │   ├── DroneFlightReconstructor.cs
│   │   ├── PhysicsAnomalySimulator.cs
│   │   ├── SyntheticTelemetryEngine.cs
│   │   ├── MissionControlCameraController.cs
│   │   └── EnvironmentObstacleGenerator.cs
│   ├── Editor/                     # Editor-only tools
│   │   ├── AeroInsightSceneBuilder.cs
│   │   └── AeroInsightLiveBridgeReceiver.cs
│   ├── Materials/                  # Custom PBR materials
│   │   ├── Drone_Fuselage.mat
│   │   ├── Motor_Cyan_Emissive.mat
│   │   ├── Hazard_Red_Emissive.mat
│   │   ├── Avionics_Gold.mat
│   │   ├── ESC_Aluminum.mat
│   │   └── Ground_Dark.mat
│   └── Scenes/
│       └── AeroInsight_DigitalTwin.unity
├── Packages/
│   ├── manifest.json               # UPM dependencies
│   └── com.anklebreaker.unity-mcp/ # Bundled MCP plugin
├── ProjectSettings/                # Unity project configuration
├── Assembly-CSharp.csproj          # Generated (do not edit)
├── AeroInsight.Simulation.csproj   # Assembly definition project
└── README.md
```
