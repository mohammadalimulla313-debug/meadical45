import React from 'react';
import {
  BarChart3,
  PieChart,
  Activity,
  HeartPulse,
  FlaskConical,
  Stethoscope,
  ClipboardList,
  Pill,
  Users,
  Clock,
  FileCheck2,
} from 'lucide-react';
import {
  CategoryDistributionChart,
  SymptomPolarityChart,
  ConditionStatusChart,
  LabFlagsChart,
  MedicationFrequencyChart,
  MedicationRouteChart,
  BloodPressureComparisonChart,
  FamilyHistoryDistributionChart,
} from './Charts';

export default function AnalyticsSection({ results }) {
  const counts = results?.counts || {
    symptoms: 0,
    diagnoses: 0,
    family_history: 0,
    medications: 0,
    lab_results: 0,
    vital_signs: 0,
    allergies: 0,
  };

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const vitals = results?.vital_signs || [];
  const labs = results?.lab_results || [];
  const meds = results?.medications || [];
  const symptoms = results?.symptoms || [];
  const diagnoses = results?.diagnoses || [];
  const familyHistory = results?.family_history || [];

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl">
      {/* Analytics Header Card */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Advanced Clinical Extraction Analytics Center
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Visual intelligence computed strictly from actual extracted data in the active clinical document.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-xs font-semibold text-blue-700 dark:text-blue-300">
              {total} Total Extracted Concepts
            </span>
            {results?.metadata?.processing_time_ms && (
              <span className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-xs font-semibold text-emerald-700 dark:text-emerald-300 font-mono">
                ⚡ {results.metadata.processing_time_ms} ms
              </span>
            )}
          </div>
        </div>

        {/* 2-Column Analytics Visualizer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* 1. Category Breakdown */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-600" />
              Category Density Distribution
            </h4>
            <CategoryDistributionChart counts={counts} />
          </div>

          {/* 2. Symptom Assertion Breakdown */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-blue-600" />
              Symptom Polarity & Negation Analysis
            </h4>
            <SymptomPolarityChart symptoms={symptoms} />
          </div>

          {/* 3. Condition Timeline Status */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-indigo-600" />
              Condition Chronology Breakdown
            </h4>
            <ConditionStatusChart diagnoses={diagnoses} />
          </div>

          {/* 4. Laboratory Flag Stratification */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-orange-600" />
              Laboratory Abnormal Flag Stratification
            </h4>
            <LabFlagsChart labResults={labs} />
          </div>

          {/* 5. Medication Frequency Distribution */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Pill className="w-4 h-4 text-emerald-600" />
              Medication Administration Frequency
            </h4>
            <MedicationFrequencyChart medications={meds} />
          </div>

          {/* 6. Medication Route Breakdown */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Pill className="w-4 h-4 text-cyan-600" />
              Medication Route of Administration
            </h4>
            <MedicationRouteChart medications={meds} />
          </div>

          {/* 7. Blood Pressure Comparison */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-rose-600" />
              Cardiovascular Blood Pressure Analysis
            </h4>
            <BloodPressureComparisonChart vitals={vitals} />
          </div>

          {/* 8. Family History Distribution */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              Family Medical History Breakdown
            </h4>
            <FamilyHistoryDistributionChart familyHistory={familyHistory} />
          </div>
        </div>
      </div>

      {/* Vital Signs Table */}
      <div className="card p-5">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-cyan-600" />
            Vital Signs Physiological Summary
          </h4>
          <span className="text-xs text-slate-400">{vitals.length} measurements</span>
        </div>

        {vitals.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 italic">No vital signs detected in current note.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-2.5">Vital Sign</th>
                  <th className="p-2.5">Measured Value</th>
                  <th className="p-2.5">Unit</th>
                  <th className="p-2.5">Source Sentence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {vitals.map((v, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                    <td className="p-2.5 font-semibold text-slate-900 dark:text-slate-100">{v.name}</td>
                    <td className="p-2.5 font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">{v.value}</td>
                    <td className="p-2.5 text-xs text-slate-500">{v.unit || '—'}</td>
                    <td className="p-2.5 text-xs text-slate-500 italic max-w-sm truncate">"{v.source_sentence}"</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
