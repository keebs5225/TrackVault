# backend/app/schemas/transaction.py
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List

class TransactionBase(BaseModel):
    amount: float
    date: Optional[datetime] = None
    description: str
    account_id: int
    type: Optional[str] = Field(default="expense")
    notes: Optional[str] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionRead(TransactionBase):
    transaction_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

class TransactionUpdate(BaseModel):
    amount: Optional[float] = None
    date: Optional[datetime] = None
    description: Optional[str] = None
    account_id: Optional[int] = None
    type: Optional[str] = None
    notes: Optional[str] = None

class TransactionReadPage(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[TransactionRead]
