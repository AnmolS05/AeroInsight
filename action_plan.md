Here is a step-by-step action plan to build and deploy **AeroInsight**. This plan is structured to guide you through the process, from repository setup to production deployment.

---

## AeroInsight: Implementation Action Plan

### Directory Structure
A clean monorepo structure keeps both the frontend and backend organized in one repository:

```text
aeroinsight/
├── backend/
│   ├── src/
│   │   ├── config/       # Database & API configs
│   │   ├── controllers/  # Route controllers
│   │   ├── routes/       # API endpoints
│   │   └── index.js      # Server entry point
│   ├── database.sqlite
│   ├── .env.example
│   ├── package.json
│   └── Renderfile        # Render blueprint (optional)
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/   # Map, Sidebar, FileUploader
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
├── .github/
│   └── workflows/
│       ├── deploy-backend.yml
│       └── deploy-frontend.yml
└── README.md
```

---

### Phase 1: Local Backend Setup (Node.js, Express & SQLite)
**Objective:** Create an API that stores drone telemetry logs and provides endpoints to fetch them.

1. **Initialize Backend:**
   * Inside the `backend/` folder, run `npm init -y`.
   * Install dependencies: `npm install express cors dotenv sqlite3`.
   * Install dev dependency: `npm install --save-dev nodemon`.

2. **Database Schema:**
   * Create a database setup script to initialize SQLite tables.
   * **Telemetry Table:** Stores raw coordinates (`latitude`, `longitude`, `altitude`, `battery`, `issue`, `timestamp`, `flight_id`).
   * **Reports Table:** Stores AI-generated summaries tied to a specific `flight_id`.

3. **Build API Endpoints:**
   * `POST /api/flights`: Receives a JSON array of telemetry points, saves them to SQLite under a unique `flight_id`, and triggers the AI analysis.
   * `GET /api/flights`: Lists all recorded flights.
   * `GET /api/flights/:id`: Returns coordinates and telemetry details for a specific flight.
   * `GET /api/flights/:id/report`: Fetches the AI anomaly report.

---

### Phase 2: AI Integration (Gemini API)
**Objective:** Analyze raw JSON coordinates for anomalies and output a structured markdown report.

1. **Gemini SDK Setup:**
   * Sign up for Google AI Studio to obtain a free API key.
   * Install the Gemini SDK: `npm install @google/genai` (or use the classic `@google/generative-ai` package).

2. **Construct the Prompt & Agent Logic:**
   * Write a function in the backend that processes the JSON array.
   * Format a system prompt that instructs the model to act as a geospatial inspector.
   * *Example Prompt:*
     ```text
     You are an expert drone telemetry analyst. Analyze the following drone flight JSON data:
     [Telemetry Data]
     
     Identify:
     1. Total flight duration estimate.
     2. Specific GPS coordinates where issues (like cracks, battery drops, structural anomalies) were flagged.
     3. A professional assessment and recommended maintenance steps.
     
     Provide the output strictly in clean Markdown format with headers.
     ```
   * Save the API's response directly into the SQLite `Reports` table, linked to the `flight_id`.

---

### Phase 3: Frontend Setup (React & Leaflet.js)
**Objective:** Build an interactive UI to display telemetry paths and view AI reports.

1. **Initialize Frontend:**
   * Run `npm create vite@latest frontend -- --template react` inside the root directory.
   * Install UI and Map packages: `npm install react-leaflet leaflet lucide-react tailwindcss postcss autoprefixer`.
   * Set up Tailwind CSS for styling.

2. **Map Component Integration:**
   * Import Leaflet's CSS file in `main.jsx` to prevent map rendering issues:
     ```javascript
     import 'leaflet/dist/leaflet.css';
     ```
   * Use `<MapContainer>`, `<TileLayer>`, `<Polyline>`, and `<Marker>` components from `react-leaflet`.
   * Map the array of telemetry coordinates to a `Polyline` to show the flight path.
   * Filter the telemetry points for rows where `issue !== 'none'` and render a red `<Marker>` at those coordinates. Add a `<Popup>` to display the issue description.

3. **Sidebar and File Upload:**
   * Build a simple upload component that accepts JSON files (matching the drone telemetry format).
   * Upon upload, send the file data to the backend API (`POST /api/flights`).
   * Display a list of past flights in the sidebar. Selecting a flight should update the map view and fetch the AI report to display in a markdown-rendered viewport.

---

### Phase 4: CI/CD Pipeline Configuration
**Objective:** Automate deployments when code changes are merged into the main branch.

1. **Create GitHub Actions Workflows:**
   * Inside `.github/workflows/`, create two configuration files:
     * `deploy-frontend.yml`: Triggers on push to `main` branch when changes occur in `/frontend`. Uses Vercel CLI to deploy.
     * `deploy-backend.yml`: Triggers Render deployment when changes occur in `/backend` (can also use Render's native auto-deploy on git push).

2. **Set up Secrets on GitHub:**
   * `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (for frontend continuous delivery).
   * `RENDER_DEPLOY_HOOK` (if using Render webhooks).

---

### Phase 5: Production Deployment
**Objective:** Move the application to live, publicly accessible URLs.

1. **Backend Deployment (Render):**
   * Link your GitHub repository to Render.
   * Create a Web Service for the `backend/` directory.
   * Set Environment Variables:
     * `PORT = 10000`
     * `GEMINI_API_KEY = your_gemini_api_key_here`
     * `DATABASE_URL` (SQLite runs locally within the Render instance disk, or you can switch to PostgreSQL on Render for persistent production storage).
   * Use the start command: `node src/index.js`.

2. **Frontend Deployment (Vercel):**
   * Import the repository on Vercel.
   * Select the Root Directory as `frontend/`.
   * Set Environment Variables:
     * `VITE_API_BASE_URL = https://your-backend-render-url.onrender.com`
   * Deploy the site.

---

### Phase 6: Verification and Testing
* [ ] **Local Verification:** Run both apps locally, upload a dummy flight log with a simulated battery drop and structural fault, and check if the red marker renders on the map.
* [ ] **AI Validation:** Confirm that the markdown report generated by Gemini is rendered correctly in the UI.
* [ ] **Database Integrity:** Verify that SQLite registers the coordinates and ties the generated report ID to the flight record.
* [ ] **Production Check:** Confirm that the live frontend can communicate with the live backend over HTTP/S.