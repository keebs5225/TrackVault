# backend/app/routers/accounts.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List
from datetime import datetime
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.db import get_session
from app.models import Account
from app.schemas.account import AccountCreate, AccountRead, AccountUpdate
from app.routers.users import get_current_user

router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.post("", response_model=AccountRead, status_code=status.HTTP_201_CREATED)
async def create_account(
    acct_in: AccountCreate,
    current=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    acct = Account(**acct_in.dict(), user_id=current.user_id)
    session.add(acct)
    await session.commit()
    await session.refresh(acct)
    return acct


@router.get("", response_model=List[AccountRead])
async def list_accounts(
    current=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
    skip: int = 0,
    limit: int = Query(100, le=1000),
):
    q = select(Account).where(Account.user_id == current.user_id).offset(skip).limit(limit)
    results = await session.exec(q)
    return results.all()


@router.patch("/{acct_id}", response_model=AccountRead)
async def update_account(
    acct_id: int,
    updates: AccountUpdate,
    current=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.exec(select(Account).where(Account.id == acct_id, Account.user_id == current.user_id))
    acct = result.first()
    if not acct:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Account not found")
    for k, v in updates.dict(exclude_unset=True).items():
        setattr(acct, k, v)
    acct.updated_at = datetime.utcnow()
    session.add(acct)
    await session.commit()
    await session.refresh(acct)
    return acct


@router.delete("/{acct_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    acct_id: int,
    current=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.exec(select(Account).where(Account.id == acct_id, Account.user_id == current.user_id))
    acct = result.first()
    if not acct:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Account not found")
    acct.is_active = False
    acct.updated_at = datetime.utcnow()
    session.add(acct)
    await session.commit()
