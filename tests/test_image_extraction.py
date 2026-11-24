"""
Unit and integration tests for MediExtract AI Image Input and Local OCR module.
Tests image validation, format rejection, corruption handling, OCR pipeline, and API endpoints.
"""

import io
import pytest
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw

from app.main import app
from app.services.ocr_engine import (
    SUPPORTED_IMAGE_EXTENSIONS,
    clean_ocr_text,
    validate_image,
)

client = TestClient(app)


def create_test_image(text: str = "Test Medical Note", format: str = "PNG") -> bytes:
    """Helper to generate an in-memory test image with text."""
    img = Image.new("RGB", (600, 200), color="white")
    draw = ImageDraw.Draw(img)
    draw.text((10, 10), text, fill="black")
    buf = io.BytesIO()
    img.save(buf, format=format)
    return buf.getvalue()


class TestImageValidation:
    """Tests for image validation and security checks."""

    def test_valid_png(self):
        content = create_test_image("Normal Note", "PNG")
        ext, meta = validate_image("scan.png", content)
        assert ext == ".png"
        assert meta["format"] == "PNG"
        assert meta["width"] == 600
        assert meta["height"] == 200

    def test_valid_jpeg(self):
        content = create_test_image("Normal Note", "JPEG")
        ext, meta = validate_image("record.jpg", content)
        assert ext == ".jpg"
        assert meta["format"] == "JPEG"

    def test_valid_webp(self):
        content = create_test_image("Normal Note", "WEBP")
        ext, meta = validate_image("chart.webp", content)
        assert ext == ".webp"
        assert meta["format"] == "WEBP"

    def test_empty_image_rejected(self):
        with pytest.raises(ValueError, match="empty"):
            validate_image("empty.png", b"")

    def test_unsupported_extension_rejected(self):
        with pytest.raises(ValueError, match="Unsupported image format"):
            validate_image("report.pdf", b"%PDF-1.4...")

    def test_oversized_image_rejected(self):
        fake_large = b"0" * (10 * 1024 * 1024 + 1)
        with pytest.raises(ValueError, match="exceeds maximum"):
            validate_image("large.png", fake_large)

    def test_corrupted_image_rejected(self):
        with pytest.raises(ValueError, match="Corrupted or invalid"):
            validate_image("broken.png", b"\x89PNG\r\n\x1a\nCorruptedGarbageBytesHere")

    def test_format_mismatch_rejected(self):
        # A JPEG file saved with .png extension should be caught or detected
        jpeg_bytes = create_test_image("Mismatch Note", "JPEG")
        # Extension says .png but header is JPEG
        with pytest.raises(ValueError, match="mismatch"):
            validate_image("mismatch.png", jpeg_bytes)


class TestImageApiEndpoint:
    """Tests for POST /api/extract/image endpoint."""

    def test_image_endpoint_success(self):
        content = create_test_image(
            "Patient with hypertension and chest pain. BP 130/85 mmHg. Aspirin 81 mg daily.",
            "PNG",
        )
        files = {"file": ("clinical_note.png", content, "image/png")}
        response = client.post("/api/extract/image", files=files)
        assert response.status_code == 200
        data = response.json()

        assert "metadata" in data
        assert "counts" in data
        assert "symptoms" in data
        assert "diagnoses" in data
        assert "medications" in data
        assert "vital_signs" in data
        assert "ocr_text" in data
        assert "image_metadata" in data
        assert data["image_metadata"]["format"] == "PNG"

    def test_image_endpoint_no_file(self):
        response = client.post("/api/extract/image")
        assert response.status_code == 422

    def test_image_endpoint_corrupted_file(self):
        files = {"file": ("bad.png", b"not-an-image", "image/png")}
        response = client.post("/api/extract/image", files=files)
        assert response.status_code == 400
        assert "Corrupted or invalid" in response.json()["detail"]

    def test_image_endpoint_unsupported_ext(self):
        files = {"file": ("bad.exe", b"binarycontent", "application/octet-stream")}
        response = client.post("/api/extract/image", files=files)
        assert response.status_code == 400
        assert "Unsupported image format" in response.json()["detail"]


def test_clean_ocr_text():
    raw = "Line 1\r\n\r\n\r\n\r\nLine 2   \r\n"
    cleaned = clean_ocr_text(raw)
    assert "\r" not in cleaned
    assert "Line 1\n\nLine 2" in cleaned
