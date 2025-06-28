# backend/app/schemas/category.py
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List

class CategoryBase(BaseModel):
    name: str
    type: Optional[str] = Field(default="expense", description="income or expense")
    parent_category_id: Optional[int] = None
    is_active: Optional[bool] = True

class CategoryCreate(CategoryBase):
    pass

class CategoryRead(CategoryBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    # Nested children (optional)
    children: Optional[List["CategoryRead"]] = []

    class Config:
        orm_mode = True

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    parent_category_id: Optional[int] = None
    is_active: Optional[bool] = None
