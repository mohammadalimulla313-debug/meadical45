"""
MediExtract AI — Backend re-export of clinical extractor for backward compatibility.
"""

from app.services.clinical_extractor import (
    extract_all,
)

__all__ = ["extract_all"]
