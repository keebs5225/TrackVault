# backend/app/main.py
from typing import Any, Dict
from fastapi import FastAPI, Depends
from sqlmodel import select
from app.db import get_session
from sqlmodel.ext.asyncio.session import AsyncSession
from fastapi.security import OAuth2PasswordBearer
from app.routers import auth, users

app = FastAPI(title="TrackVault API")

# Include routers
app.include_router(auth.router)
app.include_router(users.router)

oauth2 = OAuth2PasswordBearer(tokenUrl="auth/token")


@app.get("/health")
async def health_check(session: AsyncSession = Depends(get_session)) -> Dict[str, Any]:
    result = await session.execute(select(1))
    return {"status": "API is running!", "db": result.scalar_one()}
