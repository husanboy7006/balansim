from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from decimal import Decimal

class TransactionCreate(BaseModel):
    account_id: UUID
    type: str  # income, expense, transfer
    amount: Decimal
    category_id: Optional[UUID] = None
    to_account_id: Optional[UUID] = None
    description: Optional[str] = None
    date: Optional[datetime] = None
    receipt_url: Optional[str] = None

class TransactionUpdate(BaseModel):
    account_id: Optional[UUID] = None
    type: Optional[str] = None
    amount: Optional[Decimal] = None
    category_id: Optional[UUID] = None
    description: Optional[str] = None
    date: Optional[datetime] = None

class TransactionResponse(BaseModel):
    id: UUID
    account_id: UUID
    type: str
    amount: Decimal
    category_id: Optional[UUID] = None
    to_account_id: Optional[UUID] = None
    description: Optional[str] = None
    date: datetime
    receipt_url: Optional[str] = None
    created_at: datetime
    category_name: Optional[str] = None
    category_icon: Optional[str] = None
    category_color: Optional[str] = None
    account_name: Optional[str] = None

    class Config:
        from_attributes = True

class TransactionListResponse(BaseModel):
    items: List[TransactionResponse]
    total: int
    page: int
    per_page: int
