# backend/app/schemas/category.py
from __future__ import annotations
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class CategoryBase(BaseModel):
    name: str
    type: str = Field(
        "expense",
        description="one of: income, expense"
    )
    parent_category_id: Optional[int] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryRead(CategoryBase):
    category_id: int
    user_id:     int
    created_at:  datetime
    updated_at:  datetime
    children:    List[CategoryRead] = Field(default_factory=list)

    class Config:
        orm_mode = True

class CategoryUpdate(BaseModel):
    name:                Optional[str] = None
    type:                Optional[str] = None
    parent_category_id:  Optional[int] = None