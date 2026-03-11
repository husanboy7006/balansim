from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from app.database import get_db
from app.models.transaction import Transaction
from app.models.account import Account
from app.models.category import Category
from app.models.user import User
from app.schemas.transaction import TransactionCreate, TransactionResponse, TransactionUpdate, TransactionListResponse
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])

@router.get("/", response_model=TransactionListResponse)
async def get_transactions(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    type: Optional[str] = None,
    category_id: Optional[UUID] = None,
    account_id: Optional[UUID] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get transactions with filtering and pagination"""
    query = select(Transaction).where(Transaction.user_id == user.id)
    count_query = select(func.count(Transaction.id)).where(Transaction.user_id == user.id)
    
    if type:
        query = query.where(Transaction.type == type)
        count_query = count_query.where(Transaction.type == type)
    if category_id:
        query = query.where(Transaction.category_id == category_id)
        count_query = count_query.where(Transaction.category_id == category_id)
    if account_id:
        query = query.where(Transaction.account_id == account_id)
        count_query = count_query.where(Transaction.account_id == account_id)
    if date_from:
        query = query.where(Transaction.date >= date_from)
        count_query = count_query.where(Transaction.date >= date_from)
    if date_to:
        query = query.where(Transaction.date <= date_to)
        count_query = count_query.where(Transaction.date <= date_to)
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Get paginated results
    offset = (page - 1) * per_page
    query = query.order_by(desc(Transaction.date)).offset(offset).limit(per_page)
    result = await db.execute(query)
    transactions = result.scalars().all()
    
    # Enrich with category and account info
    items = []
    for t in transactions:
        item = TransactionResponse.model_validate(t)
        if t.category_id:
            cat_result = await db.execute(select(Category).where(Category.id == t.category_id))
            cat = cat_result.scalar_one_or_none()
            if cat:
                item.category_name = cat.name
                item.category_icon = cat.icon
                item.category_color = cat.color
        acc_result = await db.execute(select(Account).where(Account.id == t.account_id))
        acc = acc_result.scalar_one_or_none()
        if acc:
            item.account_name = acc.name
        items.append(item)
    
    return TransactionListResponse(items=items, total=total, page=page, per_page=per_page)

@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(transaction_id: UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get a single transaction"""
    try:
        result = await db.execute(select(Transaction).where(Transaction.id == transaction_id, Transaction.user_id == user.id))
        t = result.scalar_one_or_none()
        if not t:
            raise HTTPException(status_code=404, detail="Tranzaksiya topilmadi")
        
        item = TransactionResponse.model_validate(t)
        # Enrich info
        if t.category_id:
            cat = (await db.execute(select(Category).where(Category.id == t.category_id))).scalar_one_or_none()
            if cat:
                item.category_name = cat.name
        acc = (await db.execute(select(Account).where(Account.id == t.account_id))).scalar_one_or_none()
        if acc:
            item.account_name = acc.name
        return item
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=TransactionResponse, status_code=201)
async def create_transaction(data: TransactionCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Create a new transaction and update account balances"""
    try:
        # Verify account belongs to user
        result = await db.execute(select(Account).where(Account.id == data.account_id, Account.user_id == user.id))
        account = result.scalar_one_or_none()
        if not account:
            raise HTTPException(status_code=404, detail="Hisob topilmadi")
        
        # Handle balance updates
        if data.type == "expense":
            account.balance -= data.amount
        elif data.type == "income":
            account.balance += data.amount
        elif data.type == "transfer":
            if not data.to_account_id:
                raise HTTPException(status_code=400, detail="O'tkazma uchun manzil hisob kerak")
            to_result = await db.execute(select(Account).where(Account.id == data.to_account_id, Account.user_id == user.id))
            to_account = to_result.scalar_one_or_none()
            if not to_account:
                raise HTTPException(status_code=404, detail="Manzil hisob topilmadi")
            account.balance -= data.amount
            to_account.balance += data.amount
        
        transaction = Transaction(
            user_id=user.id,
            account_id=data.account_id,
            type=data.type,
            amount=data.amount,
            category_id=data.category_id,
            to_account_id=data.to_account_id,
            description=data.description,
            date=data.date or datetime.utcnow(),
            receipt_url=data.receipt_url,
        )
        db.add(transaction)
        await db.commit()
        await db.refresh(transaction)
        return TransactionResponse.model_validate(transaction)
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"TRANSACTION CREATE ERROR: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Server xatoligi: {str(e)}")

@router.put("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(transaction_id: UUID, data: TransactionUpdate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Update a transaction and adjust balances"""
    try:
        result = await db.execute(select(Transaction).where(Transaction.id == transaction_id, Transaction.user_id == user.id))
        transaction = result.scalar_one_or_none()
        if not transaction:
            raise HTTPException(status_code=404, detail="Tranzaksiya topilmadi")
        
        # 1. Reverse OLD balance changes
        old_acc = (await db.execute(select(Account).where(Account.id == transaction.account_id))).scalar_one_or_none()
        if old_acc:
            if transaction.type == "expense":
                old_acc.balance += transaction.amount
            elif transaction.type == "income":
                old_acc.balance -= transaction.amount
            elif transaction.type == "transfer":
                old_acc.balance += transaction.amount
                if transaction.to_account_id:
                    to_acc = (await db.execute(select(Account).where(Account.id == transaction.to_account_id))).scalar_one_or_none()
                    if to_acc: to_acc.balance -= transaction.amount
        
        # 2. Update fields
        update_dict = data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(transaction, field, value)
            
        # 3. Apply NEW balance changes
        new_acc = (await db.execute(select(Account).where(Account.id == transaction.account_id))).scalar_one_or_none()
        if not new_acc: raise HTTPException(status_code=404, detail="Yangi hisob topilmadi")
        
        if transaction.type == "expense":
            new_acc.balance -= transaction.amount
        elif transaction.type == "income":
            new_acc.balance += transaction.amount
        elif transaction.type == "transfer":
            if not transaction.to_account_id: raise HTTPException(status_code=400, detail="O'tkazma uchun manzil kerak")
            new_acc.balance -= transaction.amount
            to_acc = (await db.execute(select(Account).where(Account.id == transaction.to_account_id))).scalar_one_or_none()
            if to_acc: to_acc.balance += transaction.amount
            
        await db.commit()
        await db.refresh(transaction)
        return TransactionResponse.model_validate(transaction)
    except Exception as e:
        import traceback
        print(f"TRANSACTION UPDATE ERROR: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{transaction_id}")
async def delete_transaction(transaction_id: UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Delete a transaction and reverse balance changes"""
    try:
        result = await db.execute(select(Transaction).where(Transaction.id == transaction_id, Transaction.user_id == user.id))
        transaction = result.scalar_one_or_none()
        if not transaction:
            raise HTTPException(status_code=404, detail="Tranzaksiya topilmadi")
        
        # Reverse balance
        acc_result = await db.execute(select(Account).where(Account.id == transaction.account_id))
        account = acc_result.scalar_one_or_none()
        if account:
            if transaction.type == "expense":
                account.balance += transaction.amount
            elif transaction.type == "income":
                account.balance -= transaction.amount
            elif transaction.type == "transfer" and transaction.to_account_id:
                account.balance += transaction.amount
                to_result = await db.execute(select(Account).where(Account.id == transaction.to_account_id))
                to_account = to_result.scalar_one_or_none()
                if to_account:
                    to_account.balance -= transaction.amount
        
        await db.delete(transaction)
        await db.commit()
        return {"message": "Tranzaksiya o'chirildi"}
    except Exception as e:
        import traceback
        print(f"TRANSACTION DELETE ERROR: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
