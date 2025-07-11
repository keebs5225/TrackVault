# backend/app/schemas/budget.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from enum import Enum

class BudgetPeriod(str, Enum):
    weekly = "weekly"
    monthly = "monthly"
    yearly = "yearly"

class BudgetBase(BaseModel):
    category_id: int
    amount_limit: float
    period: BudgetPeriod
    start_date: datetime
    end_date: Optional[datetime] = None

class BudgetCreate(BudgetBase):
    pass

class BudgetRead(BudgetBase):
    budget_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class BudgetUpdate(BaseModel):
    amount_limit: Optional[float] = None
    period: Optional[BudgetPeriod] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
