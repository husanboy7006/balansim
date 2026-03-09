import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

async def init_db():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("DATABASE_URL topilmadi!")
        return

    # asyncpg expects postgresql:// to be changed if needed, but usually it works fine
    if database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    engine = create_async_engine(database_url)
    
    sql_file = "init.sql"
    if not os.path.exists(sql_file):
        # Path adjustment for running from different dirs
        sql_file = os.path.join(os.path.dirname(__file__), "init.sql")

    with open(sql_file, "r", encoding="utf-8") as f:
        sql_commands = f.read()

    async with engine.begin() as conn:
        # Split by semicolon but be careful with functions/triggers if any
        # For simplicity, we run the whole block if the driver supports it
        # asyncpg's engine.begin() and conn.execute(text(...)) can handle multiple statements
        print("Ma'lumotlar bazasi jadvallari yaratilmoqda...")
        await conn.execute(text(sql_commands))
        print("Muvaffaqiyatli yakunlandi!")

if __name__ == "__main__":
    asyncio.run(init_db())
