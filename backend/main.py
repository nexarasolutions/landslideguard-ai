import sys
import os

# Ensure both current directory and parent are in python path
cur_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(cur_dir)
if cur_dir not in sys.path:
    sys.path.insert(0, cur_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from backend.config import ALLOWED_ORIGINS
    from backend.routers import auth, stations, alerts, analytics, settings
except ImportError:
    from config import ALLOWED_ORIGINS
    from routers import auth, stations, alerts, analytics, settings

app = FastAPI(
    title="LandslideGuard AI API",
    description="Early-warning telemetry, geotechnical AI risk assessment, sensor telemetry & incident response API.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration for seamless communication with Vercel frontend and local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(stations.router)
app.include_router(alerts.router)
app.include_router(analytics.router)
app.include_router(settings.router)

@app.get("/health", tags=["System"])
async def health():
    return {
        "status": "healthy",
        "service": "LandslideGuard AI Backend",
        "version": "1.0.0"
    }

@app.get("/", tags=["System"])
async def root():
    return {
        "message": "Welcome to LandslideGuard AI API",
        "docs": "/docs",
        "health": "/health",
        "endpoints": [
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/me",
            "/api/stations",
            "/api/alerts",
            "/api/prediction/simulate",
            "/api/analytics/summary",
            "/api/settings"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
