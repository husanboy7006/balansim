from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID
from decimal import Decimal
from app.database import get_db
from app.models.goal import Goal
from app.models.user import User
from app.schemas.goal import GoalCreate, GoalResponse, GoalUpdate, GoalContribution
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/goals", tags=["Goals"])

def _goal_to_response(goal: Goal) -> GoalResponse:
    resp = GoalResponse.model_validate(goal)
    if goal.target_amount > 0:
        resp.progress = round(float(goal.current_amount / goal.target_amount * 100), 1)
    return resp

@router.get("/", response_model=List[GoalResponse])
async def get_goals(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get all savings goals"""
    result = await db.execute(select(Goal).where(Goal.user_id == user.id).order_by(Goal.created_at.desc()))
    return [_goal_to_response(g) for g in result.scalars().all()]

@router.post("/", response_model=GoalResponse, status_code=201)
async def create_goal(data: GoalCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Create a new savings goal"""
    try:
        goal = Goal(
            user_id=user.id,
            name=data.name,
            target_amount=data.target_amount,
            currency=data.currency,
            deadline=data.deadline,
            icon=data.icon,
            color=data.color,
        )
        db.add(goal)
        await db.commit()
        await db.refresh(goal)
        return _goal_to_response(goal)
    except Exception as e:
        import traceback
        print(f"GOAL CREATE ERROR: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Server xatoligi: {str(e)}")

@router.put("/{goal_id}", response_model=GoalResponse)
async def update_goal(goal_id: UUID, data: GoalUpdate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Update a goal"""
    try:
        result = await db.execute(select(Goal).where(Goal.id == goal_id, Goal.user_id == user.id))
        goal = result.scalar_one_or_none()
        if not goal:
            raise HTTPException(status_code=404, detail="Maqsad topilmadi")
        
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(goal, field, value)
        await db.commit()
        await db.refresh(goal)
        return _goal_to_response(goal)
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"GOAL UPDATE ERROR: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Server xatoligi: {str(e)}")

@router.post("/{goal_id}/contribute", response_model=GoalResponse)
async def contribute_to_goal(goal_id: UUID, data: GoalContribution, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Add money to a savings goal"""
    try:
        result = await db.execute(select(Goal).where(Goal.id == goal_id, Goal.user_id == user.id))
        goal = result.scalar_one_or_none()
        if not goal:
            raise HTTPException(status_code=404, detail="Maqsad topilmadi")
        
        goal.current_amount += data.amount
        await db.commit()
        await db.refresh(goal)
        return _goal_to_response(goal)
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"GOAL CONTRIBUTE ERROR: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Server xatoligi: {str(e)}")

@router.delete("/{goal_id}")
async def delete_goal(goal_id: UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Delete a goal"""
    result = await db.execute(select(Goal).where(Goal.id == goal_id, Goal.user_id == user.id))
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Maqsad topilmadi")
    
    await db.delete(goal)
    await db.commit()
    return {"message": "Maqsad o'chirildi"}
