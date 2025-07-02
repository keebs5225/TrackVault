# backend/app/routers/transactions.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.db import get_session
from app.models import Transaction
from app.schemas.transactions import TransactionCreate, TransactionRead, TransactionUpdate
from app.routers.users import get_current_user
from datetime import datetime

router = APIRouter(tags=["transactions"])


@router.post("", response_model=TransactionRead, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    tx_in: TransactionCreate,
    current=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    tx = Transaction(**tx_in.dict(), user_id=current.user_id)
    session.add(tx)
    await session.commit()
    await session.refresh(tx)
    return tx


@router.get("", response_model=List[TransactionRead])
async def list_transactions(
    current=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
    skip: int = 0,
    limit: int = Query(100, le=1000),
    start: Optional[datetime] = Query(None),
    end:   Optional[datetime] = Query(None),
    account: Optional[int] = Query(None),
    category: Optional[int] = Query(None),
):
    q = select(Transaction).where(Transaction.user_id == current.user_id)
    if start:
        q = q.where(Transaction.date >= start)
    if end:
        q = q.where(Transaction.date <= end)
    if account:
        q = q.where(Transaction.account_id == account)
    if category:
        q = q.where(Transaction.category_id == category)
    q = q.offset(skip).limit(limit)
    results = await session.exec(q)
    return results.all()


@router.patch("/{tx_id}", response_model=TransactionRead)
async def update_transaction(
    tx_id: int,
    updates: TransactionUpdate,
    current=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.exec(select(Transaction).where(Transaction.id == tx_id, Transaction.user_id == current.user_id))
    tx = result.first()
    if not tx:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Transaction not found")
    for k, v in updates.dict(exclude_unset=True).items():
        setattr(tx, k, v)
    tx.updated_at = datetime.utcnow()
    session.add(tx)
    await session.commit()
    await session.refresh(tx)
    return tx


@router.delete("/{tx_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    tx_id: int,
    current=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.exec(select(Transaction).where(Transaction.id == tx_id, Transaction.user_id == current.user_id))
    tx = result.first()
    if not tx:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Transaction not found")
    # soft-delete could be a flag; here we just hard-delete
    await session.delete(tx)
    await session.commit()
