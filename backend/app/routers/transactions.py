# backend/app/routers/transactions.py
from typing import Optional
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db import get_session
from app.models import Transaction, User, Account
from app.schemas.transactions import (
    TransactionCreate,
    TransactionRead,
    TransactionUpdate,
    TransactionReadPage,
)
from app.core.security import get_current_user

router = APIRouter(tags=["transactions"])


@router.get(
    "/",
    response_model=TransactionReadPage,
    response_model_by_alias=False,
)
async def list_transactions(
    *,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1),
    start: Optional[date] = Query(None),
    end: Optional[date] = Query(None),
    account: Optional[int] = Query(None),
    current: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    base = Transaction.user_id == current.user_id
    q = select(Transaction).where(base)

    if start:
        q = q.where(Transaction.date >= datetime.combine(start, datetime.min.time()))
    if end:
        q = q.where(Transaction.date <= datetime.combine(end,   datetime.max.time()))
    if account:
        q = q.where(Transaction.account_id == account)

    total = await session.scalar(
        select(func.count())
        .select_from(Transaction)
        .where(q.whereclause)
    )

    q = (
        q.order_by(Transaction.date.desc())
         .offset((page - 1) * page_size)
         .limit(page_size)
    )
    result = await session.exec(q)
    items = result.scalars().all()

    return TransactionReadPage(
        total=total,
        page=page,
        page_size=page_size,
        items=[TransactionRead.model_validate(t) for t in items],
    )


@router.get(
    "/{tx_id}",
    response_model=TransactionRead,
    response_model_by_alias=False,
)
async def get_transaction(
    tx_id: int,
    current: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    tx = await session.get(Transaction, tx_id)
    if not tx or tx.user_id != current.user_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Transaction not found")
    return TransactionRead.model_validate(tx)


@router.post(
    "/",
    response_model=TransactionRead,
    status_code=status.HTTP_201_CREATED,
    response_model_by_alias=False,
)
async def create_transaction(
    payload: TransactionCreate,
    current: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    tx = Transaction(**payload.dict(), user_id=current.user_id)
    session.add(tx)

    acct = await session.get(Account, payload.account_id)
    if not acct or acct.user_id != current.user_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid account")

    if payload.direction == "deposit":
        acct.balance += payload.amount
    else:
        acct.balance -= payload.amount

    session.add(acct)
    await session.commit()
    await session.refresh(tx)
    return TransactionRead.model_validate(tx)


@router.patch(
    "/{tx_id}",
    response_model=TransactionRead,
    response_model_by_alias=False,
)
async def update_transaction(
    tx_id: int,
    payload: TransactionUpdate,
    current: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    tx = await session.get(Transaction, tx_id)
    if not tx or tx.user_id != current.user_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Transaction not found")

    # old values
    old_amount = tx.amount
    old_direction = tx.direction
    old_account_id = tx.account_id

    # apply updates
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(tx, field, value)

    # reverse old effect
    acct_old = await session.get(Account, old_account_id)
    if old_direction == "deposit":
        acct_old.balance -= old_amount
    else:
        acct_old.balance += old_amount
    session.add(acct_old)

    # apply new effect
    acct_new = await session.get(Account, tx.account_id)
    if tx.direction == "deposit":
        acct_new.balance += tx.amount
    else:
        acct_new.balance -= tx.amount
    session.add(acct_new)

    tx.updated_at = datetime.utcnow()
    session.add(tx)

    await session.commit()
    await session.refresh(tx)
    return TransactionRead.model_validate(tx)


@router.delete("/{tx_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    tx_id: int,
    current: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    tx = await session.get(Transaction, tx_id)
    if not tx or tx.user_id != current.user_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Transaction not found")

    acct = await session.get(Account, tx.account_id)
    if tx.direction == "deposit":
        acct.balance -= tx.amount
    else:
        acct.balance += tx.amount
    session.add(acct)

    await session.delete(tx)
    await session.commit()
    return
