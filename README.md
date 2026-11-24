# MediExtract AI — Premium Healthcare Document Intelligence Platform

MediExtract AI is a **100% local, deterministic clinical natural language processing (NLP) and document intelligence platform** built with FastAPI and React. It extracts medical concepts from unstructured clinical notes, discharge summaries, and medical records (PDF, DOCX, TXT) without relying on spaCy, external AI APIs, machine learning models, or external internet connections.

> **Disclaimer**: *Automated rule-based extraction for demonstration purposes. Not a medical diagnosis. Not for clinical use.*

---

## Architecture & System Overview

- **100% Local Processing / Zero External AI Calls**: Runs entirely on the local machine with zero external network requests and zero LLM dependencies.
- **Strict Library Compliance**: Uses only permitted dependencies: `fastapi`, `uvicorn`, `pydantic` v2, `PyMuPDF`, `python-docx`, `python-multipart`, `pytest`, and `httpx`.
- **10 Core Clinical Extraction Categories**:
  1. **Present Symptoms** (e.g. chest pain, palpitations, diaphoresis)
  2. **Absent Symptoms / Negated** (e.g. "denies dyspnea", "negative for fever")
  3. **Current Diagnoses & Conditions** (e.g. hypertension, T2DM, acute myocardial infarction)
  4. **Historical Conditions** (e.g. "past history of stroke", "status post CABG")
  5. **Uncertain Diagnoses / Differential** (e.g. "possible pneumonia", "rule out PE")
  6. **Family Medical History** (e.g. "father had CAD", "mother diagnosed with breast cancer")
  7. **Medications, Dosages & Frequencies** (with isolated windows, routes, and status)
  8. **Laboratory Results** (with unit parsing and reference range flags: `HIGH`, `LOW`, `NORMAL`, `CRITICAL`)
  9. **Vital Signs** (Blood Pressure, Heart Rate, Respiratory Rate, Temperature, SpO2, BMI, Weight, Height)
  10. **Allergies & Reactions** (NKDA recognition, allergen + clinical reaction parsing)
- **Clause-Bounded Negation Engine**: Negation does not bleed across contrastive boundaries (e.g. *"denies chest pain, but reports shortness of breath"* correctly extracts chest pain as absent and shortness of breath as present).
- **Extraction Traceability**: Preserves exact matched spans, canonical medical terminology, trigger words, rule identifiers, and full source sentences.
- **Explicit Medical Timeline**: Identifies and orders explicit dates found in clinical text, categorizing document dates and clinical event dates.
- **Side-by-Side Document Comparison**: Computes shared entities, unique findings, medication changes, and laboratory measurement differences between two documents from the current session.
- **Professional Report Generator**: Interactive report builder with section toggles, preview pane, JSON/CSV export, and print-to-PDF formatting.

---

## 15-Section Healthcare Navigation Platform

1. **Dashboard (`overview`)**: Quick note/file extractor, KPI metric counters, recent session activity, disclaimer banner.
2. **Document Center (`documents`)**: Drag-and-drop batch ingestion for PDF, DOCX, and TXT (up to 10 MB each), document text preview modal, queue search, sequential processing.
3. **Medical Extraction (`extraction`)**: Full tabbed browser across all clinical concepts with search, sort, and provenance inspection.
4. **Symptoms Analysis (`symptoms`)**: Detailed breakdown of present, absent, uncertain, and historical symptoms.
5. **Conditions Analysis (`conditions`)**: Active vs historical vs differential diagnoses.
6. **Medication Analytics (`medications`)**: Regimens, dosages, administration frequencies, and routes.
7. **Laboratory Analytics (`labs`)**: Test results, units, and clinical reference range flags.
8. **Vital Signs (`vitals`)**: Physiological vital signs measurements and reference ranges.
9. **Allergies (`allergies`)**: Allergen substance, clinical reactions, and NKDA declarations.
10. **Family History (`family_history`)**: First-degree relatives and familial medical conditions.
11. **Medical Timeline (`timeline`)**: Chronological visual event timeline extracted from explicit dates.
12. **Document Comparison (`comparison`)**: Side-by-side difference matrix comparing two documents.
13. **Analytics Center (`analytics`)**: 15+ native SVG and CSS visualizations (polarities, distributions, routes, lab flags, blood pressure).
14. **Report Generator (`reports`)**: Customizable clinical report builder with live preview and multi-format export.
15. **Settings (`settings`)**: Light/Dark theme, animation and reduced motion preferences, backend health diagnostics, session clear.

---

## Project Structure

```
meadical45/
├── app/                        # Modular FastAPI Application
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py           # /api/health, /api/extract/text, /api/extract/file
│   ├── data/
│   │   ├── __init__.py
│   │   └── dictionaries.py     # Medical lexicons, patterns, and reference ranges
│   ├── models/
│   │   ├── __init__.py
│   │   └── extraction.py       # Pydantic v2 data schemas + TimelineEvent
│   ├── services/
│   │   ├── __init__.py
│   │   ├── clinical_extractor.py # Deterministic extraction + Timeline + Rule IDs
│   │   ├── context_analyzer.py   # NegEx, assertion, trigger words, clause boundaries
│   │   └── document_parser.py    # PDF (PyMuPDF), DOCX (python-docx), TXT parser
│   ├── __init__.py
│   └── main.py                 # FastAPI initialization and CORS
├── backend/                    # Backward-compatibility layer (aliasing app)
│   ├── clinical_extractor.py
│   ├── context_analyzer.py
│   ├── document_parser.py
│   ├── extraction.py
│   ├── main.py
│   └── routes.py
├── frontend/                   # React 18 + Vite 6 + Tailwind CSS Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── AnalyticsSection.jsx       # 15+ interactive visualizations
│   │   │   ├── Charts.jsx                 # Native SVG charts (Donut, Bar, Grouped)
│   │   │   ├── ClinicalSection.jsx        # Category tables with Traceability
│   │   │   ├── ComparisonSection.jsx      # Side-by-side document comparison
│   │   │   ├── ConfirmationModal.jsx      # Action confirmation dialogs
│   │   │   ├── DocumentCenter.jsx         # Batch uploader with document preview
│   │   │   ├── Header.jsx                 # Global search, branding, status pill, export
│   │   │   ├── InputPanel.jsx             # Dual-mode text & single-file quick extractor
│   │   │   ├── OverviewSection.jsx        # Metric KPI cards & recent activity
│   │   │   ├── PrintReportView.jsx        # Print-to-PDF stylesheet view
│   │   │   ├── ReportGeneratorSection.jsx # Report builder with live preview
│   │   │   ├── SettingsSection.jsx        # Theme, motion, privacy, session reset
│   │   │   ├── Sidebar.jsx                # Collapsible 15-section navigation
│   │   │   ├── ToastNotification.jsx      # Non-blocking feedback toasts
│   │   │   └── TraceabilityModal.jsx      # Provenance inspector (matched span, trigger, rule ID)
│   │   ├── utils/
│   │   │   ├── api.js                     # Centralized API fetch client
│   │   │   ├── exportUtils.js             # Client-side JSON, CSV, Summary text
│   │   │   └── presets.js                 # Synthetic clinical benchmark cases
│   │   ├── App.jsx                        # Master platform controller & router
│   │   ├── index.css                      # Tailwind base, components, badges, print styles
│   │   └── main.jsx                       # React entry point
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── tests/                      # Automated Pytest Suite (49 passed)
│   ├── test_api_endpoints.py
│   ├── test_clinical_extractor.py
│   ├── test_context_analyzer.py
│   └── test_document_parser.py
├── start_all.bat               # One-click Windows launcher (Backend + Frontend + Browser)
├── run_backend.bat             # Start FastAPI on port 8000
├── run_frontend.bat            # Start React Vite on port 5173
├── requirements.txt            # Python dependencies
└── README.md
```

---

## Quick Start (Windows)

### Option 1: One-Click Launcher
Double-click `start_all.bat` in the root folder. It will:
1. Start the FastAPI backend on `http://127.0.0.1:8000`.
2. Start the React Vite dev server on `http://localhost:5173`.
3. Open your browser directly to `http://localhost:5173`.

### Option 2: Manual Terminal Startup
In Terminal 1 (Backend):
```powershell
uvicorn app.main:app --reload --port 8000
```

In Terminal 2 (Frontend):
```powershell
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Running Automated Tests

Run the full pytest suite:
```powershell
python -m pytest -v
```

All 49 unit and integration tests verify:
- API health and extraction endpoints (`/api/health`, `/api/extract/text`, `/api/extract/file`)
- Valid and corrupted PDF, DOCX, and TXT document ingestion
- 10 MB size limits and empty file rejection
- Non-medical text safety (returns empty lists with zero hallucinated items)
- Clause-bounded NegEx negation, historical assertion, and uncertainty tagging
- Isolated medication windows and route classifications
- Laboratory reference range flag logic (`NORMAL`, `HIGH`, `LOW`, `CRITICAL`)
- Vital sign normalization and allergy recognition

---

## Building Frontend for Production

```powershell
cd frontend
npm run build
```
Generates optimized, production-ready static assets in `frontend/dist/`.
