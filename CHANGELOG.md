# Changelog

- **Date:** 2026-08-27 17:31:00
  - **Description:** Secured hardcoded Carto API key by replacing it with a template literal using environment variables and creating a local .env file.
  - **Files affected:** `frontend/src/components/Map.jsx`, `frontend/.env`, `frontend/.gitignore`

- **Date:** 2026-08-27 17:42:00
  - **Description:** Restored Carto API key in `frontend/.env` and properly set Gemini API key in `backend/.env`.
  - **Files affected:** `frontend/.env`, `backend/.env`
- **Date:** 2026-09-06 00:12:00
  - **Description:** Restructured the homepage hero view to match the desired layout: restored the floating squircle aircraft icon, 'AeroInsight Intelligence' title, and centered glass instruction card with zero action buttons, maintaining a clean, focused Apple-inspired landing state.
  - **Files affected:** `frontend/src/App.jsx`, `frontend/src/index.css`

- **Date:** 2026-09-06 00:37:00
  - **Description:** Redesigned the main landing hero view to remove the rigid metallic squircle plaque box. Extracted the illuminated brushed-titanium delta wing and cyan telemetry radar pulse arcs as a seamless transparent mark with soft atmospheric radial back-glow, subtle floating motion, and refined Apple Pro typography hierarchy (Drones • Telemetry • Autonomous Analytics).
  - **Files affected:** `frontend/public/brand-mark.png`, `frontend/src/App.jsx`
- **Date:** 2026-09-06 01:23:00
  - **Description:** Implemented architectural resilience and latency decoupling in backend: decoupled synchronous Gemini LLM inference from the transactional ingestion write path, committing telemetry points immediately with baseline deterministic ML risk evaluation and scheduling deep AI analysis asynchronously; added idle client error handling to the PostgreSQL connection pool to protect against unhandled connection drop crashes.
  - **Files affected:** `backend/src/controllers/flightController.js`, `backend/src/config/database.js`
- **Date:** 2026-09-08 17:52:00
  - **Description:** Hardened Gemini AI telemetry processing and serverless reliability: implemented multi-model cascading fallback (`gemini-3.6-flash` -> `gemini-3.7-flash` -> `gemini-flash-latest`) with exponential backoff and telemetry downsampling in dedicated service module (`geminiService.js`); resolved Vercel serverless execution freeze by replacing detached async event loop calls with bounded execution; added Express `trust proxy` configuration to eliminate proxy header validation warnings on Vercel; guarded PostgreSQL client acquisition and transaction rollback against connection pool leaks; updated flight report regeneration with actionable AI error diagnostics and automatic report record creation.
  - **Files affected:** `backend/src/services/geminiService.js`, `backend/src/controllers/flightController.js`, `backend/src/index.js`, `backend/src/config/database.js`

- **Date:** 2026-09-10 19:45:00
  - **Description:** Fixed map popup coloring and low-contrast readability across Leaflet markers: introduced an Apple-inspired dark glassmorphism theme for Leaflet popups with backdrop blur, deep neutral surface (`rgba(20, 20, 24, 0.96)`), matching pointer tip, circular close button, crisp typography, and high-contrast structured telemetry metrics.
  - **Files affected:** `frontend/src/index.css`, `frontend/src/components/Map.jsx`

