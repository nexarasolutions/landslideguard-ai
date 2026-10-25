import os
import re
from pathlib import Path

# Load .env file from workspace root or supabase folder
try:
    from dotenv import load_dotenv
    root_env = Path(__file__).resolve().parent.parent / '.env'
    supabase_env = Path(__file__).resolve().parent.parent / 'supabase' / '.env'
    if root_env.exists():
        load_dotenv(dotenv_path=root_env)
    if supabase_env.exists():
        load_dotenv(dotenv_path=supabase_env)
    load_dotenv()
except ImportError:
    for env_file in [Path(__file__).resolve().parent.parent / '.env', Path(__file__).resolve().parent.parent / 'supabase' / '.env']:
        if env_file.exists():
            try:
                with open(env_file, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#') and '=' in line:
                            k, v = line.split('=', 1)
                            k, v = k.strip(), v.strip().strip('"').strip("'")
                            if k not in os.environ:
                                os.environ[k] = v
            except Exception:
                pass


SECRET_KEY = os.environ.get("SECRET_KEY", "landslideguard-ai-super-secret-key-production-2026")
# If SECRET_KEY is set to a Supabase JWT (starts with eyJ), preserve it as service role key
if SECRET_KEY.startswith("eyJ"):
    if not os.environ.get("SUPABASE_SERVICE_ROLE_KEY"):
        os.environ["SUPABASE_SERVICE_ROLE_KEY"] = SECRET_KEY
    SECRET_KEY = "landslideguard-ai-super-secret-key-production-2026"

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Supabase Configuration
RAW_SUPABASE_URL = os.environ.get("SUPABASE_URL", "").strip()
DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()

# Auto-correct postgres:// or postgresql:// URLs if supplied as SUPABASE_URL
if RAW_SUPABASE_URL.startswith("postgresql://") or RAW_SUPABASE_URL.startswith("postgres://"):
    if not DATABASE_URL:
        DATABASE_URL = RAW_SUPABASE_URL
    match = re.search(r"@db\.([a-zA-Z0-9]+)\.supabase\.co", RAW_SUPABASE_URL)
    if match:
        SUPABASE_URL = f"https://{match.group(1)}.supabase.co"
    else:
        SUPABASE_URL = RAW_SUPABASE_URL
else:
    SUPABASE_URL = RAW_SUPABASE_URL

SUPABASE_KEY = (
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    or os.environ.get("SUPABASE_KEY", "").strip()
    or os.environ.get("SUPABASE_ANON_KEY", "").strip()
)

# CORS origins - Allow all origins by default for seamless frontend deployment on Vercel
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://localhost:4173",
    "*"
]

