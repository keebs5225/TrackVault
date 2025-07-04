# backend/app/routers/accounts.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from app.models import Account
from app.schemas.account import AccountCreate, AccountRead, AccountUpdate
from app.core.security import get_current_user
from app.db import get_session

router = APIRouter(tags=["accounts"])


@router.post("", response_model=AccountRead, status_code=status.HTTP_201_CREATED)
async def create_account(
    account_in: AccountCreate,
    current=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    acct = Account(**account_in.dict(), user_id=current.user_id)
    session.add(acct)
    await session.commit()
    await session.refresh(acct)
    return acct


@router.get("", response_model=List[AccountRead])
async def read_accounts(
    current=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.exec(
        select(Account).where(Account.user_id == current.user_id)
    )
    return result.all()


@router.patch("/{account_id}", response_model=AccountRead)
async def update_account(
    account_id: int,
    updates: AccountUpdate,
    current=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    acct = await session.get(Account, account_id)
    if not acct or acct.user_id != current.user_id:
        raise HTTPException(status_code=404, detail="Account not found")
    for k, v in updates.dict(exclude_unset=True).items():
        setattr(acct, k, v)
    await session.commit()
    await session.refresh(acct)
    return acct


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    account_id: int,
    current=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    acct = await session.get(Account, account_id)
    if not acct or acct.user_id != current.user_id:
        raise HTTPException(status_code=404, detail="Account not found")
    await session.delete(acct)
    await session.commit()
    return
