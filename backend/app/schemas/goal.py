from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal

class GoalCreate(BaseModel):
    name: str
    target_amount: Decimal
    currency: str = "UZS"
    deadline: Optional[date] = None
    icon: str = "target"
    color: str = "#10B981"

class GoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[Decimal] = None
    deadline: Optional[date] = None
    icon: Optional[str] = None
    color: Optional[str] = None

class GoalContribution(BaseModel):
    amount: Decimal

class GoalResponse(BaseModel):
    id: UUID
    name: str
    target_amount: Decimal
    current_amount: Decimal
    currency: str
    deadline: Optional[date] = None
    icon: str
    color: str
    progress: float = 0.0
    created_at: datetime

    class Config:
        from_attributes = True
