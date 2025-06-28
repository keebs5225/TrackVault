# backend/app/routers/categories.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.db import get_session
from app.models import Category
from app.schemas.category import CategoryCreate, CategoryRead, CategoryUpdate
from app.routers.users import get_current_user
from datetime import datetime

router = APIRouter(prefix="/categories", tags=["categories"])


@router.post("", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
async def create_category(
    cat_in: CategoryCreate,
    current=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    cat = Category(**cat_in.dict(), user_id=current.user_id)
    session.add(cat)
    await session.commit()
    await session.refresh(cat)
    return cat


@router.get("", response_model=List[CategoryRead])
async def list_categories(
    current=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
    skip: int = 0,
    limit: int = Query(100, le=1000),
    parent: Optional[int] = Query(None),
):
    q = select(Category).where(Category.user_id == current.user_id)
    if parent is not None:
        q = q.where(Category.parent_category_id == parent)
    q = q.offset(skip).limit(limit)
    results = await session.exec(q)
    return results.all()


@router.patch("/{cat_id}", response_model=CategoryRead)
async def update_category(
    cat_id: int,
    updates: CategoryUpdate,
    current=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.exec(select(Category).where(Category.id == cat_id, Category.user_id == current.user_id))
    cat = result.first()
    if not cat:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found")
    for k, v in updates.dict(exclude_unset=True).items():
        setattr(cat, k, v)
    cat.updated_at = datetime.utcnow()
    session.add(cat)
    await session.commit()
    await session.refresh(cat)
    return cat


@router.delete("/{cat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    cat_id: int,
    current=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.exec(select(Category).where(Category.id == cat_id, Category.user_id == current.user_id))
    cat = result.first()
    if not cat:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found")
    cat.is_active = False
    cat.updated_at = datetime.utcnow()
    session.add(cat)
    await session.commit()
