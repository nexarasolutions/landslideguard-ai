from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
try:
    from backend.models import Alert, AlertSimulateRequest, UserOut
    from backend.auth import get_current_user
    from backend.database import db
except ImportError:
    from models import Alert, AlertSimulateRequest, UserOut
    from auth import get_current_user
    from database import db

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

class AckRequest(BaseModel):
    responder: Optional[str] = "Control Center"

@router.get("", response_model=List[Alert])
async def list_alerts():
    return db.get_alerts()

@router.post("/{alert_id}/acknowledge", response_model=Alert)
async def acknowledge_alert(
    alert_id: str,
    body: Optional[AckRequest] = None,
    current_user: Optional[UserOut] = Depends(get_current_user)
):
    responder = (current_user.name if current_user else None) or (body.responder if body else "Control Center")
    alert = db.acknowledge_alert(alert_id, responder=responder)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

@router.post("/simulate", response_model=Alert)
async def simulate_alert(req: AlertSimulateRequest):
    return db.simulate_alert(req)
