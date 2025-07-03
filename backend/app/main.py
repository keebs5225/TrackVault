# backend/app/main.py

from typing import Any, Dict

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import SQLModel, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db import engine, get_session
from app.routers import auth, users, accounts, categories, transactions

app = FastAPI(title="TrackVault API")

# CORS — allow your React client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create all tables on startup
@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

# === Authentication ===
# /auth/signup, /auth/token
app.include_router( auth, prefix="/auth", tags=["authentication"],)

# === User profile management ===
# GET /users/me, PATCH /users/me, DELETE /users/me
app.include_router( users, prefix="/users", tags=["users"])

# === Other domain routers ===
app.include_router(accounts, prefix="/accounts", tags=["accounts"])
app.include_router(categories, prefix="/categories", tags=["categories"])
app.include_router(transactions, prefix="/transactions", tags=["transactions"])

# A simple healthcheck
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


@app.get("/health")
async def health_check(
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    # simple DB round-trip
    value = await session.scalar(select(1))
    return {"status": "API is running!", "db": value}
