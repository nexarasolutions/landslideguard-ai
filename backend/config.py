import os

SECRET_KEY = os.environ.get("SECRET_KEY", "landslideguard-ai-super-secret-key-production-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# CORS origins - Allow all origins by default for seamless frontend deployment on Vercel
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://localhost:4173",
    "*"
]
