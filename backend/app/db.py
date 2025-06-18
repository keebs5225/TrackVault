from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
import os
from typing import AsyncGenerator

# 1) Build the URL—for Docker Compose, the service name is "db"
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://keebs:keebs@db:5432/trackvault"
)

# 2) Create an async engine
engine = create_async_engine(DATABASE_URL, echo=True, future=True)

# 3) Dependency for endpoints: yields an AsyncSession
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency that yields an AsyncSession.
    """
    async with AsyncSession(engine) as session:
        yield session