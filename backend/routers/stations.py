from typing import List
from fastapi import APIRouter, HTTPException, status
try:
    from backend.models import Station, StationCreate, Reading, TelemetryUpdate
    from backend.database import db
except ImportError:
    from models import Station, StationCreate, Reading, TelemetryUpdate
    from database import db

router = APIRouter(prefix="/api/stations", tags=["Stations"])

@router.get("", response_model=List[Station])
async def list_stations():
    return db.get_stations()

@router.get("/{station_id}", response_model=Station)
async def get_station(station_id: str):
    st = db.get_station(station_id)
    if not st:
        raise HTTPException(status_code=404, detail="Station not found")
    return st

@router.post("", response_model=Station, status_code=status.HTTP_201_CREATED)
async def create_station(station_in: StationCreate):
    return db.create_station(station_in)

@router.post("/{station_id}/telemetry", response_model=Station)
async def post_station_telemetry(station_id: str, telemetry: TelemetryUpdate):
    st = db.update_telemetry(station_id, telemetry)
    return st

@router.post("/telemetry", response_model=Station)
async def ingest_telemetry(telemetry: TelemetryUpdate):
    station_id = telemetry.station_id or "STN-001"
    st = db.update_telemetry(station_id, telemetry)
    return st

@router.get("/{station_id}/readings", response_model=List[Reading])
async def get_readings(station_id: str):
    return db.get_readings(station_id)

@router.post("/{station_id}/calibrate", response_model=Station)
async def calibrate_station(station_id: str):
    st = db.calibrate_station(station_id)
    if not st:
        raise HTTPException(status_code=404, detail="Station not found")
    return st

