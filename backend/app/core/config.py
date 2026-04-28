"""
Application configuration — loads from .env
"""
import os
from typing import List
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./medical_reports.db")

    # JWT Auth
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "CHANGE-THIS-TO-A-RANDOM-STRING-IN-PRODUCTION-PLEASE",
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
    )

    # Groq LLM
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    # CORS — frontends allowed to call this API
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",   # Vite dev server
        "http://localhost:3000",   # Alternative dev port
        "http://127.0.0.1:5173",
    ]

    # File upload
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_EXTENSIONS: set = {".pdf", ".png", ".jpg", ".jpeg"}


settings = Settings()
