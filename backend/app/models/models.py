"""
SQLAlchemy database models.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    reports = relationship(
        "Report", back_populates="owner", cascade="all, delete-orphan"
    )


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    original_text = Column(Text, nullable=True)       # extracted from PDF/image
    simplified_text = Column(Text, nullable=True)     # AI-generated explanation
    flagged_values = Column(Text, nullable=True)      # JSON of abnormal values
    suggested_questions = Column(Text, nullable=True) # JSON of questions
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="reports")
