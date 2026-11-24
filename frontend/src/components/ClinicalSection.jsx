import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Copy,
  Check,
  Stethoscope,
  ClipboardList,
  Users,
  Pill,
  FlaskConical,
  HeartPulse,
  AlertTriangle,
  ArrowUpDown,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import TraceabilityModal from './TraceabilityModal';

// ═══════════════════════════════════════════════════════════
// Status & Flag Badges
// ═══════════════════════════════════════════════════════════

function StatusBadge({ status }) {
  const labels = {
    present: 'Present',
    absent: 'Absent (Negated)',
    historical: 'Historical',
    uncertain: 'Uncertain / RO',
    family_history: 'Family Hx',
    active: 'Active',
    discontinued: 'Discontinued',
  };
  return <span className={`badge badge-${status}`}>{labels[status] || status}</span>;
}

function LabFlagBadge({ flag }) {
  if (!flag) return null;
  return <span className={`badge badge-${flag.toLowerCase()}`}>{flag}</span>;
}

function EmptyCategory({ label }) {
  return (
    <div className="py-6 text-center text-sm text-slate-400 dark:text-slate-500 italic">
      No {label} detected in the processed document.
    </div>
  );
}

function SourceSentence({ sentence }) {
  const [expanded, setExpanded] = useState(false);
  if (!sentence) return null;

  const isLong = sentence.length > 90;
  const displayText = expanded || !isLong ? sentence : sentence.slice(0, 90) + '…';

  return (
    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
      <span className="font-medium text-slate-400 dark:text-slate-500">Source: </span>
      <span className="italic">"{displayText}"</span>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-1.5 text-blue-600 dark:text-blue-400 hover:underline font-normal inline"
        >
          {expanded ? 'less' : 'more'}
        </button>
      )}
    </div>
  );
}

export default function ClinicalSection({
  results,
  onToast,
  initialCategory = 'all',
  globalSearch = '',
}) {
  const [searchTerm, setSearchTerm] = useState(globalSearch || '');
  const [activeTab, setActiveTab] = useState(initialCategory || 'all');
  const [sortOrder, setSortOrder] = useState('default'); // 'default' | 'asc' | 'desc'
  const [copiedId, setCopiedId] = useState(null);
  const [traceEntity, setTraceEntity] = useState(null);

  useEffect(() => {
    if (initialCategory) {
      setActiveTab(initialCategory);
    }
  }, [initialCategory]);

  useEffect(() => {
    if (globalSearch) {
      setSearchTerm(globalSearch);
    }
  }, [globalSearch]);

  const copyItemText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    onToast && onToast({
      type: 'success',
      message: `Copied to clipboard: "${text.slice(0, 35)}${text.length > 35 ? '...' : ''}"`,
    });
  };

  // Search and Sort Filtering
  const filterAndSort = (items, keyField = 'text') => {
    if (!items) return [];
    let list = items;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((item) => {
        const textVal = String(item[keyField] || '').toLowerCase();
        const normVal = String(item.normalized_term || item.normalized_test || '').toLowerCase();
        const sentVal = String(item.source_sentence || '').toLowerCase();
        const extraVal = String(item.dosage || item.allergen || item.value || '').toLowerCase();
        return textVal.includes(q) || normVal.includes(q) || sentVal.includes(q) || extraVal.includes(q);
      });
    }

    if (sortOrder === 'asc') {
      return [...list].sort((a, b) => String(a[keyField] || '').localeCompare(String(b[keyField] || '')));
    } else if (sortOrder === 'desc') {
      return [...list].sort((a, b) => String(b[keyField] || '').localeCompare(String(a[keyField] || '')));
    }
    return list;
  };

  const filteredSymptoms = useMemo(() => filterAndSort(results?.symptoms || [], 'text'), [results, searchTerm, sortOrder]);
  const filteredConditions = useMemo(() => filterAndSort(results?.diagnoses || [], 'text'), [results, searchTerm, sortOrder]);
  const filteredFamilyHistory = useMemo(() => filterAndSort(results?.family_history || [], 'text'), [results, searchTerm, sortOrder]);
  const filteredMedications = useMemo(() => filterAndSort(results?.medications || [], 'name'), [results, searchTerm, sortOrder]);
  const filteredLabs = useMemo(() => filterAndSort(results?.lab_results || [], 'normalized_test'), [results, searchTerm, sortOrder]);
  const filteredVitals = useMemo(() => filterAndSort(results?.vital_signs || [], 'name'), [results, searchTerm, sortOrder]);
  const filteredAllergies = useMemo(() => filterAndSort(results?.allergies || [], 'allergen'), [results, searchTerm, sortOrder]);

  const tabs = [
    { id: 'all', label: 'All Categories', count: results?.counts ? Object.values(results.counts).reduce((a, b) => a + b, 0) : 0 },
    { id: 'symptoms', label: 'Symptoms', count: filteredSymptoms.length },
    { id: 'conditions', label: 'Conditions', count: filteredConditions.length },
    { id: 'family_history', label: 'Family History', count: filteredFamilyHistory.length },
    { id: 'medications', label: 'Medications', count: filteredMedications.length },
    { id: 'labs', label: 'Lab Results', count: filteredLabs.length },
    { id: 'vitals', label: 'Vital Signs', count: filteredVitals.length },
    { id: 'allergies', label: 'Allergies', count: filteredAllergies.length },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl">
      {/* Search, Filter & Sort Controls */}
      <div className="card p-4 space-y-3.5">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter extracted clinical entities, dosages, labs, or source sentences..."
              className="w-full pl-9 pr-4 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sort Order Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Sort:</span>
            <button
              onClick={() => setSortOrder(sortOrder === 'default' ? 'asc' : sortOrder === 'asc' ? 'desc' : 'default')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span>{sortOrder === 'default' ? 'Document Order' : sortOrder === 'asc' ? 'A to Z' : 'Z to A'}</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
              <span className="ml-1.5 opacity-75 text-[10px]">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Category Results Grid */}
      <div className="space-y-5">
        {/* 1. Allergies */}
        {(activeTab === 'all' || activeTab === 'allergies') && (
          <div className="card">
            <div className="card-header bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Allergies & Adverse Drug Reactions</span>
              <span className="ml-auto text-xs font-normal text-slate-400">{filteredAllergies.length} detected</span>
            </div>
            <div className="p-4 space-y-2.5">
              {filteredAllergies.length === 0 ? (
                <EmptyCategory label="Allergies" />
              ) : (
                filteredAllergies.map((a, i) => (
                  <div
                    key={i}
                    className="group relative p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 hover:shadow-xs transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {a.is_nkda ? (
                          <span className="badge bg-emerald-100 text-emerald-800 font-semibold dark:bg-emerald-950 dark:text-emerald-300">
                            NKDA — No Known Drug Allergies
                          </span>
                        ) : (
                          <>
                            <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                              {a.allergen}
                            </span>
                            {a.reaction && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 font-medium">
                                Reaction: {a.reaction}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setTraceEntity(a)}
                          className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                          title="Inspect Rule & Provenance"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => copyItemText(a.allergen, `allergy-${i}`)}
                          className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                          title="Copy allergen"
                        >
                          {copiedId === `allergy-${i}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <SourceSentence sentence={a.source_sentence} />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 2. Vital Signs */}
        {(activeTab === 'all' || activeTab === 'vitals') && (
          <div className="card">
            <div className="card-header">
              <HeartPulse className="w-4 h-4 text-cyan-600" />
              <span>Vital Signs Measurements</span>
              <span className="ml-auto text-xs font-normal text-slate-400">{filteredVitals.length} recorded</span>
            </div>
            <div className="p-4">
              {filteredVitals.length === 0 ? (
                <EmptyCategory label="Vital Signs" />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {filteredVitals.map((v, i) => (
                    <div
                      key={i}
                      className="group relative p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-blue-950/20 hover:border-cyan-300 hover:shadow-xs transition-all"
                    >
                      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setTraceEntity(v)}
                          className="p-0.5 text-slate-400 hover:text-blue-600"
                          title="Inspect Rule & Provenance"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => copyItemText(`${v.name}: ${v.value} ${v.unit}`.trim(), `vital-${i}`)}
                          className="p-0.5 text-slate-400 hover:text-cyan-600"
                          title="Copy measurement"
                        >
                          {copiedId === `vital-${i}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        {v.name}
                      </span>
                      <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                        {v.value}
                      </div>
                      <span className="text-xs text-slate-400">{v.unit}</span>
                      <SourceSentence sentence={v.source_sentence} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. Symptoms */}
        {(activeTab === 'all' || activeTab === 'symptoms') && (
          <div className="card">
            <div className="card-header">
              <Stethoscope className="w-4 h-4 text-blue-600" />
              <span>Present & Absent Symptoms</span>
              <span className="ml-auto text-xs font-normal text-slate-400">{filteredSymptoms.length} detected</span>
            </div>
            <div className="p-4 space-y-2">
              {filteredSymptoms.length === 0 ? (
                <EmptyCategory label="Symptoms" />
              ) : (
                filteredSymptoms.map((s, i) => (
                  <div
                    key={i}
                    className="group flex items-start justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={s.status} />
                        <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                          {s.text}
                        </span>
                        {s.normalized_term && s.normalized_term !== s.text.toLowerCase() && (
                          <span className="text-xs text-slate-400 font-medium">→ {s.normalized_term}</span>
                        )}
                        {s.trigger_word && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-mono">
                            trigger: "{s.trigger_word}"
                          </span>
                        )}
                      </div>
                      <SourceSentence sentence={s.source_sentence} />
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setTraceEntity(s)}
                        className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                        title="Inspect Rule & Provenance"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => copyItemText(s.text, `symptom-${i}`)}
                        className="p-1 text-slate-400 hover:text-blue-600 transition-opacity"
                        title="Copy symptom"
                      >
                        {copiedId === `symptom-${i}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 4. Conditions & Diagnoses */}
        {(activeTab === 'all' || activeTab === 'conditions') && (
          <div className="card">
            <div className="card-header">
              <ClipboardList className="w-4 h-4 text-purple-600" />
              <span>Current & Historical Conditions</span>
              <span className="ml-auto text-xs font-normal text-slate-400">{filteredConditions.length} identified</span>
            </div>
            <div className="p-4 space-y-2">
              {filteredConditions.length === 0 ? (
                <EmptyCategory label="Conditions" />
              ) : (
                filteredConditions.map((d, i) => (
                  <div
                    key={i}
                    className="group flex items-start justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={d.status} />
                        <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                          {d.text}
                        </span>
                        {d.normalized_term && d.normalized_term !== d.text.toLowerCase() && (
                          <span className="text-xs text-slate-400 font-medium">→ {d.normalized_term}</span>
                        )}
                        {d.trigger_word && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-mono">
                            trigger: "{d.trigger_word}"
                          </span>
                        )}
                      </div>
                      <SourceSentence sentence={d.source_sentence} />
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setTraceEntity(d)}
                        className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                        title="Inspect Rule & Provenance"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => copyItemText(d.text, `diag-${i}`)}
                        className="p-1 text-slate-400 hover:text-purple-600 transition-opacity"
                        title="Copy condition"
                      >
                        {copiedId === `diag-${i}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 5. Family Medical History */}
        {(activeTab === 'all' || activeTab === 'family_history') && (
          <div className="card">
            <div className="card-header">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Family Medical History</span>
              <span className="ml-auto text-xs font-normal text-slate-400">{filteredFamilyHistory.length} documented</span>
            </div>
            <div className="p-4 space-y-2">
              {filteredFamilyHistory.length === 0 ? (
                <EmptyCategory label="Family History" />
              ) : (
                filteredFamilyHistory.map((f, i) => (
                  <div
                    key={i}
                    className="group flex items-start justify-between p-3 rounded-lg bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/60 hover:bg-indigo-50/70 transition-colors"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="badge badge-family_history">Family Hx</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                          {f.text}
                        </span>
                        {f.normalized_term && f.normalized_term !== f.text.toLowerCase() && (
                          <span className="text-xs text-slate-400 font-medium">→ {f.normalized_term}</span>
                        )}
                      </div>
                      <SourceSentence sentence={f.source_sentence} />
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setTraceEntity(f)}
                        className="p-1 text-slate-400 hover:text-blue-600"
                        title="Inspect Rule & Provenance"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => copyItemText(f.text, `fh-${i}`)}
                        className="p-1 text-slate-400 hover:text-indigo-600 transition-opacity"
                        title="Copy family history item"
                      >
                        {copiedId === `fh-${i}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 6. Medications Table */}
        {(activeTab === 'all' || activeTab === 'medications') && (
          <div className="card">
            <div className="card-header">
              <Pill className="w-4 h-4 text-emerald-600" />
              <span>Medication Regimens</span>
              <span className="ml-auto text-xs font-normal text-slate-400">{filteredMedications.length} regimens</span>
            </div>
            <div className="p-4">
              {filteredMedications.length === 0 ? (
                <EmptyCategory label="Medications" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-2.5">Medication</th>
                        <th className="p-2.5">Dosage</th>
                        <th className="p-2.5">Frequency</th>
                        <th className="p-2.5">Route</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Source Context</th>
                        <th className="p-2.5 text-right">Inspect</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredMedications.map((m, i) => (
                        <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-slate-850">
                          <td className="p-2.5 font-semibold text-slate-900 dark:text-slate-100 capitalize">
                            <div className="flex items-center gap-1.5">
                              <span>{m.name}</span>
                              <button
                                onClick={() => copyItemText(`${m.name} ${m.dosage || ''}`, `med-${i}`)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-emerald-600 transition-opacity"
                                title="Copy medication"
                              >
                                {copiedId === `med-${i}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          </td>
                          <td className="p-2.5 font-mono text-xs">{m.dosage || '—'}</td>
                          <td className="p-2.5 text-xs text-slate-600 dark:text-slate-400">{m.frequency || '—'}</td>
                          <td className="p-2.5 text-xs text-slate-600 dark:text-slate-400">{m.route || '—'}</td>
                          <td className="p-2.5"><StatusBadge status={m.status} /></td>
                          <td className="p-2.5 max-w-xs"><SourceSentence sentence={m.source_sentence} /></td>
                          <td className="p-2.5 text-right">
                            <button
                              onClick={() => setTraceEntity(m)}
                              className="p-1 text-slate-400 hover:text-blue-600"
                              title="Inspect Traceability"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 7. Laboratory Results Table */}
        {(activeTab === 'all' || activeTab === 'labs') && (
          <div className="card">
            <div className="card-header">
              <FlaskConical className="w-4 h-4 text-orange-600" />
              <span>Laboratory Results & Measurements</span>
              <span className="ml-auto text-xs font-normal text-slate-400">{filteredLabs.length} tests</span>
            </div>
            <div className="p-4">
              {filteredLabs.length === 0 ? (
                <EmptyCategory label="Lab Results" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-2.5">Lab Test</th>
                        <th className="p-2.5">Measured Value</th>
                        <th className="p-2.5">Unit</th>
                        <th className="p-2.5">Flag</th>
                        <th className="p-2.5">Source Context</th>
                        <th className="p-2.5 text-right">Inspect</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredLabs.map((l, i) => (
                        <tr
                          key={i}
                          className={`group hover:bg-slate-50 dark:hover:bg-slate-850 ${
                            l.flag === 'CRITICAL'
                              ? 'bg-rose-50/70 dark:bg-rose-950/40 font-semibold'
                              : l.flag === 'HIGH' || l.flag === 'LOW'
                              ? 'bg-amber-50/40 dark:bg-amber-950/20'
                              : ''
                          }`}
                        >
                          <td className="p-2.5 font-semibold text-slate-900 dark:text-slate-100">
                            <div className="flex items-center gap-1.5">
                              <span>{l.normalized_test}</span>
                              <button
                                onClick={() => copyItemText(`${l.normalized_test}: ${l.value} ${l.unit || ''}`.trim(), `lab-${i}`)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-orange-600 transition-opacity"
                                title="Copy lab test"
                              >
                                {copiedId === `lab-${i}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          </td>
                          <td className="p-2.5 font-mono text-sm">{l.value}</td>
                          <td className="p-2.5 text-xs text-slate-500">{l.unit || '—'}</td>
                          <td className="p-2.5"><LabFlagBadge flag={l.flag} /></td>
                          <td className="p-2.5 max-w-xs"><SourceSentence sentence={l.source_sentence} /></td>
                          <td className="p-2.5 text-right">
                            <button
                              onClick={() => setTraceEntity(l)}
                              className="p-1 text-slate-400 hover:text-blue-600"
                              title="Inspect Traceability"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Traceability Modal */}
      <TraceabilityModal
        isOpen={Boolean(traceEntity)}
        onClose={() => setTraceEntity(null)}
        entity={traceEntity}
      />
    </div>
  );
}
