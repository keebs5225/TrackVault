# backend/app/db.py

# ── Load env vars ─────────────────────────────────────────
from dotenv import load_dotenv

load_dotenv()  # ensure .env is loaded before os.getenv() call

import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL")
print("Using DB URL:", DATABASE_URL)

# ── Engine & session factory ──────────────────────────────
engine = create_async_engine(DATABASE_URL, echo=True, future=True)

async_session = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# ── DB session dependency ─────────────────────────────────
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session
