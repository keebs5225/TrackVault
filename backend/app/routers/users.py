from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from fastapi.security import OAuth2PasswordBearer
from app.models import User
from app.schemas.user import UserRead, UserUpdate
from app.core.security import hash_password
from app.db import get_session

router = APIRouter(prefix="/users", tags=["users"])
oauth2 = OAuth2PasswordBearer(tokenUrl="auth/token")

async def get_current_user(
    token: str = Depends(oauth2),
    session: AsyncSession = Depends(get_session)
) -> User:
    from jose import jwt
    from app.core.security import SECRET_KEY, ALGORITHM
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except:
        raise HTTPException(401, "Invalid token")
    result = await session.execute(select(User).where(User.user_id==user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(401, "User not found")
    return user

@router.get("/me", response_model=UserRead)
async def read_me(current: User = Depends(get_current_user)):
    return current

@router.patch("/me", response_model=UserRead)
async def update_me(
    updates: UserUpdate,
    current: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    if updates.password:
        updates.password_hash = hash_password(updates.password)
    for key, value in updates.dict(exclude_unset=True).items():
        setattr(current, key, value)
    current.updated_at = __import__('datetime').datetime.utcnow()
    session.add(current)
    await session.commit()
    await session.refresh(current)
    return current
