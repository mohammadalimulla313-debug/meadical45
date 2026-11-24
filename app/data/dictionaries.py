"""
MediExtract AI — Medical Terminology Dictionaries, Regex Patterns, and Reference Ranges.
Pure Python standard data structures. 100% local, no external APIs or dependencies.
"""

from __future__ import annotations

import re
from typing import Optional

# ══════════════════════════════════════════════════════════════
# 1. CLINICAL SECTION HEADERS
# ══════════════════════════════════════════════════════════════

SECTION_HEADER_PATTERNS: list[tuple[re.Pattern, str]] = [
    (re.compile(r"^\s*(?:chief\s+complaint|cc)\s*:", re.I), "chief_complaint"),
    (re.compile(r"^\s*(?:history\s+of\s+present\s+illness|hpi)\s*:", re.I), "hpi"),
    (re.compile(r"^\s*(?:past\s+medical\s+history|pmh|pmhx|past\s+history|medical\s+history)\s*:", re.I), "past_history"),
    (re.compile(r"^\s*(?:past\s+surgical\s+history|psh|pshx|surgical\s+history)\s*:", re.I), "past_history"),
    (re.compile(r"^\s*(?:family\s+medical\s+history|family\s+history|fh|fhx)\s*:", re.I), "family_history"),
    (re.compile(r"^\s*(?:social\s+history|sh|shx)\s*:", re.I), "social_history"),
    (re.compile(r"^\s*(?:medications?|current\s+medications?|meds)\s*:", re.I), "medications"),
    (re.compile(r"^\s*(?:allergies|allergy|known\s+allergies|drug\s+allergies)\s*:", re.I), "allergies"),
    (re.compile(r"^\s*(?:review\s+of\s+systems|ros)\s*:", re.I), "ros"),
    (re.compile(r"^\s*(?:vital\s+signs?|vitals?|vs)\s*:", re.I), "vitals"),
    (re.compile(r"^\s*(?:physical\s+exam(?:ination)?|pe)\s*:", re.I), "physical_exam"),
    (re.compile(r"^\s*(?:labs?|laboratory\s+(?:data|results)|diagnostic\s+data)\s*:", re.I), "labs"),
    (re.compile(r"^\s*(?:assessment\s*(?:and|&)\s*plan|a&p|impression|assessment|plan)\s*:", re.I), "assessment_plan"),
]


# ══════════════════════════════════════════════════════════════
# 2. SYMPTOMS LEXICON (term -> normalized concept)
# ══════════════════════════════════════════════════════════════

SYMPTOMS_LEXICON: dict[str, str] = {
    # Cardiovascular
    "chest pain": "chest pain",
    "chest tightness": "chest pain",
    "chest pressure": "chest pain",
    "chest discomfort": "chest pain",
    "angina": "angina",
    "anginal pain": "angina",
    "anginal": "angina",
    "palpitations": "palpitations",
    "heart palpitations": "palpitations",
    "racing heart": "palpitations",
    "peripheral edema": "peripheral edema",
    "pedal edema": "peripheral edema",
    "lower extremity edema": "peripheral edema",
    "leg swelling": "peripheral edema",
    "swelling of legs": "peripheral edema",
    "ankle swelling": "peripheral edema",
    "swelling": "edema",
    "edema": "edema",

    # Respiratory
    "dyspnea": "dyspnea",
    "shortness of breath": "dyspnea",
    "sob": "dyspnea",
    "breathlessness": "dyspnea",
    "difficulty breathing": "dyspnea",
    "labored breathing": "dyspnea",
    "orthopnea": "orthopnea",
    "paroxysmal nocturnal dyspnea": "paroxysmal nocturnal dyspnea",
    "pnd": "paroxysmal nocturnal dyspnea",
    "cough": "cough",
    "coughing": "cough",
    "productive cough": "productive cough",
    "dry cough": "dry cough",
    "hemoptysis": "hemoptysis",
    "coughing up blood": "hemoptysis",
    "wheezing": "wheezing",
    "stridor": "stridor",
    "tachypnea": "tachypnea",

    # Constitutional
    "fever": "fever",
    "pyrexia": "fever",
    "febrile": "fever",
    "high temperature": "fever",
    "chills": "chills",
    "rigors": "rigors",
    "diaphoresis": "diaphoresis",
    "sweating": "diaphoresis",
    "night sweats": "night sweats",
    "profuse sweating": "diaphoresis",
    "fatigue": "fatigue",
    "tiredness": "fatigue",
    "exhaustion": "fatigue",
    "malaise": "malaise",
    "weakness": "weakness",
    "generalized weakness": "weakness",
    "lethargy": "lethargy",
    "weight loss": "weight loss",
    "unintentional weight loss": "weight loss",
    "weight gain": "weight gain",
    "loss of appetite": "anorexia",
    "anorexia": "anorexia",
    "decreased appetite": "anorexia",
    "poor appetite": "anorexia",

    # Gastrointestinal
    "nausea": "nausea",
    "vomiting": "vomiting",
    "emesis": "vomiting",
    "nausea and vomiting": "nausea and vomiting",
    "diarrhea": "diarrhea",
    "loose stools": "diarrhea",
    "watery stools": "diarrhea",
    "constipation": "constipation",
    "abdominal pain": "abdominal pain",
    "stomach pain": "abdominal pain",
    "belly pain": "abdominal pain",
    "abdominal cramps": "abdominal pain",
    "epigastric pain": "epigastric pain",
    "dysphagia": "dysphagia",
    "difficulty swallowing": "dysphagia",
    "odynophagia": "odynophagia",
    "painful swallowing": "odynophagia",
    "melena": "melena",
    "black tarry stools": "melena",
    "hematochezia": "hematochezia",
    "bright red blood per rectum": "hematochezia",
    "brbpr": "hematochezia",
    "hematemesis": "hematemesis",
    "vomiting blood": "hematemesis",
    "bloating": "bloating",
    "abdominal distension": "abdominal distension",
    "heartburn": "heartburn",
    "acid reflux": "heartburn",
    "dyspepsia": "dyspepsia",
    "indigestion": "dyspepsia",
    "jaundice": "jaundice",
    "icterus": "jaundice",

    # Neurological
    "headache": "headache",
    "cephalalgia": "headache",
    "severe headache": "headache",
    "dizziness": "dizziness",
    "lightheadedness": "lightheadedness",
    "vertigo": "vertigo",
    "syncope": "syncope",
    "fainting": "syncope",
    "passed out": "syncope",
    "presyncope": "presyncope",
    "near syncope": "presyncope",
    "confusion": "confusion",
    "disorientation": "confusion",
    "altered mental status": "altered mental status",
    "ams": "altered mental status",
    "seizure": "seizure",
    "seizures": "seizure",
    "convulsions": "seizure",
    "tremor": "tremor",
    "tremors": "tremor",
    "numbness": "numbness",
    "tingling": "tingling",
    "paresthesia": "paresthesia",
    "paresthesias": "paresthesia",
    "loss of sensation": "numbness",
    "ataxia": "ataxia",
    "unsteady gait": "ataxia",
    "gait instability": "ataxia",

    # Musculoskeletal
    "arthralgia": "arthralgia",
    "joint pain": "arthralgia",
    "myalgia": "myalgia",
    "muscle pain": "myalgia",
    "muscle aches": "myalgia",
    "back pain": "back pain",
    "lower back pain": "lower back pain",
    "neck pain": "neck pain",
    "stiffness": "stiffness",
    "joint stiffness": "stiffness",
    "calf pain": "calf pain",
    "leg pain": "leg pain",

    # Dermatological
    "rash": "rash",
    "skin rash": "rash",
    "pruritus": "pruritus",
    "itching": "pruritus",
    "urticaria": "urticaria",
    "hives": "urticaria",
    "erythema": "erythema",
    "skin redness": "erythema",
    "petechiae": "petechiae",
    "purpura": "purpura",
    "ecchymosis": "ecchymosis",
    "bruising": "ecchymosis",

    # Ophthalmologic & ENT
    "blurred vision": "blurred vision",
    "visual changes": "visual changes",
    "diplopia": "diplopia",
    "double vision": "diplopia",
    "vision loss": "vision loss",
    "photophobia": "photophobia",
    "sore throat": "sore throat",
    "rhinorrhea": "rhinorrhea",
    "runny nose": "rhinorrhea",
    "nasal congestion": "nasal congestion",
    "congestion": "nasal congestion",
    "sneezing": "sneezing",
    "epistaxis": "epistaxis",
    "nosebleed": "epistaxis",
    "ear pain": "otalgia",
    "otalgia": "otalgia",
    "tinnitus": "tinnitus",
    "ringing in ears": "tinnitus",

    # Genitourinary
    "dysuria": "dysuria",
    "painful urination": "dysuria",
    "burning on urination": "dysuria",
    "hematuria": "hematuria",
    "blood in urine": "hematuria",
    "urinary frequency": "urinary frequency",
    "frequent urination": "urinary frequency",
    "urinary urgency": "urinary urgency",
    "urgency": "urinary urgency",
    "polyuria": "polyuria",
    "excessive urination": "polyuria",
    "polydipsia": "polydipsia",
    "excessive thirst": "polydipsia",
    "oliguria": "oliguria",
    "decreased urine output": "oliguria",
    "nocturia": "nocturia",
    "urinary incontinence": "urinary incontinence",
    "urinary retention": "urinary retention",

    # Psychiatric / Sleep
    "insomnia": "insomnia",
    "difficulty sleeping": "insomnia",
    "anxiety": "anxiety",
    "nervousness": "anxiety",
    "panic": "panic",
    "depression": "depressed mood",
    "depressed mood": "depressed mood",
    "hallucinations": "hallucinations",
    "delirium": "delirium",
    "agitation": "agitation",
}


# ══════════════════════════════════════════════════════════════
# 3. DISEASES & DIAGNOSES LEXICON (term -> normalized concept)
# ══════════════════════════════════════════════════════════════

DIAGNOSES_LEXICON: dict[str, str] = {
    # Cardiovascular
    "hypertension": "hypertension",
    "htn": "hypertension",
    "essential hypertension": "essential hypertension",
    "high blood pressure": "hypertension",
    "hypotension": "hypotension",
    "coronary artery disease": "coronary artery disease",
    "cad": "coronary artery disease",
    "coronary heart disease": "coronary artery disease",
    "acute myocardial infarction": "acute myocardial infarction",
    "myocardial infarction": "myocardial infarction",
    "heart attack": "myocardial infarction",
    "ami": "acute myocardial infarction",
    "stemi": "ST-elevation myocardial infarction",
    "nstemi": "non-ST-elevation myocardial infarction",
    "congestive heart failure": "congestive heart failure",
    "heart failure": "heart failure",
    "chf": "congestive heart failure",
    "hfref": "heart failure with reduced ejection fraction",
    "hfpef": "heart failure with preserved ejection fraction",
    "atrial fibrillation": "atrial fibrillation",
    "afib": "atrial fibrillation",
    "a-fib": "atrial fibrillation",
    "atrial flutter": "atrial flutter",
    "ventricular tachycardia": "ventricular tachycardia",
    "vtach": "ventricular tachycardia",
    "ventricular fibrillation": "ventricular fibrillation",
    "vfib": "ventricular fibrillation",
    "supraventricular tachycardia": "supraventricular tachycardia",
    "svt": "supraventricular tachycardia",
    "deep vein thrombosis": "deep vein thrombosis",
    "dvt": "deep vein thrombosis",
    "pulmonary embolism": "pulmonary embolism",
    "pe": "pulmonary embolism",
    "aortic stenosis": "aortic stenosis",
    "mitral regurgitation": "mitral regurgitation",
    "aortic aneurysm": "aortic aneurysm",
    "abdominal aortic aneurysm": "abdominal aortic aneurysm",
    "aaa": "abdominal aortic aneurysm",
    "endocarditis": "endocarditis",
    "pericarditis": "pericarditis",
    "cardiomyopathy": "cardiomyopathy",
    "peripheral arterial disease": "peripheral arterial disease",
    "pad": "peripheral arterial disease",

    # Respiratory
    "pneumonia": "pneumonia",
    "community-acquired pneumonia": "community-acquired pneumonia",
    "cap": "community-acquired pneumonia",
    "hospital-acquired pneumonia": "hospital-acquired pneumonia",
    "hap": "hospital-acquired pneumonia",
    "aspiration pneumonia": "aspiration pneumonia",
    "asthma": "asthma",
    "bronchial asthma": "asthma",
    "copd": "chronic obstructive pulmonary disease",
    "chronic obstructive pulmonary disease": "chronic obstructive pulmonary disease",
    "emphysema": "emphysema",
    "chronic bronchitis": "chronic bronchitis",
    "pulmonary fibrosis": "pulmonary fibrosis",
    "interstitial lung disease": "interstitial lung disease",
    "ild": "interstitial lung disease",
    "pleural effusion": "pleural effusion",
    "pneumothorax": "pneumothorax",
    "acute respiratory distress syndrome": "acute respiratory distress syndrome",
    "ards": "acute respiratory distress syndrome",
    "bronchitis": "bronchitis",
    "acute bronchitis": "acute bronchitis",
    "sleep apnea": "obstructive sleep apnea",
    "obstructive sleep apnea": "obstructive sleep apnea",
    "osa": "obstructive sleep apnea",

    # Endocrine & Metabolic
    "type 2 diabetes mellitus": "type 2 diabetes mellitus",
    "type 2 diabetes": "type 2 diabetes mellitus",
    "t2dm": "type 2 diabetes mellitus",
    "t2d": "type 2 diabetes mellitus",
    "diabetes mellitus": "diabetes mellitus",
    "diabetes": "diabetes mellitus",
    "type 1 diabetes mellitus": "type 1 diabetes mellitus",
    "type 1 diabetes": "type 1 diabetes mellitus",
    "t1dm": "type 1 diabetes mellitus",
    "t1d": "type 1 diabetes mellitus",
    "diabetic ketoacidosis": "diabetic ketoacidosis",
    "dka": "diabetic ketoacidosis",
    "hyperosmolar hyperglycemic state": "hyperosmolar hyperglycemic state",
    "hhs": "hyperosmolar hyperglycemic state",
    "hypothyroidism": "hypothyroidism",
    "underactive thyroid": "hypothyroidism",
    "hyperthyroidism": "hyperthyroidism",
    "thyrotoxicosis": "hyperthyroidism",
    "hashimoto's thyroiditis": "Hashimoto thyroiditis",
    "graves' disease": "Graves disease",
    "cushing's syndrome": "Cushing syndrome",
    "adrenal insufficiency": "adrenal insufficiency",
    "addison's disease": "Addison disease",

    # Renal & Urological
    "chronic kidney disease": "chronic kidney disease",
    "ckd": "chronic kidney disease",
    "acute kidney injury": "acute kidney injury",
    "aki": "acute kidney injury",
    "renal failure": "renal failure",
    "end-stage renal disease": "end-stage renal disease",
    "esrd": "end-stage renal disease",
    "nephrolithiasis": "nephrolithiasis",
    "kidney stones": "nephrolithiasis",
    "benign prostatic hyperplasia": "benign prostatic hyperplasia",
    "bph": "benign prostatic hyperplasia",
    "urinary tract infection": "urinary tract infection",
    "uti": "urinary tract infection",
    "pyelonephritis": "pyelonephritis",

    # Hematology & Oncology
    "anemia": "anemia",
    "iron deficiency anemia": "iron deficiency anemia",
    "sickle cell disease": "sickle cell disease",
    "pancytopenia": "pancytopenia",
    "thrombocytopenia": "thrombocytopenia",
    "leukocytosis": "leukocytosis",
    "leukopenia": "leukopenia",
    "malignancy": "malignancy",
    "cancer": "cancer",
    "carcinoma": "carcinoma",
    "lymphoma": "lymphoma",
    "leukemia": "leukemia",
    "multiple myeloma": "multiple myeloma",
    "breast cancer": "breast cancer",
    "lung cancer": "lung cancer",
    "colon cancer": "colon cancer",
    "colorectal cancer": "colorectal cancer",
    "prostate cancer": "prostate cancer",
    "melanoma": "melanoma",
    "pancreatic cancer": "pancreatic cancer",
    "metastatic cancer": "metastatic malignancy",
    "metastases": "metastatic malignancy",

    # Infectious Diseases
    "sepsis": "sepsis",
    "severe sepsis": "severe sepsis",
    "septic shock": "septic shock",
    "cellulitis": "cellulitis",
    "osteomyelitis": "osteomyelitis",
    "meningitis": "meningitis",
    "encephalitis": "encephalitis",
    "bacteremia": "bacteremia",
    "covid-19": "COVID-19",
    "covid": "COVID-19",
    "influenza": "influenza",
    "flu": "influenza",
    "tuberculosis": "tuberculosis",
    "tb": "tuberculosis",
    "clostridioides difficile": "Clostridioides difficile colitis",
    "c. diff": "Clostridioides difficile colitis",
    "c diff": "Clostridioides difficile colitis",
    "hiv": "HIV infection",
    "aids": "HIV/AIDS",
    "lyme disease": "Lyme disease",

    # Gastrointestinal & Hepatic
    "gerd": "gastroesophageal reflux disease",
    "gastroesophageal reflux disease": "gastroesophageal reflux disease",
    "peptic ulcer disease": "peptic ulcer disease",
    "peptic ulcer": "peptic ulcer disease",
    "pud": "peptic ulcer disease",
    "gastritis": "gastritis",
    "cirrhosis": "cirrhosis",
    "hepatic cirrhosis": "cirrhosis",
    "hepatitis": "hepatitis",
    "hepatitis b": "hepatitis B",
    "hepatitis c": "hepatitis C",
    "nonalcoholic fatty liver disease": "nonalcoholic fatty liver disease",
    "nafld": "nonalcoholic fatty liver disease",
    "nash": "nonalcoholic steatohepatitis",
    "pancreatitis": "pancreatitis",
    "acute pancreatitis": "acute pancreatitis",
    "chronic pancreatitis": "chronic pancreatitis",
    "gi bleed": "gastrointestinal bleeding",
    "gastrointestinal bleeding": "gastrointestinal bleeding",
    "upper gi bleed": "upper gastrointestinal bleeding",
    "lower gi bleed": "lower gastrointestinal bleeding",
    "inflammatory bowel disease": "inflammatory bowel disease",
    "ibd": "inflammatory bowel disease",
    "crohn's disease": "Crohn's disease",
    "crohns disease": "Crohn's disease",
    "ulcerative colitis": "ulcerative colitis",
    "diverticulitis": "diverticulitis",
    "diverticulosis": "diverticulosis",
    "cholecystitis": "cholecystitis",
    "cholelithiasis": "cholelithiasis",
    "gallstones": "cholelithiasis",
    "appendicitis": "appendicitis",
    "small bowel obstruction": "small bowel obstruction",
    "sbo": "small bowel obstruction",

    # Neurological
    "stroke": "stroke",
    "cerebrovascular accident": "cerebrovascular accident",
    "cva": "cerebrovascular accident",
    "ischemic stroke": "ischemic stroke",
    "hemorrhagic stroke": "hemorrhagic stroke",
    "transient ischemic attack": "transient ischemic attack",
    "tia": "transient ischemic attack",
    "migraine": "migraine",
    "migraines": "migraine",
    "epilepsy": "epilepsy",
    "seizure disorder": "seizure disorder",
    "parkinson's disease": "Parkinson's disease",
    "parkinsons": "Parkinson's disease",
    "alzheimer's disease": "Alzheimer's disease",
    "alzheimers": "Alzheimer's disease",
    "dementia": "dementia",
    "vascular dementia": "vascular dementia",
    "multiple sclerosis": "multiple sclerosis",
    "ms": "multiple sclerosis",
    "neuropathy": "peripheral neuropathy",
    "peripheral neuropathy": "peripheral neuropathy",
    "diabetic neuropathy": "diabetic neuropathy",
    "myasthenia gravis": "myasthenia gravis",
    "bells palsy": "Bell's palsy",
    "bell's palsy": "Bell's palsy",

    # Dyslipidemias & Electrolytes
    "hyperlipidemia": "hyperlipidemia",
    "hlp": "hyperlipidemia",
    "dyslipidemia": "dyslipidemia",
    "hypercholesterolemia": "hypercholesterolemia",
    "high cholesterol": "hypercholesterolemia",
    "hypertriglyceridemia": "hypertriglyceridemia",
    "hyperkalemia": "hyperkalemia",
    "hypokalemia": "hypokalemia",
    "hypernatremia": "hypernatremia",
    "hyponatremia": "hyponatremia",
    "hypomagnesemia": "hypomagnesemia",
    "hypercalcemia": "hypercalcemia",
    "hypocalcemia": "hypocalcemia",
    "hypoglycemia": "hypoglycemia",
    "hyperglycemia": "hyperglycemia",
    "metabolic acidosis": "metabolic acidosis",
    "respiratory acidosis": "respiratory acidosis",

    # Musculoskeletal & Rheumatology
    "osteoarthritis": "osteoarthritis",
    "oa": "osteoarthritis",
    "degenerative joint disease": "osteoarthritis",
    "djd": "osteoarthritis",
    "rheumatoid arthritis": "rheumatoid arthritis",
    "ra": "rheumatoid arthritis",
    "gout": "gout",
    "pseudogout": "pseudogout",
    "osteoporosis": "osteoporosis",
    "osteopenia": "osteopenia",
    "lupus": "systemic lupus erythematosus",
    "systemic lupus erythematosus": "systemic lupus erythematosus",
    "sle": "systemic lupus erythematosus",
    "fibromyalgia": "fibromyalgia",
    "psoriatic arthritis": "psoriatic arthritis",
    "ankylosing spondylitis": "ankylosing spondylitis",

    # Psychiatric
    "major depressive disorder": "major depressive disorder",
    "mdd": "major depressive disorder",
    "depression": "major depressive disorder",
    "generalized anxiety disorder": "generalized anxiety disorder",
    "gad": "generalized anxiety disorder",
    "anxiety disorder": "generalized anxiety disorder",
    "bipolar disorder": "bipolar disorder",
    "bipolar": "bipolar disorder",
    "schizophrenia": "schizophrenia",
    "schizoaffective disorder": "schizoaffective disorder",
    "ptsd": "post-traumatic stress disorder",
    "post-traumatic stress disorder": "post-traumatic stress disorder",
    "obsessive-compulsive disorder": "obsessive-compulsive disorder",
    "ocd": "obsessive-compulsive disorder",
    "panic disorder": "panic disorder",
    "alcohol use disorder": "alcohol use disorder",
    "substance use disorder": "substance use disorder",
}


# ══════════════════════════════════════════════════════════════
# 4. MEDICATIONS LEXICON
# ══════════════════════════════════════════════════════════════

MEDICATIONS_LEXICON: set[str] = {
    # Cardiovascular: Antihypertensives, Statins, Antiarrhythmics, Anticoagulants
    "lisinopril", "enalapril", "ramipril", "benazepril", "captopril",
    "losartan", "valsartan", "irbesartan", "olmesartan", "candesartan",
    "amlodipine", "nifedipine", "felodipine", "diltiazem", "verapamil",
    "metoprolol", "metoprolol succinate", "metoprolol tartrate",
    "atenolol", "propranolol", "carvedilol", "bisoprolol", "labetalol", "nebivolol",
    "atorvastatin", "lipitor", "rosuvastatin", "crestor", "simvastatin", "zocor", "pravastatin", "lovastatin",
    "aspirin", "baby aspirin", "clopidogrel", "plavix", "prasugrel", "ticagrelor", "brilinta",
    "apixaban", "eliquis", "rivaroxaban", "xarelto", "warfarin", "coumadin",
    "heparin", "enoxaparin", "lovenox", "dabigatran", "pradaxa", "fondaparinux",
    "nitroglycerin", "nitro", "isosorbide", "isosorbide mononitrate", "isosorbide dinitrate",
    "hydralazine", "minoxidil", "clonidine",
    "amiodarone", "digoxin", "dronedarone", "sotalol", "flecainide",
    "furosemide", "lasix", "bumetanide", "torsemide",
    "hydrochlorothiazide", "hctz", "chlorthalidone", "indapamide",
    "spironolactone", "aldactone", "eplerenone",

    # Endocrine & Diabetes
    "metformin", "glucophage", "glipizide", "glyburide", "glimepiride",
    "insulin glargine", "insulin lispro", "insulin aspart", "insulin detemir", "insulin degludec",
    "insulin", "lantus", "humalog", "novolog", "tresiba", "levemir",
    "empagliflozin", "jardiance", "dapagliflozin", "farxiga", "canagliflozin", "invokana",
    "semaglutide", "ozempic", "wegovy", "rybelsus",
    "liraglutide", "victoza", "dulaglutide", "trulicity", "tirzepatide", "mounjaro",
    "sitagliptin", "januvia", "linagliptin", "tradjenta",
    "pioglitazone", "actos",
    "levothyroxine", "synthroid", "levoxyl", "armor thyroid",
    "methimazole", "propylthiouracil",

    # Respiratory
    "albuterol", "proair", "ventolin", "levalbuterol", "xopenex",
    "ipratropium", "atrovent", "tiotropium", "spiriva",
    "fluticasone", "flovent", "flonase", "budesonide", "pulmicort", "symbicort", "advair",
    "mometasone", "asmanex", "beclomethasone",
    "montelukast", "singulair", "theophylline",

    # Analgesics, Anti-inflammatory & Steroids
    "prednisone", "prednisolone", "methylprednisolone", "medrol", "dexamethasone", "hydrocortisone",
    "ibuprofen", "motrin", "advil", "naproxen", "aleve", "naprosyn",
    "celecoxib", "celebrex", "meloxicam", "mobic", "diclofenac", "voltaren", "indomethacin",
    "acetaminophen", "tylenol", "paracetamol",
    "morphine", "hydromorphone", "dilaudid", "fentanyl", "oxycodone", "oxycontin", "percocet",
    "hydrocodone", "vicodin", "norco", "tramadol", "ultram", "codeine",
    "gabapentin", "neurontin", "pregabalin", "lyrica",
    "ketorolac", "toradol",

    # Antibiotics, Antivirals, Antifungals
    "amoxicillin", "amoxil", "augmentin", "amoxicillin-clavulanate",
    "ampicillin", "penicillin", "penicillin vk",
    "azithromycin", "zithromax", "z-pak", "clarithromycin", "erythromycin",
    "ceftriaxone", "rocephin", "cefazolin", "ancef", "cephalexin", "keflex",
    "cefepime", "ceftazidime", "cefdinir", "cefpodoxime",
    "vancomycin", "vancocin",
    "piperacillin-tazobactam", "piperacillin", "zosyn",
    "meropenem", "merrem", "imipenem", "ertapenem",
    "ciprofloxacin", "cipro", "levofloxacin", "levaquin", "moxifloxacin",
    "doxycycline", "vibramycin", "minocycline", "tetracycline",
    "trimethoprim-sulfamethoxazole", "bactrim", "septra", "tmp-smx",
    "metronidazole", "flagyl", "clindamycin", "cleocin",
    "linezolid", "zyvox", "daptomycin", "cubicin", "nitrofurantoin", "macrobid",
    "fluconazole", "diflucan", "micafungin", "voriconazole", "nystatin",
    "acyclovir", "valacyclovir", "valtrex", "oseltamivir", "tamiflu", "paxlovid",

    # Gastrointestinal
    "omeprazole", "prilosec", "pantoprazole", "protonix", "esomeprazole", "nexium", "lansoprazole", "prevacid",
    "famotidine", "pepcid", "ranitidine", "zantac",
    "ondansetron", "zofran", "metoclopramide", "reglan", "promethazine", "phenergan", "prochlorperazine",
    "sucralfate", "carafate", "bismuth subsalicylate", "pepto-bismol",
    "lactulose", "polyethylene glycol", "miralax", "docusate", "colace", "senna",
    "linaclotide", "linzess",

    # Psychiatric & Neurological
    "sertraline", "zoloft", "fluoxetine", "prozac", "paroxetine", "paxil",
    "citalopram", "celexa", "escitalopram", "lexapro",
    "venlafaxine", "effexor", "duloxetine", "cymbalta", "bupropion", "wellbutrin", "mirtazapine", "remeron",
    "quetiapine", "seroquel", "olanzapine", "zyprexa", "risperidone", "risperdal", "aripiprazole", "abilify", "haloperidol", "haldol",
    "lorazepam", "ativan", "midazolam", "versed", "diazepam", "valium", "alprazolam", "xanax", "clonazepam", "klonopin",
    "lithium", "valproic acid", "depakote", "carbamazepine", "tegretol", "lamotrigine", "lamictal",
    "levetiracetam", "keppra", "phenytoin", "dilantin", "topiramate", "topamax", "oxcarbazepine",
    "donepezil", "aricept", "memantine", "namenda",
    "zolpidem", "ambien", "trazodone", "buspirone",

    # Miscellaneous
    "allopurinol", "zyloprim", "colchicine", "colcrys",
    "potassium chloride", "kcl", "k-dur",
    "ferrous sulfate", "iron sulfate", "iron",
    "calcium carbonate", "vitamin d", "ergocalciferol", "cholecalciferol",
    "folic acid", "vitamin b12", "cyanocobalamin",
    "tamsulosin", "flomax", "finasteride", "proscar", "alfuzosin",
    "hydroxychloroquine", "plaquenil", "methotrexate",
}


# ══════════════════════════════════════════════════════════════
# 5. DOSAGE, FREQUENCY & ROUTE REGEX
# ══════════════════════════════════════════════════════════════

DOSAGE_RE = re.compile(
    r"\b(\d+(?:\.\d+)?)\s*(mg|mcg|µg|ug|g|ml|mL|L|units?|IU|mEq|%)\b",
    re.IGNORECASE,
)

FREQUENCY_RE = re.compile(
    r"""
    \b(?:
        once\s+daily|twice\s+daily|three\s+times\s+daily|four\s+times\s+daily
        | every\s+\d+\s+hours?
        | q\.?\s*\d+\s*h
        | q\.?d\.?|b\.?i\.?d\.?|t\.?i\.?d\.?|q\.?i\.?d\.?
        | q\.?h\.?s\.?|qam|qpm
        | p\.?r\.?n\.?|as\s+needed(?:\s+for\s+[a-zA-Z\s]+)?
        | daily|nightly|weekly|monthly
        | at\s+bedtime|at\s+night
        | every\s+morning|every\s+evening
        | stat
        | a\.?m\.?\s+and\s+p\.?m\.?
        | with\s+meals
    )\b
    """,
    re.VERBOSE | re.IGNORECASE,
)

ROUTE_RE = re.compile(
    r"""
    \b(?:
        PO|oral(?:ly)?|by\s+mouth
        | IV|intravenous(?:ly)?
        | IM|intramuscular(?:ly)?
        | SC|SubQ|subcutaneous(?:ly)?|subcut
        | topical(?:ly)?
        | inhaled|inhalation|nebulized
        | SL|sublingual(?:ly)?
        | rectal(?:ly)?|PR
        | transdermal
        | intranasal
        | ophthalmic
        | otic
    )\b
    """,
    re.VERBOSE | re.IGNORECASE,
)


# ══════════════════════════════════════════════════════════════
# 6. LAB TEST PATTERNS & REFERENCE RANGES
# ══════════════════════════════════════════════════════════════

LAB_PATTERNS: list[tuple[re.Pattern, str, Optional[str]]] = [
    (re.compile(r"\b(?:WBC|white\s+blood\s+cell(?:\s+count)?)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(K/uL|k/ul|×?10\^?[39]/[uµ]?L|thou/uL)?", re.I), "WBC", "K/uL"),
    (re.compile(r"\b(?:RBC|red\s+blood\s+cell(?:\s+count)?)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(M/uL|mil/uL)?", re.I), "RBC", "M/uL"),
    (re.compile(r"\b(?:Hgb|Hb|[Hh]emoglobin)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(g/dL|g/dl)?", re.I), "Hemoglobin", "g/dL"),
    (re.compile(r"\b(?:Hct|[Hh]ematocrit)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(%)?", re.I), "Hematocrit", "%"),
    (re.compile(r"\b(?:PLT|[Pp]latelets?(?:\s+count)?)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(K/uL|k/ul|×?10\^?[39]/[uµ]?L|thou/uL|x10\^3/uL)?", re.I), "Platelets", "K/uL"),
    (re.compile(r"\b(?:HbA1[cC]|A1[cC]|glycated\s+hemoglobin|hemoglobin\s+a1c)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(%)?", re.I), "HbA1c", "%"),
    (re.compile(r"\b(?:Glucose|blood\s+glucose|fasting\s+glucose|random\s+glucose|FBG|RBG|BG)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(mg/dL|mg/dl|mmol/L)?", re.I), "Glucose", "mg/dL"),
    (re.compile(r"\b(?:Creatinine|Creat|Cr|SCr)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(mg/dL|mg/dl|µmol/L)?", re.I), "Creatinine", "mg/dL"),
    (re.compile(r"\b(?:BUN|blood\s+urea\s+nitrogen)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(mg/dL|mg/dl)?", re.I), "BUN", "mg/dL"),
    (re.compile(r"\b(?:eGFR|estimated\s+GFR|GFR)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(mL/min(?:/1\.73\s*m2)?)?", re.I), "eGFR", "mL/min"),
    (re.compile(r"\b(?:Sodium|Na\+?)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(mEq/L|mmol/L)?", re.I), "Sodium", "mmol/L"),
    (re.compile(r"\b(?:Potassium|K\+?)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(mEq/L|mmol/L)?", re.I), "Potassium", "mmol/L"),
    (re.compile(r"\b(?:Chloride|Cl\-?)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(mEq/L|mmol/L)?", re.I), "Chloride", "mmol/L"),
    (re.compile(r"\b(?:Bicarbonate|Bicarb|CO2|HCO3)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(mEq/L|mmol/L)?", re.I), "Bicarbonate", "mmol/L"),
    (re.compile(r"\b(?:Calcium|Ca)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(mg/dL|mg/dl|mmol/L)?", re.I), "Calcium", "mg/dL"),
    (re.compile(r"\b(?:Magnesium|Mg)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(mg/dL|mg/dl|mEq/L)?", re.I), "Magnesium", "mg/dL"),
    (re.compile(r"\b(?:Phosphorus|Phos)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(mg/dL|mg/dl)?", re.I), "Phosphorus", "mg/dL"),
    (re.compile(r"\b(?:Troponin\s*(?:I|T)?|TnI|TnT|cTnI|cTnT|hs-?Troponin)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(ng/mL|ng/ml|ng/L|pg/mL)?", re.I), "Troponin", "ng/mL"),
    (re.compile(r"\b(?:BNP|NT-?proBNP|brain\s+natriuretic\s+peptide)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(pg/mL|pg/ml|ng/L)?", re.I), "BNP", "pg/mL"),
    (re.compile(r"\b(?:ALT|SGPT|alanine\s+(?:amino)?transaminase)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(U/L|IU/L)?", re.I), "ALT", "U/L"),
    (re.compile(r"\b(?:AST|SGOT|aspartate\s+(?:amino)?transaminase)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(U/L|IU/L)?", re.I), "AST", "U/L"),
    (re.compile(r"\b(?:ALP|alkaline\s+phosphatase)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(U/L|IU/L)?", re.I), "ALP", "U/L"),
    (re.compile(r"\b(?:Total\s+Bilirubin|T\.?\s*Bili|Bilirubin)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(mg/dL|mg/dl)?", re.I), "Total Bilirubin", "mg/dL"),
    (re.compile(r"\b(?:Albumin|Alb)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(g/dL|g/dl)?", re.I), "Albumin", "g/dL"),
    (re.compile(r"\b(?:TSH|thyroid\s+stimulating\s+hormone)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(mIU/L|µIU/mL|uIU/mL)?", re.I), "TSH", "mIU/L"),
    (re.compile(r"\b(?:Free\s+T4|FT4)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(ng/dL|ng/dl|pmol/L)?", re.I), "Free T4", "ng/dL"),
    (re.compile(r"\b(?:LDL|LDL-?C|LDL\s+cholesterol)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(mg/dL|mg/dl|mmol/L)?", re.I), "LDL", "mg/dL"),
    (re.compile(r"\b(?:HDL|HDL-?C|HDL\s+cholesterol)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(mg/dL|mg/dl|mmol/L)?", re.I), "HDL", "mg/dL"),
    (re.compile(r"\b(?:Total\s+[Cc]holesterol|TC)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(mg/dL|mg/dl)?", re.I), "Total Cholesterol", "mg/dL"),
    (re.compile(r"\b(?:Triglycerides|TG|Trig)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(mg/dL|mg/dl)?", re.I), "Triglycerides", "mg/dL"),
    (re.compile(r"\b(?:CRP|C-?reactive\s+protein)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(mg/L|mg/dl)?", re.I), "CRP", "mg/L"),
    (re.compile(r"\b(?:ESR|sed\s+rate|erythrocyte\s+sedimentation\s+rate)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(mm/hr|mm/h)?", re.I), "ESR", "mm/hr"),
    (re.compile(r"\b(?:D-?dimer|D\s+dimer)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(ng/mL|ng/ml|µg/L|mg/L\s*FEU)?", re.I), "D-dimer", "ng/mL"),
    (re.compile(r"\b(?:INR|international\s+normalized\s+ratio)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\b", re.I), "INR", None),
    (re.compile(r"\b(?:PT|prothrombin\s+time)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(seconds?|sec|s)?", re.I), "PT", "seconds"),
    (re.compile(r"\b(?:PTT|aPTT|activated\s+partial\s+thromboplastin\s+time)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(seconds?|sec|s)?", re.I), "aPTT", "seconds"),
    (re.compile(r"\b(?:Lactate|Lactic\s+acid)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(mmol/L|mg/dL|mg/dl)?", re.I), "Lactate", "mmol/L"),
    (re.compile(r"\b(?:Procalcitonin|PCT)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(ng/mL|ng/ml|µg/L)?", re.I), "Procalcitonin", "ng/mL"),
    (re.compile(r"\b(?:Ferritin)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(ng/mL|ng/ml|µg/L)?", re.I), "Ferritin", "ng/mL"),
    (re.compile(r"\b(?:Iron|Serum\s+Iron)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(µg/dL|mcg/dL|ug/dL)?", re.I), "Iron", "µg/dL"),
    (re.compile(r"\b(?:TIBC|total\s+iron\s+binding\s+capacity)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(µg/dL|mcg/dL)?", re.I), "TIBC", "µg/dL"),
    (re.compile(r"\b(?:Lipase)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(U/L|IU/L)?", re.I), "Lipase", "U/L"),
    (re.compile(r"\b(?:Amylase)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d+(?:\.\d+)?)\s*(U/L|IU/L)?", re.I), "Amylase", "U/L"),
]

# (normalized_name -> (normal_low, normal_high, critical_low, critical_high))
LAB_RANGES: dict[str, tuple[float, float, Optional[float], Optional[float]]] = {
    "WBC":          (4.5, 11.0, 2.0, 30.0),
    "RBC":          (4.2, 5.9, 2.5, 7.0),
    "Hemoglobin":   (12.0, 17.5, 7.0, 20.0),
    "Hematocrit":   (36.0, 50.0, 20.0, 60.0),
    "Platelets":    (150.0, 400.0, 50.0, 1000.0),
    "HbA1c":        (4.0, 5.6, None, 14.0),
    "Glucose":      (70.0, 100.0, 40.0, 500.0),
    "Creatinine":   (0.6, 1.2, None, 10.0),
    "BUN":          (7.0, 20.0, None, 100.0),
    "eGFR":         (90.0, 999.0, 15.0, None),
    "Sodium":       (136.0, 145.0, 120.0, 160.0),
    "Potassium":    (3.5, 5.0, 2.5, 6.5),
    "Chloride":     (98.0, 106.0, None, None),
    "Bicarbonate":  (22.0, 28.0, 10.0, 40.0),
    "Calcium":      (8.5, 10.5, 6.0, 14.0),
    "Troponin":     (0.0, 0.04, None, 2.0),
    "ALT":          (7.0, 56.0, None, 1000.0),
    "AST":          (10.0, 40.0, None, 1000.0),
    "TSH":          (0.4, 4.0, None, None),
    "LDL":          (0.0, 100.0, None, None),
    "HDL":          (40.0, 999.0, None, None),
    "CRP":          (0.0, 10.0, None, None),
    "D-dimer":      (0.0, 500.0, None, None),
    "INR":          (0.8, 1.2, None, 5.0),
    "Lactate":      (0.5, 2.0, None, 4.0),
    "Total Bilirubin": (0.1, 1.2, None, 15.0),
    "Albumin":      (3.5, 5.0, None, None),
    "Magnesium":    (1.7, 2.2, 1.0, 4.0),
    "Phosphorus":   (2.5, 4.5, 1.0, None),
    "Procalcitonin": (0.0, 0.1, None, 10.0),
    "Lipase":       (10.0, 140.0, None, 600.0),
    "Amylase":      (30.0, 110.0, None, 500.0),
}


# ══════════════════════════════════════════════════════════════
# 7. VITAL SIGNS PATTERNS
# ══════════════════════════════════════════════════════════════

VITAL_PATTERNS: list[tuple[re.Pattern, str, str]] = [
    # Blood Pressure
    (re.compile(r"\b(?:BP|[Bb]lood\s+[Pp]ressure)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d{2,3}\s*/\s*\d{2,3})\s*(mmHg)?", re.I), "Blood Pressure", "mmHg"),
    # Heart Rate
    (re.compile(r"\b(?:HR|[Hh]eart\s+[Rr]ate|[Pp]ulse)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d{2,3})\s*(bpm|beats?/min)?", re.I), "Heart Rate", "bpm"),
    # Respiratory Rate
    (re.compile(r"\b(?:RR|[Rr]esp(?:iratory)?\s*(?:[Rr]ate)?)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d{1,2})\s*(/min|breaths?/min)?", re.I), "Respiratory Rate", "/min"),
    # Temperature
    (re.compile(r"\b(?:Temp|[Tt]emperature|T)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d{2,3}(?:\.\d{1,2})?)\s*°?\s*([FCfc])\b", re.I), "Temperature", ""),
    # SpO2
    (re.compile(r"\b(?:SpO2|O2\s*[Ss]at|[Oo]xygen\s+[Ss]aturation|SaO2|[Oo]2\s+sat)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d{2,3})\s*(%)?", re.I), "SpO2", "%"),
    # Weight
    (re.compile(r"\b(?:Weight|Wt|wt)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d{2,3}(?:\.\d{1,2})?)\s*(kg|lbs?|pounds?)\b", re.I), "Weight", ""),
    # Height
    (re.compile(r"\b(?:Height|Ht|ht)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d{2,3}(?:\.\d{1,2})?)\s*(cm|m|in|inches|feet|ft)\b", re.I), "Height", ""),
    # BMI
    (re.compile(r"\b(?:BMI|[Bb]ody\s+[Mm]ass\s+[Ii]ndex)\s*(?:[:=]|\bis\b|\bwas\b|\bof\b)?\s*(\d{2,3}(?:\.\d{1,2})?)\s*(kg/m2|kg/m²)?", re.I), "BMI", "kg/m²"),
]


# ══════════════════════════════════════════════════════════════
# 8. ALLERGY REGEX PATTERNS
# ══════════════════════════════════════════════════════════════

ALLERGY_SECTION_RE = re.compile(
    r"""
    (?:
        \b(?:Allergies|Allergy|Drug\s+Allergies|Medication\s+Allergies|Known\s+Allergies)\s*[:]\s*
    )
    (.+?)
    (?:\n\n|\n(?=[A-Z][a-z0-9\s]+:)|\Z)
    """,
    re.VERBOSE | re.IGNORECASE | re.DOTALL,
)

ALLERGIC_TO_RE = re.compile(
    r"\b(?:allergic\s+to|allergy\s+to|allergies\s+to|allergies\s+include)\s+(.+?)(?:[.;]|\band\b(?!\s+\w+\s+(?:causing|resulting))|\Z)",
    re.IGNORECASE,
)

NKDA_RE = re.compile(
    r"\b(?:NKDA|NKA|no\s+known\s+(?:drug\s+)?allergies|no\s+known\s+allergies|no\s+allergies(?:\s+noted)?)\b",
    re.IGNORECASE,
)

REACTION_RE = re.compile(
    r"\(\s*([^)]+)\s*\)|(?:causing|resulting\s+in|with)\s+([a-zA-Z\s]+)",
    re.IGNORECASE,
)
