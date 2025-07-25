# backend/app/routers/auth.py
from fastapi import APIRouter, HTTPException, Depends, status
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from app.models import User
from app.schemas.user import UserCreate, UserRead
from app.core.security import hash_password, verify_password, create_access_token
from app.db import get_session


# ── Router setup ───────────────────────────────────────────
router = APIRouter(tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


# ── Token model ────────────────────────────────────────────
class Token(BaseModel):
    access_token: str
    token_type: str


# ── Sign up new user ───────────────────────────────────────
@router.post("/signup", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def signup(
    user_in: UserCreate,
    session: AsyncSession = Depends(get_session),
) -> UserRead:
    # ── Check email uniqueness ───────────────────────────────
    result = await session.exec(select(User).where(User.email == user_in.email))
    if result.first():
        raise HTTPException(400, "Email already registered")

    # ── Create & store user ─────────────────────────────────
    user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=hash_password(user_in.password),
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return UserRead.model_validate(user)


# ── Log in & issue token ──────────────────────────────────
@router.post("/token", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(get_session),
) -> Token:
    # ── Verify credentials ───────────────────────────────────
    result = await session.exec(select(User).where(User.email == form_data.username))
    user = result.first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")

    # ── Create access token ─────────────────────────────────
    token = create_access_token({"sub": str(user.user_id)})
    return Token(access_token=token, token_type="bearer")
