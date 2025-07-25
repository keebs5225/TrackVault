# backend/app/routers/goals.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select, func, delete
from datetime import datetime
from app.db import get_session
from app.models import Goal, GoalDeposit
from app.schemas.goal import (
    GoalCreate,
    GoalRead,
    GoalUpdate,
    GoalDepositCreate,
    GoalDepositRead,
)
from app.core.security import get_current_user


# ── Router setup ───────────────────────────────────────────
router = APIRouter(tags=["goals"])


# ── Create goal ───────────────────────────────────────
@router.post("", response_model=GoalRead, status_code=status.HTTP_201_CREATED)
async def create_goal(
    goal_in: GoalCreate,
    current=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    g = Goal(**goal_in.dict(), user_id=current.user_id)
    session.add(g)
    await session.commit()
    await session.refresh(g)
    return g


# ── List goals with totals ──────────────────────────────
@router.get("", response_model=List[GoalRead])
async def list_goals(
    current=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    # ── Sum deposits per goal ────────────────────────────
    stmt = (
        select(
            Goal, func.coalesce(func.sum(GoalDeposit.amount), 0).label("current_amount")
        )
        .where(Goal.user_id == current.user_id)
        .outerjoin(GoalDeposit, Goal.goal_id == GoalDeposit.goal_id)
        .group_by(Goal.goal_id)
    )
    results = await session.exec(stmt)

    out: List[GoalRead] = []
    for goal, current_amount in results.all():
        g = GoalRead.from_orm(goal)
        g.current_amount = float(current_amount)
        out.append(g)
    return out


# ── Update goal ───────────────────────────────────────
@router.patch("/{goal_id}", response_model=GoalRead)
async def update_goal(
    goal_id: int,
    updates: GoalUpdate,
    current=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    g = await session.get(Goal, goal_id)
    if not g or g.user_id != current.user_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Goal not found")
    for k, v in updates.dict(exclude_unset=True).items():
        setattr(g, k, v)
    g.updated_at = datetime.utcnow()
    session.add(g)
    await session.commit()
    await session.refresh(g)
    return g


# ── Delete goal ───────────────────────────────────────
@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_goal(
    goal_id: int,
    current=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    g = await session.get(Goal, goal_id)
    if not g or g.user_id != current.user_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Goal not found")
    # ── Remove related deposits first ────────────────────
    await session.exec(delete(GoalDeposit).where(GoalDeposit.goal_id == goal_id))
    await session.delete(g)
    await session.commit()


# ── Add deposit ───────────────────────────────────────
@router.post(
    "/{goal_id}/deposits",
    response_model=GoalDepositRead,
    status_code=status.HTTP_201_CREATED,
)
async def add_deposit(
    goal_id: int,
    deposit_in: GoalDepositCreate,
    current=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    g = await session.get(Goal, goal_id)
    if not g or g.user_id != current.user_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Goal not found")
    d = GoalDeposit(**deposit_in.dict(), goal_id=goal_id)
    session.add(d)
    await session.commit()
    await session.refresh(d)
    return d


# ── List deposits for goal ─────────────────────────────
@router.get("/{goal_id}/deposits", response_model=List[GoalDepositRead])
async def list_deposits(
    goal_id: int,
    current=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    g = await session.get(Goal, goal_id)
    if not g or g.user_id != current.user_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Goal not found")
    result = await session.exec(
        select(GoalDeposit).where(GoalDeposit.goal_id == goal_id)
    )
    return result.all()
