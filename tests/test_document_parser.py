"""
Tests for Document Parser (PDF, DOCX, TXT, validation, corruption, limits).
Uses only synthetic test files created on-the-fly.
"""

import io
import pytest
import pymupdf
from docx import Document

from app.services.document_parser import (
    ALLOWED_EXTENSIONS,
    MAX_FILE_SIZE_BYTES,
    extract_docx,
    extract_pdf,
    extract_txt,
    normalize_whitespace,
    parse_document,
    validate_upload,
)


def _create_synthetic_pdf(text: str) -> bytes:
    """Generate in-memory synthetic PDF using PyMuPDF."""
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((50, 72), text)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def _create_synthetic_docx(paragraphs: list[str], table_data: list[list[str]] = None) -> bytes:
    """Generate in-memory synthetic DOCX using python-docx."""
    doc = Document()
    for p in paragraphs:
        doc.add_paragraph(p)
    if table_data:
        table = doc.add_table(rows=len(table_data), cols=len(table_data[0]))
        for r_idx, row in enumerate(table_data):
            for c_idx, val in enumerate(row):
                table.cell(r_idx, c_idx).text = val
    bio = io.BytesIO()
    doc.save(bio)
    return bio.getvalue()


class TestDocumentValidation:
    """Tests for file validation logic."""

    def test_valid_extensions(self):
        assert validate_upload("patient.pdf", b"dummy content") == ".pdf"
        assert validate_upload("report.docx", b"dummy content") == ".docx"
        assert validate_upload("notes.txt", b"dummy content") == ".txt"

    def test_unsupported_extensions(self):
        with pytest.raises(ValueError, match="Unsupported file type"):
            validate_upload("image.png", b"dummy content")

        with pytest.raises(ValueError, match="Unsupported file type"):
            validate_upload("script.exe", b"dummy content")

    def test_empty_file_rejected(self):
        with pytest.raises(ValueError, match="empty"):
            validate_upload("empty.txt", b"")

    def test_oversized_file_rejected(self):
        oversized = b"A" * (MAX_FILE_SIZE_BYTES + 1024)
        with pytest.raises(ValueError, match="exceeds"):
            validate_upload("large.txt", oversized)


class TestTextExtraction:
    """Tests for TXT decoding and whitespace normalization."""

    def test_utf8_txt(self):
        text = "Patient reports mild cough and headache."
        raw_bytes = text.encode("utf-8")
        extracted, meta = parse_document("note.txt", raw_bytes)
        assert "cough" in extracted
        assert meta["source_type"] == "txt"

    def test_latin1_txt(self):
        text = "Patient température 38.5°C."
        raw_bytes = text.encode("latin-1")
        extracted = extract_txt(raw_bytes)
        assert "38.5" in extracted

    def test_whitespace_normalization(self):
        messy = "Line 1.\n\n\n\nLine 2.   Lots    of   spaces."
        cleaned = normalize_whitespace(messy)
        assert "\n\n\n" not in cleaned
        assert "    " not in cleaned


class TestPdfExtraction:
    """Tests for PDF parsing with PyMuPDF."""

    def test_valid_pdf_extraction(self):
        sample = "Patient diagnosed with hypertension and type 2 diabetes."
        pdf_bytes = _create_synthetic_pdf(sample)
        extracted, meta = parse_document("clinic_note.pdf", pdf_bytes)
        assert "hypertension" in extracted
        assert meta["source_type"] == "pdf"
        assert meta["page_count"] >= 1

    def test_corrupted_pdf_handling(self):
        corrupted_bytes = b"%PDF-1.4 corrupted garbage bytes 0123456789"
        with pytest.raises(ValueError, match="Corrupted or invalid PDF"):
            extract_pdf(corrupted_bytes)


class TestDocxExtraction:
    """Tests for DOCX parsing with python-docx."""

    def test_valid_docx_extraction_with_tables(self):
        paragraphs = [
            "Chief Complaint: Chest pain.",
            "Past Medical History: Asthma.",
        ]
        table = [
            ["Lab Test", "Result"],
            ["WBC", "12.5 K/uL"],
            ["Glucose", "180 mg/dL"],
        ]
        docx_bytes = _create_synthetic_docx(paragraphs, table)
        extracted, meta = parse_document("discharge.docx", docx_bytes)
        assert "Chest pain" in extracted
        assert "WBC" in extracted
        assert meta["source_type"] == "docx"

    def test_corrupted_docx_handling(self):
        corrupted_bytes = b"PK\x03\x04 fake corrupted docx content"
        with pytest.raises(ValueError, match="Corrupted or invalid DOCX"):
            extract_docx(corrupted_bytes)


class TestEdgeCases:
    """Tests for short documents and edge conditions."""

    def test_insufficient_text(self):
        tiny_txt = b"abc"
        with pytest.raises(ValueError, match="insufficient text"):
            parse_document("tiny.txt", tiny_txt)
