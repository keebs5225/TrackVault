# backend/app/schemas/user.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


# ── Signing up ─────────────────────────────────
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(..., min_length=8)


# ── Reading user data ──────────────────────────
class UserRead(BaseModel):
    user_id: int
    name: str
    email: EmailStr
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Updating profile ────────────────────────────
class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    current_password: Optional[str] = Field(None, min_length=8)
    new_password: Optional[str] = Field(None, min_length=8)
