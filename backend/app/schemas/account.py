# backend/app/schemas/account.py
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional


# ── Base account schema ───────────────────────────────────
class AccountBase(BaseModel):
    name: str
    account_type: Optional[str] = Field(
        "checking", description="one of: checking, savings, credit, cash"
    )
    balance: Optional[float] = Field(0.0, description="starting balance")


# ── Input (creating) ────────────────────────────
class AccountCreate(AccountBase):
    pass


# ── Output (reading)  ────────────────────────────
class AccountRead(AccountBase):
    account_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


# ── Input (updating)  ────────────────────────────
class AccountUpdate(BaseModel):
    name: Optional[str] = None
    account_type: Optional[str] = None
    balance: Optional[float] = None
