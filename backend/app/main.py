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
    return {"message": "BALANSIM API ishlayapti!", "version": "1.0.0"}

@app.get("/api/health")
@app.head("/api/health")
async def health():
    return {"status": "ok"}

@app.get("/api/health/init-db")
async def run_init_db():
    from app.database import engine
    import os
    from sqlalchemy import text
    
    sql_file = "/app/backend/init.sql"
    if not os.path.exists(sql_file):
        sql_file = "backend/init.sql"
    if not os.path.exists(sql_file):
        sql_file = "init.sql"
        
    try:
        with open(sql_file, "r", encoding="utf-8") as f:
            sql_commands = f.read()
        
        async with engine.begin() as conn:
            # We execute as one big block since asyncpg handles it often
            await conn.execute(text(sql_commands))
            
        return {"status": "success", "message": "Database initialized successfully"}
    except Exception as e:
        import traceback
        return {"status": "error", "message": str(e), "traceback": traceback.format_exc()}
