# backend/app/routers/categories.py
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from app.models import Category
from app.schemas.category import CategoryCreate, CategoryRead, CategoryUpdate
from app.core.security import get_current_user
from app.db import get_session

router = APIRouter(prefix="/categories", tags=["categories"])


@router.post("", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_in: CategoryCreate,
    current=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    cat = Category.from_orm(category_in)
    cat.user_id = current.user_id
    session.add(cat)
    await session.commit()
    await session.refresh(cat)
    return cat


@router.get("", response_model=List[CategoryRead])
async def read_categories(
    parent_id: Optional[int] = Query(None, alias="parent_id"),
    current=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    stmt = select(Category).where(Category.user_id == current.user_id)
    if parent_id is not None:
        stmt = stmt.where(Category.parent_category_id == parent_id)
    result = await session.exec(stmt)
    return result.all()


@router.patch("/{category_id}", response_model=CategoryRead)
async def update_category(
    category_id: int,
    updates: CategoryUpdate,
    current=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    cat = await session.get(Category, category_id)
    if not cat or cat.user_id != current.user_id:
        raise HTTPException(status_code=404, detail="Category not found")
    for k, v in updates.dict(exclude_unset=True).items():
        setattr(cat, k, v)
    await session.commit()
    await session.refresh(cat)
    return cat


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    current=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    cat = await session.get(Category, category_id)
    if not cat or cat.user_id != current.user_id:
        raise HTTPException(status_code=404, detail="Category not found")
    await session.delete(cat)
    await session.commit()
    return
