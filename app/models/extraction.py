"""
MediExtract AI — Pydantic v2 Data Contracts for Clinical Entity Extraction.
Fully deterministic, strictly typed models for clinical notes and document extraction.
"""

from __future__ import annotations

from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator


# ──────────────────────────────────────────────────────────────
# Request Schemas
# ──────────────────────────────────────────────────────────────

class TextExtractionRequest(BaseModel):
    """Incoming text payload for clinical extraction."""
    text: str = Field(..., min_length=5, description="Clinical note text (min 5 chars after trimming)")

    @field_validator("text", mode="before")
    @classmethod
    def strip_and_validate(cls, v: str) -> str:
        if not isinstance(v, str):
            raise ValueError("Input text must be a string.")
        stripped = v.strip()
        if len(stripped) < 5:
            raise ValueError("Clinical text must be at least 5 characters after trimming whitespace.")
        return stripped


# ──────────────────────────────────────────────────────────────
# Entity Schemas
# ──────────────────────────────────────────────────────────────

class ClinicalEntity(BaseModel):
    """A clinical entity (symptom, condition/diagnosis, family history) with assertion status."""
    text: str = Field(..., description="Exact matched span from the source text")
    normalized_term: str = Field(..., description="Canonical medical concept name")
    category: Literal["symptom", "diagnosis", "allergy", "family_history"] = Field(
        ..., description="Entity category"
    )
    status: Literal["present", "absent", "historical", "uncertain", "family_history"] = Field(
        default="present", description="Clinical assertion status"
    )
    source_sentence: str = Field(default="", description="The sentence from which this entity was extracted")
    trigger_word: Optional[str] = Field(default=None, description="Trigger word that caused assertion classification")
    rule_id: Optional[str] = Field(default=None, description="Deterministic rule identifier for traceability")


class MedicationExtraction(BaseModel):
    """A medication entity with dosage, frequency, route, and status."""
    name: str = Field(..., description="Medication generic or brand name")
    dosage: Optional[str] = Field(default=None, description="Dosage (e.g. '500 mg', '10 mg')")
    frequency: Optional[str] = Field(default=None, description="Frequency (e.g. 'twice daily', 'daily')")
    route: Optional[str] = Field(default=None, description="Route of administration (e.g. 'PO', 'IV')")
    status: Literal["active", "discontinued", "historical"] = Field(
        default="active", description="Medication regimen status"
    )
    source_sentence: str = Field(default="", description="Source sentence from which medication was extracted")
    trigger_word: Optional[str] = Field(default=None, description="Regimen status trigger word")
    rule_id: Optional[str] = Field(default="RULE-MED-REGEX-01", description="Deterministic rule identifier")


class LabExtraction(BaseModel):
    """A laboratory test result with measured value and reference range flag."""
    test_name: str = Field(..., description="Lab test name as found in text")
    normalized_test: str = Field(..., description="Canonical lab test name")
    value: str = Field(..., description="Measured laboratory result value")
    unit: Optional[str] = Field(default=None, description="Unit of measurement")
    flag: Optional[Literal["HIGH", "LOW", "NORMAL", "CRITICAL"]] = Field(
        default=None, description="Clinical abnormal flag"
    )
    source_sentence: str = Field(default="", description="Source sentence containing the lab result")
    rule_id: Optional[str] = Field(default="RULE-LAB-RANGE-01", description="Deterministic rule identifier")


class VitalSignExtraction(BaseModel):
    """A vital sign measurement."""
    name: str = Field(..., description="Vital sign name (e.g. 'Blood Pressure', 'Heart Rate')")
    value: str = Field(..., description="Measured value (e.g. '120/80', '72')")
    unit: str = Field(default="", description="Unit of measurement (e.g. 'mmHg', 'bpm', '°F')")
    source_sentence: str = Field(default="", description="Source sentence containing the measurement")
    rule_id: Optional[str] = Field(default="RULE-VITAL-NORM-01", description="Deterministic rule identifier")


class AllergyExtraction(BaseModel):
    """An allergy or adverse reaction entry, or NKDA declaration."""
    allergen: str = Field(..., description="Substance or allergen name")
    reaction: Optional[str] = Field(default=None, description="Clinical reaction (e.g. 'rash', 'hives')")
    is_nkda: bool = Field(default=False, description="True if this represents No Known Drug Allergies")
    source_sentence: str = Field(default="", description="Source sentence containing the allergy statement")
    rule_id: Optional[str] = Field(default="RULE-ALLERGY-MATCH-01", description="Deterministic rule identifier")


class TimelineEvent(BaseModel):
    """An explicitly dated medical event or document date for the medical timeline."""
    date_str: str = Field(..., description="Explicit date string found in text")
    event_type: Literal["document_date", "medical_event", "clinical_finding"] = Field(
        default="clinical_finding", description="Classification of the dated event"
    )
    description: str = Field(..., description="Summary or finding associated with this date")
    category: Optional[str] = Field(default=None, description="Associated clinical category")
    source_sentence: str = Field(default="", description="Source sentence containing the explicit date")
    rule_id: Optional[str] = Field(default="RULE-TIMELINE-DATE-01", description="Deterministic rule identifier")


# ──────────────────────────────────────────────────────────────
# Aggregated Response Schema
# ──────────────────────────────────────────────────────────────

class ExtractionResponse(BaseModel):
    """Full extraction response returned by all extraction endpoints."""
    metadata: dict = Field(default_factory=dict, description="Metadata such as engine, timings, character counts")
    ocr_text: Optional[str] = Field(default=None, description="Original OCR text recognized from image if source is an image")
    image_metadata: Optional[dict] = Field(default=None, description="Image dimensions, format, and local OCR details")
    warnings: list[str] = Field(default_factory=list, description="Processing or extraction warnings")
    symptoms: list[ClinicalEntity] = Field(default_factory=list, description="Present, absent, historical, or uncertain symptoms")
    diagnoses: list[ClinicalEntity] = Field(default_factory=list, description="Present, historical, or uncertain diseases & diagnoses")
    family_history: list[ClinicalEntity] = Field(default_factory=list, description="Family medical history conditions")
    medications: list[MedicationExtraction] = Field(default_factory=list, description="Medication entries with dosage and frequency")
    lab_results: list[LabExtraction] = Field(default_factory=list, description="Laboratory results with values and flags")
    vital_signs: list[VitalSignExtraction] = Field(default_factory=list, description="Vital signs measurements")
    allergies: list[AllergyExtraction] = Field(default_factory=list, description="Allergies and adverse drug reactions")
    timeline: list[TimelineEvent] = Field(default_factory=list, description="Explicitly dated medical timeline events")
    counts: dict[str, int] = Field(default_factory=dict, description="Count of extracted entities per category")
