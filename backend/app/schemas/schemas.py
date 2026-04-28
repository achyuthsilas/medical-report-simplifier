"""
Pydantic schemas — request/response validation models.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


# ---------- User schemas ----------
class UserRegister(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=6, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Token schemas ----------
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    user_id: Optional[int] = None


# ---------- Report schemas ----------
class ReportSummary(BaseModel):
    id: int
    filename: str
    created_at: datetime

    class Config:
        from_attributes = True


class ReportDetail(BaseModel):
    id: int
    filename: str
    original_text: Optional[str]
    simplified_text: Optional[str]
    flagged_values: Optional[str]
    suggested_questions: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
