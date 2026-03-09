from pydantic import BaseModel, field_validator, validator
from typing import Optional
from uuid import UUID
from datetime import datetime
import re

def validate_phone_number(v: Optional[str]) -> Optional[str]:
    if v is not None:
        v = re.sub(r'[\s\-\(\)]', '', v)
        if not v.startswith('+'):
            if v.startswith('998'): v = '+' + v
            else: v = '+998' + v
        if not re.match(r"^\+998\d{9}$", v):
            raise ValueError("Raqam format xato! Jami 12 ta raqam bo'lishi kerak. Masalan: +998 90 123 45 67")
    return v

class UserCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    telegram_id: Optional[int] = None
    currency: str = "UZS"

    @field_validator('phone', mode='before')
    @classmethod
    def check_phone(cls, v):
        return validate_phone_number(v)

class UserUpdate(BaseModel):
    name: Optional[str] = None
    currency: Optional[str] = None
    theme: Optional[str] = None
    language: Optional[str] = None
    avatar_url: Optional[str] = None

class UserResponse(BaseModel):
    id: UUID
    name: str
    phone: Optional[str] = None
    telegram_id: Optional[int] = None
    currency: str
    role: str
    theme: str
    language: str
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class SessionResponse(BaseModel):
    id: UUID
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    expires_at: datetime
    created_at: datetime
    is_current: bool = False

    class Config:
        from_attributes = True

class TelegramAuthData(BaseModel):
    init_data: str

class PhoneOTPRequest(BaseModel):
    phone: str

    @field_validator('phone', mode='before')
    @classmethod
    def check_phone(cls, v):
        return validate_phone_number(v)

class PhoneOTPVerify(BaseModel):
    phone: str
    otp: Optional[str] = None

    @field_validator('phone', mode='before')
    @classmethod
    def check_phone(cls, v):
        return validate_phone_number(v)

class PinSet(BaseModel):
    pin: str

class PinVerify(BaseModel):
    pin: str
