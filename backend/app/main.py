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
    from app.database import engine
    import os
    import re
    from sqlalchemy import text
    
    sql_file = "/app/backend/init.sql"
    if not os.path.exists(sql_file):
        sql_file = "backend/init.sql"
    if not os.path.exists(sql_file):
        sql_file = "init.sql"
        
    try:
        with open(sql_file, "r", encoding="utf-8") as f:
            sql_content = f.read()
            
        # Remove comments to avoid issues
        sql_content = re.sub(r'--.*?\n', '\n', sql_content)
        
        # Split by ; but not if inside $$ ... $$ (for DO blocks)
        # Using a more robust splitting for asyncpg
        statements = [s.strip() for s in re.split(r';(?=(?:[^\$]*\$\$[^\$]*\$\$)*[^\$]*$)', sql_content) if s.strip()]
        
        async with engine.begin() as conn:
            for statement in statements:
                # Some statements might have trailing semicolons removed by split
                await conn.execute(text(statement))
            
        return {"status": "success", "message": f"Database initialized successfully with {len(statements)} statements"}
    except Exception as e:
        import traceback
        return {"status": "error", "message": str(e), "traceback": traceback.format_exc()}
