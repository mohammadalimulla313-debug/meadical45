import React, { useState } from 'react';
import { GitCompare, FileText, Check, AlertCircle, ArrowRightLeft, Layers, Pill, FlaskConical } from 'lucide-react';

export default function ComparisonSection({ sessionHistory = [], onSelectDocument }) {
  const [docAIndex, setDocAIndex] = useState(0);
  const [docBIndex, setDocBIndex] = useState(sessionHistory.length > 1 ? 1 : 0);

  if (sessionHistory.length < 2) {
    return (
      <div className="card p-12 text-center max-w-3xl mx-auto space-y-4 animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto">
          <GitCompare className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Document Comparison Module
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          Compare two clinical notes or uploaded documents side-by-side to identify shared medical entities, unique findings, medication changes, and laboratory measurements.
        </p>
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs text-slate-600 dark:text-slate-400 inline-block">
          Currently {sessionHistory.length} document in current session. Process at least <strong>2 documents</strong> to activate comparison.
        </div>
      </div>
    );
  }

  const docA = sessionHistory[docAIndex]?.results;
  const docB = sessionHistory[docBIndex]?.results;

  // Extract concept sets for comparison
  const getConcepts = (res) => {
    if (!res) return { symptoms: new Set(), diagnoses: new Set(), meds: new Set(), labs: new Map() };
    const symptoms = new Set((res.symptoms || []).map((s) => s.normalized_term.toLowerCase()));
    const diagnoses = new Set((res.diagnoses || []).map((d) => d.normalized_term.toLowerCase()));
    const meds = new Set((res.medications || []).map((m) => m.name.toLowerCase()));
    const labs = new Map((res.lab_results || []).map((l) => [l.normalized_test.toLowerCase(), l]));
    return { symptoms, diagnoses, meds, labs };
  };

  const a = getConcepts(docA);
  const b = getConcepts(docB);

  // All unique concept names
  const allSymptoms = Array.from(new Set([...a.symptoms, ...b.symptoms])).sort();
  const allDiagnoses = Array.from(new Set([...a.diagnoses, ...b.diagnoses])).sort();
  const allMeds = Array.from(new Set([...a.meds, ...b.meds])).sort();
  const allLabKeys = Array.from(new Set([...a.labs.keys(), ...b.labs.keys()])).sort();

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      {/* Header & Selector */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Side-by-Side Document Comparison
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Deterministic concept-level difference matrix. Highlights shared and unique entities without clinical inference.
            </p>
          </div>
        </div>

        {/* Document Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20">
            <label className="text-[11px] font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider block mb-1">
              Document A (Baseline) {docA?.metadata?.source_type === 'image' && '— [OCR Image]'}
            </label>
            <select
              value={docAIndex}
              onChange={(e) => setDocAIndex(Number(e.target.value))}
              className="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            >
              {sessionHistory.map((h, i) => (
                <option key={i} value={i}>
                  Doc {i + 1}: {h.title} ({h.time}) {h.results?.metadata?.source_type === 'image' ? '[Image OCR]' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20">
            <label className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider block mb-1">
              Document B (Comparison) {docB?.metadata?.source_type === 'image' && '— [OCR Image]'}
            </label>
            <select
              value={docBIndex}
              onChange={(e) => setDocBIndex(Number(e.target.value))}
              className="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            >
              {sessionHistory.map((h, i) => (
                <option key={i} value={i}>
                  Doc {i + 1}: {h.title} ({h.time}) {h.results?.metadata?.source_type === 'image' ? '[Image OCR]' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Comparison Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Symptoms Comparison */}
        <div className="card p-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-3 flex items-center justify-between">
            <span>Symptoms Matrix</span>
            <span className="text-[11px] text-slate-400 font-normal">{allSymptoms.length} distinct</span>
          </h4>
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-2">Symptom Concept</th>
                  <th className="p-2 text-center w-20">Doc A</th>
                  <th className="p-2 text-center w-20">Doc B</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {allSymptoms.map((term, i) => {
                  const hasA = a.symptoms.has(term);
                  const hasB = b.symptoms.has(term);
                  return (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                      <td className="p-2 font-medium capitalize">{term}</td>
                      <td className="p-2 text-center">
                        {hasA ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-slate-300 dark:text-slate-600">—</span>}
                      </td>
                      <td className="p-2 text-center">
                        {hasB ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-slate-300 dark:text-slate-600">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Conditions Comparison */}
        <div className="card p-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-3 flex items-center justify-between">
            <span>Conditions Matrix</span>
            <span className="text-[11px] text-slate-400 font-normal">{allDiagnoses.length} distinct</span>
          </h4>
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-2">Diagnosis Concept</th>
                  <th className="p-2 text-center w-20">Doc A</th>
                  <th className="p-2 text-center w-20">Doc B</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {allDiagnoses.map((term, i) => {
                  const hasA = a.diagnoses.has(term);
                  const hasB = b.diagnoses.has(term);
                  return (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                      <td className="p-2 font-medium capitalize">{term}</td>
                      <td className="p-2 text-center">
                        {hasA ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-slate-300 dark:text-slate-600">—</span>}
                      </td>
                      <td className="p-2 text-center">
                        {hasB ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-slate-300 dark:text-slate-600">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Medications Comparison */}
        <div className="card p-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5"><Pill className="w-4 h-4 text-emerald-600" /> Medication Comparison</span>
            <span className="text-[11px] text-slate-400 font-normal">{allMeds.length} distinct</span>
          </h4>
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-2">Medication</th>
                  <th className="p-2 text-center w-24">Doc A Regimen</th>
                  <th className="p-2 text-center w-24">Doc B Regimen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {allMeds.map((med, i) => {
                  const medA = (docA?.medications || []).find((m) => m.name.toLowerCase() === med);
                  const medB = (docB?.medications || []).find((m) => m.name.toLowerCase() === med);
                  return (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                      <td className="p-2 font-medium capitalize">{med}</td>
                      <td className="p-2 text-center text-[11px]">
                        {medA ? <span className="text-emerald-700 dark:text-emerald-300 font-semibold">{medA.dosage || 'Prescribed'}</span> : <span className="text-slate-300 dark:text-slate-600">—</span>}
                      </td>
                      <td className="p-2 text-center text-[11px]">
                        {medB ? <span className="text-indigo-700 dark:text-indigo-300 font-semibold">{medB.dosage || 'Prescribed'}</span> : <span className="text-slate-300 dark:text-slate-600">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Labs Comparison */}
        <div className="card p-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5"><FlaskConical className="w-4 h-4 text-orange-600" /> Laboratory Result Trends</span>
            <span className="text-[11px] text-slate-400 font-normal">{allLabKeys.length} distinct</span>
          </h4>
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-2">Laboratory Test</th>
                  <th className="p-2 text-center w-24">Doc A Value</th>
                  <th className="p-2 text-center w-24">Doc B Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {allLabKeys.map((key, i) => {
                  const labA = a.labs.get(key);
                  const labB = b.labs.get(key);
                  return (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                      <td className="p-2 font-medium capitalize">{key}</td>
                      <td className="p-2 text-center text-[11px] font-mono">
                        {labA ? `${labA.value} ${labA.unit || ''}` : <span className="text-slate-300 dark:text-slate-600">—</span>}
                      </td>
                      <td className="p-2 text-center text-[11px] font-mono">
                        {labB ? `${labB.value} ${labB.unit || ''}` : <span className="text-slate-300 dark:text-slate-600">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
