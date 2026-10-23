import math
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict
try:
    from backend.models import (
        Station, StationCreate, Reading, Alert, AlertSimulateRequest,
        ScenarioSimulateRequest, ScenarioSimulateResponse, SystemSettings, Risk
    )
except ImportError:
    from models import (
        Station, StationCreate, Reading, Alert, AlertSimulateRequest,
        ScenarioSimulateRequest, ScenarioSimulateResponse, SystemSettings, Risk
    )

def risk_of_score(score: int) -> Risk:
    if score >= 75:
        return 'Critical'
    elif score >= 55:
        return 'High'
    elif score >= 30:
        return 'Moderate'
    return 'Low'

# Initial stations matching and expanding upon demo data
INITIAL_STATIONS = [
    {
        "id": "DEMO-001",
        "name": "Sample Site A (North Ridge)",
        "lat": 11.4000,
        "lng": 76.7000,
        "rainfall": 18.2,
        "soil": 82.0,
        "tilt": 2.4,
        "vibration": 1.9,
        "battery": 78,
        "signal": 84,
        "lastSeenMin": 2,
        "status": "online",
        "score": 78,
        "risk": "Critical"
    },
    {
        "id": "DEMO-002",
        "name": "Sample Site B (Valley Escarpment)",
        "lat": 11.4300,
        "lng": 76.7400,
        "rainfall": 9.5,
        "soil": 66.0,
        "tilt": 1.1,
        "vibration": 0.8,
        "battery": 91,
        "signal": 72,
        "lastSeenMin": 3,
        "status": "online",
        "score": 58,
        "risk": "High"
    },
    {
        "id": "DEMO-003",
        "name": "Sample Site C (Highway Junction Cut)",
        "lat": 11.3800,
        "lng": 76.7500,
        "rainfall": 4.1,
        "soil": 48.0,
        "tilt": 0.5,
        "vibration": 0.3,
        "battery": 64,
        "signal": 90,
        "lastSeenMin": 1,
        "status": "online",
        "score": 33,
        "risk": "Moderate"
    },
    {
        "id": "DEMO-004",
        "name": "Sample Site D (West Slope Foothill)",
        "lat": 11.4500,
        "lng": 76.6700,
        "rainfall": 1.2,
        "soil": 31.0,
        "tilt": 0.2,
        "vibration": 0.1,
        "battery": 88,
        "signal": 95,
        "lastSeenMin": 4,
        "status": "online",
        "score": 12,
        "risk": "Low"
    },
    {
        "id": "DEMO-005",
        "name": "Sample Site E (East Valley Creek)",
        "lat": 11.3600,
        "lng": 76.6600,
        "rainfall": 6.8,
        "soil": 55.0,
        "tilt": 0.9,
        "vibration": 0.5,
        "battery": 22,
        "signal": 41,
        "lastSeenMin": 45,
        "status": "stale",
        "score": 41,
        "risk": "Moderate"
    },
    {
        "id": "DEMO-006",
        "name": "Sample Site F (Gorge Bridge Spur)",
        "lat": 11.4100,
        "lng": 76.6300,
        "rainfall": 0.0,
        "soil": 0.0,
        "tilt": 0.0,
        "vibration": 0.0,
        "battery": 5,
        "signal": 0,
        "lastSeenMin": 190,
        "status": "offline",
        "score": 0,
        "risk": "Low"
    }
]

INITIAL_ALERTS = [
    {
        "id": "AL-101",
        "stationId": "DEMO-001",
        "location": "Sample Site A (North Ridge)",
        "severity": "Critical",
        "time": "2 h ago",
        "trigger": "Soil 82 % · Rain 18.2 mm/h",
        "description": "Simulated threshold breach: sustained rainfall with near-saturated soil.",
        "acknowledged": False,
        "responder": None
    },
    {
        "id": "AL-102",
        "stationId": "DEMO-002",
        "location": "Sample Site B (Valley Escarpment)",
        "severity": "High",
        "time": "5 h ago",
        "trigger": "Soil 66 % · Tilt 1.1°",
        "description": "Simulated rise in soil moisture and ground tilt.",
        "acknowledged": False,
        "responder": None
    },
    {
        "id": "AL-103",
        "stationId": "DEMO-005",
        "location": "Sample Site E (East Valley Creek)",
        "severity": "Moderate",
        "time": "9 h ago",
        "trigger": "Data stale 45 min · Battery 22 %",
        "description": "Station reporting late with low battery.",
        "acknowledged": True,
        "responder": "Field team 2"
    },
    {
        "id": "AL-104",
        "stationId": "DEMO-006",
        "location": "Sample Site F (Gorge Bridge Spur)",
        "severity": "Moderate",
        "time": "1 d ago",
        "trigger": "No reading for 190 min",
        "description": "Station offline. Risk estimate unavailable.",
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

    def get_stations(self) -> List[Station]:
        return list(self.stations.values())

    def get_station(self, station_id: str) -> Optional[Station]:
        return self.stations.get(station_id)

    def create_station(self, station_in: StationCreate) -> Station:
        station_id = station_in.id or f"SITE-{uuid.uuid4().hex[:6].upper()}"
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
        return st

    def get_readings(self, station_id: str) -> List[Reading]:
        st = self.stations.get(station_id) or list(self.stations.values())[0]
        k = 0.3 + (st.score / 100.0)
        seed = 1
        try:
            seed = int(st.id[-1])
        except Exception:
            seed = 3

        readings: List[Reading] = []
        for i in range(48):
            gap = st.status == 'offline' and 18 < i < 36
            hour = (24 + (i - 48)) % 24
            time_str = f"{hour:02d}:00"

            if gap:
                readings.append(Reading(t=time_str, rainfall=None, soil=None, tilt=None, vibration=None))
            else:
                w1 = math.sin(i / 5.0 + seed * 1.0)
                w2 = math.sin(i / 5.0 + seed * 2.0)
                w3 = math.sin(i / 5.0 + seed * 3.0)
                w4 = math.sin(i / 5.0 + seed * 4.0)

                rain = round(max(0.0, (3.0 + 5.0 * w1) * k * 1.6), 2)
                soil = round(min(100.0, max(0.0, 35.0 + 12.0 * w2 + i * 0.4 * k + st.score * 0.2)), 2)
                tilt = round(max(0.0, 0.3 + (i / 47.0) * st.tilt + 0.1 * w3), 2)
                vib = round(max(0.0, 0.2 + 0.5 * k * abs(w4)), 2)

                readings.append(Reading(
                    t=time_str,
                    rainfall=rain,
                    soil=soil,
                    tilt=tilt,
                    vibration=vib
                ))
        return readings

    def get_alerts(self) -> List[Alert]:
        return self.alerts

    def acknowledge_alert(self, alert_id: str, responder: str = "Operator") -> Optional[Alert]:
        for alert in self.alerts:
            if alert.id == alert_id:
                alert.acknowledged = True
                alert.responder = responder
                return alert
        return None

    def simulate_alert(self, req: AlertSimulateRequest) -> Alert:
        st = self.stations.get(req.stationId)
        loc = st.name if st else "Sample Location"
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
        return alert

    def simulate_scenario(self, req: ScenarioSimulateRequest) -> ScenarioSimulateResponse:
        # Geotechnical calculation
        # Factor of Safety (FoS) = (c' + (gamma - gamma_w * ru) * z * cos^2(beta) * tan(phi)) / (gamma * z * sin(beta) * cos(beta))
        # Simplified AI proxy:
        slope_rad = math.radians(req.slope_angle_deg)
        pore_pressure = req.soil_saturation_pct * 0.45 * (req.rainfall_intensity_mm / 50.0)
        drainage_factor = max(0.1, 1.0 - (req.drainage_capacity_pct / 100.0))
        effective_pore_kpa = round(pore_pressure * drainage_factor * 12.5, 1)

        # Baseline resisting vs driving forces
        driving = math.sin(slope_rad) * 1.5 + (req.rainfall_intensity_mm / 100.0) * 0.8
        resisting = math.cos(slope_rad) * (1.8 - (req.soil_saturation_pct / 100.0) * 0.9)
        fos = round(max(0.4, min(3.0, (resisting / max(0.1, driving)) * (1.0 + (req.drainage_capacity_pct / 200.0)))), 2)

        raw_score = int(max(0, min(100, (2.2 - fos) * 50 + (effective_pore_kpa / 1.5))))
        risk_level = risk_of_score(raw_score)

        if fos < 1.0:
            time_to_critical = round(max(0.5, 4.0 - (req.rainfall_intensity_mm / 25.0)), 1)
            statement = f"CRITICAL SLOPE INSTABILITY: Factor of Safety ({fos}) below failure threshold. Evacuation warning recommended."
        elif fos < 1.3:
            time_to_critical = round(max(2.0, 12.0 - (req.rainfall_intensity_mm / 15.0)), 1)
            statement = f"HIGH HAZARD WARNING: Pore water pressure ({effective_pore_kpa} kPa) nearing shear failure limits. Continuous monitoring active."
        else:
            time_to_critical = None
            statement = f"STABLE CONDITIONS: Slope retaining structural equilibrium (FoS {fos}). Normal watch condition."

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

db = Database()
