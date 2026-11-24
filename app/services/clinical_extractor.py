"""
MediExtract AI — Deterministic Local Clinical Medical NLP Engine.

Extracts 10 categories of clinical entities using regex grammars, dictionaries,
and clause-bounded context analysis. 100% local, zero external APIs, zero DLL dependencies.
"""

from __future__ import annotations

import re
import time
from typing import Optional

from app.models.extraction import (
    AllergyExtraction,
    ClinicalEntity,
    ExtractionResponse,
    LabExtraction,
    MedicationExtraction,
    TimelineEvent,
    VitalSignExtraction,
)
from app.data.dictionaries import (
    ALLERGIC_TO_RE,
    ALLERGY_SECTION_RE,
    DIAGNOSES_LEXICON,
    DOSAGE_RE,
    FREQUENCY_RE,
    LAB_PATTERNS,
    LAB_RANGES,
    MEDICATIONS_LEXICON,
    NKDA_RE,
    REACTION_RE,
    ROUTE_RE,
    SYMPTOMS_LEXICON,
    VITAL_PATTERNS,
)
from app.services.context_analyzer import (
    classify_assertion,
    classify_assertion_with_trigger,
    classify_medication_status,
    detect_section,
    split_sentences,
)


# ══════════════════════════════════════════════════════════════
# LAB FLAG CALCULATION
# ══════════════════════════════════════════════════════════════

def _compute_lab_flag(name: str, value_str: str) -> Optional[str]:
    """Compute abnormal flag based on standard clinical reference ranges."""
    if name not in LAB_RANGES:
        return None
    try:
        value = float(value_str)
    except (ValueError, TypeError):
        return None

    low, high, crit_low, crit_high = LAB_RANGES[name]

    if crit_high is not None and value >= crit_high:
        return "CRITICAL"
    if crit_low is not None and value <= crit_low:
        return "CRITICAL"
    if value > high:
        return "HIGH"
    if value < low:
        return "LOW"
    return "NORMAL"


# ══════════════════════════════════════════════════════════════
# DEDUPLICATION WITH LONGEST-MATCH PRIORITY
# ══════════════════════════════════════════════════════════════

def _dedup_entities(entities: list[dict], key: str = "text") -> list[dict]:
    """Remove redundant sub-spans and exact duplicate occurrences."""
    if not entities:
        return entities

    # Sort descending by span length so longer phrases (e.g. "coronary artery disease") take priority
    entities.sort(key=lambda e: len(e.get(key, "")), reverse=True)

    seen: set[str] = set()
    deduped: list[dict] = []

    for ent in entities:
        norm_key = ent.get(key, "").lower().strip()
        status = ent.get("status", "")
        sent = ent.get("source_sentence", "")
        composite = f"{norm_key}||{status}||{sent}"

        is_subspan = False
        for s in seen:
            seen_text, seen_status, seen_sent = s.split("||", 2)
            if sent == seen_sent and norm_key != seen_text and norm_key in seen_text:
                is_subspan = True
                break

        if composite not in seen and not is_subspan:
            seen.add(composite)
            deduped.append(ent)

    return deduped


def _dedup_by_field(items: list[dict], field: str) -> list[dict]:
    """Deduplicate list of dicts by field and sentence."""
    seen: set[str] = set()
    deduped: list[dict] = []
    for item in items:
        val = str(item.get(field, "")).lower().strip()
        sent = item.get("source_sentence", "").strip()
        key = f"{val}||{sent}"
        if key not in seen:
            seen.add(key)
            deduped.append(item)
    return deduped


# ══════════════════════════════════════════════════════════════
# ALLERGY EXTRACTION HELPERS
# ══════════════════════════════════════════════════════════════

def _extract_allergies(text: str, sentences: list[str]) -> list[dict]:
    """Extract allergies, reactions, and NKDA declarations."""
    allergies: list[dict] = []

    # 1. Check for NKDA / NKA
    nkda_match = NKDA_RE.search(text)
    if nkda_match:
        allergies.append({
            "allergen": "NKDA",
            "reaction": None,
            "is_nkda": True,
            "source_sentence": _find_containing_sentence(nkda_match.group(0), sentences, text),
        })

    # 2. Check dedicated Allergy Sections
    for match in ALLERGY_SECTION_RE.finditer(text):
        section_text = match.group(1).strip()
        if NKDA_RE.search(section_text):
            continue
        _parse_allergy_items(section_text, allergies, sentences, text)

    # 3. Check inline "allergic to" statements
    for match in ALLERGIC_TO_RE.finditer(text):
        inline_text = match.group(1).strip()
        _parse_allergy_items(inline_text, allergies, sentences, text)

    # Deduplicate allergies by allergen name
    seen_allergens: set[str] = set()
    final_allergies: list[dict] = []
    for a in allergies:
        key = a["allergen"].lower().strip()
        if key not in seen_allergens:
            seen_allergens.add(key)
            final_allergies.append(a)

    return final_allergies


def _parse_allergy_items(
    text_span: str,
    acc: list[dict],
    sentences: list[str],
    full_text: str,
) -> None:
    """Parse allergy list separated by commas, semicolons, or lines."""
    parts = re.split(r"[,;\n]", text_span)
    for p in parts:
        item = p.strip()
        if not item or len(item) < 2:
            continue
        if NKDA_RE.search(item):
            continue

        reaction_match = REACTION_RE.search(item)
        reaction = None
        if reaction_match:
            reaction = (reaction_match.group(1) or reaction_match.group(2) or "").strip()

        allergen = REACTION_RE.sub("", item).strip()
        # Clean allergen prefix words
        allergen = re.sub(r"^(?:allergic\s+to|allergy\s+to|known\s+allergies|allergy)\s*[:=]?\s*", "", allergen, flags=re.I).strip()
        allergen = allergen.strip(" .,;:!?\t\r\n")

        if allergen and len(allergen) >= 2:
            acc.append({
                "allergen": allergen,
                "reaction": reaction if reaction else None,
                "is_nkda": False,
                "source_sentence": _find_containing_sentence(allergen, sentences, full_text),
            })


def _find_containing_sentence(span: str, sentences: list[str], full_text: str) -> str:
    """Find the sentence containing the specified span."""
    span_lower = span.lower()
    for s in sentences:
        if span_lower in s.lower():
            return s
    pos = full_text.lower().find(span_lower)
    if pos != -1:
        start = max(0, pos - 60)
        end = min(len(full_text), pos + len(span) + 60)
        return full_text[start:end].strip()
    return span


def _extract_timeline_events(sentences: list[str]) -> list[TimelineEvent]:
    """Deterministically extract explicit dates found in sentences for chronological timeline."""
    events: list[TimelineEvent] = []
    seen: set[str] = set()

    date_patterns = [
        re.compile(r"\b(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{2,4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?,?\s+\d{2,4})\b", re.I),
        re.compile(r"\b\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\b"),
        re.compile(r"\b\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}\b"),
        re.compile(r"\b(?:in|since|during|year)\s+(\d{4})\b", re.I),
    ]

    doc_date_pattern = re.compile(r"\b(?:date of service|encounter date|admission date|visit date|report date|date:)\s*[:=]?\s*", re.I)

    for sentence in sentences:
        for p in date_patterns:
            for match in p.finditer(sentence):
                raw_date = match.group(0).strip()
                if raw_date.lower().startswith(("in ", "since ", "during ", "year ")):
                    raw_date = match.group(1).strip()

                key = f"{raw_date.lower()}||{sentence}"
                if key in seen:
                    continue
                seen.add(key)

                is_doc_date = bool(doc_date_pattern.search(sentence))
                event_type = "document_date" if is_doc_date else "medical_event"
                desc = sentence if len(sentence) <= 90 else sentence[:87] + "..."

                events.append(TimelineEvent(
                    date_str=raw_date,
                    event_type=event_type,
                    description=desc,
                    source_sentence=sentence,
                    rule_id="RULE-TIMELINE-DATE-01",
                ))

    return events


# ══════════════════════════════════════════════════════════════
# MAIN CLINICAL EXTRACTION PIPELINE
# ══════════════════════════════════════════════════════════════

def extract_all(text: str, metadata: Optional[dict] = None) -> ExtractionResponse:
    """Perform deterministic clinical information extraction on raw clinical text.

    Args:
        text: Clinical note or document text.
        metadata: Optional dictionary with source type, filename, etc.

    Returns:
        ExtractionResponse with all extracted entities and entity counts.
    """
    start_time = time.perf_counter()

    sentences = split_sentences(text)

    symptoms_raw: list[dict] = []
    diagnoses_raw: list[dict] = []
    family_history_raw: list[dict] = []
    medications_raw: list[dict] = []
    labs_raw: list[dict] = []
    vitals_raw: list[dict] = []

    current_section: Optional[str] = None

    for sentence in sentences:
        sec = detect_section(sentence)
        if sec:
            current_section = sec

        # ── 1. Symptoms ──
        for term, norm in SYMPTOMS_LEXICON.items():
            pattern = re.compile(r"\b" + re.escape(term) + r"\b", re.IGNORECASE)
            match = pattern.search(sentence)
            if match:
                status, trigger, rule_id = classify_assertion_with_trigger(term, sentence, section=current_section)
                if status == "family_history":
                    family_history_raw.append({
                        "text": match.group(0),
                        "normalized_term": norm,
                        "category": "family_history",
                        "status": "family_history",
                        "source_sentence": sentence,
                        "trigger_word": trigger,
                        "rule_id": rule_id,
                    })
                else:
                    symptoms_raw.append({
                        "text": match.group(0),
                        "normalized_term": norm,
                        "category": "symptom",
                        "status": status,
                        "source_sentence": sentence,
                        "trigger_word": trigger,
                        "rule_id": rule_id,
                    })

        # ── 2. Diagnoses & Conditions ──
        for term, norm in DIAGNOSES_LEXICON.items():
            if len(term) <= 3:
                pattern = re.compile(r"(?<![a-zA-Z])" + re.escape(term) + r"(?![a-zA-Z])", re.IGNORECASE)
            else:
                pattern = re.compile(r"\b" + re.escape(term) + r"\b", re.IGNORECASE)

            match = pattern.search(sentence)
            if match:
                status, trigger, rule_id = classify_assertion_with_trigger(term, sentence, section=current_section)
                if status == "family_history":
                    family_history_raw.append({
                        "text": match.group(0),
                        "normalized_term": norm,
                        "category": "family_history",
                        "status": "family_history",
                        "source_sentence": sentence,
                        "trigger_word": trigger,
                        "rule_id": rule_id,
                    })
                else:
                    diagnoses_raw.append({
                        "text": match.group(0),
                        "normalized_term": norm,
                        "category": "diagnosis",
                        "status": status,
                        "source_sentence": sentence,
                        "trigger_word": trigger,
                        "rule_id": rule_id,
                    })

        # ── 3. Medications (Per-medication window extraction) ──
        matched_meds: list[tuple[int, int, str]] = []
        for med_name in MEDICATIONS_LEXICON:
            if len(med_name) <= 3:
                pattern = re.compile(r"(?<![a-zA-Z])" + re.escape(med_name) + r"(?![a-zA-Z])", re.IGNORECASE)
            else:
                pattern = re.compile(r"\b" + re.escape(med_name) + r"\b", re.IGNORECASE)

            for m in pattern.finditer(sentence):
                matched_meds.append((m.start(), m.end(), m.group(0)))

        # Sort by start position
        matched_meds.sort(key=lambda x: x[0])

        for idx, (m_start, m_end, m_name) in enumerate(matched_meds):
            next_start = matched_meds[idx + 1][0] if idx + 1 < len(matched_meds) else len(sentence)
            window = sentence[m_start:next_start]

            dosage_match = DOSAGE_RE.search(window)
            freq_match = FREQUENCY_RE.search(window)
            route_match = ROUTE_RE.search(window)

            dosage = f"{dosage_match.group(1)} {dosage_match.group(2)}" if dosage_match else None
            frequency = freq_match.group(0).strip() if freq_match else None
            route = route_match.group(0).strip() if route_match else None

            med_status = classify_medication_status(sentence)

            medications_raw.append({
                "name": m_name,
                "dosage": dosage,
                "frequency": frequency,
                "route": route,
                "status": med_status,
                "source_sentence": sentence,
            })

        # ── 4. Laboratory Results ──
        for lab_pattern, lab_name, unit_hint in LAB_PATTERNS:
            match = lab_pattern.search(sentence)
            if match:
                value = match.group(1)
                unit = match.group(2) if match.lastindex >= 2 and match.group(2) else unit_hint
                flag = _compute_lab_flag(lab_name, value)

                test_raw = match.group(0).split(":")[0].split("=")[0].strip() if (":" in match.group(0) or "=" in match.group(0)) else lab_name

                labs_raw.append({
                    "test_name": test_raw,
                    "normalized_test": lab_name,
                    "value": value,
                    "unit": unit,
                    "flag": flag,
                    "source_sentence": sentence,
                })

        # ── 5. Vital Signs ──
        for vital_pattern, vital_name, default_unit in VITAL_PATTERNS:
            match = vital_pattern.search(sentence)
            if match:
                value = match.group(1)
                if match.lastindex >= 2 and match.group(2):
                    unit = match.group(2)
                    if vital_name == "Temperature":
                        unit = f"°{match.group(2).upper()}"
                else:
                    unit = default_unit

                vitals_raw.append({
                    "name": vital_name,
                    "value": value,
                    "unit": unit or "",
                    "source_sentence": sentence,
                })

    # ── 6. Allergies (Global & inline parsing) ──
    allergies_raw = _extract_allergies(text, sentences)

    # ── 7. Explicit Timeline Events ──
    timeline_events = _extract_timeline_events(sentences)

    # ── Deduplicate ──
    symptoms_dedup = _dedup_entities(symptoms_raw, "text")
    diagnoses_dedup = _dedup_entities(diagnoses_raw, "text")
    family_history_dedup = _dedup_entities(family_history_raw, "text")
    medications_dedup = _dedup_by_field(medications_raw, "name")
    labs_dedup = _dedup_by_field(labs_raw, "normalized_test")
    vitals_dedup = _dedup_by_field(vitals_raw, "name")

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

    if metadata is None:
        metadata = {}

    metadata.update({
        "char_count": len(text),
        "sentence_count": len(sentences),
        "processing_time_ms": elapsed_ms,
        "engine": "local-rule-based-v1",
    })

    symptoms = [ClinicalEntity(**s) for s in symptoms_dedup]
    diagnoses = [ClinicalEntity(**d) for d in diagnoses_dedup]
    family_history = [ClinicalEntity(**f) for f in family_history_dedup]
    medications = [MedicationExtraction(**m) for m in medications_dedup]
    lab_results = [LabExtraction(**l) for l in labs_dedup]
    vital_signs = [VitalSignExtraction(**v) for v in vitals_dedup]
    allergies = [AllergyExtraction(**a) for a in allergies_raw]

    counts = {
        "symptoms": len(symptoms),
        "diagnoses": len(diagnoses),
        "family_history": len(family_history),
        "medications": len(medications),
        "lab_results": len(lab_results),
        "vital_signs": len(vital_signs),
        "allergies": len(allergies),
    }

    warnings = metadata.get("warnings", [])
    ocr_text = metadata.get("ocr_text", None)
    image_metadata = metadata.get("image_metadata", None)

    return ExtractionResponse(
        metadata=metadata,
        ocr_text=ocr_text,
        image_metadata=image_metadata,
        warnings=warnings,
        symptoms=symptoms,
        diagnoses=diagnoses,
        family_history=family_history,
        medications=medications,
        lab_results=lab_results,
        vital_signs=vital_signs,
        allergies=allergies,
        timeline=timeline_events,
        counts=counts,
    )
