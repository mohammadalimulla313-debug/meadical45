import React from 'react';
import {
  Stethoscope,
  ClipboardList,
  Users,
  Pill,
  FlaskConical,
  HeartPulse,
  AlertTriangle,
  Zap,
  Clock,
  FileText,
  ShieldAlert,
  Image as ImageIcon,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  CategoryDistributionChart,
  SymptomPolarityChart,
  ConditionStatusChart,
  LabFlagsChart,
} from './Charts';

export default function OverviewSection({
  results,
  sessionHistory = [],
  onSelectSessionItem,
  onNavigateToSection,
}) {
  const counts = results?.counts || {
    symptoms: 0,
    diagnoses: 0,
    family_history: 0,
    medications: 0,
    lab_results: 0,
    vital_signs: 0,
    allergies: 0,
  };

  const totalEntities = Object.values(counts).reduce((a, b) => a + b, 0);

  const presentSymptoms = results?.symptoms?.filter((s) => s.status === 'present').length || 0;
  const absentSymptoms = results?.symptoms?.filter((s) => s.status === 'absent').length || 0;
  const activeConditions = results?.diagnoses?.filter((d) => d.status === 'present').length || 0;
  const historicalConditions = results?.diagnoses?.filter((d) => d.status === 'historical').length || 0;
  const abnormalLabs = results?.lab_results?.filter((l) => l.flag && l.flag !== 'NORMAL').length || 0;

  // Image Processing Session Metrics (Phase 8 Requirement)
  const imageSessions = sessionHistory.filter(
    (s) =>
      s.results?.metadata?.source_type === 'image' ||
      ['.jpg', '.jpeg', '.png', '.webp'].some((ext) => (s.title || '').toLowerCase().includes(ext))
  );
  const imagesUploaded = imageSessions.length;
  const imagesProcessed = imageSessions.filter((s) => s.entityCount > 0 || s.results).length;
  const entitiesFromImages = imageSessions.reduce((sum, s) => sum + (s.entityCount || 0), 0);
  const isCurrentImage =
    results?.metadata?.source_type === 'image' ||
    Boolean(results?.ocr_text) ||
    Boolean(results?.image_metadata);

  const kpis = [
    {
      label: 'Total Extracted',
      value: totalEntities,
      icon: Zap,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900',
      badge: `${totalEntities} concepts`,
      section: 'clinical',
    },
    {
      label: 'Symptoms',
      value: counts.symptoms,
      icon: Stethoscope,
      color: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-900',
      badge: `${presentSymptoms} present · ${absentSymptoms} absent`,
      section: 'clinical',
    },
    {
      label: 'Conditions',
      value: counts.diagnoses,
      icon: ClipboardList,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-900',
      badge: `${activeConditions} active · ${historicalConditions} past`,
      section: 'clinical',
    },
    {
      label: 'Family History',
      value: counts.family_history,
      icon: Users,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-900',
      badge: `${counts.family_history} records`,
      section: 'clinical',
    },
    {
      label: 'Medications',
      value: counts.medications,
      icon: Pill,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900',
      badge: `${counts.medications} regimens`,
      section: 'clinical',
    },
    {
      label: 'Lab Results',
      value: counts.lab_results,
      icon: FlaskConical,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-950/60 border-orange-200 dark:border-orange-900',
      badge: `${abnormalLabs} flagged`,
      section: 'clinical',
    },
    {
      label: 'Vital Signs',
      value: counts.vital_signs,
      icon: HeartPulse,
      color: 'text-cyan-600 dark:text-cyan-400',
      bg: 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-200 dark:border-cyan-900',
      badge: `${counts.vital_signs} vitals`,
      section: 'clinical',
    },
    {
      label: 'Allergies',
      value: counts.allergies,
      icon: AlertTriangle,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900',
      badge: results?.allergies?.some((a) => a.is_nkda) ? 'NKDA documented' : `${counts.allergies} recorded`,
      section: 'clinical',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Notice & Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800/60 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-700 dark:text-amber-300 flex-shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
              Clinical Disclaimer
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
              Rule-based extraction for demonstration. Not for clinical use.
            </p>
          </div>
        </div>
        {results?.metadata?.processing_time_ms && (
          <div className="text-right flex-shrink-0 hidden sm:block">
            <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 rounded-md border border-amber-200 dark:border-amber-900">
              ⚡ {results.metadata.processing_time_ms}ms
            </span>
          </div>
        )}
      </div>

      {/* KPI Dynamic Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3.5">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <div
              key={i}
              onClick={() => onNavigateToSection && onNavigateToSection(k.section)}
              className="kpi-tile group cursor-pointer border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all duration-300 p-4 rounded-xl text-left"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                  {k.label}
                </span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${k.bg} transition-transform group-hover:scale-110`}>
                  <Icon className={`w-4 h-4 ${k.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                {k.value}
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate">
                {k.badge}
              </div>
            </div>
          );
        })}
      </div>

      {/* Image Intelligence Session Summary (Phase 8 Requirement) */}
      <div className="card p-5 bg-gradient-to-br from-teal-50/50 via-white to-slate-50/50 dark:from-teal-950/20 dark:via-slate-900 dark:to-slate-900 border-teal-200/70 dark:border-teal-900/40 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-teal-100 dark:border-teal-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500 text-white flex items-center justify-center shadow-xs">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Medical Image OCR Intelligence</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  100% Offline
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Session statistics for scanned prescriptions, lab photos, and document images
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateToSection && onNavigateToSection('documents')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-all flex items-center gap-1.5 shadow-xs"
          >
            <span>Upload Images in Document Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 block">Images in Session</span>
            <strong className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">
              {imagesUploaded}
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 block">Successfully Extracted</span>
            <strong className="text-base font-bold text-teal-600 dark:text-teal-400 font-mono">
              {imagesProcessed}
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 block">Entities from Images</span>
            <strong className="text-base font-bold text-purple-600 dark:text-purple-400 font-mono">
              {entitiesFromImages}
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 block">Active OCR Engine</span>
            <strong className="text-xs font-semibold text-slate-700 dark:text-slate-300 block truncate">
              {results?.metadata?.ocr_engine || results?.image_metadata?.ocr_engine || 'Windows Native OCR'}
            </strong>
          </div>
        </div>

        {/* If active document is an image, display OCR Traceability preview */}
        {isCurrentImage && (
          <div className="p-3 rounded-xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-teal-900 dark:text-teal-200">
                Active Document Source: Medical Image
              </span>
              <p className="text-[11px] text-teal-800 dark:text-teal-300">
                OCR Text recognized: {results?.ocr_text?.length || 0} characters · Engine: {results?.metadata?.ocr_engine || 'Windows Native OCR'}
              </p>
            </div>
            <button
              onClick={() => onNavigateToSection && onNavigateToSection('documents')}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-700 hover:bg-teal-100 transition-colors"
            >
              View in Document Center
            </button>
          </div>
        )}
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Proportions */}
        <div className="card p-5">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Extraction Category Distribution
              </h3>
              <p className="text-xs text-slate-400">Relative entity density across the clinical record</p>
            </div>
          </div>
          <CategoryDistributionChart counts={counts} />
        </div>

        {/* Clinical Polarities (Present vs Absent) */}
        <div className="card p-5">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Symptom Polarity Breakdown
              </h3>
              <p className="text-xs text-slate-400">Clause-bounded present vs. negated assertion</p>
            </div>
          </div>
          <SymptomPolarityChart symptoms={results?.symptoms} />
        </div>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conditions Chronology */}
        <div className="card p-5">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Condition Status Timeline
              </h3>
              <p className="text-xs text-slate-400">Active vs. historical vs. differential diagnoses</p>
            </div>
          </div>
          <ConditionStatusChart diagnoses={results?.diagnoses} />
        </div>

        {/* Laboratory Flags Distribution */}
        <div className="card p-5">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Laboratory Result Flag Summary
              </h3>
              <p className="text-xs text-slate-400">Standard clinical reference range classification</p>
            </div>
          </div>
          <LabFlagsChart labResults={results?.lab_results} />
        </div>
      </div>

      {/* Session Recent Extractions */}
      <div className="card p-5">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Recent Session Extractions
            </h3>
          </div>
          <span className="text-xs text-slate-400">{sessionHistory.length} items in current session</span>
        </div>

        {sessionHistory.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 italic">
            No extraction history in this session yet. Input text or upload a document to begin.
          </div>
        ) : (
          <div className="space-y-2">
            {sessionHistory.slice(-5).reverse().map((item, idx) => (
              <div
                key={idx}
                onClick={() => onSelectSessionItem && onSelectSessionItem(item.results)}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 hover:border-blue-200 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                      {item.title || 'Clinical Note'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {item.time} · {item.entityCount} entities extracted
                    </span>
                  </div>
                </div>
                <button
                  className="text-xs px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 transition-colors font-medium"
                >
                  View
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
