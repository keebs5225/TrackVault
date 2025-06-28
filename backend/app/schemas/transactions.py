# backend/app/schemas/transaction.py
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional

class TransactionBase(BaseModel):
    amount: float
    date: Optional[datetime] = None
    description: str
    account_id: int
    category_id: int
    type: Optional[str] = Field(default="expense")
    notes: Optional[str] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionRead(TransactionBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class TransactionUpdate(BaseModel):
    amount: Optional[float] = None
    date: Optional[datetime] = None
    description: Optional[str] = None
    account_id: Optional[int] = None
    category_id: Optional[int] = None
    type: Optional[str] = None
    notes: Optional[str] = None
