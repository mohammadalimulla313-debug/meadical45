"""
Tests for API Endpoints (/api/health, /api/extract/text, /api/extract/file).
Uses FastAPI TestClient and synthetic medical documents.
"""

import io
import pytest
from fastapi.testclient import TestClient
import pymupdf
from docx import Document

from app.main import app

client = TestClient(app)


def _make_pdf_bytes(text: str) -> bytes:
    """Create in-memory PDF bytes."""
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((50, 72), text)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def _make_docx_bytes(paragraphs: list[str]) -> bytes:
    """Create in-memory DOCX bytes."""
    doc = Document()
    for p in paragraphs:
        doc.add_paragraph(p)
    bio = io.BytesIO()
    doc.save(bio)
    return bio.getvalue()


class TestHealthEndpoint:
    """Tests for GET /api/health."""

    def test_health_check_status_code(self):
        response = client.get("/api/health")
        assert response.status_code == 200

    def test_health_check_payload(self):
        data = client.get("/api/health").json()
        assert data["status"] == "healthy"
        assert data["spacy_used"] is False
        assert data["external_apis"] is False
        assert data["engine"] == "local-rule-based-nlp"


class TestTextExtractionEndpoint:
    """Tests for POST /api/extract/text."""

    def test_extract_valid_clinical_note(self):
        payload = {
            "text": (
                "Patient is a 58-year-old presenting with acute chest pain and dyspnea. "
                "Denies fever or vomiting. Diagnosed with essential hypertension. "
                "Takes Lisinopril 10 mg PO daily. Vitals: BP 138/86 mmHg, HR 88 bpm. "
                "Labs: Troponin 0.08 ng/mL, WBC 11.8 K/uL. Allergies: Penicillin (rash)."
            )
        }
        response = client.post("/api/extract/text", json=payload)
        assert response.status_code == 200
        data = response.json()

        # Check response schema
        assert "metadata" in data
        assert "symptoms" in data
        assert "diagnoses" in data
        assert "medications" in data
        assert "lab_results" in data
        assert "vital_signs" in data
        assert "allergies" in data
        assert "counts" in data

        # Check counts match lists
        assert data["counts"]["symptoms"] == len(data["symptoms"])
        assert data["counts"]["diagnoses"] == len(data["diagnoses"])
        assert data["counts"]["medications"] == len(data["medications"])
        assert data["counts"]["lab_results"] == len(data["lab_results"])
        assert data["counts"]["vital_signs"] == len(data["vital_signs"])
        assert data["counts"]["allergies"] == len(data["allergies"])

        # Check specific extracted items
        symptom_texts = [s["text"].lower() for s in data["symptoms"]]
        assert "chest pain" in symptom_texts
        assert "dyspnea" in symptom_texts

        med_names = [m["name"].lower() for m in data["medications"]]
        assert "lisinopril" in med_names

        vital_names = [v["name"] for v in data["vital_signs"]]
        assert "Blood Pressure" in vital_names
        assert "Heart Rate" in vital_names

    def test_text_without_medical_info(self):
        payload = {"text": "Today the weather was sunny and clear in the city garden."}
        response = client.post("/api/extract/text", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["symptoms"] == []
        assert data["diagnoses"] == []
        assert data["medications"] == []
        assert data["lab_results"] == []
        assert data["vital_signs"] == []
        assert data["allergies"] == []
        assert all(count == 0 for count in data["counts"].values())

    def test_empty_and_short_text_rejected(self):
        # Empty text
        res1 = client.post("/api/extract/text", json={"text": ""})
        assert res1.status_code in (400, 422)

        # Whitespace only
        res2 = client.post("/api/extract/text", json={"text": "    "})
        assert res2.status_code in (400, 422)

        # Under 5 chars
        res3 = client.post("/api/extract/text", json={"text": "Pain"})
        assert res3.status_code in (400, 422)


class TestFileExtractionEndpoint:
    """Tests for POST /api/extract/file."""

    def test_txt_file_upload(self):
        txt_content = (
            "Patient with chronic cough and wheezing.\n"
            "History of asthma.\n"
            "Prescribed Albuterol inhaler 2 puffs q4h PRN."
        ).encode("utf-8")
        files = {"file": ("note.txt", txt_content, "text/plain")}
        response = client.post("/api/extract/file", files=files)
        assert response.status_code == 200
        data = response.json()
        assert data["metadata"]["source_type"] == "txt"
        assert len(data["symptoms"]) >= 1
        assert len(data["diagnoses"]) >= 1

    def test_pdf_file_upload(self):
        pdf_bytes = _make_pdf_bytes(
            "Cardiology Consult:\n"
            "Patient reports palpitations and fatigue.\n"
            "Assessment: Atrial fibrillation.\n"
            "Metoprolol 25 mg twice daily."
        )
        files = {"file": ("consult.pdf", pdf_bytes, "application/pdf")}
        response = client.post("/api/extract/file", files=files)
        assert response.status_code == 200
        data = response.json()
        assert data["metadata"]["source_type"] == "pdf"
        assert any(d["normalized_term"] == "atrial fibrillation" for d in data["diagnoses"])

    def test_docx_file_upload(self):
        docx_bytes = _make_docx_bytes([
            "Emergency Department Summary",
            "Chief Complaint: Severe headache and dizziness.",
            "Vital Signs: BP 150/95 mmHg, HR 82 bpm.",
            "NKDA."
        ])
        files = {"file": ("summary.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
        response = client.post("/api/extract/file", files=files)
        assert response.status_code == 200
        data = response.json()
        assert data["metadata"]["source_type"] == "docx"
        assert any(s["normalized_term"] == "headache" for s in data["symptoms"])
        assert any(a["is_nkda"] for a in data["allergies"])

    def test_unsupported_file_extension(self):
        files = {"file": ("test.png", b"\x89PNG\r\n\x1a\n", "image/png")}
        response = client.post("/api/extract/file", files=files)
        assert response.status_code == 400
        assert "Unsupported file type" in response.json()["detail"]

    def test_empty_file_upload(self):
        files = {"file": ("empty.txt", b"", "text/plain")}
        response = client.post("/api/extract/file", files=files)
        assert response.status_code == 400
        assert "empty" in response.json()["detail"]

    def test_oversized_file_upload(self):
        huge_bytes = b"0" * (10 * 1024 * 1024 + 100)
        files = {"file": ("large.txt", huge_bytes, "text/plain")}
        response = client.post("/api/extract/file", files=files)
        assert response.status_code == 400
        assert "exceeds" in response.json()["detail"]

    def test_corrupted_pdf_upload(self):
        corrupted_bytes = b"%PDF-1.5 corrupted invalid content that cannot be parsed by pymupdf"
        files = {"file": ("broken.pdf", corrupted_bytes, "application/pdf")}
        response = client.post("/api/extract/file", files=files)
        assert response.status_code == 400
        assert "Corrupted or invalid PDF" in response.json()["detail"]

    def test_corrupted_docx_upload(self):
        corrupted_bytes = b"PK\x03\x04 corrupted invalid docx content"
        files = {"file": ("broken.docx", corrupted_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
        response = client.post("/api/extract/file", files=files)
        assert response.status_code == 400
        assert "Corrupted or invalid DOCX" in response.json()["detail"]
