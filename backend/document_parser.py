"""
MediExtract AI — Backend re-export of document parser for backward compatibility.
"""

from app.services.document_parser import (
    ALLOWED_EXTENSIONS,
    MAX_FILE_SIZE_BYTES,
    validate_upload,
    extract_pdf,
    extract_docx,
    extract_txt,
    normalize_whitespace,
    parse_document,
)

__all__ = [
    "ALLOWED_EXTENSIONS",
    "MAX_FILE_SIZE_BYTES",
    "validate_upload",
    "extract_pdf",
    "extract_docx",
    "extract_txt",
    "normalize_whitespace",
    "parse_document",
]
