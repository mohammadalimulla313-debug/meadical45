"""
MediExtract AI — Backend re-export of context analyzer for backward compatibility.
"""

from app.services.context_analyzer import (
    AssertionStatus,
    split_sentences,
    split_clauses,
    detect_section,
    classify_assertion,
    classify_assertion_with_trigger,
    classify_medication_status,
)

__all__ = [
    "AssertionStatus",
    "split_sentences",
    "split_clauses",
    "detect_section",
    "classify_assertion",
    "classify_assertion_with_trigger",
    "classify_medication_status",
]
