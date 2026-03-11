from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from app.database import get_db
from app.models.debt import Debt
from app.models.user import User
from app.schemas.debt import DebtCreate, DebtResponse, DebtUpdate, DebtPayment
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/debts", tags=["Debts"])

@router.get("/", response_model=List[DebtResponse])
async def get_debts(
    status: Optional[str] = None,
    type: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all debts for current user"""
    query = select(Debt).where(Debt.user_id == user.id)
    if status:
        query = query.where(Debt.status == status)
    if type:
        query = query.where(Debt.type == type)
    
    result = await db.execute(query.order_by(Debt.created_at.desc()))
    return [DebtResponse.model_validate(d) for d in result.scalars().all()]

@router.post("/", response_model=DebtResponse, status_code=201)
async def create_debt(data: DebtCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Create a new debt record"""
    try:
        debt = Debt(
            user_id=user.id,
            contact_name=data.contact_name,
            contact_phone=data.contact_phone,
            type=data.type,
            amount=data.amount,
            remaining=data.amount,
            currency=data.currency,
            due_date=data.due_date,
            notes=data.notes,
        )
        db.add(debt)
        await db.commit()
        await db.refresh(debt)
        return DebtResponse.model_validate(debt)
    except Exception as e:
        import traceback
        print(f"DEBT CREATE ERROR: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Server xatoligi: {str(e)}")

@router.put("/{debt_id}", response_model=DebtResponse)
async def update_debt(debt_id: UUID, data: DebtUpdate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Update a debt record"""
    try:
        result = await db.execute(select(Debt).where(Debt.id == debt_id, Debt.user_id == user.id))
        debt = result.scalar_one_or_none()
        if not debt:
            raise HTTPException(status_code=404, detail="Qarz topilmadi")
        
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(debt, field, value)
        await db.commit()
        await db.refresh(debt)
        return DebtResponse.model_validate(debt)
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"DEBT UPDATE ERROR: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Server xatoligi: {str(e)}")

@router.post("/{debt_id}/pay", response_model=DebtResponse)
async def pay_debt(debt_id: UUID, data: DebtPayment, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Make a partial or full payment on a debt"""
    try:
        result = await db.execute(select(Debt).where(Debt.id == debt_id, Debt.user_id == user.id))
        debt = result.scalar_one_or_none()
        if not debt:
            raise HTTPException(status_code=404, detail="Qarz topilmadi")
        
        if data.amount > debt.remaining:
            raise HTTPException(status_code=400, detail="To'lov summasi qarz qoldig'idan ko'p")
        
        debt.remaining -= data.amount
        if debt.remaining <= Decimal("0"):
            debt.remaining = Decimal("0")
            debt.status = "paid"
        
        await db.commit()
        await db.refresh(debt)
        return DebtResponse.model_validate(debt)
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"DEBT PAY ERROR: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Server xatoligi: {str(e)}")

@router.delete("/{debt_id}")
async def delete_debt(debt_id: UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Delete a debt record"""
    result = await db.execute(select(Debt).where(Debt.id == debt_id, Debt.user_id == user.id))
    debt = result.scalar_one_or_none()
    if not debt:
        raise HTTPException(status_code=404, detail="Qarz topilmadi")
    
    await db.delete(debt)
    await db.commit()
    return {"message": "Qarz o'chirildi"}
