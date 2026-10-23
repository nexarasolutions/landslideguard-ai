from fastapi import APIRouter
try:
    from backend.models import SystemSettings
    from backend.database import db
except ImportError:
    from models import SystemSettings
    from database import db

router = APIRouter(prefix="/api/settings", tags=["Settings"])

@router.get("", response_model=SystemSettings)
async def get_settings():
    return db.settings

@router.put("", response_model=SystemSettings)
async def update_settings(new_settings: SystemSettings):
    db.settings = new_settings
    return db.settings
