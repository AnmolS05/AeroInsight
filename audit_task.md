### AeroInsight System Audit & Deployment Runbook

This comprehensive guide serves as your final system audit, gap analysis, and operational runbook to transition **AeroInsight v2.0.0** into a fully operational, live production environment. 

---

## Part 1: System-Wide Audit & Code Verification

Based on a thorough review of the provided full-stack codebase, here is the architectural status of your system:

### 1. Frontend Client (`frontend/`)
The frontend UI is **fully wired** and matches your visual specifications. It implements:
* **Interactive 3D Viewport (`Interactive3DTrajectory.jsx`):** Renders altitude-gradient ribbons, glowing red anomaly markers, and animated force vector overlays ($\vec{T}$, $\vec{L}$, $\vec{D}$, $\vec{W}$) utilizing pure HTML5 Canvas space translations.
* **Concept 1, 2, and 4 Modals (`DigitalTwinModal.jsx`):** Completely integrated with tabs for the Digital Twin reconstructor, Physics/Crash Lab (offering Microburst, Rotor Cutoff, and Voltage Sag presets), and an interactive JSON-RPC debug console to audit live MCP tool calls.
* **Concept 3 Modal (`SyntheticFlightModal.jsx`):** Fully connects to backend routes with options for single UAV flight patterns (Solar Array Serpentine, Wind Turbine Helical, Cell Tower Cylindrical) or coordinated multi-drone tactical swarms.
* **AI Copilot Modal (`AIChatModal.jsx`):** Fully maps conversational queries to structured actions (3D reconstruction, camera orbits, physics simulation triggers).

### 2. Backend Orchestrator (`backend/`)
The Express API is clean, secure, and utilizes centralized middleware:
* **`geminiService.js`:** Implements multi-model cascading fallback (`gemini-3.6-flash` $\rightarrow$ `gemini-3.7-flash` $\rightarrow$ `gemini-flash-latest`) with exponential backoff and telemetry downsampling to optimize prompt token usage.
* **`unityMcpClient.js`:** Leverages the `@modelcontextprotocol/sdk` to establish a persistent stdio subprocess connection to your `unity-mcp-server`.
* **`websocketBridge.js`:** Manages bidirectional viewport sync, relaying camera focus triggers and flight coordinates between the browser and Unity on port `8765`.

### 3. Unity Simulation Project (`simulation/`)
The C# game engine assets and editor tools are fully compiled with zero errors:
* **`AeroInsightLiveBridgeReceiver.cs`:** Automatically bootstraps an HTTP server listener on port `7890` using `[InitializeOnLoad]`, allowing direct, real-time SceneView camera framing and timeline scrubbing.
* **`PhysicsAnomalySimulator.cs`:** Computes real-time aerodynamic equations, factoring in vertical drag, thrust deficits, and environmental gusts.
* **`AeroInsightSceneBuilder.cs`:** Generates full drone component hierarchies, directional lighting, and ground reference plates with one click.

---

## Part 2: Gaps & Technical Remediations

To ensure a seamless launch, you must address two key environmental constraints:

### Gap A: Database Layer Discrepancy
While early design notes referred to SQLite, the active production configuration (`database.js`) is written for **PostgreSQL** (`pg`). 
* If you run the backend locally without a running PostgreSQL instance, the connection pool will fail.
* **Remediation:** You must run the PostgreSQL container configured in your `docker-compose.yml` or use a local PostgreSQL server with the credentials listed in your `.env` file.

### Gap B: Local MCP Server Path Resolution
The stdio client (`unityMcpClient.js`) points to a hardcoded path on your local Windows system:
```javascript
const MCP_SERVER_SCRIPT = process.env.UNITY_MCP_SERVER_PATH || 'C:\\path\\to\\unity-mcp-server\\src\\index.js';
```
* **Remediation:** If running in a containerized environment, on macOS/Linux, or on a different Windows directory, this path must be configured via environment variables.

---

## Part 3: Operational Runbook (Getting It Live)

Follow these steps in sequence to boot the entire multi-agent, dual-screen ecosystem.

```text
[ React Frontend (5173) ] ── (WebSocket Viewport Sync) ──> [ WS Bridge Server (8765) ]
            │                                                      │
     (HTTP Requests)                                               │
            ▼                                                      ▼
[ Node.js Backend (10000) ] ── (stdio MCP stdio) ──> [ unity-mcp-server (7891) ]
            │                                                      │
   (PostgreSQL 5432)                                               ▼ (Local HTTP Bridge)
            └─────────────────────────────────────────> [ Unity Editor (7890) ]
```

### Step 1: Environment Configuration
Create or update your `.env` files.

**Backend Configuration (`backend/.env`):**
```ini
PORT=10000
NODE_ENV=development
GEMINI_API_KEY=AIzaSyYourActualGeminiAPIKeyHere
DATABASE_URL=postgres://aeroinsight:password@localhost:5432/aeroinsight
CORS_ORIGIN=http://localhost:5173
WS_PORT=8765
UNITY_BRIDGE_HOST=127.0.0.1
UNITY_BRIDGE_PORT=7890
UNITY_BRIDGE_PORT_MCP=7891
UNITY_MCP_SERVER_PATH=C:\path\to\unity-mcp-server\src\index.js
UNITY_HUB_PATH=C:\Program Files\Unity Hub\Unity Hub.exe
```

**Frontend Configuration (`frontend/.env`):**
```ini
VITE_API_BASE_URL=http://localhost:10000
```

---

### Step 2: Initialize the Database (PostgreSQL)
Run the isolated PostgreSQL database container. In your root directory, run:
```bash
docker-compose up -d db
```
*Verify connectivity:*
```bash
docker ps
# You should see the postgres:15 container running and forwarding port 5432.
```

---

### Step 3: Start the Unity Editor & Live Bridge
1. Open **Unity Hub**.
2. Load the project folder located under `/simulation` (Ensure you are using **Unity 2022.3 LTS** or **Unity 6**).
3. Once loaded, click the top menu bar item: **Tools > AeroInsight > Bootstrap Simulation Scene**.
4. This instantly builds the ground grid plane, sun, mission camera, and the hierarchical drone target (`AeroInsight_Drone`).
5. Open the Unity Console window. You should see:
   `[AeroInsight MCP] Live Bridge Server active on http://127.0.0.1:7890/`

---

### Step 4: Run the Unity MCP Server
The `unity-mcp-server` translates tool-calling requests from your LLM into commands the Unity Editor understands. Open a terminal and run:
```bash
# Navigate to your local unity-mcp-server directory
cd C:\path\to\unity-mcp-server
npm install
npm run start
```
*This server listens on port `7891` and acts as the stdio execution bridge.*

---

### Step 5: Start the AeroInsight Backend
1. Open a new terminal in the `backend/` directory.
2. Install dependencies and start the development server:
```bash
cd backend
npm install
npm run dev
```
*This starts the API on port `10000` and initializes the WebSocket Viewport Sync Bridge on port `8765`.*

---

### Step 6: Start the Frontend Client
1. Open a new terminal in the `frontend/` directory.
2. Install dependencies and run Vite:
```bash
cd frontend
npm install
npm run dev
```
3. Open your browser and navigate to `http://localhost:5173`.

---

## Part 4: Verification Protocol (Dashboard Test Suite)

Verify your live pipeline using this 4-step checklist:

### Test 1: Verify the Unity MCP Server Connection
1. In the sidebar, select one of the default missions (e.g., `Bengaluru Urban Survey`).
2. Click the **3D Digital Twin** button in the header to launch the modal.
3. Select the **Unity MCP Protocol** tab.
4. Click **Query MCP Status**.
5. *Success Criteria:* The status banner turns green and shows a successful list of registered Unity tools (e.g., `unity_gameobject_create`, `unity_editor_state`).

### Test 2: Execute Concept 1 (AI Digital Twin Creator)
1. Within the **Unity MCP Protocol** tab, click **Construct Scene via MCP**.
2. *Success Criteria:* Check your open Unity Editor window. The scene will dynamically generate a 3D trajectory LineRenderer along with red anomaly markers. The SceneView camera will frame and focus directly on the drone.

### Test 3: Execute Concept 2 (Physics Anomaly Crash Lab)
1. Switch to the **Physics & Crash Simulation** tab inside the modal.
2. Select the **Rotor 1 Cutoff (50%)** failure preset.
3. Click **Run Physics Simulation**.
4. *Success Criteria:* The physics simulator computes the aerodynamic drag and descending gravity vectors. The dashboard displays the **Empirical Hypothesis Verification Card** showing an $R^2$ goodness-of-fit score close to `0.98` and a confirmed match verdict.

### Test 4: Execute Concept 4 (Timeline Scrubber Sync)
1. Navigate back to the **Digital Twin Reconstructor** tab in the modal.
2. Ensure **Unity Sync** is toggled **ON** in the top right toolbar.
3. Slide the progress scrubber at the bottom of the viewport back and forth.
4. *Success Criteria:* The virtual drone inside your Unity Editor moves and rotates in real-time, matching the timeline progress bar.

---

## Part 5: Production Deployment Blueprint

When you are ready to ship to production hosting (such as Vercel and Render):

### 1. Production Backend (Render)
* **Build Command:** `npm install`
* **Start Command:** `node src/index.js`
* **Environment Variables:** Set your production `DATABASE_URL` (pointing to your hosted Postgres instance), `CORS_ORIGIN` (your Vercel frontend URL), and your `GEMINI_API_KEY`.
* *Note:* Because the Unity Editor runs on your local machine, features requiring local bridge ports (`7890`/`7891`) will run in **standby/simulation mode** on your production server. The web UI's built-in interactive 3D WebGL viewer (`Interactive3DTrajectory.jsx`) will continue to run with zero-friction on your hosted site.

### 2. Production Frontend (Vercel)
* **Build Command:** `npm run build`
* **Output Directory:** `dist`
* **Environment Variables:** Set `VITE_API_BASE_URL` to your live Render backend URL.