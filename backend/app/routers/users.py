# backend/app/routers/users.py
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime
from jose import jwt

from app.models import User
from app.schemas.user import UserRead, UserUpdate
from app.core.security import hash_password, SECRET_KEY, ALGORITHM
from app.db import get_session

router = APIRouter(prefix="/users", tags=["users"])
oauth2 = OAuth2PasswordBearer(tokenUrl="auth/token")


async def get_current_user(
    token: str = Depends(oauth2),
    session: AsyncSession = Depends(get_session),
) -> User:
    """
    Decode JWT, load user from DB, or 401 if invalid.
    """
    try:
        payload: Dict[str, Any] = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub = payload.get("sub")
        if not isinstance(sub, str):
            raise ValueError
        user_id = int(sub)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    result = await session.execute(select(User).where(User.user_id == user_id))
    # scalar_one_or_none returns Any; cast it to User so MyPy knows its type
    from typing import cast

    raw = result.scalar_one_or_none()
    user = cast(User, raw)
    # If user is None, user was not found (401)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.get("/me", response_model=UserRead)
async def read_me(current: User = Depends(get_current_user)) -> UserRead:
    return UserRead.from_orm(current)


@router.patch("/me", response_model=UserRead)
async def update_me(
    updates: UserUpdate,
    current: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> UserRead:
    # Only update password on the current user
    if updates.password:
        current.password_hash = hash_password(updates.password)

    # Apply other fields
    for key, value in updates.dict(exclude_unset=True).items():
        setattr(current, key, value)

    current.updated_at = datetime.utcnow()
    session.add(current)
    await session.commit()
    await session.refresh(current)
    return UserRead.from_orm(current)
