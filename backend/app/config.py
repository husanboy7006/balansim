import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://balansim:balansim_secret_2024@localhost:5432/balansim_db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "balansim-jwt-secret-key")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    # 99 years (almost infinity for the app)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 52034400 
    REFRESH_TOKEN_EXPIRE_DAYS: int = 36135
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    class Config:
        env_file = ".env"

settings = Settings()
