import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

try:
    from backend.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
    from backend.models import UserOut
except ImportError:
    from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
    from models import UserOut

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def hash_password(password: str, salt: Optional[str] = None) -> str:
    """Hash password using PBKDF2-HMAC-SHA256."""
    if not salt:
        salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    )
    return f"{salt}${key.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        salt, _ = hashed_password.split('$', 1)
        expected = hash_password(plain_password, salt=salt)
        return secrets.compare_digest(expected, hashed_password)
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

# In-memory users database initialized with default demo credentials
USERS_DB = {
    "engineer@landslideguard.ai": {
        "id": "usr-eng-001",
        "email": "engineer@landslideguard.ai",
        "name": "Sarah Chen",
        "role": "Field Engineer",
        "hashed_password": hash_password("landslide2026")
    },
    "admin@landslideguard.ai": {
        "id": "usr-adm-001",
        "email": "admin@landslideguard.ai",
        "name": "Marcus Vance",
        "role": "Admin",
        "hashed_password": hash_password("admin2026")
    },
    "geologist@landslideguard.ai": {
        "id": "usr-geo-001",
        "email": "geologist@landslideguard.ai",
        "name": "Dr. Priya Nair",
        "role": "Geologist",
        "hashed_password": hash_password("geo2026")
    }
}

async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[UserOut]:
    if not token:
        return None
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    email: str = payload.get("sub")
    if not email or email not in USERS_DB:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_dict = USERS_DB[email]
    return UserOut(
        id=user_dict["id"],
        email=user_dict["email"],
        name=user_dict["name"],
        role=user_dict["role"]
    )
