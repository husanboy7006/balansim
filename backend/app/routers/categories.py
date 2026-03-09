from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import List, Optional
from uuid import UUID
from app.database import get_db
from app.models.category import Category
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/categories", tags=["Categories"])

@router.get("/", response_model=List[CategoryResponse])
async def get_categories(
    type: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all categories (default + user's custom). Returns parent categories with children nested."""
    query = select(Category).where(
        or_(Category.is_default == True, Category.user_id == user.id),
        Category.parent_id == None
    )
    if type:
        query = query.where(Category.type == type)
    
    result = await db.execute(query.order_by(Category.name))
    parents = result.scalars().all()
    
    items = []
    for parent in parents:
        item = CategoryResponse.model_validate(parent)
        # Get children
        children_result = await db.execute(
            select(Category).where(Category.parent_id == parent.id)
        )
        children = children_result.scalars().all()
        item.children = [CategoryResponse.model_validate(c) for c in children]
        items.append(item)
    
    return items

@router.post("/", response_model=CategoryResponse, status_code=201)
async def create_category(data: CategoryCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Create a custom category"""
    category = Category(
        name=data.name,
        icon=data.icon,
        color=data.color,
        type=data.type,
        parent_id=data.parent_id,
        user_id=user.id,
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return CategoryResponse.model_validate(category)

@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(category_id: UUID, data: CategoryUpdate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Update a custom category (can't modify defaults)"""
    result = await db.execute(select(Category).where(Category.id == category_id, Category.user_id == user.id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Toifa topilmadi yoki tahrirlash mumkin emas")
    
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(category, field, value)
    await db.commit()
    await db.refresh(category)
    return CategoryResponse.model_validate(category)

@router.delete("/{category_id}")
async def delete_category(category_id: UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Delete a custom category"""
    result = await db.execute(select(Category).where(Category.id == category_id, Category.user_id == user.id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Toifa topilmadi yoki o'chirib bo'lmaydi")
    
    await db.delete(category)
    await db.commit()
    return {"message": "Toifa o'chirildi"}
