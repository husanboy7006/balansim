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
