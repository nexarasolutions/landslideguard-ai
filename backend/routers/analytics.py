from fastapi import APIRouter
from fastapi.responses import Response
try:
    from backend.models import ScenarioSimulateRequest, ScenarioSimulateResponse
    from backend.database import db
except ImportError:
    from models import ScenarioSimulateRequest, ScenarioSimulateResponse
    from database import db

router = APIRouter(prefix="/api", tags=["Analytics & AI Prediction"])

@router.post("/prediction/simulate", response_model=ScenarioSimulateResponse)
async def simulate_scenario(req: ScenarioSimulateRequest):
    return db.simulate_scenario(req)

@router.get("/analytics/summary")
async def get_analytics_summary():
    stations = db.get_stations()
    alerts = db.get_alerts()
    
    total = len(stations)
    critical_count = sum(1 for s in stations if s.risk == 'Critical')
    high_count = sum(1 for s in stations if s.risk == 'High')
    online_count = sum(1 for s in stations if s.status == 'online')
    stale_count = sum(1 for s in stations if s.status == 'stale')
    offline_count = sum(1 for s in stations if s.status == 'offline')
    avg_soil = round(sum(s.soil for s in stations) / max(1, total), 1)
    max_rain = round(max((s.rainfall for s in stations), default=0.0), 1)

    return {
        "total_stations": total,
        "critical_count": critical_count,
        "high_count": high_count,
        "online_count": online_count,
        "stale_count": stale_count,
        "offline_count": offline_count,
        "average_soil_saturation_pct": avg_soil,
        "peak_rainfall_rate_mm": max_rain,
        "total_alerts": len(alerts),
        "unacknowledged_alerts": sum(1 for a in alerts if not a.acknowledged)
    }

@router.get("/analytics/export")
async def export_telemetry_csv():
    stations = db.get_stations()
    lines = ["station_id,station_name,latitude,longitude,rainfall_mm,soil_moisture_pct,tilt_deg,vibration_mms,status,score,risk"]
    for s in stations:
        lines.append(f"{s.id},{s.name},{s.lat},{s.lng},{s.rainfall},{s.soil},{s.tilt},{s.vibration},{s.status},{s.score},{s.risk}")
    
    csv_content = "\n".join(lines)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=landslideguard_telemetry.csv"}
    )
