# backend/app/routers/transactions.py
from typing import Optional
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db import get_session
from app.models import Transaction, User
from app.schemas.transactions import (TransactionCreate, TransactionRead, TransactionUpdate, TransactionReadPage)
from app.core.security import get_current_user

router = APIRouter(tags=["transactions"])

@router.get("/", response_model=TransactionReadPage)
async def list_transactions(
    *,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    start: Optional[date] = Query(None),
    end:   Optional[date] = Query(None),
    account: Optional[int] = Query(None),
    current: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    # base filter: only this user
    base = (Transaction.user_id == current.user_id)
    q = select(Transaction).where(base)
    # apply optional filters
    if start:
        q = q.where(Transaction.date >= datetime.combine(start, datetime.min.time()))
    if end:
        q = q.where(Transaction.date <= datetime.combine(end,   datetime.max.time()))
    if account:
        q = q.where(Transaction.account_id == account)

    # count total
    count_q = select(func.count()).select_from(Transaction).where(q.whereclause)  # reuse same WHERE
    total = await session.scalar(count_q)

    # page slice + ordering
    q = q.order_by(Transaction.date.desc()) \
         .offset((page - 1) * page_size) \
         .limit(page_size)

    result = await session.exec(q)
    items = result.all()

    return TransactionReadPage(
        total=total,
        page=page,
        page_size=page_size,
        items=[TransactionRead.from_orm(t) for t in items],
    )

@router.get("/{tx_id}", response_model=TransactionRead)
async def get_transaction(
    tx_id: int,
    current: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    tx = await session.get(Transaction, tx_id)
    if not tx or tx.user_id != current.user_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Transaction not found")
    return TransactionRead.from_orm(tx)

@router.post("/", response_model=TransactionRead, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    data: TransactionCreate,
    current: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    tx = Transaction(**data.dict(), user_id=current.user_id)
    session.add(tx)
    await session.commit()
    await session.refresh(tx)
    return TransactionRead.from_orm(tx)

@router.patch("/{tx_id}", response_model=TransactionRead)
async def update_transaction(
    tx_id: int,
    data: TransactionUpdate,
    current: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    tx = await session.get(Transaction, tx_id)
    if not tx or tx.user_id != current.user_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Transaction not found")
    for k, v in data.dict(exclude_unset=True).items():
        setattr(tx, k, v)
    tx.updated_at = datetime.utcnow()
    session.add(tx)
    await session.commit()
    await session.refresh(tx)
    return TransactionRead.from_orm(tx)

@router.delete("/{tx_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    tx_id: int,
    current: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    tx = await session.get(Transaction, tx_id)
    if not tx or tx.user_id != current.user_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Transaction not found")
    await session.delete(tx)
    await session.commit()
