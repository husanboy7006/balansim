from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class CategoryCreate(BaseModel):
    name: str
    icon: str = "tag"
    color: str = "#6366F1"
    type: str  # income, expense
    parent_id: Optional[UUID] = None

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None

class CategoryResponse(BaseModel):
    id: UUID
    name: str
    icon: str
    color: str
    type: str
    parent_id: Optional[UUID] = None
    is_default: bool
    children: Optional[List["CategoryResponse"]] = None

    class Config:
        from_attributes = True
