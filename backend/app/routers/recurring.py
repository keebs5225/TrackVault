#backend/app/routers/recurring.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from app.models import RecurringTransaction
from app.schemas.recurring import RecurringCreate, RecurringRead, RecurringUpdate
from app.core.security import get_current_user
from app.db import get_session

router = APIRouter(tags=["recurring"])

@router.post("", response_model=RecurringRead, status_code=status.HTTP_201_CREATED)
async def create_recurring(
    rec_in: RecurringCreate,
    current=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    r = RecurringTransaction(**rec_in.dict(), user_id=current.user_id)
    session.add(r)
    await session.commit()
    await session.refresh(r)
    return r

@router.get("", response_model=List[RecurringRead])
async def read_recurrings(
    current=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.exec(
        select(RecurringTransaction).where(RecurringTransaction.user_id == current.user_id)
    )
    return result.all()

@router.patch("/{rec_id}", response_model=RecurringRead)
async def update_recurring(
    rec_id: int,
    updates: RecurringUpdate,
    current=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    r = await session.get(RecurringTransaction, rec_id)
    if not r or r.user_id != current.user_id:
        raise HTTPException(status_code=404, detail="Recurring not found")
    for k, v in updates.dict(exclude_unset=True).items():
        setattr(r, k, v)
    await session.commit()
    await session.refresh(r)
    return r

@router.delete("/{rec_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recurring(
    rec_id: int,
    current=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    r = await session.get(RecurringTransaction, rec_id)
    if not r or r.user_id != current.user_id:
        raise HTTPException(status_code=404, detail="Recurring not found")
    await session.delete(r)
    await session.commit()
