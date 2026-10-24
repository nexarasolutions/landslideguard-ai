-- ====================================================================
-- LandslideGuard AI — Production Supabase PostgreSQL Schema
-- Platform: Supabase (PostgreSQL 15+)
-- Organization: Nexara Auto Tech Solutions
-- Project: Geotechnical Risk Monitoring & Landslide Early Warning
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 2. TABLE: stations
-- Represents active IoT telemetry monitoring stations
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.stations (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    rainfall DOUBLE PRECISION DEFAULT 0.0,
    soil DOUBLE PRECISION DEFAULT 0.0,
    tilt DOUBLE PRECISION DEFAULT 0.0,
    vibration DOUBLE PRECISION DEFAULT 0.0,
    battery INTEGER DEFAULT 100,
    signal INTEGER DEFAULT 100,
    last_seen_min INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'online' CHECK (status IN ('online', 'stale', 'offline')),
    score INTEGER DEFAULT 0,
    risk VARCHAR(20) DEFAULT 'Low' CHECK (risk IN ('Low', 'Moderate', 'High', 'Critical')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 3. TABLE: readings
-- Time-series telemetry readings recorded by sensor stations
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.readings (
    id BIGSERIAL PRIMARY KEY,
    station_id VARCHAR(50) NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    rainfall DOUBLE PRECISION,
    soil_moisture DOUBLE PRECISION,
    tilt_angle DOUBLE PRECISION,
    vibration DOUBLE PRECISION,
    battery_pct INTEGER,
    signal_rssi INTEGER
);

CREATE INDEX IF NOT EXISTS idx_readings_station_time ON public.readings(station_id, recorded_at DESC);

-- ====================================================================
-- 4. TABLE: alerts
-- Real-time geotechnical threshold alerts and incident logs
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.alerts (
    id VARCHAR(50) PRIMARY KEY,
    station_id VARCHAR(50) REFERENCES public.stations(id) ON DELETE SET NULL,
    location VARCHAR(150) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('Low', 'Moderate', 'High', 'Critical')),
    metric VARCHAR(50),
    value DOUBLE PRECISION,
    threshold DOUBLE PRECISION,
    time_str VARCHAR(50),
    trigger_desc VARCHAR(255) NOT NULL,
    description TEXT,
    acknowledged BOOLEAN DEFAULT FALSE,
    responder VARCHAR(100),
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_severity ON public.alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_ack ON public.alerts(acknowledged);

-- ====================================================================
-- 5. TABLE: users
-- Authorized operational operators, geologists, and engineers
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'Field Engineer' CHECK (role IN ('Field Engineer', 'Geologist', 'Admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 6. TABLE: system_settings
-- System hazard limits and notification configurations
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.system_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    rainfall_limit_mm DOUBLE PRECISION DEFAULT 15.0,
    soil_moisture_limit_pct DOUBLE PRECISION DEFAULT 75.0,
    tilt_limit_deg DOUBLE PRECISION DEFAULT 2.0,
    vibration_limit_mms DOUBLE PRECISION DEFAULT 1.5,
    auto_alert_notifications BOOLEAN DEFAULT TRUE,
    webhook_url VARCHAR(255) DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- ====================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- Enable public read/write access for application operations
-- ====================================================================
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public full access to stations" ON public.stations;
CREATE POLICY "Public full access to stations" ON public.stations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access to readings" ON public.readings;
CREATE POLICY "Public full access to readings" ON public.readings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access to alerts" ON public.alerts;
CREATE POLICY "Public full access to alerts" ON public.alerts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access to users" ON public.users;
CREATE POLICY "Public full access to users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access to system_settings" ON public.system_settings;
CREATE POLICY "Public full access to system_settings" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);

-- ====================================================================
-- 8. INITIAL PRODUCTION SEED DATA
-- Active telemetry monitoring grid locations
-- ====================================================================
INSERT INTO public.stations (id, name, lat, lng, rainfall, soil, tilt, vibration, battery, signal, last_seen_min, status, score, risk)
VALUES 
    ('STN-001', 'North Ridge Sector A', 11.4000, 76.7000, 18.2, 82.0, 2.4, 1.9, 78, 84, 2, 'online', 78, 'Critical'),
    ('STN-002', 'Valley Escarpment Sector B', 11.4300, 76.7400, 9.5, 66.0, 1.1, 0.8, 91, 72, 3, 'online', 58, 'High'),
    ('STN-003', 'High Slope Observatory', 11.3800, 76.7500, 4.1, 48.0, 0.5, 0.3, 64, 90, 1, 'online', 33, 'Moderate'),
    ('STN-004', 'Rail Corridor Incline Sector D', 11.4500, 76.6700, 1.2, 31.0, 0.2, 0.1, 88, 95, 4, 'online', 12, 'Low'),
    ('STN-005', 'Western Ghats Pass Station', 11.3600, 76.6600, 6.8, 55.0, 0.9, 0.5, 22, 41, 45, 'stale', 41, 'Moderate'),
    ('STN-006', 'Catchment Gorge Station', 11.4100, 76.6300, 0.0, 0.0, 0.0, 0.0, 5, 0, 190, 'offline', 0, 'Low')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    rainfall = EXCLUDED.rainfall,
    soil = EXCLUDED.soil,
    tilt = EXCLUDED.tilt,
    vibration = EXCLUDED.vibration,
    battery = EXCLUDED.battery,
    signal = EXCLUDED.signal,
    status = EXCLUDED.status,
    score = EXCLUDED.score,
    risk = EXCLUDED.risk,
    updated_at = NOW();

INSERT INTO public.system_settings (id, rainfall_limit_mm, soil_moisture_limit_pct, tilt_limit_deg, vibration_limit_mms, auto_alert_notifications, webhook_url)
VALUES (1, 15.0, 75.0, 2.0, 1.5, TRUE, '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.alerts (id, station_id, location, severity, trigger_desc, description, acknowledged, responder)
VALUES
    ('AL-101', 'STN-001', 'North Ridge Sector A', 'Critical', 'Soil 82% · Rain 18.2 mm/h', 'Sustained heavy precipitation with near-saturated soil pore pressure.', FALSE, NULL),
    ('AL-102', 'STN-002', 'Valley Escarpment Sector B', 'High', 'Soil 66% · Tilt 1.1°', 'Accelerating pore saturation with measurable ground tilt drift.', FALSE, NULL),
    ('AL-103', 'STN-005', 'Western Ghats Pass Station', 'Moderate', 'Data stale 45 min · Battery 22%', 'Station transmission latency elevated, secondary battery reserve active.', TRUE, 'Field Team Alpha'),
    ('AL-104', 'STN-006', 'Catchment Gorge Station', 'Moderate', 'No transmission for 190 min', 'Hardware telemetry offline. Scheduled for on-site diagnostic inspection.', FALSE, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (email, name, hashed_password, role)
VALUES
    ('engineer@landslideguard.ai', 'Sarah Chen', '9ab72808c1a60ca69ee08aa8c29ec4a6132fb2c954eb270a4a500ad99b4f65c5', 'Field Engineer'),
    ('geologist@landslideguard.ai', 'Dr. Priya Nair', '9ab72808c1a60ca69ee08aa8c29ec4a6132fb2c954eb270a4a500ad99b4f65c5', 'Geologist'),
    ('admin@landslideguard.ai', 'Marcus Vance', '9ab72808c1a60ca69ee08aa8c29ec4a6132fb2c954eb270a4a500ad99b4f65c5', 'Admin'),
    ('nexaraautotechsolution@gmail.com', 'Nexara Admin', '9ab72808c1a60ca69ee08aa8c29ec4a6132fb2c954eb270a4a500ad99b4f65c5', 'Admin')
ON CONFLICT (email) DO NOTHING;
