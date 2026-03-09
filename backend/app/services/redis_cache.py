import redis.asyncio as redis
from app.config import settings
from datetime import timedelta
import json

# Graceful Redis connection - don't crash if Redis is not available
try:
    redis_client = redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
except Exception as e:
    print(f"WARNING: Redis connection failed: {e}")
    redis_client = None

class RedisCache:
    @staticmethod
    async def set_otp(phone: str, otp: str, expire_seconds: int = 120):
        if not redis_client:
            return
        try:
            await redis_client.set(f"otp:{phone}", otp, ex=expire_seconds)
        except Exception as e:
            print(f"Redis error in set_otp: {e}")

    @staticmethod
    async def get_otp(phone: str) -> str:
        if not redis_client:
            return None
        try:
            return await redis_client.get(f"otp:{phone}")
        except Exception as e:
            print(f"Redis error in get_otp: {e}")
            return None

    @staticmethod
    async def delete_otp(phone: str):
        if not redis_client:
            return
        try:
            await redis_client.delete(f"otp:{phone}")
        except Exception as e:
            print(f"Redis error in delete_otp: {e}")

    @staticmethod
    async def get_failed_attempts(identifier: str) -> int:
        if not redis_client:
            return 0
        try:
            val = await redis_client.get(f"attempts:{identifier}")
            return int(val) if val else 0
        except Exception as e:
            print(f"Redis error in get_failed_attempts: {e}")
            return 0

    @staticmethod
    async def increment_failed_attempts(identifier: str, expire_seconds: int = 900) -> int:
        if not redis_client:
            return 0
        try:
            key = f"attempts:{identifier}"
            val = await redis_client.incr(key)
            if val == 1:
                await redis_client.expire(key, expire_seconds)
            return val
        except Exception as e:
            print(f"Redis error in increment_failed_attempts: {e}")
            return 0

    @staticmethod
    async def reset_failed_attempts(identifier: str):
        if not redis_client:
            return
        try:
            await redis_client.delete(f"attempts:{identifier}")
        except Exception as e:
            print(f"Redis error in reset_failed_attempts: {e}")
