import logging
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="BALANSIM API",
    description="Oilaviy Byudjet (Family Budget) API",
    version="1.0.0",
)

# CORS - Specific origins are safer and more reliable than *
origins = [
    "https://balansim.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routers
from app.routers import auth, accounts, transactions, categories, debts, goals, stats

# Routers
app.include_router(auth.router)
app.include_router(accounts.router)
app.include_router(transactions.router)
app.include_router(categories.router)
app.include_router(debts.router)
app.include_router(goals.router)
app.include_router(stats.router)

@app.get("/")
async def root():
    return {"message": "BALANSIM API ishlayapti!", "version": "1.0.1-init-fix"}

@app.get("/api/health")
@app.head("/api/health")
async def health():
    return {"status": "ok"}

@app.get("/api/health/init-db")
async def run_init_db():
    from sqlalchemy.ext.asyncio import create_async_engine
    import os
    import re
    from sqlalchemy import text
    from app.config import settings
    
    database_url = settings.DATABASE_URL
    if database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        
    # Create a dedicated engine for init with NO statement caching
    temp_engine = create_async_engine(
        database_url,
        connect_args={
            "prepared_statement_cache_size": 0,
            "statement_cache_size": 0
        }
    )
    
    sql_file = "/app/backend/init.sql"
    if not os.path.exists(sql_file):
        sql_file = "backend/init.sql"
    if not os.path.exists(sql_file):
        sql_file = "init.sql"
        
    try:
        with open(sql_file, "r", encoding="utf-8") as f:
            sql_content = f.read()
            
        sql_content = re.sub(r'--.*?\n', '\n', sql_content)
        statements = [s.strip() for s in re.split(r';(?=(?:[^\$]*\$\$[^\$]*\$\$)*[^\$]*$)', sql_content) if s.strip()]
        
        async with temp_engine.begin() as conn:
            for statement in statements:
                await conn.execute(text(statement))
        
        await temp_engine.dispose()
        return {"status": "success", "message": f"Database initialized successfully with {len(statements)} statements"}
    except Exception as e:
        import traceback
        if 'temp_engine' in locals():
            await temp_engine.dispose()
        return {"status": "error", "message": str(e), "traceback": traceback.format_exc()}
