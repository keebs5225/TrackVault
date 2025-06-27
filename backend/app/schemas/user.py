# backend/app/schemas/account.py
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional

class AccountBase(BaseModel):
    name: str
    type: Optional[str] = Field(default="checking", description="e.g. checking, savings")
    balance: Optional[float] = 0.0
    currency: Optional[str] = "USD"
    is_active: Optional[bool] = True

class AccountCreate(AccountBase):
    pass

class AccountRead(AccountBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class AccountUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    balance: Optional[float] = None
    currency: Optional[str] = None
    is_active: Optional[bool] = None
