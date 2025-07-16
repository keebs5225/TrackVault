#backend/app/schemas/recurring.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from enum import Enum

class Frequency(str, Enum):
    daily   = "daily"
    weekly  = "weekly"
    monthly = "monthly"
    yearly  = "yearly"

class RecurringBase(BaseModel):
    account_id: int
    amount: float
    frequency: Frequency
    start_date: datetime
    end_date: Optional[datetime] = None
    next_run_date: datetime

class RecurringCreate(RecurringBase):
    pass

class RecurringRead(RecurringBase):
    recurring_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class RecurringUpdate(BaseModel):
    amount: Optional[float] = None
    frequency: Optional[Frequency] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    next_run_date: Optional[datetime] = None
