# LandslideGuard AI — Full-Stack Telemetry & Early-Warning Platform
**Organization**: Nexara Auto Tech Solutions (`nexaraautotechsolution@gmail.com`)  
**Stack**: FastAPI (Python 3.11+) + Supabase (PostgreSQL 15+) + React (Vite + TypeScript) + Render + Vercel

---

## 🌟 Architecture & Features

### 1. Supabase PostgreSQL Database (`supabase_schema.sql`)
- **`stations`**: Real-time IoT monitoring telemetry (Rainfall, Soil Moisture %, Ground Tilt °, Vibration mm/s, Battery %, Signal RSSI, Status, Risk Index).
- **`readings`**: High-frequency time-series sensor observations with indexing for real-time charting.
- **`alerts`**: Geotechnical threshold breaches, severity levels, triggers, and audit-logged responder acknowledgments.
- **`users`**: Mission operators, geologists, and administrators with PBKDF2-HMAC-SHA256 hashed credentials.
- **`system_settings`**: Configurable early-warning rainfall, soil moisture, tilt, and vibration limits.
- **Security**: Row Level Security (RLS) enabled with operational policies for application clients.

### 2. FastAPI Backend (`/backend`)
- **Authentication**: JWT access tokens (HS256) with role-based access control (Admin, Geologist, Field Engineer).
  - Pre-configured operator accounts:
    - **Nexara Admin**: `nexaraautotechsolution@gmail.com` / `landslide2026`
    - **Field Engineer**: `engineer@landslideguard.ai` / `landslide2026`
    - **Geologist**: `geologist@landslideguard.ai` / `geo2026`
    - **Admin**: `admin@landslideguard.ai` / `admin2026`
- **Station Management**: Live telemetry querying, hardware recalibration, and node deployment (`/api/stations`).
- **AI Geotechnical Simulator**: Physics-informed neural calculation of Factor of Safety (FoS), effective pore water pressure (kPa), and time-to-critical hours (`/api/prediction/simulate`).
- **Alert Dispatch**: Real-time hazard notifications, threshold breach detection, and responder acknowledgment (`/api/alerts`).
- **Analytics & Export**: Historical time-series telemetry and certified CSV data export (`/api/analytics/export`).
- **Supabase Integration**: Synchronizes directly with Supabase PostgreSQL via REST/Postgres when configured, with seamless in-memory fallback.

### 3. Frontend Web App (`/src`)
- **Overview**: Real-time KPI dashboard, danger zone previews, and active incident feed.
- **Live Monitoring**: Grid/table view with status filtering (Online, Stale, Offline) and deep-dive sensor details.
- **Risk Prediction**: Interactive "what-if" storm simulator with rainfall rate, storm duration, soil moisture, and slope gradient controls.
- **Landslide Risk Map**: Leaflet interactive geospatial map showing station markers color-coded by hazard severity.
- **Alerts & Incident Response**: Severity tags, audit logs, and 1-click responder acknowledgment.
- **Sensor Management**: Hardware diagnostics, LoRa ping tests, zero-point recalibration, and new node deployment.
- **Historical Analytics**: Multi-metric time-series trend analysis (24h, 7d, 30d) and CSV telemetry export.
- **Official Reports**: Print-ready Landslide Hazard Evaluation Report formatted for civil defense and municipal planning.
- **Settings & API Bridge**: Live connection manager displaying Supabase database engine, Render backend connection, and alert rules.

---

## 🗄️ Supabase Database Setup

1. Log into your Supabase account at [supabase.com](https://supabase.com) using your project account (`nexaraautotechsolution@gmail.com`).
2. Click **New Project** and name it `landslideguard-ai`.
3. In the left sidebar, click **SQL Editor** -> **New query**.
4. Copy the entire contents of [`supabase_schema.sql`](./supabase_schema.sql) and paste it into the SQL Editor.
5. Click **Run**. This will:
   - Create all 5 required tables (`stations`, `readings`, `alerts`, `users`, `system_settings`).
   - Enable Row Level Security (RLS) with full operational policies.
   - Insert the real telemetry stations (`STN-001` through `STN-006`), initial alerts, and operator accounts.
6. In Supabase, go to **Project Settings** -> **API** to copy:
   - **Project URL** (`https://<project-ref>.supabase.co`)
   - **anon / public key** or **service_role key**

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
1. Create a repository on GitHub (e.g. `nexaraautotechsolution/landslideguard-ai`) and push the code:
   ```bash
   git remote add origin https://github.com/<your-username>/landslideguard-ai.git
   git branch -M main
   git push -u origin main
   ```
2. In [Render Dashboard](https://dashboard.render.com/) (logged in as `nexaraautotechsolution@gmail.com`):
   - Click **New +** -> **Blueprint**.
   - Select your GitHub repository.
   - Render automatically reads [`render.yaml`](./render.yaml).
3. Under Environment Variables in Render, set:
   - `SUPABASE_URL`: Your Supabase Project URL (`https://<project-ref>.supabase.co`)
   - `SUPABASE_KEY`: Your Supabase API Key
4. Click **Apply**. Render will deploy your FastAPI service and provide a public URL (e.g. `https://landslideguard-ai-backend.onrender.com`).

### Deploying the Frontend to Vercel
1. In [Vercel Dashboard](https://vercel.com/dashboard):
   - Click **Add New...** -> **Project**.
   - Select your GitHub repository.
2. Vercel automatically detects the Vite settings from [`vercel.json`](./vercel.json).
3. Under **Environment Variables**, add:
   - `VITE_API_URL`: Your Render backend URL (e.g. `https://landslideguard-ai-backend.onrender.com`)
4. Click **Deploy**. Your full-stack enterprise platform is live!
