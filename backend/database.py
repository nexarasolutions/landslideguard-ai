import math
import uuid
import os
from datetime import datetime, timezone
from typing import List, Optional, Dict
try:
    import httpx
except ImportError:
    httpx = None

try:
    from backend.models import (
        Station, StationCreate, Reading, Alert, AlertSimulateRequest,
        ScenarioSimulateRequest, ScenarioSimulateResponse, SystemSettings, Risk,
        TelemetryUpdate
    )
    from backend.config import SUPABASE_URL, SUPABASE_KEY
except ImportError:
    from models import (
        Station, StationCreate, Reading, Alert, AlertSimulateRequest,
        ScenarioSimulateRequest, ScenarioSimulateResponse, SystemSettings, Risk,
        TelemetryUpdate
    )
    from config import SUPABASE_URL, SUPABASE_KEY


def risk_of_score(score: int) -> Risk:
    if score >= 75:
        return 'Critical'
    elif score >= 55:
        return 'High'
    elif score >= 30:
        return 'Moderate'
    return 'Low'

# Operational IoT telemetry monitoring device
INITIAL_STATIONS = [
    {
        "id": "STN-001",
        "name": "LandslideGuard AI - Live Node",
        "lat": 11.3164,
        "lng": 77.5525,
        "rainfall": 0.0,
        "soil": 0.0,
        "tilt": 0.0,
        "vibration": 0.0,
        "battery": 100,
        "signal": 100,
        "lastSeenMin": 0,
        "status": "online",
        "score": 0,
        "risk": "Low"
    }
]

INITIAL_ALERTS = [
    {
        "id": "AL-101",
        "stationId": "STN-001",
        "location": "North Ridge Sector A",
        "severity": "Critical",
        "time": "2 h ago",
        "trigger": "Soil 82% · Rain 18.2 mm/h",
        "description": "Sustained heavy precipitation with near-saturated soil pore pressure.",
        "acknowledged": False,
        "responder": None
    },
    {
        "id": "AL-102",
        "stationId": "STN-002",
        "location": "Valley Escarpment Sector B",
        "severity": "High",
        "time": "5 h ago",
        "trigger": "Soil 66% · Tilt 1.1°",
        "description": "Accelerating pore saturation with measurable ground tilt drift.",
        "acknowledged": False,
        "responder": None
    },
    {
        "id": "AL-103",
        "stationId": "STN-005",
        "location": "Western Ghats Pass Station",
        "severity": "Moderate",
        "time": "9 h ago",
        "trigger": "Data stale 45 min · Battery 22%",
        "description": "Station transmission latency elevated, secondary battery reserve active.",
        "acknowledged": True,
        "responder": "Field Team Alpha"
    },
    {
        "id": "AL-104",
        "stationId": "STN-006",
        "location": "Catchment Gorge Station",
        "severity": "Moderate",
        "time": "1 d ago",
        "trigger": "No transmission for 190 min",
        "description": "Hardware telemetry offline. Scheduled for on-site diagnostic inspection.",
        "acknowledged": False,
        "responder": None
    }
]

class Database:
    def __init__(self):
        self.stations: Dict[str, Station] = {
            s["id"]: Station(**s) for s in INITIAL_STATIONS
        }
        self.alerts: List[Alert] = [
            Alert(**a) for a in INITIAL_ALERTS
        ]
        self.settings: SystemSettings = SystemSettings()
        self.supabase_url = SUPABASE_URL.rstrip('/') if SUPABASE_URL else None
        self.supabase_key = SUPABASE_KEY if SUPABASE_KEY else None

        # Synchronize from Supabase if configured
        self._sync_from_supabase()

    def _get_supabase_headers(self):
        if not self.supabase_key:
            return {}
        return {
            "apikey": self.supabase_key,
            "Authorization": f"Bearer {self.supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    def _sync_from_supabase(self):
        """Fetch remote stations from Supabase if available."""
        if not self.supabase_url or not self.supabase_key or not httpx:
            return
        try:
            with httpx.Client(timeout=4.0) as client:
                res = client.get(
                    f"{self.supabase_url}/rest/v1/stations?select=*",
                    headers=self._get_supabase_headers()
                )
                if res.status_code == 200:
                    records = res.json()
                    if records and len(records) > 0:
                        new_stations = {}
                        for r in records:
                            st = Station(
                                id=r.get("id"),
                                name=r.get("name"),
                                lat=r.get("lat", 0.0),
                                lng=r.get("lng", 0.0),
                                rainfall=r.get("rainfall", 0.0),
                                soil=r.get("soil", 0.0),
                                tilt=r.get("tilt", 0.0),
                                vibration=r.get("vibration", 0.0),
                                battery=r.get("battery", 100),
                                signal=r.get("signal", 100),
                                lastSeenMin=r.get("last_seen_min", 0),
                                status=r.get("status", "online"),
                                score=r.get("score", 0),
                                risk=r.get("risk", "Low")
                            )
                            new_stations[st.id] = st
                        self.stations = new_stations
        except Exception as e:
            # Seamless fallback to in-memory store
            pass

    def get_stations(self) -> List[Station]:
        now = datetime.now(timezone.utc).timestamp()
        if now - getattr(self, '_last_sync', 0) > 4.0:
            self._sync_from_supabase()
            self._last_sync = now
        return list(self.stations.values())

    def get_station(self, station_id: str) -> Optional[Station]:
        now = datetime.now(timezone.utc).timestamp()
        if now - getattr(self, '_last_sync', 0) > 4.0:
            self._sync_from_supabase()
            self._last_sync = now
        return self.stations.get(station_id)

    def create_station(self, station_in: StationCreate) -> Station:
        station_id = station_in.id or f"STN-00{len(self.stations) + 1}"
        score = station_in.score
        risk = risk_of_score(score)
        st = Station(
            id=station_id,
            name=station_in.name,
            lat=station_in.lat,
            lng=station_in.lng,
            rainfall=station_in.rainfall,
            soil=station_in.soil,
            tilt=station_in.tilt,
            vibration=station_in.vibration,
            battery=station_in.battery,
            signal=station_in.signal,
            lastSeenMin=station_in.lastSeenMin,
            status=station_in.status,
            score=score,
            risk=risk
        )
        self.stations[station_id] = st

        # Push to Supabase if configured
        if self.supabase_url and self.supabase_key and httpx:
            try:
                with httpx.Client(timeout=3.0) as client:
                    client.post(
                        f"{self.supabase_url}/rest/v1/stations",
                        headers=self._get_supabase_headers(),
                        json={
                            "id": st.id,
                            "name": st.name,
                            "lat": st.lat,
                            "lng": st.lng,
                            "rainfall": st.rainfall,
                            "soil": st.soil,
                            "tilt": st.tilt,
                            "vibration": st.vibration,
                            "battery": st.battery,
                            "signal": st.signal,
                            "last_seen_min": st.lastSeenMin,
                            "status": st.status,
                            "score": st.score,
                            "risk": st.risk
                        }
                    )
            except Exception:
                pass

        return st

    def calibrate_station(self, station_id: str) -> Optional[Station]:
        st = self.stations.get(station_id)
        if not st:
            return None
        st.tilt = 0.0
        st.vibration = 0.05
        st.status = 'online'
        st.lastSeenMin = 0
        st.score = max(5, int(st.score * 0.7))
        st.risk = risk_of_score(st.score)

        if self.supabase_url and self.supabase_key and httpx:
            try:
                with httpx.Client(timeout=3.0) as client:
                    client.patch(
                        f"{self.supabase_url}/rest/v1/stations?id=eq.{station_id}",
                        headers=self._get_supabase_headers(),
                        json={
                            "tilt": 0.0,
                            "vibration": 0.05,
                            "status": "online",
                            "last_seen_min": 0,
                            "score": st.score,
                            "risk": st.risk
                        }
                    )
            except Exception:
                pass

        return st

    def update_telemetry(self, station_id: str, telemetry: TelemetryUpdate) -> Optional[Station]:
        st = self.stations.get(station_id)
        if not st:
            st = Station(
                id=station_id,
                name=f"Field Telemetry Node ({station_id})",
                lat=telemetry.lat if telemetry.lat is not None and telemetry.lat != 0.0 else 11.4000,
                lng=telemetry.lng if telemetry.lng is not None and telemetry.lng != 0.0 else 76.7000,
                rainfall=0.0,
                soil=0.0,
                tilt=0.0,
                vibration=0.0,
                battery=100,
                signal=95,
                lastSeenMin=0,
                status="online",
                score=10,
                risk="Low"
            )
            self.stations[station_id] = st

        soil_val = telemetry.soil if telemetry.soil is not None else telemetry.soil_moisture
        if soil_val is not None:
            st.soil = round(float(soil_val), 1)
        if telemetry.rainfall is not None:
            st.rainfall = round(float(telemetry.rainfall), 1)
        if telemetry.tilt is not None:
            st.tilt = round(float(telemetry.tilt), 2)
        if telemetry.vibration is not None:
            st.vibration = round(float(telemetry.vibration), 2)
        if telemetry.battery is not None:
            st.battery = int(telemetry.battery)
        elif telemetry.voltage is not None:
            pct = min(100, max(5, int((telemetry.voltage / 4.2) * 100))) if telemetry.voltage <= 5.0 else min(100, max(5, int((telemetry.voltage / 14.5) * 100)))
            st.battery = pct
        if telemetry.lat is not None and telemetry.lat != 0.0:
            st.lat = telemetry.lat
        if telemetry.lng is not None and telemetry.lng != 0.0:
            st.lng = telemetry.lng

        st.status = 'online'
        st.lastSeenMin = 0

        score = int(min(100, max(5, (st.soil * 0.4) + (st.rainfall * 2.0) + (st.tilt * 10.0) + (st.vibration * 15.0))))
        st.score = score
        st.risk = risk_of_score(score)

        if self.supabase_url and self.supabase_key and httpx:
            try:
                with httpx.Client(timeout=4.0) as client:
                    # 1. Update station state in Supabase
                    client.patch(
                        f"{self.supabase_url}/rest/v1/stations?id=eq.{station_id}",
                        headers=self._get_supabase_headers(),
                        json={
                            "name": st.name,
                            "lat": st.lat,
                            "lng": st.lng,
                            "rainfall": st.rainfall,
                            "soil": st.soil,
                            "tilt": st.tilt,
                            "vibration": st.vibration,
                            "battery": st.battery,
                            "last_seen_min": 0,
                            "status": "online",
                            "score": st.score,
                            "risk": st.risk,
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }
                    )

                    # 2. Insert telemetry reading record into public.readings
                    reading_row = {
                        "station_id": station_id,
                        "rainfall": st.rainfall,
                        "soil_moisture": st.soil,
                        "tilt_angle": st.tilt,
                        "vibration": st.vibration,
                        "battery_pct": st.battery,
                        "signal_rssi": st.signal
                    }
                    client.post(
                        f"{self.supabase_url}/rest/v1/readings",
                        headers=self._get_supabase_headers(),
                        json=reading_row
                    )

                    # 3. If critical or high risk, auto-create alert in Supabase
                    if st.risk in ('Critical', 'High'):
                        alert_id = f"AL-{int(datetime.now(timezone.utc).timestamp()) % 1000000}"
                        trigger_text = f"Soil {st.soil}% · Tilt {st.tilt}° · Vib {st.vibration} mm/s"
                        alert_row = {
                            "id": alert_id,
                            "station_id": station_id,
                            "location": st.name,
                            "severity": st.risk,
                            "trigger_desc": trigger_text,
                            "description": f"Real-time sensor threshold breach detected at {st.name}. Immediate geotechnical attention recommended.",
                            "acknowledged": False
                        }
                        client.post(
                            f"{self.supabase_url}/rest/v1/alerts",
                            headers=self._get_supabase_headers(),
                            json=alert_row
                        )
            except Exception:
                pass

        return st

    def get_readings(self, station_id: str) -> List[Reading]:
        st = self.stations.get(station_id) or (list(self.stations.values())[0] if self.stations else None)
        if not st:
            return []

        # First, try to fetch real saved readings from Supabase
        if self.supabase_url and self.supabase_key and httpx:
            try:
                with httpx.Client(timeout=4.0) as client:
                    res = client.get(
                        f"{self.supabase_url}/rest/v1/readings?station_id=eq.{station_id}&order=recorded_at.desc&limit=48",
                        headers=self._get_supabase_headers()
                    )
                    if res.status_code == 200:
                        rows = res.json()
                        if rows and len(rows) > 0:
                            rows.reverse()
                            real_readings = []
                            for r in rows:
                                rec_at = r.get("recorded_at") or ""
                                t_str = rec_at[11:16] if ("T" in rec_at and len(rec_at) >= 16) else "Now"
                                real_readings.append(Reading(
                                    t=t_str,
                                    rainfall=r.get("rainfall"),
                                    soil=r.get("soil_moisture"),
                                    tilt=r.get("tilt_angle"),
                                    vibration=r.get("vibration")
                                ))
                            return real_readings
            except Exception:
                pass

        # Fallback to realistic baseline telemetry if no records in Supabase yet
        k = 0.3 + (st.score / 100.0)
        seed = 1
        try:
            seed = int(st.id[-1])
        except Exception:
            seed = 3

        readings: List[Reading] = []
        for i in range(24):
            hour = (24 + (i - 24)) % 24
            time_str = f"{hour:02d}:00"
            w1 = math.sin(i / 5.0 + seed * 1.0)
            w2 = math.sin(i / 5.0 + seed * 2.0)
            rain = round(max(0.0, (1.0 + 3.0 * w1) * k), 1)
            soil = round(min(100.0, max(0.0, st.soil - 10.0 + 8.0 * w2)), 1)
            tilt = round(max(0.0, st.tilt * 0.8 + 0.1 * w1), 2)
            vib = round(max(0.0, st.vibration * 0.8 + 0.05 * abs(w2)), 2)

            readings.append(Reading(
                t=time_str,
                rainfall=rain,
                soil=soil,
                tilt=tilt,
                vibration=vib
            ))
        return readings

    def get_alerts(self) -> List[Alert]:
        if self.supabase_url and self.supabase_key and httpx:
            try:
                with httpx.Client(timeout=3.0) as client:
                    res = client.get(
                        f"{self.supabase_url}/rest/v1/alerts?select=*&order=created_at.desc&limit=50",
                        headers=self._get_supabase_headers()
                    )
                    if res.status_code == 200:
                        records = res.json()
                        if isinstance(records, list):
                            db_alerts = []
                            for r in records:
                                db_alerts.append(Alert(
                                    id=r.get("id"),
                                    stationId=r.get("station_id") or "STN-001",
                                    location=r.get("location") or "Regional Sector",
                                    severity=r.get("severity") or "Low",
                                    time=r.get("time_str") or "Recent",
                                    trigger=r.get("trigger_desc") or "",
                                    description=r.get("description") or "",
                                    acknowledged=bool(r.get("acknowledged")),
                                    responder=r.get("responder")
                                ))
                            self.alerts = db_alerts
                            return self.alerts
            except Exception:
                pass
        return self.alerts


    def acknowledge_alert(self, alert_id: str, responder: str = "Mission Operator") -> Optional[Alert]:
        for alert in self.alerts:
            if alert.id == alert_id:
                alert.acknowledged = True
                alert.responder = responder

                if self.supabase_url and self.supabase_key and httpx:
                    try:
                        with httpx.Client(timeout=3.0) as client:
                            client.patch(
                                f"{self.supabase_url}/rest/v1/alerts?id=eq.{alert_id}",
                                headers=self._get_supabase_headers(),
                                json={"acknowledged": True, "responder": responder}
                            )
                    except Exception:
                        pass

                return alert
        return None

    def simulate_alert(self, req: AlertSimulateRequest) -> Alert:
        st = self.stations.get(req.stationId)
        loc = st.name if st else "Regional Sector"
        alert = Alert(
            id=f"AL-{len(self.alerts) + 101}",
            stationId=req.stationId,
            location=loc,
            severity=req.severity,
            time="Just now",
            trigger=req.trigger,
            description=req.description,
            acknowledged=False
        )
        self.alerts.insert(0, alert)

        if self.supabase_url and self.supabase_key and httpx:
            try:
                with httpx.Client(timeout=3.0) as client:
                    client.post(
                        f"{self.supabase_url}/rest/v1/alerts",
                        headers=self._get_supabase_headers(),
                        json={
                            "id": alert.id,
                            "station_id": alert.stationId,
                            "location": alert.location,
                            "severity": alert.severity,
                            "trigger_desc": alert.trigger,
                            "description": alert.description,
                            "acknowledged": False
                        }
                    )
            except Exception:
                pass

        return alert

    def simulate_scenario(self, req: ScenarioSimulateRequest) -> ScenarioSimulateResponse:
        slope_rad = math.radians(req.slope_angle_deg)
        pore_pressure = req.soil_saturation_pct * 0.45 * (req.rainfall_intensity_mm / 50.0)
        drainage_factor = max(0.1, 1.0 - (req.drainage_capacity_pct / 100.0))
        effective_pore_kpa = round(pore_pressure * drainage_factor * 12.5, 1)

        driving = math.sin(slope_rad) * 1.5 + (req.rainfall_intensity_mm / 100.0) * 0.8
        resisting = math.cos(slope_rad) * (1.8 - (req.soil_saturation_pct / 100.0) * 0.9)
        fos = round(max(0.4, min(3.0, (resisting / max(0.1, driving)) * (1.0 + (req.drainage_capacity_pct / 200.0)))), 2)

        raw_score = int(max(0, min(100, (2.2 - fos) * 50 + (effective_pore_kpa / 1.5))))
        risk_level = risk_of_score(raw_score)

        if fos < 1.0:
            time_to_critical = round(max(0.5, 4.0 - (req.rainfall_intensity_mm / 25.0)), 1)
            statement = f"CRITICAL SLOPE INSTABILITY: Factor of Safety ({fos}) below failure threshold. Immediate hazard evacuation required."
        elif fos < 1.3:
            time_to_critical = round(max(2.0, 12.0 - (req.rainfall_intensity_mm / 15.0)), 1)
            statement = f"HIGH HAZARD WARNING: Pore water pressure ({effective_pore_kpa} kPa) approaching shear failure limits. Continuous sensor monitoring active."
        else:
            time_to_critical = None
            statement = f"STABLE CONDITIONS: Slope retaining structural equilibrium (FoS {fos}). Normal watch condition maintained."

        factors = [
            {"factor": "Rainfall Intensity", "impact": "High" if req.rainfall_intensity_mm > 50 else "Moderate", "weight": 35},
            {"factor": "Soil Saturation", "impact": "Critical" if req.soil_saturation_pct > 80 else "Moderate", "weight": 30},
            {"factor": "Slope Incline", "impact": "High" if req.slope_angle_deg > 35 else "Low", "weight": 20},
            {"factor": "Drainage Attenuation", "impact": "Protective" if req.drainage_capacity_pct > 50 else "Deficit", "weight": 15}
        ]

        return ScenarioSimulateResponse(
            projected_risk_score=raw_score,
            projected_risk_level=risk_level,
            pore_water_pressure_kpa=effective_pore_kpa,
            factor_of_safety=fos,
            time_to_critical_hours=time_to_critical,
            warning_statement=statement,
            factors=factors
        )

    def get_analytics_summary(self) -> Dict:
        stations_list = list(self.stations.values())
        total = len(stations_list)
        return {
            "total_stations": total,
            "critical_count": len([s for s in stations_list if s.risk == "Critical"]),
            "high_count": len([s for s in stations_list if s.risk == "High"]),
            "online_count": len([s for s in stations_list if s.status == "online"]),
            "stale_count": len([s for s in stations_list if s.status == "stale"]),
            "offline_count": len([s for s in stations_list if s.status == "offline"]),
            "average_soil_saturation_pct": round(sum(s.soil for s in stations_list) / max(1, total), 1),
            "peak_rainfall_rate_mm": max([s.rainfall for s in stations_list] + [0.0]),
            "total_alerts": len(self.alerts),
            "unacknowledged_alerts": len([a for a in self.alerts if not a.acknowledged])
        }

    def get_system_settings(self) -> SystemSettings:
        return self.settings

    def update_system_settings(self, settings_in: SystemSettings) -> SystemSettings:
        self.settings = settings_in
        return self.settings

db = Database()
