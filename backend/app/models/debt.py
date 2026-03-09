import uuid
from sqlalchemy import Column, String, Numeric, Text, Date, ForeignKey, DateTime, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Debt(Base):
    __tablename__ = "debts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    contact_name = Column(String(100), nullable=False)
    contact_phone = Column(String(20), nullable=True)
    type = Column(SAEnum("lent", "borrowed", name="debt_type"), nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    remaining = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(3), default="UZS")
    due_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(SAEnum("active", "paid", name="debt_status"), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="debts")
