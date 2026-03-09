from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, accounts, transactions, categories, debts, goals, stats

app = FastAPI(
    title="BALANSIM API",
    description="Oilaviy Byudjet (Family Budget) API",
    version="1.0.0",
)

# CORS
origins = [
    "https://balansim.vercel.app",
    "https://balansim.vercel.app/",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
]

import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
async def health():
    return {"status": "ok"}
