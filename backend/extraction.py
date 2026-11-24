"""
MediExtract AI — Backend re-export of Pydantic models for backward compatibility.
"""

from app.models.extraction import (
    TextExtractionRequest,
    ClinicalEntity,
    MedicationExtraction,
    LabExtraction,
    VitalSignExtraction,
    AllergyExtraction,
    TimelineEvent,
    ExtractionResponse,
)

__all__ = [
    "TextExtractionRequest",
    "ClinicalEntity",
    "MedicationExtraction",
    "LabExtraction",
    "VitalSignExtraction",
    "AllergyExtraction",
    "TimelineEvent",
    "ExtractionResponse",
]
