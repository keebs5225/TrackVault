# backend/app/schemas/category.py
from __future__ import annotations
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class CategoryBase(BaseModel):
    name: str
    type: str = Field("expense", description="income or expense")
    parent_category_id: Optional[int] = None
    is_active: bool = True

class CategoryRead(CategoryBase):
    category_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    children: List[CategoryRead] = Field(default_factory=list)

    model_config = {"from_attributes": True}

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    parent_category_id: Optional[int] = None
    is_active: Optional[bool] = None
