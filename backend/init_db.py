import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.database import Base
from app.config import settings
from sqlalchemy import text

# Import all models to ensure they are registered with Base.metadata
from app.models.user import User, Family
from app.models.account import Account
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.debt import Debt
from app.models.goal import Goal
from app.models.session import Session

async def init_db():
    database_url = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    engine = create_async_engine(database_url, echo=True)

    async with engine.begin() as conn:
        print("Baza jadvallarini yaratish boshlandi...")
        
        # extensions yarating
        await conn.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'))
        
        # Jadvallarni yarating
        await conn.run_sync(Base.metadata.create_all)
        
        # Default kategoriyalarni qo'shish (faqat bo'sh bo'lsa)
        print("Baza tayyor.")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(init_db())
