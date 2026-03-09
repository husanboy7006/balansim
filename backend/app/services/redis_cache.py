import redis.asyncio as redis
from app.config import settings
from datetime import timedelta
import json

redis_client = redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)

class RedisCache:
    @staticmethod
    async def set_otp(phone: str, otp: str, expire_seconds: int = 120):
        await redis_client.set(f"otp:{phone}", otp, ex=expire_seconds)

    @staticmethod
    async def get_otp(phone: str) -> str:
        return await redis_client.get(f"otp:{phone}")

    @staticmethod
    async def delete_otp(phone: str):
        await redis_client.delete(f"otp:{phone}")

    @staticmethod
    async def get_failed_attempts(identifier: str) -> int:
        val = await redis_client.get(f"attempts:{identifier}")
        return int(val) if val else 0

    @staticmethod
    async def increment_failed_attempts(identifier: str, expire_seconds: int = 900) -> int:
        key = f"attempts:{identifier}"
        val = await redis_client.incr(key)
        if val == 1:
            await redis_client.expire(key, expire_seconds) # 15 min block initially
        return val

    @staticmethod
    async def reset_failed_attempts(identifier: str):
        await redis_client.delete(f"attempts:{identifier}")
