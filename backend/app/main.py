"""
Medical Report Simplifier — FastAPI Backend
Run with: uvicorn app.main:app --reload
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine
from app.auth.router import router as auth_router
from app.reports.router import router as reports_router

# Create database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Medical Report Simplifier API",
    description="AI-powered medical report explanation service",
    version="1.0.0",
)

# CORS — allow React frontend (Vite default port: 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(reports_router, prefix="/reports", tags=["Reports"])


@app.get("/")
def root():
    return {
        "message": "Medical Report Simplifier API",
        "docs": "/docs",
        "status": "running",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
