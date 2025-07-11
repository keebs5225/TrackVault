#backend/app/schemas/goal.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class GoalBase(BaseModel):
    title:         str
    description:   Optional[str] = None
    target_amount: float
    target_date:   datetime

class GoalCreate(GoalBase):
    pass

class GoalRead(GoalBase):
    goal_id:       int
    user_id:       int
    created_at:    datetime
    updated_at:    datetime
    current_amount: float = Field(0.0, description="Sum of all deposits")

    class Config:
        orm_mode = True

class GoalUpdate(BaseModel):
    title:         Optional[str]
    description:   Optional[str]
    target_amount: Optional[float]
    target_date:   Optional[datetime]


class GoalDepositBase(BaseModel):
    amount: float
    date:   Optional[datetime] = None
    note:   Optional[str]     = None

class GoalDepositCreate(GoalDepositBase):
    pass

class GoalDepositRead(GoalDepositBase):
    deposit_id: int
    goal_id:    int

    class Config:
        orm_mode = True
