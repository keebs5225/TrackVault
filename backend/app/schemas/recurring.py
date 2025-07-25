# backend/app/schemas/recurring.py
from enum import Enum
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models import TransactionDirection


# ── Frequency options ────────────────────────────────────
class Frequency(str, Enum):
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"
    yearly = "yearly"


# ── Fields for recurring ───────────────────────────
class RecurringBase(BaseModel):
    account_id: int
    amount: float
    direction: TransactionDirection
    frequency: Frequency
    start_date: datetime
    end_date: Optional[datetime] = None
    next_run_date: datetime
    title: Optional[str] = None
    description: Optional[str] = None


# ── New recurring ─────────────────────────────
class RecurringCreate(RecurringBase):
    pass


# ── Updating recurring ────────────────────────
class RecurringUpdate(BaseModel):
    account_id: Optional[int] = None
    amount: Optional[float] = None
    direction: Optional[TransactionDirection] = None
    frequency: Optional[Frequency] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    next_run_date: Optional[datetime] = None
    title: Optional[str] = None
    description: Optional[str] = None


# ── Reading recurring ──────────────────────────
class RecurringRead(RecurringBase):
    recurring_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
