from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal

class DebtCreate(BaseModel):
    contact_name: str
    contact_phone: Optional[str] = None
    type: str  # lent, borrowed
    amount: Decimal
    currency: str = "UZS"
    due_date: Optional[date] = None
    notes: Optional[str] = None

class DebtUpdate(BaseModel):
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    due_date: Optional[date] = None
    notes: Optional[str] = None

class DebtPayment(BaseModel):
    amount: Decimal

class DebtResponse(BaseModel):
    id: UUID
    contact_name: str
    contact_phone: Optional[str] = None
    type: str
    amount: Decimal
    remaining: Decimal
    currency: str
    due_date: Optional[date] = None
    notes: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
