# backend/app/schemas/budget.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from enum import Enum


# ── Section types ─────────────────────────────────────────
class Section(str, Enum):
    income = "income"
    fixed = "fixed"
    variable = "variable"
    savings_and_debt = "savings_and_debt"


# ── Budget period options ─────────────────────────────────
class BudgetPeriod(str, Enum):
    weekly = "weekly"
    monthly = "monthly"
    yearly = "yearly"


# ── Shared fields for budget ───────────────────────────────
class BudgetBase(BaseModel):
    section: Section
    label: str
    amount: float


# ── Input (creating) ─────────────────────────────────
class BudgetCreate(BudgetBase):
    pass


# ── Output (reading)  ────────────────────────────
class BudgetRead(BudgetBase):
    budget_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


# ── Input (updating)  ────────────────────────────
class BudgetUpdate(BaseModel):
    amount_limit: Optional[float] = None
    period: Optional[BudgetPeriod] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
