"""
Tests for PDF Export endpoint (/api/export/pdf).
Validates local vector PDF report generation with PyMuPDF.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_export_pdf_missing_results():
    response = client.post("/api/export/pdf", json={})
    assert response.status_code == 400
    assert "Missing 'results'" in response.json()["detail"]


def test_export_pdf_success():
    sample_payload = {
        "results": {
            "metadata": {
                "source_type": "clinical_note",
                "sentence_count": 5,
                "processing_time_ms": 12.5,
            },
            "counts": {
                "symptoms": 1,
                "diagnoses": 1,
                "medications": 1,
                "vital_signs": 1,
                "lab_results": 1,
                "allergies": 1,
                "family_history": 0,
            },
            "symptoms": [
                {
                    "text": "shortness of breath",
                    "normalized_term": "dyspnea",
                    "status": "present",
                    "source_sentence": "Patient reports shortness of breath.",
                }
            ],
            "diagnoses": [
                {
                    "text": "hypertension",
                    "normalized_term": "hypertension",
                    "status": "present",
                    "source_sentence": "History of hypertension.",
                }
            ],
            "medications": [
                {
                    "name": "Lisinopril",
                    "dosage": "10 mg",
                    "frequency": "daily",
                    "route": "oral",
                    "status": "active",
                    "source_sentence": "Takes Lisinopril 10 mg daily.",
                }
            ],
            "vital_signs": [
                {
                    "name": "Blood Pressure",
                    "value": "130/85",
                    "unit": "mmHg",
                    "source_sentence": "BP 130/85 mmHg.",
                }
            ],
            "lab_results": [
                {
                    "test_name": "Hemoglobin A1c",
                    "normalized_test": "Hemoglobin A1c",
                    "value": "6.8",
                    "unit": "%",
                    "flag": "HIGH",
                    "source_sentence": "HbA1c was 6.8%.",
                }
            ],
            "allergies": [
                {
                    "allergen": "Penicillin",
                    "reaction": "rash",
                    "is_nkda": False,
                    "source_sentence": "Allergic to Penicillin: rash.",
                }
            ],
            "timeline": [],
        },
        "reviewer": {
            "name": "Dr. Sarah Chen, MD",
            "department": "Informatics & Cardiology",
            "date": "2026-11-24",
            "notes": "Verified clinical rule-based extraction.",
        },
    }

    response = client.post("/api/export/pdf", json=sample_payload)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "attachment; filename=" in response.headers["content-disposition"]
    # PDF starts with %PDF-
    assert response.content.startswith(b"%PDF-")
    assert len(response.content) > 1000
