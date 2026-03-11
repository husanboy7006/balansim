import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

import re

async def init_db():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("DATABASE_URL topilmadi!")
        return

    # asyncpg expects postgresql:// to be changed if needed, but usually it works fine
    if database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    engine = create_async_engine(
        database_url,
        connect_args={
            "prepared_statement_cache_size": 0,
            "statement_cache_size": 0
        }
    )
    
    sql_file = "init.sql"
    if not os.path.exists(sql_file):
        # Path adjustment for running from different dirs
        sql_file = os.path.join(os.path.dirname(__file__), "init.sql")
        if not os.path.exists(sql_file):
            sql_file = "/app/backend/init.sql"

    with open(sql_file, "r", encoding="utf-8") as f:
        sql_content = f.read()

    # Remove comments
    sql_content = re.sub(r'--.*?\n', '\n', sql_content)
    
    # Split by semicolon but ignore inside $$ blocks
    statements = [s.strip() for s in re.split(r';(?=(?:[^\$]*\$\$[^\$]*\$\$)*[^\$]*$)', sql_content) if s.strip()]

    async with engine.begin() as conn:
        print(f"Ma'lumotlar bazasi jadvallari yaratilmoqda ({len(statements)} qism)...")
        for statement in statements:
            await conn.execute(text(statement))
        print("Muvaffaqiyatli yakunlandi!")

if __name__ == "__main__":
    asyncio.run(init_db())
