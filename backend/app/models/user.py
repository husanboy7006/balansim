import uuid
from sqlalchemy import Column, String, BigInteger, ForeignKey, DateTime, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Family(Base):
    __tablename__ = "families"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    invite_code = Column(String(20), unique=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    members = relationship("User", back_populates="family", foreign_keys="User.family_id")

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    telegram_id = Column(BigInteger, unique=True, nullable=True)
    phone = Column(String(20), unique=True, nullable=True)
    name = Column(String(100), nullable=False)
    pin_code = Column(String(255), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    currency = Column(String(3), default="UZS")
    role = Column(SAEnum("owner", "admin", "member", name="user_role"), default="owner")
    family_id = Column(UUID(as_uuid=True), ForeignKey("families.id"), nullable=True)
    theme = Column(String(10), default="light")
    language = Column(String(5), default="uz")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    family = relationship("Family", back_populates="members", foreign_keys=[family_id])
    accounts = relationship("Account", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    debts = relationship("Debt", back_populates="user", cascade="all, delete-orphan")
    goals = relationship("Goal", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
