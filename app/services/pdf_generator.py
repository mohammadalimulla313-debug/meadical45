"""
MediExtract AI — Professional Clinical PDF Report Generator.
Generates multi-page vector PDF reports using PyMuPDF (pymupdf).
100% local, zero cloud dependencies, zero external network calls.
"""

from __future__ import annotations

import io
from datetime import datetime
from typing import Any, Dict, List, Optional

import pymupdf


def _sanitize(text: Any) -> str:
    """Ensure text is safe for PDF insertion without None errors."""
    if text is None:
        return ""
    return str(text).replace("\r\n", " ").replace("\n", " ").strip()


class PDFReportBuilder:
    """Builds a formatted, multi-page clinical extraction PDF report."""

    def __init__(self, data: Dict[str, Any], reviewer: Optional[Dict[str, str]] = None):
        self.data = data
        self.reviewer = reviewer or {
            "name": "Dr. Alex Vance, MD",
            "department": "Department of Internal Medicine / Clinical Informatics",
            "date": datetime.now().strftime("%Y-%m-%d"),
            "notes": "Rule-based extraction findings verified against source documentation.",
        }
        self.doc = pymupdf.open()
        self.width = 595.3  # A4 width in pt
        self.height = 841.9  # A4 height in pt
        self.margin_x = 40.0
        self.margin_y = 40.0
        self.content_w = self.width - 2 * self.margin_x
        self.current_y = self.margin_y
        self.page = None
        self._new_page()

    def _new_page(self):
        """Create a new page and reset vertical position."""
        self.page = self.doc.new_page(width=self.width, height=self.height)
        self.current_y = self.margin_y

    def _ensure_space(self, needed_pt: float):
        """Ensure there is enough vertical space, otherwise create new page."""
        if self.current_y + needed_pt > self.height - self.margin_y - 30:
            self._new_page()

    def build(self) -> bytes:
        """Generate and return PDF bytes."""
        self._draw_header()
        self._draw_disclaimer()
        self._draw_summary_grid()
        self._draw_clinical_alerts()
        self._draw_allergies()
        self._draw_vital_signs()
        self._draw_symptoms()
        self._draw_diagnoses()
        self._draw_medications()
        self._draw_lab_results()
        self._draw_family_history()
        self._draw_timeline()
        self._draw_reviewer_signoff()
        self._draw_page_footers()

        return self.doc.tobytes()

    # ──────────────────────────────────────────────────────────
    # Sections
    # ──────────────────────────────────────────────────────────

    def _draw_header(self):
        # Top banner line
        rect = pymupdf.Rect(self.margin_x, self.current_y, self.margin_x + self.content_w, self.current_y + 40)
        
        # Teal Brand Box
        brand_box = pymupdf.Rect(self.margin_x, self.current_y, self.margin_x + 30, self.current_y + 30)
        self.page.draw_rect(brand_box, color=None, fill=(0.05, 0.68, 0.62))  # Teal #0DAD9F
        self.page.insert_text(
            (self.margin_x + 7, self.current_y + 20),
            "ME",
            fontsize=13,
            fontname="helv",
            color=(1, 1, 1),
        )

        # Title
        self.page.insert_text(
            (self.margin_x + 38, self.current_y + 15),
            "MEDIEXTRACT AI — CLINICAL EXTRACTION REPORT",
            fontsize=12,
            fontname="helv",
            color=(0.09, 0.13, 0.20),
        )
        self.page.insert_text(
            (self.margin_x + 38, self.current_y + 27),
            "Deterministic Rule-Based Clinical Natural Language Processing Platform",
            fontsize=8,
            fontname="helv",
            color=(0.48, 0.53, 0.60),
        )

        # Meta right aligned
        meta = self.data.get("metadata", {})
        gen_time = datetime.now().strftime("%Y-%m-%d %H:%M")
        src = _sanitize(meta.get("filename") or meta.get("source_type") or "Clinical Document")
        if len(src) > 30:
            src = src[:27] + "..."

        self.page.insert_text(
            (self.width - self.margin_x - 140, self.current_y + 13),
            f"Generated: {gen_time}",
            fontsize=7.5,
            fontname="helv",
            color=(0.3, 0.35, 0.4),
        )
        self.page.insert_text(
            (self.width - self.margin_x - 140, self.current_y + 23),
            f"Source: {src}",
            fontsize=7.5,
            fontname="helv",
            color=(0.3, 0.35, 0.4),
        )
        self.page.insert_text(
            (self.width - self.margin_x - 140, self.current_y + 33),
            f"Engine: 100% Local Rule NLP",
            fontsize=7.5,
            fontname="helv",
            color=(0.05, 0.68, 0.62),
        )

        self.current_y += 42
        # Separator Line
        self.page.draw_line(
            (self.margin_x, self.current_y),
            (self.margin_x + self.content_w, self.current_y),
            color=(0.85, 0.88, 0.92),
            width=1.0,
        )
        self.current_y += 8

    def _draw_disclaimer(self):
        disc_rect = pymupdf.Rect(self.margin_x, self.current_y, self.margin_x + self.content_w, self.current_y + 20)
        self.page.draw_rect(disc_rect, color=(0.95, 0.80, 0.50), fill=(0.99, 0.96, 0.89))
        self.page.insert_text(
            (self.margin_x + 12, self.current_y + 13),
            "Automated rule-based extraction for demonstration purposes. Not a medical diagnosis. Not for clinical use.",
            fontsize=7.5,
            fontname="helv",
            color=(0.60, 0.30, 0.05),
        )
        self.current_y += 28

    def _draw_summary_grid(self):
        counts = self.data.get("counts", {})
        box_w = self.content_w / 7.0
        h = 28.0

        items = [
            ("Symptoms", counts.get("symptoms", 0)),
            ("Conditions", counts.get("diagnoses", 0)),
            ("Family Hx", counts.get("family_history", 0)),
            ("Meds", counts.get("medications", 0)),
            ("Labs", counts.get("lab_results", 0)),
            ("Vitals", counts.get("vital_signs", 0)),
            ("Allergies", counts.get("allergies", 0)),
        ]

        for i, (label, val) in enumerate(items):
            bx = self.margin_x + i * box_w
            rect = pymupdf.Rect(bx, self.current_y, bx + box_w - 3, self.current_y + h)
            self.page.draw_rect(rect, color=(0.85, 0.88, 0.92), fill=(0.96, 0.97, 0.98))
            self.page.insert_text((bx + 6, self.current_y + 11), label.upper(), fontsize=6.5, fontname="helv", color=(0.4, 0.45, 0.5))
            self.page.insert_text((bx + 6, self.current_y + 23), str(val), fontsize=10, fontname="helv", color=(0.09, 0.13, 0.20))

        self.current_y += h + 12

    def _draw_section_header(self, title: str, count: Optional[int] = None):
        self._ensure_space(30)
        text = title.upper()
        if count is not None:
            text += f" ({count})"

        self.page.draw_line(
            (self.margin_x, self.current_y),
            (self.margin_x + self.content_w, self.current_y),
            color=(0.9, 0.92, 0.95),
            width=0.5,
        )
        self.current_y += 5
        self.page.insert_text(
            (self.margin_x, self.current_y + 10),
            text,
            fontsize=8.5,
            fontname="helv",
            color=(0.05, 0.55, 0.50),
        )
        self.current_y += 18

    def _draw_clinical_alerts(self):
        alerts = []
        for l in self.data.get("lab_results", []):
            flag = getattr(l, "flag", None) or (l.get("flag") if isinstance(l, dict) else None)
            if flag in ("CRITICAL", "HIGH", "LOW"):
                test = getattr(l, "normalized_test", None) or (l.get("normalized_test") if isinstance(l, dict) else "")
                val = getattr(l, "value", None) or (l.get("value") if isinstance(l, dict) else "")
                unit = getattr(l, "unit", "") or (l.get("unit", "") if isinstance(l, dict) else "")
                alerts.append(f"[{flag} LAB] {test}: {val} {unit}")

        for a in self.data.get("allergies", []):
            is_nkda = getattr(a, "is_nkda", False) if hasattr(a, "is_nkda") else (a.get("is_nkda", False) if isinstance(a, dict) else False)
            if not is_nkda:
                alg = getattr(a, "allergen", "") if hasattr(a, "allergen") else (a.get("allergen", "") if isinstance(a, dict) else "")
                react = getattr(a, "reaction", "") if hasattr(a, "reaction") else (a.get("reaction", "") if isinstance(a, dict) else "")
                alerts.append(f"[ALLERGY] Active allergy to {alg}{f' (Reaction: {react})' if react else ''}")

        if not alerts:
            return

        self._ensure_space(len(alerts) * 14 + 25)
        self._draw_section_header("Clinical Alerts & Critical Flags", len(alerts))
        for alt in alerts[:8]:
            self.page.insert_text(
                (self.margin_x + 8, self.current_y + 8),
                f"• {alt}",
                fontsize=7.5,
                fontname="helv",
                color=(0.8, 0.15, 0.15),
            )
            self.current_y += 13
        self.current_y += 6

    def _draw_allergies(self):
        items = self.data.get("allergies", [])
        if not items:
            return
        self._draw_section_header("Allergies & Adverse Drug Reactions", len(items))
        for a in items:
            self._ensure_space(16)
            is_nkda = getattr(a, "is_nkda", False) if hasattr(a, "is_nkda") else (a.get("is_nkda", False) if isinstance(a, dict) else False)
            if is_nkda:
                txt = "• NKDA (No Known Drug Allergies)"
                col = (0.08, 0.6, 0.3)
            else:
                alg = getattr(a, "allergen", "") if hasattr(a, "allergen") else (a.get("allergen", "") if isinstance(a, dict) else "")
                react = getattr(a, "reaction", "") if hasattr(a, "reaction") else (a.get("reaction", "") if isinstance(a, dict) else "")
                txt = f"• {alg}{f' — Reaction: {react}' if react else ''}"
                col = (0.1, 0.15, 0.2)

            self.page.insert_text((self.margin_x + 8, self.current_y + 8), txt, fontsize=8, fontname="helv", color=col)
            self.current_y += 13
        self.current_y += 5

    def _draw_vital_signs(self):
        items = self.data.get("vital_signs", [])
        if not items:
            return
        self._draw_section_header("Vital Signs Physiological Measurements", len(items))
        cols = 3
        cell_w = self.content_w / cols
        for i, v in enumerate(items):
            if i % cols == 0:
                self._ensure_space(18)
            col_idx = i % cols
            x = self.margin_x + col_idx * cell_w
            name = getattr(v, "name", "") if hasattr(v, "name") else (v.get("name", "") if isinstance(v, dict) else "")
            val = getattr(v, "value", "") if hasattr(v, "value") else (v.get("value", "") if isinstance(v, dict) else "")
            unit = getattr(v, "unit", "") if hasattr(v, "unit") else (v.get("unit", "") if isinstance(v, dict) else "")

            self.page.insert_text((x + 4, self.current_y + 8), f"{name}:", fontsize=7.5, fontname="helv", color=(0.4, 0.45, 0.5))
            self.page.insert_text((x + 75, self.current_y + 8), f"{val} {unit}".strip(), fontsize=8, fontname="helv", color=(0.09, 0.13, 0.2))

            if col_idx == cols - 1 or i == len(items) - 1:
                self.current_y += 14
        self.current_y += 5

    def _draw_symptoms(self):
        items = self.data.get("symptoms", [])
        if not items:
            return
        self._draw_section_header("Symptoms Assessment (Present vs Absent)", len(items))
        for s in items:
            self._ensure_space(14)
            text = getattr(s, "text", "") if hasattr(s, "text") else (s.get("text", "") if isinstance(s, dict) else "")
            status = (getattr(s, "status", "present") if hasattr(s, "status") else (s.get("status", "present") if isinstance(s, dict) else "present")).upper()
            norm = getattr(s, "normalized_term", "") if hasattr(s, "normalized_term") else (s.get("normalized_term", "") if isinstance(s, dict) else "")

            col = (0.08, 0.55, 0.25) if status == "PRESENT" else (0.8, 0.2, 0.2)
            self.page.insert_text((self.margin_x + 8, self.current_y + 8), f"[{status}]", fontsize=7.5, fontname="helv", color=col)
            label = f"{text}{f' -> {norm}' if norm and norm != text.lower() else ''}"
            self.page.insert_text((self.margin_x + 65, self.current_y + 8), label, fontsize=8, fontname="helv", color=(0.1, 0.15, 0.2))
            self.current_y += 13
        self.current_y += 5

    def _draw_diagnoses(self):
        items = self.data.get("diagnoses", [])
        if not items:
            return
        self._draw_section_header("Diagnoses & Clinical Conditions", len(items))
        for d in items:
            self._ensure_space(14)
            text = getattr(d, "text", "") if hasattr(d, "text") else (d.get("text", "") if isinstance(d, dict) else "")
            status = (getattr(d, "status", "present") if hasattr(d, "status") else (d.get("status", "present") if isinstance(d, dict) else "present")).upper()

            col = (0.45, 0.15, 0.6) if status == "PRESENT" else (0.4, 0.45, 0.5)
            self.page.insert_text((self.margin_x + 8, self.current_y + 8), f"[{status}]", fontsize=7.5, fontname="helv", color=col)
            self.page.insert_text((self.margin_x + 75, self.current_y + 8), text, fontsize=8, fontname="helv", color=(0.1, 0.15, 0.2))
            self.current_y += 13
        self.current_y += 5

    def _draw_medications(self):
        items = self.data.get("medications", [])
        if not items:
            return
        self._draw_section_header("Pharmacotherapy Regimens", len(items))
        # Header row
        self._ensure_space(20)
        self.page.draw_rect(pymupdf.Rect(self.margin_x, self.current_y, self.margin_x + self.content_w, self.current_y + 14), fill=(0.95, 0.96, 0.97))
        self.page.insert_text((self.margin_x + 6, self.current_y + 10), "MEDICATION", fontsize=7, fontname="helv", color=(0.4, 0.45, 0.5))
        self.page.insert_text((self.margin_x + 160, self.current_y + 10), "DOSAGE", fontsize=7, fontname="helv", color=(0.4, 0.45, 0.5))
        self.page.insert_text((self.margin_x + 260, self.current_y + 10), "FREQUENCY / ROUTE", fontsize=7, fontname="helv", color=(0.4, 0.45, 0.5))
        self.page.insert_text((self.margin_x + 430, self.current_y + 10), "STATUS", fontsize=7, fontname="helv", color=(0.4, 0.45, 0.5))
        self.current_y += 16

        for m in items:
            self._ensure_space(14)
            name = getattr(m, "name", "") if hasattr(m, "name") else (m.get("name", "") if isinstance(m, dict) else "")
            dose = getattr(m, "dosage", "") or "—" if hasattr(m, "dosage") else (m.get("dosage", "—") if isinstance(m, dict) else "—")
            freq = getattr(m, "frequency", "") or "" if hasattr(m, "frequency") else (m.get("frequency", "") if isinstance(m, dict) else "")
            route = getattr(m, "route", "") or "" if hasattr(m, "route") else (m.get("route", "") if isinstance(m, dict) else "")
            status = (getattr(m, "status", "active") if hasattr(m, "status") else (m.get("status", "active") if isinstance(m, dict) else "active")).upper()

            self.page.insert_text((self.margin_x + 6, self.current_y + 8), name.capitalize(), fontsize=8, fontname="helv", color=(0.09, 0.13, 0.2))
            self.page.insert_text((self.margin_x + 160, self.current_y + 8), _sanitize(dose), fontsize=8, fontname="helv", color=(0.1, 0.15, 0.2))
            self.page.insert_text((self.margin_x + 260, self.current_y + 8), f"{freq} {route}".strip() or "—", fontsize=8, fontname="helv", color=(0.1, 0.15, 0.2))
            self.page.insert_text((self.margin_x + 430, self.current_y + 8), status, fontsize=7.5, fontname="helv", color=(0.05, 0.55, 0.5))
            self.current_y += 13
        self.current_y += 5

    def _draw_lab_results(self):
        items = self.data.get("lab_results", [])
        if not items:
            return
        self._draw_section_header("Laboratory Tests & Measured Values", len(items))
        self._ensure_space(20)
        self.page.draw_rect(pymupdf.Rect(self.margin_x, self.current_y, self.margin_x + self.content_w, self.current_y + 14), fill=(0.95, 0.96, 0.97))
        self.page.insert_text((self.margin_x + 6, self.current_y + 10), "TEST NAME", fontsize=7, fontname="helv", color=(0.4, 0.45, 0.5))
        self.page.insert_text((self.margin_x + 220, self.current_y + 10), "VALUE", fontsize=7, fontname="helv", color=(0.4, 0.45, 0.5))
        self.page.insert_text((self.margin_x + 310, self.current_y + 10), "UNIT", fontsize=7, fontname="helv", color=(0.4, 0.45, 0.5))
        self.page.insert_text((self.margin_x + 420, self.current_y + 10), "REFERENCE FLAG", fontsize=7, fontname="helv", color=(0.4, 0.45, 0.5))
        self.current_y += 16

        for l in items:
            self._ensure_space(14)
            test = getattr(l, "normalized_test", "") if hasattr(l, "normalized_test") else (l.get("normalized_test", "") if isinstance(l, dict) else "")
            val = getattr(l, "value", "") if hasattr(l, "value") else (l.get("value", "") if isinstance(l, dict) else "")
            unit = getattr(l, "unit", "") or "—" if hasattr(l, "unit") else (l.get("unit", "—") if isinstance(l, dict) else "—")
            flag = getattr(l, "flag", "NORMAL") or "NORMAL" if hasattr(l, "flag") else (l.get("flag", "NORMAL") or "NORMAL" if isinstance(l, dict) else "NORMAL")

            col = (0.8, 0.15, 0.15) if flag in ("CRITICAL", "HIGH") else ((0.1, 0.4, 0.7) if flag == "LOW" else (0.08, 0.55, 0.25))

            self.page.insert_text((self.margin_x + 6, self.current_y + 8), test, fontsize=8, fontname="helv", color=(0.09, 0.13, 0.2))
            self.page.insert_text((self.margin_x + 220, self.current_y + 8), str(val), fontsize=8, fontname="helv", color=(0.09, 0.13, 0.2))
            self.page.insert_text((self.margin_x + 310, self.current_y + 8), unit, fontsize=8, fontname="helv", color=(0.3, 0.35, 0.4))
            self.page.insert_text((self.margin_x + 420, self.current_y + 8), flag, fontsize=7.5, fontname="helv", color=col)
            self.current_y += 13
        self.current_y += 5

    def _draw_family_history(self):
        items = self.data.get("family_history", [])
        if not items:
            return
        self._draw_section_header("Family Medical History", len(items))
        for f in items:
            self._ensure_space(14)
            text = getattr(f, "text", "") if hasattr(f, "text") else (f.get("text", "") if isinstance(f, dict) else "")
            self.page.insert_text((self.margin_x + 8, self.current_y + 8), f"• {text}", fontsize=8, fontname="helv", color=(0.09, 0.13, 0.2))
            self.current_y += 13
        self.current_y += 5

    def _draw_timeline(self):
        items = self.data.get("timeline", [])
        if not items:
            return
        self._draw_section_header("Dated Clinical Events Timeline", len(items))
        for t in items[:8]:
            self._ensure_space(14)
            dstr = getattr(t, "date_str", "") or getattr(t, "event_date", "") if hasattr(t, "date_str") or hasattr(t, "event_date") else (t.get("date_str") or t.get("event_date", "") if isinstance(t, dict) else "")
            desc = getattr(t, "description", "") or getattr(t, "entity_text", "") if hasattr(t, "description") or hasattr(t, "entity_text") else (t.get("description") or t.get("entity_text", "") if isinstance(t, dict) else "")
            self.page.insert_text((self.margin_x + 8, self.current_y + 8), f"[{dstr}]", fontsize=7.5, fontname="helv", color=(0.05, 0.55, 0.5))
            self.page.insert_text((self.margin_x + 80, self.current_y + 8), desc[:70], fontsize=8, fontname="helv", color=(0.09, 0.13, 0.2))
            self.current_y += 13
        self.current_y += 5

    def _draw_reviewer_signoff(self):
        self._ensure_space(70)
        self.current_y += 10
        self.page.draw_line(
            (self.margin_x, self.current_y),
            (self.margin_x + self.content_w, self.current_y),
            color=(0.1, 0.15, 0.2),
            width=1.0,
        )
        self.current_y += 8
        self.page.insert_text((self.margin_x, self.current_y + 8), "CLINICIAN VERIFICATION & ATTESTATION", fontsize=8, fontname="helv", color=(0.1, 0.15, 0.2))

        # Two columns
        r_name = self.reviewer.get("name", "Dr. Alex Vance, MD")
        r_dept = self.reviewer.get("department", "Internal Medicine")
        r_date = self.reviewer.get("date", datetime.now().strftime("%Y-%m-%d"))
        r_notes = self.reviewer.get("notes", "Extraction verified against source note.")

        self.page.insert_text((self.margin_x, self.current_y + 22), f"Reviewer: {r_name}", fontsize=8, fontname="helv", color=(0.1, 0.15, 0.2))
        self.page.insert_text((self.margin_x, self.current_y + 34), f"Department: {r_dept}", fontsize=7.5, fontname="helv", color=(0.4, 0.45, 0.5))
        self.page.insert_text((self.margin_x, self.current_y + 46), f"Attestation Date: {r_date}", fontsize=7.5, fontname="helv", color=(0.4, 0.45, 0.5))

        # Signature line
        sig_x = self.margin_x + 300
        self.page.insert_text((sig_x, self.current_y + 22), f"Clinical Notes: \"{r_notes}\"", fontsize=7.5, fontname="helv", color=(0.3, 0.35, 0.4))
        self.page.draw_line((sig_x, self.current_y + 42), (sig_x + 180, self.current_y + 42), color=(0.6, 0.65, 0.7), width=0.8)
        self.page.insert_text((sig_x, self.current_y + 51), "PHYSICIAN / REVIEWER SIGNATURE", fontsize=6.5, fontname="helv", color=(0.6, 0.65, 0.7))

    def _draw_page_footers(self):
        total_pages = len(self.doc)
        for i, page in enumerate(self.doc):
            p_num = f"Page {i + 1} of {total_pages}"
            page.draw_line((self.margin_x, self.height - 30), (self.margin_x + self.content_w, self.height - 30), color=(0.9, 0.92, 0.95), width=0.5)
            page.insert_text((self.margin_x, self.height - 20), "CONFIDENTIAL CLINICAL DOCUMENT — FOR DEMO USE ONLY", fontsize=6.5, fontname="helv", color=(0.6, 0.65, 0.7))
            page.insert_text((self.width - self.margin_x - 60, self.height - 20), p_num, fontsize=6.5, fontname="helv", color=(0.6, 0.65, 0.7))


def generate_pdf_report(data: Dict[str, Any], reviewer: Optional[Dict[str, str]] = None) -> bytes:
    """Public helper to construct a formatted PDF from extraction dictionary."""
    builder = PDFReportBuilder(data, reviewer)
    return builder.build()
