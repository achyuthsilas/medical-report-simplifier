"""
Reports routes — upload, list, view, delete, reprocess medical reports.
Phase 3: now wired to real text extraction + Groq AI analysis.
"""
import json
import os
import uuid
from pathlib import Path
from typing import List

from fastapi import (
    APIRouter, Depends, HTTPException, UploadFile, File, status, BackgroundTasks
)
from sqlalchemy.orm import Session

from app.core.database import get_db, SessionLocal
from app.core.config import settings
from app.models.models import Report, User
from app.schemas.schemas import ReportSummary, ReportDetail
from app.auth.dependencies import get_current_user
from app.ai.extractor import extract_text
from app.ai.simplifier import simplify_report


router = APIRouter()

# Make sure upload directory exists
Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)


def _validate_file(file: UploadFile) -> None:
    """Check file extension."""
    ext = Path(file.filename).suffix.lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type {ext} not allowed. Use: {settings.ALLOWED_EXTENSIONS}",
        )


def _process_report_async(report_id: int, file_path: str) -> None:
    """
    Background task: extract text → run AI → save results to DB.
    Uses its own DB session because the request session is already closed.
    """
    db = SessionLocal()
    try:
        report = db.query(Report).filter(Report.id == report_id).first()
        if not report:
            return

        # 1. Extract text from PDF/image
        text, method = extract_text(file_path)
        report.original_text = text or "(no text could be extracted)"

        # 2. AI analysis
        result = simplify_report(text)
        report.simplified_text = result["summary"]
        report.flagged_values = json.dumps(result["flagged_values"])
        report.suggested_questions = json.dumps(result["suggested_questions"])

        db.commit()
        print(f"[reports] Report {report_id} processed via {method}")
    except Exception as e:
        print(f"[reports] Background processing failed for report {report_id}: {e}")
    finally:
        db.close()


@router.post("/upload", response_model=ReportDetail, status_code=201)
async def upload_report(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a medical report. Returns immediately with a 'processing' status;
    AI analysis runs in the background and updates the DB when done.
    Frontend can poll GET /reports/{id} to check progress.
    """
    _validate_file(file)

    # Save file with unique name
    ext = Path(file.filename).suffix.lower()
    saved_name = f"{uuid.uuid4().hex}{ext}"
    user_dir = Path(settings.UPLOAD_DIR) / str(current_user.id)
    user_dir.mkdir(parents=True, exist_ok=True)
    saved_path = user_dir / saved_name

    # Read + size check
    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > settings.MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({size_mb:.1f}MB). Max: {settings.MAX_FILE_SIZE_MB}MB",
        )

    saved_path.write_bytes(content)

    # Create DB record with 'processing' state
    report = Report(
        user_id=current_user.id,
        filename=file.filename,
        file_path=str(saved_path),
        original_text=None,
        simplified_text="⏳ Analyzing your report... This usually takes 5-15 seconds.",
        flagged_values="[]",
        suggested_questions="[]",
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    # Kick off AI processing in the background — request returns immediately
    background_tasks.add_task(_process_report_async, report.id, str(saved_path))

    return report


@router.get("", response_model=List[ReportSummary])
def list_my_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all reports belonging to the current user."""
    reports = (
        db.query(Report)
        .filter(Report.user_id == current_user.id)
        .order_by(Report.created_at.desc())
        .all()
    )
    return reports


@router.get("/{report_id}", response_model=ReportDetail)
def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific report. Users can only access their own reports."""
    report = (
        db.query(Report)
        .filter(Report.id == report_id, Report.user_id == current_user.id)
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.post("/{report_id}/reprocess", response_model=ReportDetail)
def reprocess_report(
    report_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Re-run AI analysis on an existing report (e.g. if it failed)."""
    report = (
        db.query(Report)
        .filter(Report.id == report_id, Report.user_id == current_user.id)
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Reset to processing state
    report.simplified_text = "⏳ Re-analyzing your report..."
    report.flagged_values = "[]"
    report.suggested_questions = "[]"
    db.commit()
    db.refresh(report)

    background_tasks.add_task(_process_report_async, report.id, report.file_path)
    return report


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a report (and its file). Users can only delete their own."""
    report = (
        db.query(Report)
        .filter(Report.id == report_id, Report.user_id == current_user.id)
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    try:
        os.remove(report.file_path)
    except FileNotFoundError:
        pass

    db.delete(report)
    db.commit()
    return None
