# backend/app/routers/users.py
from typing import Any, Dict
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db import get_session
from app.models import User
from app.schemas.user import UserRead, UserUpdate
from app.core.security import hash_password, verify_password, SECRET_KEY, ALGORITHM

router = APIRouter(tags=["users"])
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
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    result = await session.exec(select(User).where(User.user_id == user_id))
    user = result.first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

@router.get("/me", response_model=UserRead)
async def read_me(current: User = Depends(get_current_user)) -> UserRead:
    """
    Get the currently-logged in user's profile.
    """
    return UserRead.model_validate(current)

@router.patch("/me", response_model=UserRead)
async def update_me(
    updates: UserUpdate,
    current: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> UserRead:
    """
    Update name, email, and optionally password.
    """
    data = updates.model_dump(exclude_unset=True)

    # 1) If changing password, verify and re-hash
    if "new_password" in data:
        if not data.get("current_password") or not verify_password(data["current_password"], current.password_hash):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
        current.password_hash = hash_password(data["new_password"])

    # 2) Apply name/email changes
    data.pop("current_password", None)
    data.pop("new_password", None)
    for field, value in data.items():
        setattr(current, field, value)

    # 3) Persist
    current.updated_at = datetime.utcnow()
    session.add(current)
    await session.commit()
    await session.refresh(current)
    return UserRead.model_validate(current)

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_me(
    current: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Response:
    """
    Delete the current user's account.
    """
    await session.delete(current)
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
