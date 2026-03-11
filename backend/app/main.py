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
    return {"message": "BALANSIM API ishlayapti!", "version": "1.0.2-final-init"}

@app.get("/api/health")
@app.head("/api/health")
async def health():
    return {"status": "ok"}

@app.get("/api/health/init-db")
async def run_init_db():
    import asyncpg
    import os
    import re
    from app.config import settings
    
    database_url = settings.DATABASE_URL
    # asyncpg needs postgresql:// but we often have postgresql+asyncpg:// in our env for sqlalchemy
    if database_url.startswith("postgresql+asyncpg://"):
        database_url = database_url.replace("postgresql+asyncpg://", "postgresql://", 1)
        
    sql_file = "/app/backend/init.sql"
    if not os.path.exists(sql_file):
        sql_file = "backend/init.sql"
    if not os.path.exists(sql_file):
        sql_file = "init.sql"
        
    conn = None
    try:
        # Connect directly with asyncpg
        conn = await asyncpg.connect(database_url, statement_cache_size=0)
        
        with open(sql_file, "r", encoding="utf-8") as f:
            sql_content = f.read()
            
        sql_content = re.sub(r'--.*?\n', '\n', sql_content)
        statements = [s.strip() for s in re.split(r';(?=(?:[^\$]*\$\$[^\$]*\$\$)*[^\$]*$)', sql_content) if s.strip()]
        
        results = []
        for statement in statements:
            try:
                await conn.execute(statement)
                results.append(f"SUCCESS: {statement[:30]}...")
            except Exception as e:
                results.append(f"FAILED: {statement[:30]}... ERROR: {str(e)}")
            
        return {
            "status": "partial_success" if "FAILED" in "".join(results) else "success",
            "message": f"Executed {len(statements)} statements",
            "details": results
        }
    except Exception as e:
        import traceback
        return {"status": "error", "message": str(e), "traceback": traceback.format_exc()}
    finally:
        if conn:
            await conn.close()
