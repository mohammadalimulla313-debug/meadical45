"""
Tests for Clinical Extraction Engine.
Tests all 10 clinical categories, edge cases, synthetic clinical notes,
and ensures no fake extractions on non-medical text.
"""

import pytest
from app.services.clinical_extractor import extract_all


class TestSymptomAndDiagnosisExtraction:
    """Tests for symptoms and disease/condition extraction."""

    def test_present_and_absent_symptoms(self):
        text = "Patient presents with acute chest pain and palpitations. Denies dyspnea, nausea, or vomiting."
        res = extract_all(text)

        symptom_terms = {s.text.lower() for s in res.symptoms}
        assert "chest pain" in symptom_terms
        assert "palpitations" in symptom_terms
        assert "dyspnea" in symptom_terms
        assert "nausea" in symptom_terms
        assert "vomiting" in symptom_terms

        # Check assertion statuses
        status_map = {s.text.lower(): s.status for s in res.symptoms}
        assert status_map["chest pain"] == "present"
        assert status_map["palpitations"] == "present"
        assert status_map["dyspnea"] == "absent"
        assert status_map["nausea"] == "absent"
        assert status_map["vomiting"] == "absent"

    def test_current_historical_uncertain_diagnoses(self):
        text = (
            "Current assessment: Hypertension and Type 2 Diabetes Mellitus. "
            "Past history of acute myocardial infarction in 2019. "
            "Differential diagnosis includes possible pneumonia and rule out pulmonary embolism."
        )
        res = extract_all(text)

        diag_map = {d.text.lower(): d.status for d in res.diagnoses}
        assert "hypertension" in diag_map
        assert diag_map["hypertension"] == "present"
        assert "type 2 diabetes mellitus" in diag_map
        assert diag_map["type 2 diabetes mellitus"] == "present"
        assert "acute myocardial infarction" in diag_map
        assert diag_map["acute myocardial infarction"] == "historical"
        assert "pneumonia" in diag_map
        assert diag_map["pneumonia"] == "uncertain"
        assert "pulmonary embolism" in diag_map
        assert diag_map["pulmonary embolism"] == "uncertain"

    def test_family_history_extraction(self):
        text = (
            "Family History:\n"
            "Father had coronary artery disease at age 50.\n"
            "Mother diagnosed with breast cancer.\n"
            "Brother has hypertension."
        )
        res = extract_all(text)
        assert len(res.family_history) >= 2
        fh_terms = {f.text.lower() for f in res.family_history}
        assert "coronary artery disease" in fh_terms
        assert "breast cancer" in fh_terms


class TestMedicationExtraction:
    """Tests for medications, dosages, frequencies, routes, and statuses."""

    def test_multiple_medications_isolated_windows(self):
        text = "Patient takes Lisinopril 20 mg PO daily, Metformin 1000 mg twice daily, and Aspirin 81 mg daily."
        res = extract_all(text)

        assert len(res.medications) >= 3
        med_dict = {m.name.lower(): m for m in res.medications}

        assert "lisinopril" in med_dict
        assert med_dict["lisinopril"].dosage == "20 mg"
        assert med_dict["lisinopril"].route == "PO"
        assert "daily" in (med_dict["lisinopril"].frequency or "").lower()

        assert "metformin" in med_dict
        assert med_dict["metformin"].dosage == "1000 mg"
        assert "twice daily" in (med_dict["metformin"].frequency or "").lower()

        assert "aspirin" in med_dict
        assert med_dict["aspirin"].dosage == "81 mg"

    def test_discontinued_medication(self):
        text = "Atorvastatin 40 mg daily was discontinued due to myalgia."
        res = extract_all(text)
        assert len(res.medications) >= 1
        med = res.medications[0]
        assert med.name.lower() == "atorvastatin"
        assert med.status == "discontinued"


class TestLabResultsExtraction:
    """Tests for lab test recognition and reference range abnormal flagging."""

    def test_labs_with_flags(self):
        text = (
            "Labs show WBC: 14.5 K/uL (elevated), Hemoglobin: 8.2 g/dL, "
            "Platelets: 210 K/uL, Potassium: 6.8 mEq/L, Troponin: 0.15 ng/mL."
        )
        res = extract_all(text)
        lab_dict = {l.normalized_test: l for l in res.lab_results}

        assert "WBC" in lab_dict
        assert lab_dict["WBC"].value == "14.5"
        assert lab_dict["WBC"].flag == "HIGH"

        assert "Hemoglobin" in lab_dict
        assert lab_dict["Hemoglobin"].value == "8.2"
        assert lab_dict["Hemoglobin"].flag == "LOW"

        assert "Platelets" in lab_dict
        assert lab_dict["Platelets"].value == "210"
        assert lab_dict["Platelets"].flag == "NORMAL"

        assert "Potassium" in lab_dict
        assert lab_dict["Potassium"].value == "6.8"
        assert lab_dict["Potassium"].flag == "CRITICAL"

        assert "Troponin" in lab_dict
        assert lab_dict["Troponin"].value == "0.15"
        assert lab_dict["Troponin"].flag == "HIGH"


class TestVitalSignsExtraction:
    """Tests for vital signs extraction."""

    def test_vital_signs(self):
        text = (
            "Vitals: BP 142/88 mmHg, HR 96 bpm, RR 18 /min, "
            "Temp 99.4 F, SpO2 96%, Weight 82 kg, BMI 28.5 kg/m2."
        )
        res = extract_all(text)
        vital_dict = {v.name: v for v in res.vital_signs}

        assert "Blood Pressure" in vital_dict
        assert vital_dict["Blood Pressure"].value == "142/88"

        assert "Heart Rate" in vital_dict
        assert vital_dict["Heart Rate"].value == "96"

        assert "Respiratory Rate" in vital_dict
        assert vital_dict["Respiratory Rate"].value == "18"

        assert "Temperature" in vital_dict
        assert "99.4" in vital_dict["Temperature"].value

        assert "SpO2" in vital_dict
        assert vital_dict["SpO2"].value == "96"

        assert "BMI" in vital_dict
        assert vital_dict["BMI"].value == "28.5"


class TestAllergiesExtraction:
    """Tests for allergy extraction and NKDA declarations."""

    def test_allergy_with_reaction(self):
        text = "Allergies: Penicillin (hives and rash), Sulfa (anaphylaxis)."
        res = extract_all(text)
        allergy_dict = {a.allergen.lower(): a for a in res.allergies}

        assert "penicillin" in allergy_dict
        assert "hives" in (allergy_dict["penicillin"].reaction or "").lower()

        assert "sulfa" in allergy_dict
        assert "anaphylaxis" in (allergy_dict["sulfa"].reaction or "").lower()

    def test_nkda(self):
        text = "Patient has no known drug allergies (NKDA)."
        res = extract_all(text)
        assert any(a.is_nkda for a in res.allergies)


class TestEdgeCasesAndSafety:
    """Tests for non-medical text and preservation of source sentences."""

    def test_non_medical_text_returns_empty_lists(self):
        text = "The weather today is sunny and mild. We decided to walk through the central park and read a novel."
        res = extract_all(text)

        assert res.symptoms == []
        assert res.diagnoses == []
        assert res.family_history == []
        assert res.medications == []
        assert res.lab_results == []
        assert res.vital_signs == []
        assert res.allergies == []
        assert all(count == 0 for count in res.counts.values())

    def test_source_sentence_preserved_for_every_entity(self):
        text = (
            "Patient reports cough. "
            "Started on Amoxicillin 500 mg TID. "
            "BP is 120/80 mmHg."
        )
        res = extract_all(text)

        for s in res.symptoms:
            assert s.source_sentence != ""
            assert "cough" in s.source_sentence.lower()

        for m in res.medications:
            assert m.source_sentence != ""
            assert "amoxicillin" in m.source_sentence.lower()

        for v in res.vital_signs:
            assert v.source_sentence != ""
            assert "120/80" in v.source_sentence
