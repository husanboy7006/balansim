from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID
from app.database import get_db
from app.models.account import Account
from app.models.user import User
from app.schemas.account import AccountCreate, AccountResponse, AccountUpdate
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/accounts", tags=["Accounts"])

@router.get("/", response_model=List[AccountResponse])
async def get_accounts(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get all accounts for current user"""
    result = await db.execute(
        select(Account).where(Account.user_id == user.id, Account.is_active == True).order_by(Account.created_at)
    )
    return [AccountResponse.model_validate(a) for a in result.scalars().all()]

@router.post("/", response_model=AccountResponse, status_code=201)
async def create_account(data: AccountCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Create a new account/wallet"""
    try:
        account = Account(
            user_id=user.id,
            name=data.name,
            type=data.type,
            currency=data.currency,
            balance=data.balance,
            icon=data.icon,
            color=data.color,
        )
        db.add(account)
        await db.commit()
        await db.refresh(account)
        return AccountResponse.model_validate(account)
    except Exception as e:
        import traceback
        print(f"ACCOUNT CREATE ERROR: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Server xatoligi: {str(e)}")

@router.put("/{account_id}", response_model=AccountResponse)
async def update_account(account_id: UUID, data: AccountUpdate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Update an account"""
    result = await db.execute(select(Account).where(Account.id == account_id, Account.user_id == user.id))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Hisob topilmadi")
    
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(account, field, value)
    await db.commit()
    await db.refresh(account)
    return AccountResponse.model_validate(account)

@router.delete("/{account_id}")
async def delete_account(account_id: UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Delete an account (soft delete)"""
    result = await db.execute(select(Account).where(Account.id == account_id, Account.user_id == user.id))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Hisob topilmadi")
    
    account.is_active = False
    await db.commit()
    return {"message": "Hisob o'chirildi"}
