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
from app.core.security import hash_password, SECRET_KEY, ALGORITHM

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
    Update fields on the current user. Only fields set in the payload will be changed.
    """
    # If password is being updated, hash it first
    if updates.password:
        current.password_hash = hash_password(updates.password)

    # Apply any other provided updates
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(current, field, value)

    current.updated_at = datetime.now(timezone.utc)
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
