from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal

class AccountCreate(BaseModel):
    name: str
    type: str = "cash"
    currency: str = "UZS"
    balance: Decimal = Decimal("0.00")
    icon: str = "wallet"
    color: str = "#4F46E5"

class AccountUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    currency: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None

class AccountResponse(BaseModel):
    id: UUID
    name: str
    type: str
    currency: str
    balance: Decimal
    icon: str
    color: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
