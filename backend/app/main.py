# backend/app/main.py
from typing import Any, Dict
from fastapi import FastAPI, Depends
from sqlmodel import select
from app.db import get_session
from sqlmodel.ext.asyncio.session import AsyncSession
from fastapi.security import OAuth2PasswordBearer
from app.routers import auth, users
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel
from app.db import engine


app = FastAPI(title="TrackVault API")

# Allow React app (port:5173) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# create missing tables at startup
@app.on_event("startup")
async def create_db_and_tables():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)

oauth2 = OAuth2PasswordBearer(tokenUrl="auth/token")


@app.get("/health")
async def health_check(session: AsyncSession = Depends(get_session)) -> Dict[str, Any]:
    value = await session.scalar(select(1))
    return {"status": "API is running!", "db": value}
