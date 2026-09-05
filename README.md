<div align="center">
  <div style="padding: 1.5rem; background: linear-gradient(145deg, #0a0f1c, #0b1120); border-radius: 1rem; border: 1px solid rgba(99,102,241,0.2); display: inline-block; box-shadow: 0 0 30px rgba(99,102,241,0.15);">
    <h1 style="color: white; margin: 0; font-family: -apple-system, sans-serif; letter-spacing: -1px; font-weight: 900;">AeroInsight <span style="color: #6366f1;">Intelligence</span></h1>
  </div>
  <p align="center" style="color: #94a3b8; font-weight: 500; font-family: monospace; letter-spacing: 0.05em; margin-top: 1rem;">
    ADVANCED DRONE TELEMETRY & AI RISK ASSESSMENT PLATFORM
  </p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-6366f1.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
  [![Gemini AI](https://img.shields.io/badge/Gemini_AI-000000?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
</div>

<br />

**AeroInsight** is an enterprise-grade autonomous flight intelligence platform designed for the ingestion, visualization, and safety analysis of drone telemetry data. 

Engineered with a **minimal, Apple-inspired aesthetic**, an ultra-responsive Node.js/Express backend with ACID PostgreSQL persistence, interactive Leaflet CartoDB geospatial mapping, and a dual-pipeline AI architecture (Google Gemini GenAI + Random Forest offline inference), AeroInsight empowers drone operators to instantly assess mission anomalies and airframe reliability.

---

## 🌟 What's New in v1.1.0 ("Apple Intelligence" Redesign & Brand Launch)

* **Refined Apple-Inspired Design System:** Overhauled the interface with matte obsidian surfaces, subtle 1px translucent borders (`border-white/[0.08]`), refined typography, and smooth interactive physics (hover elevation, fluid transitions, and reduced visual noise).
* **Official AeroInsight Brand Identity:** Introduced the brushed titanium delta-wing emblem with concentric cyan telemetry radar wave arcs, integrated across browser favicons, navigation sidebar, and the landing hero.
* **Interactive Mission Control:** Added built-in sample missions (`Bengaluru Urban Survey`, `Bay Area Coastal Patrol`), client-side flight log fallback parser (`.csv` / `.json`), real-time search filtering, and natural language AI Flight Assistant querying.
* **Geospatial & Telemetry Enhancements:** Fullscreen modal path view, animated waypoint scrubbing, dynamic battery vs. altitude profile analytics via Recharts, and CartoDB Dark Matter mapping.

---

## ⚡ Core Architecture & Capabilities

### 1. Dual AI-Pipeline 🧠
* **Generative Analysis (Google Gemini API):** Evaluates flight paths contextually, identifying hazards, environmental anomalies, and generating human-readable maintenance recommendations.
* **Deterministic ML Scoring (Custom Random Forest):** A proprietary, offline machine learning model that analyzes raw telemetry metrics (battery drain curves, duration, altitude volatility) to output a deterministic risk classification (High/Low Risk).

### 2. Apple Pro Design System & Visualization 🎨
* **Minimalist Matte Architecture:** High-contrast, accessibility-conscious UI inspired by Apple design language—eliminating neon clutters in favor of restrained translucency and smooth micro-animations.
* **Geospatial Mapping:** Interactive flight path visualization via Leaflet.js with CartoDB Dark Matter tiles, waypoint markers, and fullscreen inspection modals.
* **Real-time Telemetry Analytics:** High-performance charting via Recharts utilizing SVG AreaChart gradients for altitude ceilings and battery depletion.

### 3. Clean Backend Architecture 🏗️
* **Express Pipeline:** Structured with strict MVC patterns (Controllers, Services, Routes).
* **Global Error Handling:** Standardized error responses through centralized middleware (including Zod validation), avoiding fragile try-catch nesting.
* **Observability:** HTTP request logging integrated via `morgan` for robust debugging.
* **PostgreSQL / SQLite Storage:** Reliable relational storage with transaction safety for flight metadata and AI reports.

---

## 📁 Repository Structure

```plaintext
AeroInsight/
├── backend/               # Node.js backend infrastructure
│   ├── src/
│   │   ├── config/        # Database initialization & env config
│   │   ├── controllers/   # Request handlers (flightController.js)
│   │   ├── middlewares/   # Express middlewares (errorHandler.js, validate.js)
│   │   ├── ml_models/     # Exported Random Forest parameters
│   │   ├── routes/        # API route definitions
│   │   └── services/      # Business logic and ML inference wrappers
│   └── package.json
├── frontend/              # React frontend (Vite)
│   ├── src/
│   │   ├── components/    # Reusable UI components (Sidebar, Map, TelemetryChart, ReportModal)
│   │   ├── index.css      # Tailwind configuration & Deep Dark theme overrides
│   │   └── App.jsx        # Main layout and state management
│   └── package.json
├── ml/                    # Data science & ML training pipelines (Python)
│   └── train_risk_model.py # Model generation and synthetic dataset script
└── docker-compose.yml     # Container orchestration
```

---

## 🚀 Deployment & Installation

### Prerequisites
* **Node.js** (v18+)
* **Docker & Docker Compose** (Optional, for zero-config containerized setup)
* **Google Gemini API Key** (Required for generative reports)

### Option 1: Docker (Recommended)
1. Clone the repository and navigate to the project root.
2. Provide your API key in `backend/.env`:
   ```bash
   echo "GEMINI_API_KEY=your_key_here" > backend/.env
   ```
3. Boot the orchestrated containers:
   ```bash
   docker-compose up --build
   ```
4. Access the AeroInsight dashboard at `http://localhost:5173`.

### Option 2: Manual Initialization
**1. Backend Initialization:**
```bash
cd backend
npm install
cp .env.example .env  # Add your GEMINI_API_KEY here
npm run dev
```

**2. Frontend Initialization:**
```bash
cd ../frontend
npm install
npm run dev
```

---

## 🛡️ Usage Workflow
1. Access the web interface.
2. Click **UPLOAD FLIGHT LOG** to ingest a `.json` or `.csv` telemetry payload.
3. The backend parses the data, persists the flight metrics, executes the ML static model, and asynchronously queries Gemini.
4. Select the newly generated flight ID (e.g., `FLT-A1B2C3`) from the Sidebar.
5. Review the telemetry charts, map paths, and the unified AI intelligence report.

---

## 🤝 Contributing
We adhere to strict architectural standards. Please review our [Contributing Guidelines](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before submitting Pull Requests. Focus on maintaining the Deep Dark aesthetic and utilizing the global error handlers.

## 📄 License
Released under the [MIT License](LICENSE).
