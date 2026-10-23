import uuid
from fastapi import APIRouter, HTTPException, status, Depends
try:
    from backend.models import UserCreate, UserLogin, UserOut, Token
    from backend.auth import hash_password, verify_password, create_access_token, get_current_user, USERS_DB
except ImportError:
    from models import UserCreate, UserLogin, UserOut, Token
    from auth import hash_password, verify_password, create_access_token, get_current_user, USERS_DB

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
async def register(user_in: UserCreate):
    email = user_in.email.strip().lower()
    if email in USERS_DB:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )
    user_id = f"usr-{uuid.uuid4().hex[:8]}"
    hashed_pwd = hash_password(user_in.password)
    user_dict = {
        "id": user_id,
        "email": email,
        "name": user_in.name,
        "role": user_in.role,
        "hashed_password": hashed_pwd
    }
    USERS_DB[email] = user_dict
    token = create_access_token({"sub": email, "role": user_in.role})
    return Token(
        access_token=token,
        user=UserOut(id=user_id, email=email, name=user_in.name, role=user_in.role)
    )

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    email = credentials.email.strip().lower()
    user_dict = USERS_DB.get(email)
    if not user_dict or not verify_password(credentials.password, user_dict["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    token = create_access_token({"sub": email, "role": user_dict["role"]})
    return Token(
        access_token=token,
        user=UserOut(
            id=user_dict["id"],
            email=user_dict["email"],
            name=user_dict["name"],
            role=user_dict["role"]
        )
    )

@router.get("/me", response_model=UserOut)
async def get_me(current_user: UserOut = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    return current_user
