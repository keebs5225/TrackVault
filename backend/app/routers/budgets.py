#backend/app/routers/budgets.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.models import Budget
from app.schemas.budget import BudgetCreate, BudgetRead, BudgetUpdate
from app.core.security import get_current_user
from app.db import get_session


# ── Router setup ───────────────────────────────────────────
router = APIRouter(tags=["budgets"])

# ── Create a budget ───────────────────────────────────────
@router.post("", response_model=BudgetRead, status_code=status.HTTP_201_CREATED)
async def create_budget(
    budget_in: BudgetCreate,
    current=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    b = Budget(**budget_in.dict(), user_id=current.user_id)
    session.add(b)
    await session.commit()
    await session.refresh(b)
    return b


# ── Get all budgets ───────────────────────────────────────
@router.get("", response_model=List[BudgetRead])
async def read_budgets(
    current=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.exec(
        select(Budget).where(Budget.user_id == current.user_id)
    )
    return result.all()


# ── Update budget ───────────────────────────────────────
@router.patch("/{budget_id}", response_model=BudgetRead)
async def update_budget(
    budget_id: int,
    updates: BudgetUpdate,
    current=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    b = await session.get(Budget, budget_id)
    if not b or b.user_id != current.user_id:
        raise HTTPException(status_code=404, detail="Budget not found")
    for k, v in updates.dict(exclude_unset=True).items():
        setattr(b, k, v)
    await session.commit()
    await session.refresh(b)
    return b


# ── Delete budget ───────────────────────────────────────
@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget(
    budget_id: int,
    current=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    b = await session.get(Budget, budget_id)
    if not b or b.user_id != current.user_id:
        raise HTTPException(status_code=404, detail="Budget not found")
    await session.delete(b)
    await session.commit()