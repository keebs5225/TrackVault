# backend/app/schemas/transactions.py
from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, ConfigDict


# ── Base fields & config ──────────────────────────────────
class TransactionBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str = Field(..., description="A short title for the transaction")
    description: Optional[str] = Field(None, description="Detailed description")
    amount: float = Field(..., gt=0, description="Positive number for amount")
    direction: Literal["deposit", "withdrawal"] = Field(
        ..., alias="type", description="Whether this is a deposit or a withdrawal"
    )
    date: Optional[datetime] = Field(None, description="When the transaction occurred")
    account_id: int = Field(..., description="ID of the associated account")


# ── Creating transactions ─────────────────────
class TransactionCreate(TransactionBase):
    pass


# ── Updating transactions ─────────────────────
class TransactionUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = Field(None, gt=0)
    direction: Optional[Literal["deposit", "withdrawal"]] = Field(None, alias="type")
    date: Optional[datetime] = None
    account_id: Optional[int] = None


# ── Reading a transaction ──────────────────────
class TransactionRead(TransactionBase):
    transaction_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ── Pagination response model ─────────────────────────────
class TransactionReadPage(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[TransactionRead]
