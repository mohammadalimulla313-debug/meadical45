"""
Tests for Clinical Context & Assertion Engine (negation, history, uncertainty, family history).
"""

import pytest
from app.services.context_analyzer import (
    classify_assertion,
    classify_medication_status,
    detect_section,
    split_clauses,
    split_sentences,
)


class TestSentenceSplitter:
    """Tests for clinical sentence splitting."""

    def test_decimal_numbers_not_split(self):
        text = "Patient temperature was 98.6 F. Potassium was 4.5 mEq/L."
        sents = split_sentences(text)
        assert len(sents) == 2
        assert "98.6 F" in sents[0]
        assert "4.5 mEq/L" in sents[1]

    def test_abbreviations_not_split(self):
        text = "Dr. Smith examined the pt. who was prescribed 500 mg po bid."
        sents = split_sentences(text)
        assert len(sents) == 1

    def test_numbered_lists(self):
        text = "Past History:\n1. Hypertension\n2. Type 2 Diabetes\n3. Asthma"
        sents = split_sentences(text)
        assert len(sents) == 4
        assert "1. Hypertension" in sents[1]
        assert "2. Type 2 Diabetes" in sents[2]


class TestClauseSplitter:
    """Tests for contrastive clause boundary identification."""

    def test_contrastive_conjunction_split(self):
        sent = "Patient denies chest pain, but reports shortness of breath."
        clauses = split_clauses(sent)
        assert len(clauses) == 2
        assert "denies chest pain" in clauses[0]
        assert "shortness of breath" in clauses[1]

    def test_semicolon_split(self):
        sent = "No nausea or vomiting; however, patient complains of dizziness."
        clauses = split_clauses(sent)
        assert len(clauses) == 2


class TestAssertionClassification:
    """Tests for clinical assertion classification."""

    def test_present_assertion(self):
        sent = "Patient reports acute chest pain and palpitations."
        assert classify_assertion("chest pain", sent) == "present"
        assert classify_assertion("palpitations", sent) == "present"

    def test_absent_assertion(self):
        sent1 = "Patient denies any shortness of breath or cough."
        assert classify_assertion("shortness of breath", sent1) == "absent"
        assert classify_assertion("cough", sent1) == "absent"

        sent2 = "Workup ruled out deep vein thrombosis."
        assert classify_assertion("deep vein thrombosis", sent2) == "absent"

        sent3 = "Negative for fever, chills, or night sweats."
        assert classify_assertion("fever", sent3) == "absent"
        assert classify_assertion("chills", sent3) == "absent"

    def test_historical_assertion(self):
        sent1 = "Past medical history of myocardial infarction in 2018."
        assert classify_assertion("myocardial infarction", sent1) == "historical"

        sent2 = "Patient is status post stroke 3 years ago."
        assert classify_assertion("stroke", sent2) == "historical"

    def test_uncertain_assertion(self):
        sent1 = "Concerning for possible pneumonia."
        assert classify_assertion("pneumonia", sent1) == "uncertain"

        sent2 = "Rule out pulmonary embolism."
        assert classify_assertion("pulmonary embolism", sent2) == "uncertain"

        sent3 = "Differential diagnosis includes congestive heart failure."
        assert classify_assertion("congestive heart failure", sent3) == "uncertain"

    def test_family_history_assertion(self):
        sent1 = "Father had coronary artery disease at age 52."
        assert classify_assertion("coronary artery disease", sent1) == "family_history"

        sent2 = "Mother was diagnosed with breast cancer."
        assert classify_assertion("breast cancer", sent2) == "family_history"

        sent3 = "Strong family history of type 2 diabetes mellitus."
        assert classify_assertion("type 2 diabetes mellitus", sent3) == "family_history"

    def test_clause_bounded_negation_isolation(self):
        """Negation in first clause must NOT leak across contrastive boundary into second clause."""
        sent = "Patient denies chest pain, but reports shortness of breath."
        assert classify_assertion("chest pain", sent) == "absent"
        assert classify_assertion("shortness of breath", sent) == "present"


class TestSectionDetection:
    """Tests for detecting note sections."""

    def test_section_headers(self):
        assert detect_section("PAST MEDICAL HISTORY:") == "past_history"
        assert detect_section("Family History:") == "family_history"
        assert detect_section("Allergies:") == "allergies"
        assert detect_section("Chief Complaint:") == "chief_complaint"
        assert detect_section("Patient has fever") is None


class TestMedicationStatusClassification:
    """Tests for active vs discontinued vs historical medication regimens."""

    def test_medication_status(self):
        assert classify_medication_status("Currently taking Lisinopril 10 mg daily.") == "active"
        assert classify_medication_status("Metformin was discontinued last month.") == "discontinued"
        assert classify_medication_status("Patient stopped taking Atorvastatin.") == "discontinued"
        assert classify_medication_status("History of prior use of Albuterol inhaler.") == "historical"
