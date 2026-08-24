# AeroInsight

AeroInsight is a full-stack web application designed for drone telemetry analysis. It integrates a Node.js/Express backend, an SQLite database for log storage, a React/Vite frontend with dynamic mapping via Leaflet, and AI-powered anomaly detection using the Google Gemini API.

## Directory Structure
- `/backend`: Node.js, Express, SQLite, and Gemini API integration.
- `/frontend`: React, Vite, Tailwind CSS, Leaflet Maps.
- `/.github/workflows`: CI/CD pipelines for automatic deployment to Vercel and Render.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- A Google Gemini API Key

### Backend Setup
1. Navigate to the `backend` directory: `cd backend`
2. Install dependencies: `npm install`
3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Edit the `.env` file and add your `GEMINI_API_KEY`.
5. Start the backend server: `npm start` (or `npm run dev` for nodemon)
   The backend will run on `http://localhost:10000` and automatically initialize the SQLite database.

### Frontend Setup
1. Open a new terminal and navigate to the `frontend` directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. The frontend will be available at `http://localhost:5173`.

## Usage
1. Open the frontend in your browser.
2. Use the "Upload Flight Log" button in the sidebar to upload a JSON telemetry file.
3. Once uploaded, the backend will process the coordinates, save them to the database, and trigger Gemini for anomaly analysis.
4. Select the flight from the sidebar to view the flight path on the map and read the AI-generated report.

## Sample Telemetry Data
A sample JSON array structure expected for upload:
```json
[
  {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "altitude": 100,
    "battery": 95,
    "issue": "none",
    "timestamp": "2026-08-24T10:00:00Z"
  },
  {
    "latitude": 37.7750,
    "longitude": -122.4190,
    "altitude": 105,
    "battery": 94,
    "issue": "sudden battery drop",
    "timestamp": "2026-08-24T10:01:00Z"
  }
]
```
