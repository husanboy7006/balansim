import uuid
from sqlalchemy import Column, String, Numeric, Boolean, ForeignKey, DateTime, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Account(Base):
    __tablename__ = "accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    type = Column(SAEnum("cash", "card", "deposit", name="account_type"), default="cash")
    currency = Column(String(3), default="UZS")
    balance = Column(Numeric(15, 2), default=0.00)
    icon = Column(String(50), default="wallet")
    color = Column(String(7), default="#4F46E5")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account", foreign_keys="Transaction.account_id")
