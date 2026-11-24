"""
MediExtract AI — Multi-Format Document Parser.
Handles PDF (PyMuPDF), DOCX (python-docx), and TXT file parsing with
comprehensive validation, size checks, corruption handling, and encoding fallback.
"""

from __future__ import annotations

import io
import re
from pathlib import Path
from typing import Tuple

import pymupdf  # PyMuPDF
from docx import Document as DocxDocument

from app.services.ocr_engine import (
    SUPPORTED_IMAGE_EXTENSIONS,
    extract_text_from_image,
)


# ──────────────────────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────────────────────

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


# ──────────────────────────────────────────────────────────────
# Validation
# ──────────────────────────────────────────────────────────────

def validate_upload(filename: str, content: bytes) -> str:
    """Validate uploaded document and return the lowercased extension.

    Raises:
        ValueError: On unsupported extension, empty content, or oversized files.
    """
    if not filename:
        raise ValueError("No filename provided.")

    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file type '{ext}'. Allowed types: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    if len(content) == 0:
        raise ValueError("Uploaded file is empty (0 bytes).")

    if len(content) > MAX_FILE_SIZE_BYTES:
        size_mb = len(content) / (1024 * 1024)
        raise ValueError(
            f"File size ({size_mb:.2f} MB) exceeds maximum limit of {MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB."
        )

    return ext


# ──────────────────────────────────────────────────────────────
# PDF Extraction (PyMuPDF)
# ──────────────────────────────────────────────────────────────

def extract_pdf(content: bytes) -> Tuple[str, int]:
    """Extract plain text and page count from PDF bytes.

    Raises:
        ValueError: On corrupt, encrypted, or image-only PDFs.
    """
    try:
        doc = pymupdf.open(stream=content, filetype="pdf")
    except Exception as exc:
        raise ValueError(f"Corrupted or invalid PDF file: {exc}") from exc

    try:
        if doc.is_encrypted:
            raise ValueError("PDF is encrypted / password-protected and cannot be read.")

        pages: list[str] = []
        page_count = len(doc)
        for page in doc:
            text = page.get_text("text")
            if text:
                pages.append(text)
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError(f"Failed to read PDF pages: {exc}") from exc
    finally:
        try:
            doc.close()
        except Exception:
            pass

    if not pages or not "".join(pages).strip():
        raise ValueError("PDF contains no extractable text (may be image-only / scanned).")

    return "\n".join(pages), page_count


# ──────────────────────────────────────────────────────────────
# DOCX Extraction (python-docx)
# ──────────────────────────────────────────────────────────────

def extract_docx(content: bytes) -> str:
    """Extract text from DOCX bytes, including paragraphs and tables.

    Raises:
        ValueError: On corrupt or empty DOCX files.
    """
    try:
        doc = DocxDocument(io.BytesIO(content))
    except Exception as exc:
        raise ValueError(f"Corrupted or invalid DOCX file: {exc}") from exc

    parts: list[str] = []

    # Paragraphs
    for para in doc.paragraphs:
        text = para.text.strip()
        if text:
            parts.append(text)

    # Tables
    for table in doc.tables:
        for row in table.rows:
            cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
            if cells:
                parts.append("  |  ".join(cells))

    if not parts:
        raise ValueError("DOCX file contains no extractable text.")

    return "\n".join(parts)


# ──────────────────────────────────────────────────────────────
# TXT Extraction
# ──────────────────────────────────────────────────────────────

def extract_txt(content: bytes) -> str:
    """Decode TXT bytes with fallback encoding chain: UTF-8 -> CP1252 -> Latin-1."""
    for encoding in ("utf-8", "cp1252", "latin-1"):
        try:
            return content.decode(encoding)
        except (UnicodeDecodeError, ValueError):
            continue
    return content.decode("latin-1", errors="replace")


# ──────────────────────────────────────────────────────────────
# Whitespace Normalization
# ──────────────────────────────────────────────────────────────

_MULTI_BLANK = re.compile(r"\n{3,}")
_MULTI_SPACE = re.compile(r"[^\S\n]{2,}")


def normalize_whitespace(text: str) -> str:
    """Collapse excessive blank lines and spaces while preserving line structure."""
    text = _MULTI_BLANK.sub("\n\n", text)
    text = _MULTI_SPACE.sub(" ", text)
    return text.strip()


# ──────────────────────────────────────────────────────────────
# Public Parsing Function
# ──────────────────────────────────────────────────────────────

def parse_document(filename: str, content: bytes) -> Tuple[str, dict]:
    """Parse document bytes and return cleaned text and metadata.

    Raises:
        ValueError: On validation error, corrupted file, or empty content.
    """
    ext = validate_upload(filename, content)
    metadata: dict = {
        "filename": filename,
        "source_type": ext.lstrip("."),
        "file_size_bytes": len(content),
    }

    if ext == ".pdf":
        raw_text, page_count = extract_pdf(content)
        metadata["page_count"] = page_count
    elif ext == ".docx":
        raw_text = extract_docx(content)
    else:  # .txt
        raw_text = extract_txt(content)

    cleaned = normalize_whitespace(raw_text)
    if len(cleaned.strip()) < 5:
        raise ValueError("Document contains insufficient text for clinical extraction (< 5 characters).")

    metadata["char_count"] = len(cleaned)
    return cleaned, metadata
