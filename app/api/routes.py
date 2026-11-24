"""
MediExtract AI — FastAPI API Route Handlers.
Defines endpoints for health check, clinical text extraction, and document file extraction.
"""

from __future__ import annotations

from datetime import datetime
from fastapi import APIRouter, File, HTTPException, Request, Response, UploadFile, status
from starlette.concurrency import run_in_threadpool

from app.models.extraction import ExtractionResponse, TextExtractionRequest
from app.services.clinical_extractor import extract_all
from app.services.document_parser import parse_document
from app.services.ocr_engine import extract_text_from_image
from app.services.pdf_generator import generate_pdf_report

router = APIRouter(prefix="/api", tags=["Clinical NLP"])


# ──────────────────────────────────────────────────────────────
# Health Check Endpoint
# ──────────────────────────────────────────────────────────────

@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """Service health and diagnostic status endpoint."""
    return {
        "status": "healthy",
        "engine": "local-rule-based-nlp",
        "spacy_used": False,
        "external_apis": False,
        "version": "1.0.0",
    }


# ──────────────────────────────────────────────────────────────
# Text Extraction Endpoint
# ──────────────────────────────────────────────────────────────

@router.post(
    "/extract/text",
    response_model=ExtractionResponse,
    status_code=status.HTTP_200_OK,
    summary="Extract clinical data from text note",
)
async def extract_from_text(request: TextExtractionRequest):
    """Extract clinical entities, vitals, labs, medications, and allergies from raw text."""
    if not request.text or len(request.text.strip()) < 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Clinical text must contain at least 5 characters after trimming.",
        )

    metadata = {"source_type": "text_input"}
    try:
        result = await run_in_threadpool(extract_all, request.text, metadata=metadata)
        return result
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Clinical extraction failed: {type(exc).__name__}: {str(exc)}",
        ) from exc


# ──────────────────────────────────────────────────────────────
# File Extraction Endpoint
# ──────────────────────────────────────────────────────────────

@router.post(
    "/extract/file",
    response_model=ExtractionResponse,
    status_code=status.HTTP_200_OK,
    summary="Extract clinical data from uploaded PDF, DOCX, or TXT file",
)
async def extract_from_file(file: UploadFile = File(...)):
    """Extract clinical entities from an uploaded clinical document (.pdf, .docx, .txt)."""
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file or filename provided.",
        )

    try:
        content = await file.read()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded file: {str(exc)}",
        ) from exc

    try:
        text, doc_metadata = await run_in_threadpool(parse_document, file.filename, content)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document parsing error: {type(exc).__name__}: {str(exc)}",
        ) from exc

    try:
        result = await run_in_threadpool(extract_all, text, metadata=doc_metadata)
        return result
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Extraction failed: {type(exc).__name__}: {str(exc)}",
        ) from exc


# ──────────────────────────────────────────────────────────────
# Image Extraction Endpoint (Local OCR + Clinical NLP)
# ──────────────────────────────────────────────────────────────

@router.post(
    "/extract/image",
    response_model=ExtractionResponse,
    status_code=status.HTTP_200_OK,
    summary="Extract text and clinical data from medical document image via local OCR",
)
async def extract_from_image(file: UploadFile = File(...)):
    """Extract text from medical image (JPG, JPEG, PNG, WEBP) using local OCR,
    then extract clinical entities, symptoms, medications, vitals, labs, and diagnoses."""
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No image file or filename provided.",
        )

    try:
        content = await file.read()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded image: {str(exc)}",
        ) from exc

    try:
        ocr_text, image_metadata, warnings = await run_in_threadpool(
            extract_text_from_image, content, file.filename
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Local OCR processing error: {type(exc).__name__}: {str(exc)}",
        ) from exc

    metadata = {
        "filename": file.filename,
        "source_type": "image",
        "image_metadata": image_metadata,
        "ocr_engine": image_metadata.get("ocr_engine", "local-ocr"),
        "ocr_text": ocr_text,
        "warnings": warnings,
    }

    try:
        result = await run_in_threadpool(extract_all, ocr_text, metadata=metadata)
        return result
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Clinical extraction failed on OCR text: {type(exc).__name__}: {str(exc)}",
        ) from exc


# ──────────────────────────────────────────────────────────────
# Vector PDF Export Endpoint (PyMuPDF Local Generator)
# ──────────────────────────────────────────────────────────────

@router.post(
    "/export/pdf",
    status_code=status.HTTP_200_OK,
    summary="Generate vector clinical extraction report PDF",
)
async def export_pdf_report(request: Request):
    """Generate a clean, professional vector clinical extraction PDF report using PyMuPDF.
    100% local, deterministic, zero external network calls."""
    try:
        body = await request.json()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid JSON payload: {str(exc)}",
        ) from exc

    results_data = body.get("results")
    if not results_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing 'results' object in request body.",
        )

    reviewer_info = body.get("reviewer")
    try:
        pdf_bytes = await run_in_threadpool(generate_pdf_report, results_data, reviewer_info)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"MediExtract_Clinical_Report_{timestamp}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Type": "application/pdf",
            },
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PDF generation failed: {type(exc).__name__}: {str(exc)}",
        ) from exc
