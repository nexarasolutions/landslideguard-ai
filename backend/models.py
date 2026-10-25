from typing import List, Optional, Literal
from pydantic import BaseModel, Field

Risk = Literal['Low', 'Moderate', 'High', 'Critical']
ConnStatus = Literal['online', 'stale', 'offline']
UserRole = Literal['Admin', 'Field Engineer', 'Geologist', 'Operator']

class UserBase(BaseModel):
    email: str
    name: str
    role: UserRole = 'Field Engineer'

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(UserBase):
    id: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class StationBase(BaseModel):
    name: str
    lat: float
    lng: float
    rainfall: float = 0.0      # mm
    soil: float = 0.0          # %
    tilt: float = 0.0          # deg
    vibration: float = 0.0     # mm/s
    battery: int = 100         # %
    signal: int = 100          # %
    lastSeenMin: int = 0
    status: ConnStatus = 'online'
    score: int = 20
    risk: Risk = 'Low'

class StationCreate(StationBase):
    id: Optional[str] = None

class Station(StationBase):
    id: str

class TelemetryUpdate(BaseModel):
    station_id: Optional[str] = "STN-001"
    soil: Optional[float] = None
    soil_moisture: Optional[float] = None
    rainfall: Optional[float] = None
    tilt: Optional[float] = None
    vibration: Optional[float] = None
    voltage: Optional[float] = None
    battery: Optional[int] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

class Reading(BaseModel):

    t: str
    rainfall: Optional[float] = None
    soil: Optional[float] = None
    tilt: Optional[float] = None
    vibration: Optional[float] = None

class Alert(BaseModel):
    id: str
    stationId: str
    location: str
    severity: Risk
    time: str
    trigger: str
    description: str
    acknowledged: bool = False
    responder: Optional[str] = None

class AlertSimulateRequest(BaseModel):
    stationId: str
    severity: Risk
    trigger: str
    description: str

class ScenarioSimulateRequest(BaseModel):
    rainfall_intensity_mm: float = 85.0
    storm_duration_hours: float = 6.0
    soil_saturation_pct: float = 75.0
    slope_angle_deg: float = 38.0
    drainage_capacity_pct: float = 40.0

class ScenarioSimulateResponse(BaseModel):
    projected_risk_score: int
    projected_risk_level: Risk
    pore_water_pressure_kpa: float
    factor_of_safety: float
    time_to_critical_hours: Optional[float]
    warning_statement: str
    factors: List[dict]

class SystemSettings(BaseModel):
    rainfall_threshold_high_mm: float = 60.0
    rainfall_threshold_crit_mm: float = 100.0
    soil_moisture_threshold_pct: float = 80.0
    tilt_threshold_deg: float = 5.0
    vibration_threshold_mms: float = 12.0
    alert_email_enabled: bool = True
    alert_sms_enabled: bool = False
    auto_refresh_seconds: int = 30
