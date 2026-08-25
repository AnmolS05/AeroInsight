# AeroInsight 🚁

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

AeroInsight is a full-stack web application designed for drone telemetry analysis. It integrates a Node.js/Express backend, a PostgreSQL/SQLite database for log storage, a React/Vite frontend with dynamic mapping via Leaflet, and a dual AI-pipeline featuring a custom Machine Learning risk predictor alongside generative AI anomaly detection using the Google Gemini API.

---

## ✨ Key Features
- **Generative AI Analysis**: Gemini evaluates flight paths, identifies hazards, and recommends maintenance steps.
- **Custom ML Risk Scoring**: An integrated Random Forest decision model statically analyzes telemetry metrics (battery drain, duration, altitude) to predict operational risk levels.
- **Interactive Mapping**: Visualizes drone paths on detailed geographical maps.
- **Intelligent Search**: Easily filter past flights by ID directly from the sleek UI.
- **CSV & JSON Support**: Upload logs effortlessly in multiple data formats.

---

## 🏗️ Architecture & Directory Structure
- `/backend`: Node.js, Express, SQLite, Custom ML Inference Service, and Gemini API integration.
- `/frontend`: React, Vite, Tailwind CSS, Leaflet Maps, Framer Motion animations.
- `/ml`: Python scripts and synthetic datasets for training the custom offline ML models.
- `/.github/workflows`: CI/CD pipelines for automatic deployment.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Docker & Docker Compose (Optional, for containerized setup)
- A Google Gemini API Key

### 🐳 Quick Start (Docker)
The easiest way to run the full stack locally is with Docker:
1. Clone the repository.
2. In the `backend` folder, copy `.env.example` to `.env` and add your `GEMINI_API_KEY`.
3. In the root directory, run:
   ```bash
   docker-compose up --build
   ```
4. Access the frontend at `http://localhost:5173` and the backend API at `http://localhost:10000`.

### 💻 Manual Setup

#### Backend Setup
1. Navigate to the `backend` directory: `cd backend`
2. Install dependencies: `npm install`
3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Edit the `.env` file and add your `GEMINI_API_KEY`.
5. Start the backend server: `npm run dev`
   The backend will run on `http://localhost:10000`.

#### Frontend Setup
1. Open a new terminal and navigate to the `frontend` directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. The frontend will be available at `http://localhost:5173`.

---

## 📖 Usage
1. Open the frontend in your browser.
2. Use the "Upload Flight Log" button in the sidebar to upload a JSON telemetry file.
3. Once uploaded, the backend will process the coordinates, save them to the database, and trigger Gemini for anomaly analysis.
4. Select the flight from the sidebar to view the flight path on the map and read the AI-generated report.

## 🤝 Contributing
We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) for more details.

## 📄 License
This project is licensed under the [MIT License](LICENSE).
