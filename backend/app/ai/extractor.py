"""
Text extraction from medical reports.

Handles:
  - Text-based PDFs (via pdfplumber)
  - Scanned PDFs (via pdf2image + pytesseract OCR)
  - Image files: PNG, JPG (via pytesseract)

Strategy: try fast text extraction first; fall back to OCR if no text found.
"""
from pathlib import Path
from typing import Tuple

import pdfplumber
import pytesseract
from PIL import Image
from pdf2image import convert_from_path


# If text extraction yields fewer than this many characters,
# we assume it's a scanned PDF and fall back to OCR.
MIN_TEXT_LENGTH = 50


def extract_text_from_pdf(file_path: str) -> Tuple[str, str]:
    """
    Extract text from a PDF. Returns (text, method_used).
    method_used is 'pdfplumber' or 'ocr'.
    """
    # First attempt: native text extraction (fast, works for digital PDFs)
    try:
        with pdfplumber.open(file_path) as pdf:
            pages_text = []
            for page in pdf.pages:
                t = page.extract_text() or ""
                pages_text.append(t)
            text = "\n\n".join(pages_text).strip()

        if len(text) >= MIN_TEXT_LENGTH:
            return text, "pdfplumber"
    except Exception as e:
        print(f"[extractor] pdfplumber failed: {e}")

    # Fallback: OCR each page (slower, works for scanned PDFs)
    try:
        images = convert_from_path(file_path, dpi=200)
        ocr_text = "\n\n".join(
            pytesseract.image_to_string(img) for img in images
        ).strip()
        return ocr_text, "ocr"
    except Exception as e:
        print(f"[extractor] OCR failed: {e}")
        return "", "failed"


def extract_text_from_image(file_path: str) -> Tuple[str, str]:
    """Extract text from a PNG or JPG via OCR."""
    try:
        img = Image.open(file_path)
        text = pytesseract.image_to_string(img).strip()
        return text, "ocr"
    except Exception as e:
        print(f"[extractor] image OCR failed: {e}")
        return "", "failed"


def extract_text(file_path: str) -> Tuple[str, str]:
    """Dispatch to the right extractor based on file extension."""
    ext = Path(file_path).suffix.lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    if ext in {".png", ".jpg", ".jpeg"}:
        return extract_text_from_image(file_path)
    return "", "unsupported"
