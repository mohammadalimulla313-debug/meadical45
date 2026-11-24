"""
MediExtract AI — Local OCR Engine.
Performs 100% offline text extraction from medical document images (JPG, JPEG, PNG, WEBP).
Uses local Windows Native OCR (Windows.Media.Ocr) or local Tesseract executable via standard subprocess.
Zero cloud APIs, zero external network calls, zero native DLL NLP dependencies.
"""

from __future__ import annotations

import io
import json
import logging
import os
import re
import shutil
import subprocess
import tempfile
import time
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

from PIL import Image

logger = logging.getLogger("mediextract.ocr")

# ──────────────────────────────────────────────────────────────
# Constants & Configuration
# ──────────────────────────────────────────────────────────────

SUPPORTED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
SUPPORTED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP"}
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
OCR_TIMEOUT_SECONDS = 35

WIN_OCR_SCRIPT_PATH = Path(__file__).parent / "win_ocr.ps1"

# Known local Tesseract paths on Windows
COMMON_TESSERACT_PATHS = [
    Path(os.environ.get("TESSERACT_PATH", "")),
    Path(r"C:\Program Files\Tesseract-OCR\tesseract.exe"),
    Path(r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe"),
    Path(os.path.expandvars(r"%LOCALAPPDATA%\Programs\Tesseract-OCR\tesseract.exe")),
]


# ──────────────────────────────────────────────────────────────
# Image Validation
# ──────────────────────────────────────────────────────────────

def validate_image(filename: str, content: bytes) -> Tuple[str, Dict[str, Any]]:
    """Validate uploaded image extension, size, and actual decoded binary content.

    Args:
        filename: Name of the uploaded file.
        content: Raw bytes of the image.

    Returns:
        Tuple of (canonical_extension, image_metadata_dict)

    Raises:
        ValueError: If file is missing, oversized, empty, corrupted, or not a supported image.
    """
    if not filename:
        raise ValueError("No image filename provided.")

    ext = Path(filename).suffix.lower()
    if ext not in SUPPORTED_IMAGE_EXTENSIONS:
        raise ValueError(
            f"Unsupported image format '{ext}'. Allowed image formats: {', '.join(sorted(SUPPORTED_IMAGE_EXTENSIONS))}"
        )

    if not content or len(content) == 0:
        raise ValueError("Uploaded image file is empty (0 bytes).")

    if len(content) > MAX_IMAGE_SIZE_BYTES:
        size_mb = len(content) / (1024 * 1024)
        raise ValueError(
            f"Image size ({size_mb:.2f} MB) exceeds maximum allowed limit of {MAX_IMAGE_SIZE_BYTES // (1024 * 1024)} MB."
        )

    # Validate image header & content decoding using Pillow
    try:
        with Image.open(io.BytesIO(content)) as img:
            detected_format = (img.format or "").upper()
            if detected_format not in SUPPORTED_IMAGE_FORMATS:
                raise ValueError(
                    f"Unsupported binary image format '{detected_format}'. Allowed formats: {', '.join(sorted(SUPPORTED_IMAGE_FORMATS))}"
                )

            expected_format = {
                ".jpg": "JPEG",
                ".jpeg": "JPEG",
                ".png": "PNG",
                ".webp": "WEBP",
            }.get(ext)
            if expected_format and detected_format != expected_format:
                raise ValueError(
                    f"Image content format mismatch: file claims '{ext}' but actual binary content is '{detected_format}'."
                )

            width, height = img.size
            mode = img.mode
            img.verify()
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError(f"Corrupted or invalid image data: {str(exc)}") from exc

    metadata = {
        "filename": Path(filename).name,
        "format": detected_format,
        "extension": ext,
        "width": width,
        "height": height,
        "color_mode": mode,
        "file_size_bytes": len(content),
    }

    return ext, metadata


# ──────────────────────────────────────────────────────────────
# Local OCR Detectors & Runners
# ──────────────────────────────────────────────────────────────

def find_tesseract_binary() -> Optional[str]:
    """Find local Tesseract OCR executable if installed."""
    which_path = shutil.which("tesseract")
    if which_path and os.path.isfile(which_path):
        return which_path

    for p in COMMON_TESSERACT_PATHS:
        if p and p.is_file():
            return str(p)

    return None


def run_tesseract_ocr(image_path: str, tesseract_cmd: str) -> Dict[str, Any]:
    """Execute local Tesseract binary via standard library subprocess."""
    start_time = time.perf_counter()
    cmd = [tesseract_cmd, image_path, "stdout", "--oem", "1", "-l", "eng"]
    try:
        proc = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=OCR_TIMEOUT_SECONDS,
            check=False,
        )
        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        if proc.returncode != 0:
            logger.warning("Tesseract exited with code %s: %s", proc.returncode, proc.stderr.strip())
            return {
                "success": False,
                "text": "",
                "engine": "tesseract-ocr",
                "error": proc.stderr.strip(),
                "duration_ms": duration_ms,
            }

        raw_text = proc.stdout or ""
        return {
            "success": True,
            "text": raw_text,
            "engine": "tesseract-ocr",
            "duration_ms": duration_ms,
        }
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "text": "",
            "engine": "tesseract-ocr",
            "error": "OCR operation timed out.",
            "duration_ms": round((time.perf_counter() - start_time) * 1000, 2),
        }
    except Exception as exc:
        return {
            "success": False,
            "text": "",
            "engine": "tesseract-ocr",
            "error": str(exc),
            "duration_ms": round((time.perf_counter() - start_time) * 1000, 2),
        }


def run_windows_native_ocr(image_path: str) -> Dict[str, Any]:
    """Execute Windows Native OCR (Windows.Media.Ocr) via PowerShell subprocess.

    100% offline, built-in to Windows 10/11, zero extra installation required.
    """
    if not WIN_OCR_SCRIPT_PATH.is_file():
        return {
            "success": False,
            "text": "",
            "engine": "windows-native-ocr",
            "error": f"WinOCR script not found at {WIN_OCR_SCRIPT_PATH}",
            "duration_ms": 0,
        }

    start_time = time.perf_counter()
    cmd = [
        "powershell",
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        str(WIN_OCR_SCRIPT_PATH),
        "-ImagePath",
        image_path,
    ]

    try:
        proc = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=OCR_TIMEOUT_SECONDS,
            check=False,
        )
        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

        if proc.returncode != 0:
            err_msg = proc.stderr.strip() or f"PowerShell exited with code {proc.returncode}"
            logger.warning("Windows Native OCR error: %s", err_msg)
            return {
                "success": False,
                "text": "",
                "engine": "windows-native-ocr",
                "error": err_msg,
                "duration_ms": duration_ms,
            }

        stdout_clean = (proc.stdout or "").strip()
        if not stdout_clean:
            return {
                "success": True,
                "text": "",
                "engine": "windows-native-ocr",
                "lines_count": 0,
                "duration_ms": duration_ms,
            }

        # Parse JSON output from win_ocr.ps1
        try:
            data = json.loads(stdout_clean)
            return {
                "success": True,
                "text": data.get("Text", ""),
                "engine": "windows-native-ocr",
                "lines_count": data.get("LinesCount", 0),
                "angle": data.get("Angle"),
                "duration_ms": duration_ms,
            }
        except json.JSONDecodeError:
            # Fallback to direct text
            return {
                "success": True,
                "text": stdout_clean,
                "engine": "windows-native-ocr",
                "duration_ms": duration_ms,
            }

    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "text": "",
            "engine": "windows-native-ocr",
            "error": "Windows Native OCR operation timed out.",
            "duration_ms": round((time.perf_counter() - start_time) * 1000, 2),
        }
    except Exception as exc:
        return {
            "success": False,
            "text": "",
            "engine": "windows-native-ocr",
            "error": str(exc),
            "duration_ms": round((time.perf_counter() - start_time) * 1000, 2),
        }


# ──────────────────────────────────────────────────────────────
# Main OCR Entry Point
# ──────────────────────────────────────────────────────────────

def clean_ocr_text(text: str) -> str:
    """Normalize whitespace and line endings conservatively without altering medical terms."""
    if not text:
        return ""
    # Normalize Windows line breaks
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Collapse 3+ consecutive newlines to 2
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Strip trailing and leading whitespace
    return text.strip()


def extract_text_from_image(
    content: bytes, filename: str
) -> Tuple[str, Dict[str, Any], list[str]]:
    """Complete image processing and local OCR pipeline.

    1. Validates image extension, size, and binary integrity.
    2. Safely writes to temporary file with guaranteed cleanup.
    3. Runs available local OCR engine (Windows Native OCR or Tesseract).
    4. Cleans whitespace conservatively.
    5. Returns (ocr_text, metadata_dict, warnings_list).
    """
    ext, image_meta = validate_image(filename, content)
    warnings: list[str] = []

    # Safe temporary file
    temp_file = None
    try:
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as f:
            f.write(content)
            temp_file = f.name

        # Determine OCR engine
        tesseract_bin = find_tesseract_binary()
        ocr_result: Dict[str, Any] = {}

        if tesseract_bin:
            logger.info("Using local Tesseract executable at %s", tesseract_bin)
            ocr_result = run_tesseract_ocr(temp_file, tesseract_bin)
            if not ocr_result.get("success"):
                logger.info("Tesseract failed; falling back to Windows Native OCR")
                ocr_result = run_windows_native_ocr(temp_file)
        else:
            logger.info("Using Windows Native OCR (Windows.Media.Ocr)")
            ocr_result = run_windows_native_ocr(temp_file)

        raw_text = ocr_result.get("text", "")
        cleaned_text = clean_ocr_text(raw_text)

        engine_used = ocr_result.get("engine", "unknown-local-ocr")
        image_meta["ocr_engine"] = engine_used
        image_meta["ocr_processing_time_ms"] = ocr_result.get("duration_ms", 0)

        if "angle" in ocr_result and ocr_result["angle"] is not None:
            image_meta["text_angle"] = ocr_result["angle"]

        if not ocr_result.get("success"):
            err = ocr_result.get("error", "Unknown OCR failure")
            warnings.append(f"Local OCR engine reported an issue: {err}")

        if not cleaned_text:
            warnings.append(
                "No readable medical text was detected in the document image. "
                "Ensure image has sufficient contrast and resolution."
            )

        return cleaned_text, image_meta, warnings

    finally:
        if temp_file and os.path.exists(temp_file):
            try:
                os.unlink(temp_file)
            except Exception:
                pass
