import React, { useState } from 'react';
import {
  FileCheck,
  Printer,
  Download,
  Copy,
  Check,
  AlertTriangle,
  Calendar,
  UserCheck,
  RefreshCw,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Sliders,
  ShieldAlert,
  Clock,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { PRESETS } from '../utils/presets';
import { extractFromText } from '../utils/api';
import { downloadJSON, downloadCSV, downloadPDF, generateSummaryText } from '../utils/exportUtils';

export default function ReportGeneratorSection({
  results,
  sessionHistory = [],
  onSelectDocument,
  onExtractText,
  onToast,
}) {
  // Section toggle configuration
  const [sections, setSections] = useState({
    summary: true,
    warnings: true,
    allergies: true,
    vital_signs: true,
    symptoms: true,
    diagnoses: true,
    medications: true,
    lab_results: true,
    family_history: true,
    timeline: true,
    reviewer: true,
  });

  // Clinician Sign-off state
  const [showSignoffConfig, setShowSignoffConfig] = useState(false);
  const [reviewer, setReviewer] = useState({
    name: 'Dr. Alex Vance, MD',
    department: 'Department of Internal Medicine / Clinical Informatics',
    date: new Date().toISOString().split('T')[0],
    notes: 'Rule-based extraction findings verified against source documentation. No discrepancies noted.',
  });

  // Local quick extraction state (for when results is null or user wants to run note on the fly)
  const [quickText, setQuickText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [quickError, setQuickError] = useState(null);

  const toggleSection = (key) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Run extraction from preset
  const handleLoadPreset = async (preset) => {
    setIsProcessing(true);
    setQuickError(null);
    try {
      if (onExtractText) {
        await onExtractText(preset.text);
      } else {
        const data = await extractFromText(preset.text);
        if (onSelectDocument) onSelectDocument(data);
      }
      onToast && onToast({ type: 'success', message: `Loaded & extracted '${preset.label}'.` });
    } catch (err) {
      const msg = err.detail || err.message || 'Preset extraction failed.';
      setQuickError(msg);
      onToast && onToast({ type: 'error', message: msg });
    } finally {
      setIsProcessing(false);
    }
  };

  // Run extraction from quick text
  const handleQuickExtract = async () => {
    if (!quickText.trim() || quickText.trim().length < 5) {
      setQuickError('Please enter at least 5 characters of clinical documentation.');
      return;
    }
    setIsProcessing(true);
    setQuickError(null);
    try {
      if (onExtractText) {
        await onExtractText(quickText);
      } else {
        const data = await extractFromText(quickText);
        if (onSelectDocument) onSelectDocument(data);
      }
      setQuickText('');
      onToast && onToast({ type: 'success', message: 'Report generated successfully from clinical note.' });
    } catch (err) {
      const msg = err.detail || err.message || 'Extraction failed.';
      setQuickError(msg);
      onToast && onToast({ type: 'error', message: msg });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (!results) return;
    const text = generateSummaryText(results, sections, reviewer);
    navigator.clipboard.writeText(text);
    onToast && onToast({ type: 'success', message: 'Customized clinical report copied to clipboard.' });
  };

  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  const handleDownloadPDF = async () => {
    if (!results) return;
    setIsPdfGenerating(true);
    onToast && onToast({ type: 'info', message: 'Generating vector clinical PDF report...' });
    try {
      const ok = await downloadPDF(results, `mediextract-clinical-report-${Date.now()}.pdf`, reviewer);
      if (ok) {
        onToast && onToast({ type: 'success', message: 'Vector PDF report generated and downloaded.' });
      }
    } catch {
      onToast && onToast({ type: 'error', message: 'PDF export failed. Opening print dialog.' });
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const handlePrint = () => {
    if (!results) return;
    window.print();
  };

  const handleDownloadJSON = () => {
    if (!results) return;
    downloadJSON(results, `mediextract-report-${Date.now()}.json`, sections);
    onToast && onToast({ type: 'success', message: 'Filtered JSON report downloaded.' });
  };

  const handleDownloadCSV = () => {
    if (!results) return;
    downloadCSV(results, `mediextract-data-${Date.now()}.csv`, sections);
    onToast && onToast({ type: 'success', message: 'Filtered CSV data sheet downloaded.' });
  };

  // Identify clinical warnings & critical flags
  const clinicalAlerts = [];
  if (results) {
    // 1. Abnormal Labs
    (results.lab_results || []).forEach((l) => {
      if (l.flag === 'CRITICAL') {
        clinicalAlerts.push({
          severity: 'critical',
          category: 'Critical Laboratory Finding',
          message: `${l.normalized_test} is critically abnormal at ${l.value} ${l.unit || ''} (Flag: ${l.flag}).`,
          sentence: l.source_sentence,
        });
      } else if (l.flag === 'HIGH' || l.flag === 'LOW') {
        clinicalAlerts.push({
          severity: 'warning',
          category: 'Abnormal Laboratory Value',
          message: `${l.normalized_test} is ${l.flag.toLowerCase()} at ${l.value} ${l.unit || ''}.`,
          sentence: l.source_sentence,
        });
      }
    });

    // 2. Documented Allergies
    (results.allergies || []).forEach((a) => {
      if (!a.is_nkda) {
        clinicalAlerts.push({
          severity: 'warning',
          category: 'Allergy / Adverse Drug Reaction',
          message: `Active allergy to ${a.allergen}${a.reaction ? ` (${a.reaction})` : ''}.`,
          sentence: a.source_sentence,
        });
      }
    });

    // 3. Uncertain/Suspected conditions
    (results.diagnoses || []).forEach((d) => {
      if (d.status === 'uncertain') {
        clinicalAlerts.push({
          severity: 'info',
          category: 'Unconfirmed / Suspected Diagnosis',
          message: `Condition marked as uncertain or unconfirmed: '${d.text}'.`,
          sentence: d.source_sentence,
        });
      }
    });

    // 4. Discontinued medications
    (results.medications || []).forEach((m) => {
      if (m.status === 'discontinued') {
        clinicalAlerts.push({
          severity: 'info',
          category: 'Discontinued Pharmacotherapy',
          message: `Medication discontinued in documentation: ${m.name}.`,
          sentence: m.source_sentence,
        });
      }
    });
  }

  // EMPTY STATE HUB: When no extraction results exist yet
  if (!results) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
        {/* Hub Header */}
        <div className="card p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-sm">
            <FileCheck className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Clinical Report Generator
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-lg mx-auto">
              Assemble, customize, and export formal clinical extraction summaries. Load an existing document, choose a synthetic clinical benchmark note, or paste a note below.
            </p>
          </div>

          {/* If session has documents, let user pick one */}
          {sessionHistory && sessionHistory.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-left">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Available Session Documents ({sessionHistory.length}):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sessionHistory.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSelectDocument && onSelectDocument(item.results)}
                    className="p-3 text-left rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 transition-all flex items-center justify-between group"
                  >
                    <div className="truncate pr-2">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {item.time} · {item.entityCount} concepts
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Instant Demo Benchmark Note Presets */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Instant Benchmark Clinical Notes
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                disabled={isProcessing}
                onClick={() => handleLoadPreset(preset)}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/30 text-left transition-all space-y-2 group disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {preset.label}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Paste Clinical Note Area */}
        <div className="card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Or Paste Clinical Note Direct
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">100% Offline Rule Engine</span>
          </div>

          <textarea
            value={quickText}
            onChange={(e) => setQuickText(e.target.value)}
            disabled={isProcessing}
            rows={5}
            placeholder="Paste EHR progress note, emergency admission record, or discharge summary here..."
            className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono disabled:opacity-50"
          />

          {quickError && (
            <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{quickError}</span>
            </p>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleQuickExtract}
              disabled={isProcessing || !quickText.trim()}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition-all flex items-center gap-2 shadow-sm active:scale-95"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing Extraction...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Extract & Build Report</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE REPORT VIEW: Results Loaded
  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* 1. Configuration & Actions Toolbar (Excluded during Print) */}
      <div className="card p-6 no-print space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Clinical Report Generator
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select desired sections, configure clinician review notes, and print or export.
            </p>
          </div>

          {/* Action Export Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={isPdfGenerating}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Download vector medical PDF report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isPdfGenerating ? 'Generating...' : 'Download PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Print directly or save as clean medical PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              title="Download selected sections in JSON format"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>

            <button
              onClick={handleDownloadCSV}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              title="Download selected data in CSV spreadsheet format"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>

            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              title="Copy formatted summary to clipboard"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </button>
          </div>
        </div>

        {/* Document Switcher & Session Presets Bar */}
        {sessionHistory && sessionHistory.length > 1 && (
          <div className="flex items-center gap-2 text-xs pt-1">
            <span className="text-slate-400 font-semibold shrink-0">Switch Document:</span>
            <div className="flex flex-wrap gap-1.5">
              {sessionHistory.map((doc, i) => (
                <button
                  key={i}
                  onClick={() => onSelectDocument && onSelectDocument(doc.results)}
                  className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 truncate max-w-[200px]"
                >
                  {doc.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Section Inclusion Toggles */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Include Clinical Sections in Report:
            </p>
            <button
              onClick={() => setShowSignoffConfig(!showSignoffConfig)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
            >
              <Sliders className="w-3 h-3" />
              <span>{showSignoffConfig ? 'Hide Reviewer Details' : 'Edit Reviewer Details'}</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries({
              summary: 'Counts Overview',
              warnings: 'Clinical Alerts',
              allergies: 'Allergies & NKDA',
              vital_signs: 'Vital Signs',
              symptoms: 'Symptoms',
              diagnoses: 'Conditions',
              medications: 'Medications',
              lab_results: 'Lab Results',
              family_history: 'Family Hx',
              timeline: 'Dated Events',
              reviewer: 'Clinician Sign-Off',
            }).map(([key, label]) => (
              <label
                key={key}
                className={`cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 select-none ${
                  sections[key]
                    ? 'border-blue-300 dark:border-blue-700 bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={sections[key]}
                  onChange={() => toggleSection(key)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Clinician Sign-off Editor (Collapsible) */}
        {showSignoffConfig && (
          <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Reviewing Clinician Information</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-1">
                  Clinician Name & Degree
                </label>
                <input
                  type="text"
                  value={reviewer.name}
                  onChange={(e) => setReviewer({ ...reviewer, name: e.target.value })}
                  className="w-full text-xs p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-1">
                  Department / Specialty
                </label>
                <input
                  type="text"
                  value={reviewer.department}
                  onChange={(e) => setReviewer({ ...reviewer, department: e.target.value })}
                  className="w-full text-xs p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-1">
                  Verification Date
                </label>
                <input
                  type="date"
                  value={reviewer.date}
                  onChange={(e) => setReviewer({ ...reviewer, date: e.target.value })}
                  className="w-full text-xs p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-1">
                Clinical Review Notes
              </label>
              <input
                type="text"
                value={reviewer.notes}
                onChange={(e) => setReviewer({ ...reviewer, notes: e.target.value })}
                className="w-full text-xs p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. THE CLINICAL REPORT SHEET (#clinical-report-sheet, .print-sheet) */}
      <div
        id="clinical-report-sheet"
        className="print-sheet bg-white text-slate-900 shadow-xl border border-slate-200 rounded-xl p-8 sm:p-12 max-w-4xl mx-auto space-y-6 font-sans relative"
      >
        {/* Formal Medical Header */}
        <div className="border-b-2 border-slate-900 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                  ME
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                    MediExtract AI
                  </h2>
                  <p className="text-[11px] font-semibold text-slate-500 tracking-wide">
                    Clinical Document Intelligence & NLP Extraction Report
                  </p>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right text-[11px] text-slate-600 font-mono space-y-0.5">
              <p>
                <span className="font-semibold text-slate-800">Generated:</span>{' '}
                {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
              </p>
              <p>
                <span className="font-semibold text-slate-800">Source:</span>{' '}
                {results.metadata?.source_type || 'Clinical Document'}
              </p>
              <p>
                <span className="font-semibold text-slate-800">Engine:</span> Deterministic Local NLP (0 ms net)
              </p>
            </div>
          </div>

          {/* Mandatory Clinical Disclaimer Banner */}
          <div className="mt-4 p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-center text-xs font-semibold text-amber-900">
            Automated rule-based extraction for demonstration purposes. Not a medical diagnosis. Not for clinical use.
          </div>
        </div>

        {/* 1. Summary Strip */}
        {sections.summary && (
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 border border-slate-200 bg-slate-50 p-3 rounded-lg text-center text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] font-semibold uppercase">Symptoms</span>
              <strong className="text-sm font-bold text-slate-900">{results.counts?.symptoms || 0}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-semibold uppercase">Conditions</span>
              <strong className="text-sm font-bold text-slate-900">{results.counts?.diagnoses || 0}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-semibold uppercase">Family Hx</span>
              <strong className="text-sm font-bold text-slate-900">{results.counts?.family_history || 0}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-semibold uppercase">Meds</span>
              <strong className="text-sm font-bold text-slate-900">{results.counts?.medications || 0}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-semibold uppercase">Labs</span>
              <strong className="text-sm font-bold text-slate-900">{results.counts?.lab_results || 0}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-semibold uppercase">Vitals</span>
              <strong className="text-sm font-bold text-slate-900">{results.counts?.vital_signs || 0}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-semibold uppercase">Allergies</span>
              <strong className="text-sm font-bold text-slate-900">{results.counts?.allergies || 0}</strong>
            </div>
          </div>
        )}

        {/* 2. Clinical Warnings & Critical Alerts */}
        {sections.warnings && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>Clinical Alerts & Critical Flags</span>
            </h4>
            {clinicalAlerts.length > 0 ? (
              <div className="space-y-1.5">
                {clinicalAlerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded border text-xs flex items-start gap-2 ${
                      alert.severity === 'critical'
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : alert.severity === 'warning'
                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : 'bg-blue-50 border-blue-200 text-blue-900'
                    }`}
                  >
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                        alert.severity === 'critical'
                          ? 'bg-rose-600 text-white'
                          : alert.severity === 'warning'
                          ? 'bg-amber-600 text-white'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      {alert.category}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold">{alert.message}</p>
                      {alert.sentence && (
                        <p className="text-[11px] opacity-80 italic mt-0.5">"{alert.sentence}"</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>No critical laboratory abnormalities or severe alerts flagged in this extraction.</span>
              </div>
            )}
          </div>
        )}

        {/* 3. Allergies */}
        {sections.allergies && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
              Allergies & Adverse Drug Reactions
            </h4>
            {results.allergies?.length ? (
              <ul className="text-xs space-y-1 pl-4 list-disc text-slate-800">
                {results.allergies.map((a, i) => (
                  <li key={i}>
                    {a.is_nkda ? (
                      <span className="font-bold text-emerald-700">NKDA (No Known Drug Allergies)</span>
                    ) : (
                      <>
                        <strong className="text-slate-900">{a.allergen}</strong>{' '}
                        {a.reaction && <span className="text-slate-700">— Reaction: {a.reaction}</span>}
                      </>
                    )}
                    <span className="text-[11px] text-slate-500 block italic">Source: "{a.source_sentence}"</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs italic text-slate-400">None detected</p>
            )}
          </div>
        )}

        {/* 4. Vital Signs */}
        {sections.vital_signs && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
              Vital Signs Physiological Findings
            </h4>
            {results.vital_signs?.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {results.vital_signs.map((v, i) => (
                  <div key={i} className="p-2 border border-slate-200 rounded bg-slate-50">
                    <span className="text-slate-500 block text-[10px] font-semibold uppercase">{v.name}</span>
                    <span className="font-bold text-slate-900 font-mono text-xs">{v.value} {v.unit}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs italic text-slate-400">None detected</p>
            )}
          </div>
        )}

        {/* 5. Symptoms */}
        {sections.symptoms && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
              Present & Absent Clinical Symptoms
            </h4>
            {results.symptoms?.length ? (
              <div className="flex flex-wrap gap-1.5 text-xs">
                {results.symptoms.map((s, i) => (
                  <span
                    key={i}
                    className={`px-2 py-0.5 rounded border text-[11px] font-medium ${
                      s.status === 'present'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-rose-50 text-rose-800 border-rose-300'
                    }`}
                  >
                    [{s.status.toUpperCase()}] {s.text}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs italic text-slate-400">None detected</p>
            )}
          </div>
        )}

        {/* 6. Conditions */}
        {sections.diagnoses && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
              Conditions & Diagnoses
            </h4>
            {results.diagnoses?.length ? (
              <div className="flex flex-wrap gap-1.5 text-xs">
                {results.diagnoses.map((d, i) => (
                  <span
                    key={i}
                    className={`px-2 py-0.5 rounded border text-[11px] font-medium ${
                      d.status === 'present'
                        ? 'bg-purple-50 text-purple-800 border-purple-200'
                        : d.status === 'historical'
                        ? 'bg-slate-100 text-slate-700 border-slate-300'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    [{d.status.toUpperCase()}] {d.text}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs italic text-slate-400">None detected</p>
            )}
          </div>
        )}

        {/* 7. Medications */}
        {sections.medications && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
              Pharmacotherapy Regimens
            </h4>
            {results.medications?.length ? (
              <table className="w-full text-xs text-left border-collapse border border-slate-200">
                <thead className="bg-slate-100 text-slate-800 font-semibold">
                  <tr>
                    <th className="border border-slate-200 p-2">Medication</th>
                    <th className="border border-slate-200 p-2">Dosage</th>
                    <th className="border border-slate-200 p-2">Frequency & Route</th>
                    <th className="border border-slate-200 p-2">Status</th>
                  </tr>
                </thead>
                <tbody className="text-slate-800">
                  {results.medications.map((m, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="border border-slate-200 p-2 font-semibold capitalize">{m.name}</td>
                      <td className="border border-slate-200 p-2">{m.dosage || '—'}</td>
                      <td className="border border-slate-200 p-2">{[m.frequency, m.route].filter(Boolean).join(' ') || '—'}</td>
                      <td className="border border-slate-200 p-2 uppercase font-mono text-[10px] font-bold">
                        <span
                          className={`px-1.5 py-0.5 rounded ${
                            m.status === 'active'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {m.status || 'active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-xs italic text-slate-400">None detected</p>
            )}
          </div>
        )}

        {/* 8. Labs */}
        {sections.lab_results && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
              Laboratory Tests & Measured Values
            </h4>
            {results.lab_results?.length ? (
              <table className="w-full text-xs text-left border-collapse border border-slate-200">
                <thead className="bg-slate-100 text-slate-800 font-semibold">
                  <tr>
                    <th className="border border-slate-200 p-2">Test Name</th>
                    <th className="border border-slate-200 p-2">Measured Value</th>
                    <th className="border border-slate-200 p-2">Unit</th>
                    <th className="border border-slate-200 p-2">Reference Flag</th>
                  </tr>
                </thead>
                <tbody className="text-slate-800">
                  {results.lab_results.map((l, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="border border-slate-200 p-2 font-semibold">{l.normalized_test}</td>
                      <td className="border border-slate-200 p-2 font-mono font-bold">{l.value}</td>
                      <td className="border border-slate-200 p-2">{l.unit || '—'}</td>
                      <td className="border border-slate-200 p-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            l.flag === 'CRITICAL'
                              ? 'bg-rose-200 text-rose-900 font-extrabold'
                              : l.flag === 'HIGH'
                              ? 'bg-rose-100 text-rose-800'
                              : l.flag === 'LOW'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {l.flag || 'NORMAL'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-xs italic text-slate-400">None detected</p>
            )}
          </div>
        )}

        {/* 9. Family History */}
        {sections.family_history && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
              Family Medical History
            </h4>
            {results.family_history?.length ? (
              <ul className="text-xs space-y-1 pl-4 list-disc text-slate-800">
                {results.family_history.map((f, i) => (
                  <li key={i}>
                    <strong className="text-slate-900">{f.text}</strong>
                    <span className="text-[11px] text-slate-500 block italic">Source: "{f.source_sentence}"</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs italic text-slate-400">None detected</p>
            )}
          </div>
        )}

        {/* 10. Dated Clinical Timeline */}
        {sections.timeline && results.timeline && results.timeline.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Dated Clinical Events Timeline</span>
            </h4>
            <div className="space-y-1.5">
              {results.timeline.map((item, idx) => (
                <div key={idx} className="p-2 border border-slate-200 rounded bg-slate-50 text-xs flex items-start gap-3">
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-bold text-[11px] shrink-0">
                    {item.event_date}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{item.entity_text} <span className="text-[10px] text-slate-500 font-normal">({item.category})</span></p>
                    <p className="text-[11px] text-slate-600 italic">"{item.source_sentence}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 11. Traceability & Processing Metadata Strip */}
        <div className="p-3 rounded border border-slate-200 bg-slate-50 text-[11px] text-slate-600 flex flex-wrap justify-between items-center gap-2">
          <span>Processed Sentences: <strong>{results.metadata?.sentence_count || 0}</strong></span>
          <span>Entity Count: <strong>{Object.values(results.counts || {}).reduce((a, b) => a + b, 0)}</strong></span>
          <span>Execution Latency: <strong>{results.metadata?.processing_time_ms || 0} ms</strong></span>
          <span>Engine Architecture: <strong>FastAPI / Pydantic v2 / Pure Regex Rules</strong></span>
        </div>

        {/* 12. Reviewing Clinician Sign-Off Block */}
        {sections.reviewer && (
          <div className="pt-6 border-t-2 border-slate-900 mt-8 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Clinician Verification & Attestation
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-800">
              <div className="space-y-1">
                <p><span className="text-slate-500 font-semibold">Reviewer:</span> {reviewer.name}</p>
                <p><span className="text-slate-500 font-semibold">Department:</span> {reviewer.department}</p>
                <p><span className="text-slate-500 font-semibold">Review Date:</span> {reviewer.date}</p>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] text-slate-600 italic">
                  Notes: "{reviewer.notes}"
                </p>
                <div className="pt-4 border-b border-dashed border-slate-400">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Clinician Signature & Attestation
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
