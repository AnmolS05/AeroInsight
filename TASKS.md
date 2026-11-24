# Unity MCP Integration — Dual-Agent Task Tracker

> **Agent A** (Gemini Flash): MCP/Unity runtime scripts, MCP client pipeline, test suites  
> **Agent B** (Agnes 2.5 Flash): Backend wiring, Unity project infrastructure, frontend modals, verification

---

## Agent A Tasks (MCP/Unity Runtime)

### Phase 1: Visual Polish
- [x] Task 1.1 — Apply production materials to drone hierarchy via MCP
- [x] Task 1.2 — Add skybox and ambient lighting
- [x] Task 1.3 — Generate environment obstacles in scene

### Phase 2: Concept 1 — Digital Twin
- [x] Task 2.1 — Enhance MCP Digital Twin with materials
- [x] Task 2.2 — Add trajectory LineRenderer via MCP

### Phase 3: Concept 2 — Physics Crash
- [x] Task 3.1 — Configure PhysicsAnomalySimulator via MCP
- [x] Task 3.2 — Capture simulated telemetry (60+ frames, impact dynamics)

### Phase 4: Concept 3 — Synthetic Telemetry
- [x] Task 4.1 — `generateSyntheticTelemetryViaMcp()` in unityMcpClient.js

### Phase 5: Concept 4 — Mission Control
- [x] Task 5.3 — Enhanced smooth camera tracking in LiveBridgeReceiver + focusMissionControlViaMcp

### Phase 6: E2E Verification
- [x] Task 6.1 — Live E2E Concept 1 (`scratch/test_agent_a_mcp_features.js`)
- [x] Task 6.2 — Live E2E Concept 2
- [x] Task 6.3 — Live E2E Concept 3
- [x] Task 6.4 — Live E2E Concept 4

---

## Agent B Tasks (Backend / Unity Infra / Frontend)

### Phase 2: Concept 1 — HTTP Bridge → MCP Path
- [x] Task 2.3 — Wire HTTP bridge path to MCP path in `unityController.js`
  - `reconstructMcpTwin` controller action implemented
  - `POST /api/unity/mcp-twin/:id` route registered in `unityRoutes.js`
  - `unityMcpService.js` exports `constructDigitalTwinViaMcp`
- [x] EditorBuildSettings.asset — Scene GUID corrected to `6ddb8b56d5a7a99419fdf018332fd1d3`
- [x] Emissive materials fixed: `Motor_Cyan_Emissive.mat`, `Hazard_Red_Emissive.mat`, `Avionics_Gold.mat`
- [x] `AeroInsight.Simulation.asmdef` + `.meta` created for isolated assembly compilation
- [x] Unity project stray folders removed (`aero_insight/`, `My project/`)
- [x] `simulation/README.md` written with setup docs

### Phase 3: Concept 2 — Physics Crash Controller
- [x] Task 3.2b — Controller integration for captured telemetry
  - `simulateMcpCrash` controller action implemented
  - `POST /api/unity/mcp-crash/:id` route registered
  - `unityMcpService.js` exports `simulatePhysicsCrashViaMcp`
- [x] Task 3.3 — Frontend: display captured physics telemetry in DigitalTwinModal.jsx
  - Added dedicated `Simulate Crash via Unity MCP` action button to the Physics tab header
  - Uncoupled `mcpCrashResult` from `physicsResult` to render independently whenever MCP crash telemetry is generated
  - Designed rich empirical Rigidbody telemetry card with Goodness-of-Fit ($R^2$), terminal descent velocity, impact time, and RMSE
  - Integrated high-resolution scrollable telemetry time-series inspector table with frame timestamps, 3D coordinates, vertical velocity, acceleration, and diagnostic flags
  - Connected 1-click `Orbit Crash Ground-Zero in Unity` camera focus and `Cross-Examine in FDR Black Box` triggers

### Phase 4: Concept 3 — Synthetic Telemetry
- [x] Task 4.2 — Backend route for MCP synthetic generation
  - `POST /api/unity/generate-synthetic` → `createSyntheticFlight` (DB-persisted)
  - `POST /api/unity/generate-swarm` → `createSwarmFlight` (DB-persisted)
  - `generateSyntheticTelemetryViaMcp()` exported from unityMcpService.js
- [x] Task 4.3 — Frontend: MCP synthetic generation button in SyntheticFlightModal.jsx
  - Dedicated `Generate via Unity MCP` button wired directly to `handleGenerateMcp`
  - Dual action buttons for both standard fast simulation and direct Unity MCP Server pipeline execution
  - Synchronized MCP mode toggle with primary action button
  - Enhanced backend `generateSyntheticViaMcp` controller in `unityController.js` to seamlessly support both single UAV missions and tactical multi-drone swarm missions with database persistence and AI report generation

### Phase 5: Concept 4 — Dual-Screen Sync
- [x] `AeroInsightLiveBridgeReceiver.cs` — `[InitializeOnLoad]` HTTP bridge on port 7890
- [x] `POST /api/unity/focus` — Camera focus route wired
- [x] `focusMissionControlViaMcp()` — MCP client path
- [x] Task 5.1 — WebSocket server for live viewport sync
  - Implemented in `backend/src/services/websocketBridge.js` by Agent B
- [x] Task 5.2 — Frontend timeline → live Unity sync
  - Implemented `/api/timeline-scrub` in `AeroInsightLiveBridgeReceiver.cs` and verified live scrubbing by Agent A

### Phase 6: Polish & Verification
- [x] Backend smoke tests pass:
  - `unityMcpService` imports cleanly (14 exports)
  - `unityMcpClient` imports cleanly (7 exports)
  - `unityController` imports cleanly (12 exports)
  - `unityRoutes` registers all routes
  - `assistantController` intent detection: 5/5 pass
  - Synthetic telemetry gen: 10 points ✓
  - Swarm gen: 60 leader + 1 wingman ✓
- [x] Task 6.3b — Verify Concept 3 database + dashboard
  - PostgreSQL resilient fallback and local non-SSL mode configured in `database.js`
- [x] Task 6.5 — Frontend production build verified (`npm run build` in 1.42s)
- [x] Task 6.6 — Documentation & change tracking
  - `simulation/README.md` complete
  - `start.bat` full-stack launcher created
  - `backend/.env` & `frontend/.env` complete with all variables
  - `.gitignore` updated to exclude stray folders and generated assets
- [x] Task 6.7 — Audit Runbook (`audit_task.md`) Execution
  - Remediated Gap A (Postgres environment-aware SSL handling)
  - Remediated Gap B (MCP port resolution priority for port 7891)
  - Backend API running on port 10000 with WebSocket sync on 8765
  - Frontend Vite development server running on port 5173
  - All 4 Verification Protocol tests executed and passed (100%)

---

## System Status Summary

| Service | Port | Status | Protocol / Endpoint |
|---------|------|--------|---------------------|
| Backend API | 10000 | ACTIVE | HTTP / Express (`GET /api/unity/status`, `GET /api/unity/mcp-status`) |
| WebSocket Bridge | 8765 | ACTIVE | WS Viewport Sync (`ws://localhost:8765`) |
| Unity Live Bridge | 7890 | ACTIVE | HTTP (`GET /api/ping`, `POST /api/timeline-scrub`) |
| Unity MCP Server | 7891 | ACTIVE | stdio JSON-RPC (80 exposed tools) |
| Frontend UI | 5173 | ACTIVE | Vite HTTP (`http://localhost:5173/`) |

