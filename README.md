# LandslideGuard AI — Full-Stack Telemetry & Early-Warning Platform

Full-Stack Geotechnical Risk Monitoring & Landslide Prediction Platform featuring a **FastAPI backend** (ready for Render deployment) and a **React + TypeScript + Vite frontend** (ready for Vercel deployment).

---

## 🌟 Architecture & Features

### 1. FastAPI Backend (`/backend`)
- **Authentication**: JWT access tokens (HS256) with PBKDF2-HMAC-SHA256 password hashing.
  - Default demo accounts:
    - Field Engineer: `engineer@landslideguard.ai` / `landslide2026`
    - Geologist: `geologist@landslideguard.ai` / `geo2026`
    - Admin: `admin@landslideguard.ai` / `admin2026`
- **Station Management**: Real-time sensor readings (Rainfall, Soil Moisture %, Ground Tilt, Vibration mm/s), battery health, signal RSSI, and recalibration (`/api/stations`).
- **Alert Dispatch**: Real-time hazard notifications, threshold breach detection, and responder acknowledgment (`/api/alerts`).
- **AI Geotechnical Simulator**: Physics-informed neural calculation of Factor of Safety (FoS), effective pore water pressure (kPa), and time-to-critical hours (`/api/prediction/simulate`).
- **Analytics & Reporting**: Historical time-series telemetry and certified CSV data export (`/api/analytics/export`).
- **System Settings**: Configurable rainfall, moisture, tilt, and vibration limits (`/api/settings`).
- **Interactive API Docs**: Swagger UI at `/docs` and ReDoc at `/redoc`.

### 2. Frontend Web App (`/src`)
- **Overview**: Real-time KPI dashboard, danger zone previews, and active incident feed.
- **Live Monitoring**: Grid/table view with status filtering (Online, Stale, Offline) and deep-dive sensor details.
- **Risk Prediction**: Interactive "what-if" storm simulator with rainfall rate, storm duration, soil moisture, and slope gradient controls.
- **Landslide Risk Map**: Leaflet interactive geospatial map showing station markers color-coded by hazard severity.
- **Alerts & Incident Response**: Severity tags, audit logs, and 1-click responder acknowledgment.
- **Sensor Management**: Hardware diagnostics, LoRa ping tests, zero-point recalibration, and new node deployment.
- **Historical Analytics**: Multi-metric time-series trend analysis (24h, 7d, 30d) and CSV telemetry export.
- **Official Reports**: Print-ready Landslide Hazard Evaluation Report formatted for civil defense and municipal planning.
- **Settings & API Bridge**: Real-time connection manager to test and connect to the Render backend or run in resilient offline demo mode.
- **Authentication Modal**: Sign-in, account registration, role switching, and session persistence.

---

## 🚀 Quick Start (Local Development)

### 1. Run the FastAPI Backend
```bash
# Navigate to backend and activate virtualenv
cd backend
source venv/bin/activate
pip install -r requirements.txt

# Start backend server (starts on http://localhost:8000)
uvicorn main:app --reload --port 8000
```
API Documentation will be accessible at: `http://localhost:8000/docs`

### 2. Run the Vite Frontend
```bash
# From the project root
npm install
npm run dev
```
Access the application at: `http://localhost:5173`

---

## ☁️ Deployment Instructions

### Deploying the Backend to Render
1. Push your repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com/), click **New +** -> **Blueprint**.
3. Select your repository. Render automatically reads `render.yaml`:
   - **Runtime**: Python
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
4. Deploy the service and copy your public backend URL (e.g., `https://landslideguard-ai-backend.onrender.com`).

### Deploying the Frontend to Vercel
1. In [Vercel Dashboard](https://vercel.com/dashboard), click **Add New...** -> **Project**.
2. Select your repository. Vercel automatically detects Vite settings from `vercel.json`:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Under **Environment Variables**, add:
   - `VITE_API_URL`: Your Render backend URL (e.g. `https://landslideguard-ai-backend.onrender.com`)
4. Click **Deploy**. Your full-stack platform is live!
