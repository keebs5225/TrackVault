# backend/app/schemas/goal.py
from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field, ConfigDict


# ── Priority type ─────────────────────────────────
Priority = Literal['low', 'med', 'high']


# ── Goal fields ────────────────────────────────────
class GoalBase(BaseModel):
    title:         str
    description:   Optional[str] = None
    target_amount: float
    target_date:   datetime
    priority:      Priority = 'med'


# ── Creating a goal ───────────────────────────
class GoalCreate(GoalBase):
    pass


# ── Reading a goal ─────────────────────────────
class GoalRead(GoalBase):
    goal_id:        int
    user_id:        int
    created_at:     datetime
    updated_at:     datetime
    current_amount: float = Field(0.0, description="Sum of all deposits")

    model_config = ConfigDict(from_attributes=True)


# ── Updating a goal ───────────────────────────
class GoalUpdate(BaseModel):
    title:         Optional[str] = None
    description:   Optional[str] = None
    target_amount: Optional[float] = None
    target_date:   Optional[datetime] = None
    priority:      Optional[Priority] = None


# ── Deposit fields ─────────────────────────────────
class GoalDepositBase(BaseModel):
    amount: float
    date:   Optional[datetime] = None
    note:   Optional[str]     = None


# ── Adding deposit ──────────────────────────
class GoalDepositCreate(GoalDepositBase):
    pass


# ── Reading deposit ──────────────────────────
class GoalDepositRead(GoalDepositBase):
    deposit_id: int
    goal_id:    int

    model_config = ConfigDict(from_attributes=True)
