"""
MediExtract AI — Clause-Aware Clinical Context & Assertion Engine.

Provides:
  1. Robust clinical sentence splitter safe for medical abbreviations, decimals, and list numbering.
  2. Clause-bounded assertion detection (negation in one clause does NOT
     propagate across contrastive boundaries like 'but', 'however', etc.).
  3. Section-aware assertion classification: present, absent, historical, uncertain, family_history.
  4. Medication regimen status classification: active, discontinued, historical.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Literal, Optional

from app.data.dictionaries import SECTION_HEADER_PATTERNS

# ──────────────────────────────────────────────────────────────
# Type aliases
# ──────────────────────────────────────────────────────────────

AssertionStatus = Literal["present", "absent", "historical", "uncertain", "family_history"]


# ──────────────────────────────────────────────────────────────
# 1. Abbreviation-Safe Sentence Splitter
# ──────────────────────────────────────────────────────────────

_CLINICAL_ABBREVS = {
    "dr", "mr", "mrs", "ms", "prof", "sr", "jr",
    "vs", "eg", "ie", "etc", "al", "approx", "dept", "appt", "pt", "pts",
    "mg", "mcg", "ug", "ml", "dl", "kg", "lb", "lbs", "oz", "meq",
    "qd", "bid", "tid", "qid", "prn", "qhs", "po", "iv", "im", "sc", "sq", "sl", "pr",
    "ho", "sp", "ro", "wo", "fh", "fhx", "pmh", "pmhx", "psh", "pshx", "hpi",
    "jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "oct", "nov", "dec",
    "no", "vol", "op", "ed", "icu", "ccu", "or", "tab", "tabs", "cap", "caps",
}


def split_sentences(text: str) -> list[str]:
    """Split clinical text into sentences, safe for medical abbreviations, decimals, and lists."""
    lines = text.splitlines()
    sentences: list[str] = []

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            continue

        start = 0
        i = 0
        n = len(line)

        while i < n:
            ch = line[i]
            if ch in ".!?":
                # Check if it is a decimal point between digits (e.g. 98.6, 0.45)
                if ch == "." and i > 0 and i + 1 < n and line[i - 1].isdigit() and line[i + 1].isdigit():
                    i += 1
                    continue

                # Check if it is a list numbering at start of span (e.g. '1. ')
                if ch == "." and line[start:i].strip().isdigit() and i + 1 < n and line[i + 1].isspace():
                    i += 1
                    continue

                # Check if preceding word is an abbreviation
                pre_match = re.search(r"([A-Za-z]+)\.?$", line[start:i])
                if pre_match:
                    word = pre_match.group(1).lower()
                    cleaned_word = re.sub(r"[^a-z]", "", word)
                    if cleaned_word in _CLINICAL_ABBREVS:
                        i += 1
                        continue

                # If followed by space or at end of line
                if i + 1 == n or line[i + 1].isspace():
                    rest = line[i + 1:].lstrip()
                    if rest and rest[0].islower() and not rest.startswith(("and ", "or ", "but ")):
                        i += 1
                        continue

                    # Valid sentence boundary
                    sent = line[start:i + 1].strip()
                    if sent:
                        sentences.append(sent)
                    start = i + 1
                    while start < n and line[start].isspace():
                        start += 1
                    i = start
                    continue

            i += 1

        rem = line[start:].strip()
        if rem:
            sentences.append(rem)

    return sentences if sentences else [text.strip()]


# ──────────────────────────────────────────────────────────────
# 2. Clause Boundary Splitter
# ──────────────────────────────────────────────────────────────

_CLAUSE_BOUNDARIES = re.compile(
    r"""
    \s*(?:
        \bbut\b
        | \bhowever\b
        | \balthough\b
        | \bexcept\b
        | \bapart\s+from\b
        | \bthough\b
        | \bnevertheless\b
        | \byet\b
        | \bwhereas\b
        | \bwhile\b
        | \bwho\s+presents\s+(?:to|with)\b
        | \bpresenting\s+with\b
        | \bpresents\s+with\b
        | \bnow\s+presents\s+with\b
        | \badmitted\s+(?:for|with)\b
        | ;
    )\s*
    """,
    re.VERBOSE | re.IGNORECASE,
)


def split_clauses(sentence: str) -> list[str]:
    """Split a sentence on contrastive / clinical transition boundaries."""
    clauses = _CLAUSE_BOUNDARIES.split(sentence)
    return [c.strip() for c in clauses if c.strip()]


# ──────────────────────────────────────────────────────────────
# 3. Section Detector
# ──────────────────────────────────────────────────────────────

def detect_section(line: str) -> Optional[str]:
    """Detect whether a line is a clinical section header."""
    for pattern, section_name in SECTION_HEADER_PATTERNS:
        if pattern.search(line):
            return section_name
    return None


# ──────────────────────────────────────────────────────────────
# 4. Assertion Trigger Definitions
# ──────────────────────────────────────────────────────────────

@dataclass
class _CompiledTriggerSet:
    status: AssertionStatus
    pre_patterns: list[re.Pattern]
    post_patterns: list[re.Pattern]


def _build_boundary_pattern(phrase: str) -> re.Pattern:
    """Create a regex pattern matching a phrase with strict word boundaries."""
    escaped = re.escape(phrase)
    prefix = r"\b" if phrase[0].isalnum() else ""
    suffix = r"\b" if phrase[-1].isalnum() else ""
    escaped_flexible = re.sub(r"\\ ", r"\\s+", escaped)
    return re.compile(rf"{prefix}{escaped_flexible}{suffix}", re.IGNORECASE)


_RAW_TRIGGER_DEFS = [
    # ── Family History ──
    {
        "status": "family_history",
        "pre": [
            "family history of", "family history includes", "family history:", "family history",
            "family hx of", "family hx:", "family hx", "fhx of", "fhx:", "fhx",
            "fh of", "fh:",
            "father had", "father has", "father with", "father diagnosed with", "father was diagnosed with", "father's history of", "father:",
            "mother had", "mother has", "mother with", "mother diagnosed with", "mother was diagnosed with", "mother's history of", "mother:",
            "brother had", "brother has", "brother with", "brother diagnosed with", "brother was diagnosed with", "brother:",
            "sister had", "sister has", "sister with", "sister diagnosed with", "sister was diagnosed with", "sister:",
            "parent had", "parents had", "parent with", "parents with", "parent was diagnosed with", "parents were diagnosed with",
            "grandmother had", "grandfather had", "maternal grandmother", "maternal grandfather",
            "paternal grandmother", "paternal grandfather",
            "maternal history of", "paternal history of", "maternal:", "paternal:",
            "uncle had", "aunt had",
            "sibling with", "sibling had", "siblings with", "siblings had",
        ],
        "post": [
            "in the family", "in family history", "in first-degree relative", "in first degree relatives",
        ],
    },

    # ── Absent / Negation ──
    {
        "status": "absent",
        "pre": [
            "denies any", "denied any", "denying any",
            "denies", "denied", "denying",
            "no evidence of", "no sign of", "no signs of", "no symptom of", "no symptoms of",
            "negative for", "neg for",
            "without any evidence of", "without evidence of", "without any signs of", "without signs of",
            "without any", "without",
            "free of", "free from",
            "rules out", "ruled out", "has been ruled out", "was ruled out",
            "patient denies", "patient denied", "pt denies", "pt denied",
            "does not have", "doesn't have", "did not have", "didn't have", "never had",
            "no", "not", "none", "non",
            "afebrile",          # specific negation of fever
            "normotensive",      # specific negation of hypertension
        ],
        "post": [
            "is denied", "was denied", "are denied", "were denied",
            "is absent", "was absent", "are absent", "were absent", "absent",
            "is negative", "was negative", "are negative", "were negative", "negative",
            "not present", "not found", "not detected", "not identified", "not noted", "not seen",
            "ruled out", "was ruled out", "has been ruled out",
        ],
    },

    # ── Uncertain / Differential ──
    {
        "status": "uncertain",
        "pre": [
            "rule out", "rules out", "r/o", "ro",
            "possible", "possibly",
            "probable", "probably",
            "suspected", "suspect", "suspecting", "suspicion of", "suspicious for",
            "differential diagnosis", "differential", "ddx:", "ddx",
            "likely", "unlikely",
            "questionable",
            "consistent with",
            "concerning for", "concern for",
            "suggestive of",
            "cannot exclude", "cannot be excluded", "cannot rule out",
            "evaluate for", "eval for",
            "consider",
        ],
        "post": [
            "is suspected", "is questionable",
            "is possible", "is likely", "is unlikely",
            "cannot be excluded", "cannot be ruled out",
            "not ruled out",
        ],
    },

    # ── Historical ──
    {
        "status": "historical",
        "pre": [
            "past medical history:", "past medical history",
            "past surgical history:", "past surgical history",
            "pmh:", "pmhx:", "pmh", "pmhx", "psh:", "pshx:",
            "history of", "h/o", "hx of", "hx:",
            "previous history of", "prior history of",
            "previously diagnosed with", "previously diagnosed",
            "previous", "previously",
            "prior",
            "status post", "status-post", "s/p",
            "childhood",
            "former",
            "remote history of",
            "resolved",
        ],
        "post": [
            "in the past", "in childhood",
            "years ago", "months ago",
            "previously diagnosed",
            "resolved", "has resolved",
        ],
    },
]

# Compile triggers once at import time
_COMPILED_TRIGGER_SETS: list[_CompiledTriggerSet] = [
    _CompiledTriggerSet(
        status=d["status"],
        pre_patterns=[_build_boundary_pattern(p) for p in d["pre"]],
        post_patterns=[_build_boundary_pattern(p) for p in d["post"]],
    )
    for d in _RAW_TRIGGER_DEFS
]


# ──────────────────────────────────────────────────────────────
# 5. Assertion Classifier
# ──────────────────────────────────────────────────────────────

def classify_assertion_with_trigger(
    entity_text: str,
    sentence: str,
    section: Optional[str] = None,
) -> tuple[AssertionStatus, Optional[str], str]:
    """Determine clinical assertion status along with trigger word and deterministic rule ID.

    Returns:
        tuple of (status, trigger_word, rule_id)
    """
    entity_lower = entity_text.lower().strip()
    clauses = split_clauses(sentence)

    # Find the specific clause containing this entity
    target_clause = sentence
    for clause in clauses:
        if entity_lower in clause.lower():
            target_clause = clause
            break

    clause_lower = target_clause.lower()

    # Find position of entity in clause
    entity_match = re.search(r"\b" + re.escape(entity_lower) + r"\b", clause_lower)
    if entity_match:
        entity_start = entity_match.start()
        entity_end = entity_match.end()
    else:
        pos = clause_lower.find(entity_lower)
        if pos != -1:
            entity_start = pos
            entity_end = pos + len(entity_lower)
        else:
            entity_start = 0
            entity_end = len(clause_lower)

    # Check each trigger set in priority order:
    # 1. family_history -> 2. absent -> 3. uncertain -> 4. historical
    for ts in _COMPILED_TRIGGER_SETS:
        # Check pre-triggers (must appear BEFORE the entity in the clause)
        for pattern in ts.pre_patterns:
            for match in pattern.finditer(clause_lower):
                if match.end() <= entity_end:
                    matched_text = match.group(0).lower()
                    if matched_text == "no" and "no known" in clause_lower:
                        continue
                    rule_id = f"RULE-{ts.status.upper()}-PRE-01"
                    return ts.status, match.group(0), rule_id

        # Check post-triggers (must appear AFTER the entity in the clause)
        for pattern in ts.post_patterns:
            for match in pattern.finditer(clause_lower):
                if match.start() >= entity_start:
                    rule_id = f"RULE-{ts.status.upper()}-POST-01"
                    return ts.status, match.group(0), rule_id

    # If clause-level triggers didn't match, check section context
    if section == "family_history":
        return "family_history", "Section Header: Family History", "RULE-SECTION-FH-01"
    if section == "past_history":
        return "historical", "Section Header: Past History", "RULE-SECTION-PMH-01"

    return "present", None, "RULE-DEFAULT-AFFIRMATIVE-01"


def classify_assertion(
    entity_text: str,
    sentence: str,
    section: Optional[str] = None,
) -> AssertionStatus:
    """Determine the clinical assertion status of an entity within its sentence and section context."""
    status, _, _ = classify_assertion_with_trigger(entity_text, sentence, section=section)
    return status


def classify_medication_status(sentence: str) -> Literal["active", "discontinued", "historical"]:
    """Classify medication regimen status based on surrounding context."""
    s = sentence.lower()
    discontinued_triggers = [
        "discontinued", "stopped", "d/c", "d/c'd", "dc'd", "dc",
        "was on", "previously on",
        "no longer taking", "held", "was taking",
    ]
    historical_triggers = [
        "history of", "h/o", "previously", "past",
        "prior use of", "prior", "former",
    ]

    for t in discontinued_triggers:
        pattern = re.compile(r"\b" + re.escape(t) + r"\b", re.IGNORECASE)
        if pattern.search(s):
            return "discontinued"

    for t in historical_triggers:
        pattern = re.compile(r"\b" + re.escape(t) + r"\b", re.IGNORECASE)
        if pattern.search(s):
            return "historical"

    return "active"
