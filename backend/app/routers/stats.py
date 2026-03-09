from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from datetime import datetime, timedelta
from decimal import Decimal
from app.database import get_db
from app.models.transaction import Transaction
from app.models.account import Account
from app.models.category import Category
from app.models.debt import Debt
from app.models.goal import Goal
from app.models.user import User
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/stats", tags=["Statistics"])

@router.get("/overview")
async def get_overview(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get dashboard overview: total balance, income, expense, debts summary"""
    # Total balance across all accounts
    acc_result = await db.execute(
        select(func.sum(Account.balance)).where(Account.user_id == user.id, Account.is_active == True)
    )
    total_balance = acc_result.scalar() or Decimal("0")
    
    # This month income/expense
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    income_result = await db.execute(
        select(func.sum(Transaction.amount)).where(
            Transaction.user_id == user.id,
            Transaction.type == "income",
            Transaction.date >= month_start
        )
    )
    month_income = income_result.scalar() or Decimal("0")
    
    expense_result = await db.execute(
        select(func.sum(Transaction.amount)).where(
            Transaction.user_id == user.id,
            Transaction.type == "expense",
            Transaction.date >= month_start
        )
    )
    month_expense = expense_result.scalar() or Decimal("0")
    
    # Active debts
    lent_result = await db.execute(
        select(func.sum(Debt.remaining)).where(
            Debt.user_id == user.id, Debt.type == "lent", Debt.status == "active"
        )
    )
    total_lent = lent_result.scalar() or Decimal("0")
    
    borrowed_result = await db.execute(
        select(func.sum(Debt.remaining)).where(
            Debt.user_id == user.id, Debt.type == "borrowed", Debt.status == "active"
        )
    )
    total_borrowed = borrowed_result.scalar() or Decimal("0")
    
    # Account count
    acc_count_result = await db.execute(
        select(func.count(Account.id)).where(Account.user_id == user.id, Account.is_active == True)
    )
    account_count = acc_count_result.scalar() or 0
    
    return {
        "total_balance": float(total_balance),
        "month_income": float(month_income),
        "month_expense": float(month_expense),
        "month_net": float(month_income - month_expense),
        "total_lent": float(total_lent),
        "total_borrowed": float(total_borrowed),
        "account_count": account_count,
        "currency": user.currency,
    }

@router.get("/by-category")
async def get_by_category(
    type: str = "expense",
    period: str = Query("month", regex="^(week|month|year)$"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get spending/income breakdown by category"""
    now = datetime.utcnow()
    if period == "week":
        start = now - timedelta(days=7)
    elif period == "month":
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    
    result = await db.execute(
        select(
            Category.id,
            Category.name,
            Category.icon,
            Category.color,
            func.sum(Transaction.amount).label("total")
        )
        .join(Transaction, Transaction.category_id == Category.id)
        .where(
            Transaction.user_id == user.id,
            Transaction.type == type,
            Transaction.date >= start
        )
        .group_by(Category.id, Category.name, Category.icon, Category.color)
        .order_by(func.sum(Transaction.amount).desc())
    )
    
    rows = result.all()
    grand_total = sum(row.total for row in rows) if rows else Decimal("0")
    
    categories = []
    for row in rows:
        categories.append({
            "id": str(row.id),
            "name": row.name,
            "icon": row.icon,
            "color": row.color,
            "total": float(row.total),
            "percentage": round(float(row.total / grand_total * 100), 1) if grand_total > 0 else 0,
        })
    
    return {
        "period": period,
        "type": type,
        "total": float(grand_total),
        "categories": categories,
    }

@router.get("/cashflow")
async def get_cashflow(
    period: str = Query("month", regex="^(week|month|year)$"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get cashflow data (income vs expense over time)"""
    now = datetime.utcnow()
    if period == "week":
        start = now - timedelta(days=7)
    elif period == "month":
        start = now - timedelta(days=30)
    else:
        start = now - timedelta(days=365)
    
    # Get daily income/expense
    result = await db.execute(
        select(
            func.date_trunc('day', Transaction.date).label("day"),
            Transaction.type,
            func.sum(Transaction.amount).label("total")
        )
        .where(
            Transaction.user_id == user.id,
            Transaction.type.in_(["income", "expense"]),
            Transaction.date >= start
        )
        .group_by(func.date_trunc('day', Transaction.date), Transaction.type)
        .order_by(func.date_trunc('day', Transaction.date))
    )
    
    rows = result.all()
    data = {}
    for row in rows:
        day_str = row.day.strftime("%Y-%m-%d")
        if day_str not in data:
            data[day_str] = {"date": day_str, "income": 0, "expense": 0}
        data[day_str][row.type] = float(row.total)
    
    return {
        "period": period,
        "data": list(data.values()),
    }
