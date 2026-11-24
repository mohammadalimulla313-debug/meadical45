/**
 * MediExtract AI — Synthetic Clinical Note Presets
 * Three realistic clinical notes for instant demo/testing.
 */

export const PRESETS = [
  {
    id: 'ed-chest-pain',
    label: 'ED Acute Chest Pain',
    description: 'Emergency cardiology note with vitals, troponin, meds, allergies, and negation examples.',
    text: `EMERGENCY DEPARTMENT NOTE

Chief Complaint: Chest pain and shortness of breath

History of Present Illness:
Mr. Johnson is a 62-year-old male with a past medical history of hypertension, type 2 diabetes mellitus, and hyperlipidemia who presents to the ED with acute onset substernal chest pain radiating to the left arm that began approximately 3 hours ago. The pain is described as crushing, 8/10 in severity, associated with diaphoresis and nausea. Patient reports shortness of breath and palpitations. He denies fever, cough, hemoptysis, abdominal pain, and diarrhea. He denies syncope or presyncope. Family history of coronary artery disease — father had myocardial infarction at age 55.

Past Medical History:
- Hypertension (HTN)
- Type 2 Diabetes Mellitus (T2DM)
- Hyperlipidemia
- History of GERD
- Status post appendectomy (childhood)

Medications:
- Metoprolol 50 mg PO twice daily
- Lisinopril 20 mg PO daily
- Atorvastatin 40 mg PO nightly
- Metformin 1000 mg PO twice daily
- Aspirin 81 mg PO daily
- Omeprazole 20 mg PO daily

Allergies: Penicillin (rash), Sulfa drugs (anaphylaxis)

Vital Signs:
BP 148/92 mmHg, HR 104 bpm, RR 22 /min, Temp 98.6 F, SpO2 93% on room air

Physical Exam:
Patient appears diaphoretic and in moderate distress. Cardiac exam reveals tachycardia with regular rhythm, no murmurs. Lungs with bibasilar crackles. No peripheral edema.

Laboratory Results:
Troponin I: 0.45 ng/mL
WBC: 11.8 K/uL
Hemoglobin: 13.2 g/dL
Platelets: 195 x10^3/uL
Glucose: 215 mg/dL
Creatinine: 1.1 mg/dL
Sodium: 139 mmol/L
Potassium: 4.2 mmol/L
BNP: 450 pg/mL
INR: 1.0
D-dimer: 320 ng/mL

Assessment & Plan:
Acute NSTEMI — will start heparin drip, administer clopidogrel 300 mg loading dose, continue aspirin. Cardiology consult for possible cardiac catheterization. Rule out pulmonary embolism given elevated D-dimer. Monitor closely in the CCU.`,
  },

  {
    id: 'endo-followup',
    label: 'Endocrinology Follow-Up',
    description: 'Primary care visit with T2DM, labs (HbA1c, eGFR), historical conditions, NKDA.',
    text: `OUTPATIENT FOLLOW-UP NOTE

Patient: Maria Garcia, 54-year-old female
Visit Type: Endocrinology / Primary Care Follow-Up

Chief Complaint: Routine diabetes management follow-up

History of Present Illness:
Ms. Garcia is a 54-year-old female with type 2 diabetes mellitus diagnosed 8 years ago, hypothyroidism, chronic kidney disease stage 3, and obesity presenting for routine follow-up. She reports generally good glycemic control but notes occasional episodes of lightheadedness and fatigue. She denies chest pain, dyspnea, nausea, vomiting, blurred vision, or peripheral edema. She reports mild bilateral knee pain consistent with known osteoarthritis. No fever, weight loss, or night sweats. Previous history of gestational diabetes. She denies any episodes of hypoglycemia.

Past Medical History:
- Type 2 Diabetes Mellitus (T2DM) — diagnosed 2018
- Hypothyroidism
- Chronic Kidney Disease (CKD) Stage 3
- Obesity (BMI 34.2)
- Osteoarthritis, bilateral knees
- History of gestational diabetes
- H/O Iron Deficiency Anemia (resolved)
- Family history of hypertension — mother with HTN since age 50

Medications:
- Metformin 1000 mg PO twice daily
- Empagliflozin 10 mg PO daily
- Levothyroxine 75 mcg PO daily
- Atorvastatin 20 mg PO daily
- Acetaminophen 500 mg PO as needed
- Vitamin D 2000 IU PO daily
- Ferrous sulfate 325 mg PO daily (discontinued — anemia resolved)

Allergies: NKDA (No Known Drug Allergies)

Vital Signs:
BP 132/78 mmHg, HR 72 bpm, RR 16 /min, Temp 98.2 F, SpO2 98% on room air, Weight: 92.5 kg, BMI 34.2 kg/m2

Laboratory Results:
HbA1c: 7.4%
Fasting Glucose: 142 mg/dL
Creatinine: 1.4 mg/dL
eGFR: 48 mL/min
BUN: 28 mg/dL
Sodium: 141 mmol/L
Potassium: 4.8 mmol/L
TSH: 3.2 mIU/L
LDL: 112 mg/dL
HDL: 42 mg/dL
Triglycerides: 198 mg/dL
Total Cholesterol: 210 mg/dL
ALT: 22 U/L
Hemoglobin: 12.8 g/dL
Ferritin: 45 ng/mL
Albumin: 3.9 g/dL

Assessment:
1. Type 2 Diabetes Mellitus — HbA1c 7.4%, above target of < 7.0%. Consider adding semaglutide for additional glycemic and weight benefit.
2. Chronic Kidney Disease Stage 3 — eGFR declining, monitor closely. Continue empagliflozin for renal protection.
3. Hypothyroidism — well-controlled on current levothyroxine dose, TSH within normal range.
4. Dyslipidemia — LDL above target. Increase atorvastatin to 40 mg.
5. Osteoarthritis — conservative management, possible referral to orthopedics.`,
  },

  {
    id: 'pulm-sepsis',
    label: 'Pulmonology / Sepsis Rule-Out',
    description: 'Uncertain diagnoses, fever, elevated WBC, IV antibiotics, and critical lab values.',
    text: `INPATIENT ADMISSION NOTE — MEDICAL ICU

Patient: Robert Williams, 71-year-old male
Admitting Diagnosis: Possible sepsis vs. community-acquired pneumonia

History of Present Illness:
Mr. Williams is a 71-year-old male with COPD, congestive heart failure (HFrEF, EF 35%), and atrial fibrillation who presents from a nursing facility with 2 days of worsening productive cough, fever (Tmax 102.8 F), chills, and altered mental status. He was found to be confused and tachypneic by nursing staff. He reports progressive dyspnea and pleuritic chest pain over the past 48 hours. He denies hemoptysis, nausea, vomiting, diarrhea, and abdominal pain. Denies headache or neck stiffness. History of deep vein thrombosis 2 years ago. He is on chronic anticoagulation with apixaban. Suspected sepsis — rule out pneumonia vs. urinary source. Possible acute kidney injury.

Past Medical History:
- COPD (on home O2 2L NC)
- Congestive Heart Failure (CHF) — HFrEF, EF 35%
- Atrial Fibrillation (AFib) — chronic, rate-controlled
- History of DVT (2 years ago)
- Hypertension
- Former smoker (40 pack-year history)
- Chronic Kidney Disease Stage 2
- Previous pneumonia (3 years ago)

Medications:
- Apixaban 5 mg PO twice daily
- Carvedilol 12.5 mg PO twice daily
- Furosemide 40 mg IV daily (changed from PO)
- Spironolactone 25 mg PO daily
- Tiotropium 18 mcg inhaled daily
- Albuterol nebulized q4h PRN
- Lisinopril 10 mg PO daily
- Ceftriaxone 1 g IV q24h (started today)
- Azithromycin 500 mg IV daily (started today)
- Vancomycin 1 g IV q12h (empiric, pending cultures)
- Acetaminophen 650 mg PO q6h PRN for fever
- Heparin 5000 units subcutaneous q8h (DVT prophylaxis — apixaban held per pharmacy)

Allergies: Latex (contact dermatitis), Morphine (nausea)

Vital Signs:
BP 98/62 mmHg, HR 112 bpm, RR 28 /min, Temp 102.4 F, SpO2 88% on 4L nasal cannula

Laboratory Results:
WBC: 18.6 K/uL
Hemoglobin: 10.2 g/dL
Platelets: 142 x10^3/uL
Creatinine: 2.4 mg/dL
BUN: 48 mg/dL
eGFR: 28 mL/min
Sodium: 133 mmol/L
Potassium: 5.3 mmol/L
Lactate: 3.8 mmol/L
Procalcitonin: 4.2 ng/mL
CRP: 148 mg/L
Troponin I: 0.08 ng/mL
BNP: 1200 pg/mL
Glucose: 178 mg/dL
ALT: 48 U/L
AST: 52 U/L
INR: 1.6
Albumin: 2.8 g/dL

Assessment & Plan:
1. Suspected sepsis — elevated lactate, procalcitonin, WBC; likely pulmonary source. Continue broad-spectrum antibiotics (ceftriaxone + azithromycin + vancomycin). Blood cultures pending. Fluid resuscitation with normal saline.
2. Community-acquired pneumonia — probable diagnosis given fever, productive cough, and imaging. Chest X-ray shows right lower lobe consolidation.
3. Possible acute kidney injury — Creatinine elevated from baseline 1.3. Monitor urine output. Hold nephrotoxic agents.
4. Acute on chronic heart failure exacerbation — BNP significantly elevated. Continue IV furosemide. Daily weights.
5. Atrial fibrillation with rapid ventricular response — HR 112. Continue carvedilol. Consider IV diltiazem if rate remains uncontrolled.
6. COPD exacerbation — likely triggered by pneumonia. Continue nebulized bronchodilators.`,
  },
];
