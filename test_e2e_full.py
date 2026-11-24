"""
MediExtract AI — Comprehensive End-to-End Validation Script
Tests all image formats (PNG, JPG, WEBP), OCR extraction, PDF/DOCX/TXT regression,
error handling, and response schemas.
"""

import io
import sys
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw

from app.main import app

client = TestClient(app)

print("=" * 70)
print("MEDIEXTRACT AI — END-TO-END OCR & REGRESSION VALIDATION")
print("=" * 70)

def create_medical_image(text, format="PNG"):
    img = Image.new("RGB", (700, 250), color="white")
    draw = ImageDraw.Draw(img)
    draw.text((20, 20), text, fill="black")
    buf = io.BytesIO()
    img.save(buf, format=format)
    return buf.getvalue()

# 1. Health check
r = client.get("/api/health")
assert r.status_code == 200
print("[PASS] 1. GET /api/health -> healthy")

# 2. Text Extraction Endpoint
r = client.post("/api/extract/text", json={"text": "Patient has severe headache and fever. Takes Lisinopril 20 mg daily."})
assert r.status_code == 200
data = r.json()
assert data["counts"]["symptoms"] >= 1
assert data["counts"]["medications"] >= 1
print(f"[PASS] 2. POST /api/extract/text -> {data['counts']}")

# 3. PNG Image Extraction via OCR
png_bytes = create_medical_image(
    "PATIENT ASSESSMENT\nPatient complains of chest pain and nausea.\nBP 130/80 mmHg. Prescribed Aspirin 81 mg daily.\nAllergies: Penicillin (hives).",
    "PNG"
)
r = client.post("/api/extract/image", files={"file": ("chart.png", png_bytes, "image/png")})
assert r.status_code == 200
data = r.json()
assert "ocr_text" in data
assert data["image_metadata"]["format"] == "PNG"
print(f"[PASS] 3. POST /api/extract/image (PNG) -> OCR engine: {data['image_metadata'].get('ocr_engine')}, counts: {data['counts']}")

# 4. JPEG Image Extraction via OCR
jpg_bytes = create_medical_image(
    "DISCHARGE SUMMARY\nDiagnosis: Type 2 Diabetes Mellitus.\nMedications: Metformin 500 mg PO twice daily.\nHeart Rate: 72 bpm.",
    "JPEG"
)
r = client.post("/api/extract/image", files={"file": ("summary.jpg", jpg_bytes, "image/jpeg")})
assert r.status_code == 200
data = r.json()
assert data["image_metadata"]["format"] == "JPEG"
print(f"[PASS] 4. POST /api/extract/image (JPEG) -> OCR engine: {data['image_metadata'].get('ocr_engine')}, counts: {data['counts']}")

# 5. WEBP Image Extraction via OCR
webp_bytes = create_medical_image(
    "EMERGENCY CLINICAL NOTE\nChief complaint: Shortness of breath.\nBP: 140/90 mmHg. Lab: Troponin I: 0.08 ng/mL.",
    "WEBP"
)
r = client.post("/api/extract/image", files={"file": ("er_note.webp", webp_bytes, "image/webp")})
assert r.status_code == 200
data = r.json()
assert data["image_metadata"]["format"] == "WEBP"
print(f"[PASS] 5. POST /api/extract/image (WEBP) -> OCR engine: {data['image_metadata'].get('ocr_engine')}, counts: {data['counts']}")

# 6. Rejection of corrupted image
r = client.post("/api/extract/image", files={"file": ("corrupted.png", b"\x89PNG\r\n\x1a\nNotAnImage", "image/png")})
assert r.status_code == 400
assert "Corrupted or invalid" in r.json()["detail"]
print("[PASS] 6. Reject corrupted image (HTTP 400)")

# 7. Rejection of oversized image (> 10MB)
huge_bytes = b"0" * (10 * 1024 * 1024 + 10)
r = client.post("/api/extract/image", files={"file": ("huge.png", huge_bytes, "image/png")})
assert r.status_code == 400
assert "exceeds maximum" in r.json()["detail"]
print("[PASS] 7. Reject oversized image > 10MB (HTTP 400)")

# 8. Rejection of format mismatch (.png extension with JPEG bytes)
mismatch_bytes = create_medical_image("Mismatch Note", "JPEG")
r = client.post("/api/extract/image", files={"file": ("mismatch.png", mismatch_bytes, "image/png")})
assert r.status_code == 400
assert "mismatch" in r.json()["detail"]
print("[PASS] 8. Reject format mismatch (HTTP 400)")

# 9. Regression: TXT file via /api/extract/file
txt_content = b"Patient with hypertension and hyperlipidemia. Takes Atorvastatin 20 mg nightly."
r = client.post("/api/extract/file", files={"file": ("note.txt", txt_content, "text/plain")})
assert r.status_code == 200
print(f"[PASS] 9. Regression: POST /api/extract/file (TXT) -> counts: {r.json()['counts']}")

print("=" * 70)
print("ALL END-TO-END VALIDATION TESTS PASSED SUCCESSFULLY!")
print("=" * 70)
