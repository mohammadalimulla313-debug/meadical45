import React, { useState, useMemo } from 'react';

// ═══════════════════════════════════════════════════════════
// Status & Flag Badges
// ═══════════════════════════════════════════════════════════

function StatusBadge({ status }) {
  const labels = {
    present: 'Present',
    absent: 'Absent (Negated)',
    historical: 'Historical',
    uncertain: 'Uncertain / R/O',
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

// ═══════════════════════════════════════════════════════════
// KPI Strip
// ═══════════════════════════════════════════════════════════

function KPIStrip({ counts }) {
  const kpis = [
    { label: 'Symptoms', value: counts?.symptoms ?? 0, icon: '🩺', color: 'text-blue-600' },
    { label: 'Conditions', value: counts?.diagnoses ?? 0, icon: '📋', color: 'text-purple-600' },
    { label: 'Family Hx', value: counts?.family_history ?? 0, icon: '👨‍👩‍👧', color: 'text-indigo-600' },
    { label: 'Medications', value: counts?.medications ?? 0, icon: '💊', color: 'text-green-600' },
    { label: 'Lab Results', value: counts?.lab_results ?? 0, icon: '🧪', color: 'text-orange-600' },
    { label: 'Vital Signs', value: counts?.vital_signs ?? 0, icon: '📊', color: 'text-cyan-600' },
    { label: 'Allergies', value: counts?.allergies ?? 0, icon: '⚠️', color: 'text-red-600' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-5">
      {kpis.map((k) => (
        <div key={k.label} className="kpi-tile p-3 bg-white rounded-xl border border-gray-100 shadow-sm text-center">
          <div className="text-base">{k.icon}</div>
          <div className={`text-xl font-bold ${k.color}`}>{k.value}</div>
          <div className="text-xs text-gray-500 mt-0.5">{k.label}</div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Filter Pills
// ═══════════════════════════════════════════════════════════

function FilterPills({ options, activeFilter, setActiveFilter }) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-3">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => setActiveFilter(opt.id)}
          className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
            activeFilter === opt.id
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Empty State ("None detected")
// ═══════════════════════════════════════════════════════════

function EmptyState() {
  return (
    <div className="py-6 text-center text-sm text-gray-400 italic">
      None detected
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Expandable Source Sentence
// ═══════════════════════════════════════════════════════════

function SourceSentence({ sentence }) {
  const [expanded, setExpanded] = useState(false);
  if (!sentence) return null;

  const truncated = sentence.length > 90 ? sentence.slice(0, 90) + '…' : sentence;

  return (
    <div className="mt-1 text-xs">
      <span className="text-gray-400 font-medium">Source: </span>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-gray-500 hover:text-blue-600 transition-colors text-left italic inline"
        title="Click to toggle full source sentence"
      >
        "{expanded ? sentence : truncated}"
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 1. Allergies Card
// ═══════════════════════════════════════════════════════════

function AllergiesCard({ allergies }) {
  if (!allergies || allergies.length === 0) {
    return (
      <div className="card">
        <div className="card-header text-amber-700">
          <span className="text-amber-600">⚠️</span>
          Allergies
        </div>
        <div className="p-4">
          <EmptyState />
        </div>
      </div>
    );
  }

  const hasNKDA = allergies.some((a) => a.is_nkda);
  const activeAllergies = allergies.filter((a) => !a.is_nkda);

  return (
    <div className={`card ${activeAllergies.length > 0 ? 'ring-2 ring-amber-300' : ''}`}>
      <div className={`card-header ${activeAllergies.length > 0 ? 'bg-amber-50 text-amber-800' : 'text-green-700'}`}>
        <span className="text-amber-600">⚠️</span>
        Allergies
        {activeAllergies.length > 0 && (
          <span className="ml-auto badge bg-amber-200 text-amber-800">{activeAllergies.length} Documented</span>
        )}
      </div>
      <div className="p-4 space-y-2">
        {hasNKDA && (
          <div className="flex items-start gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold">NKDA — No Known Drug Allergies</p>
              {allergies.find((a) => a.is_nkda)?.source_sentence && (
                <SourceSentence sentence={allergies.find((a) => a.is_nkda).source_sentence} />
              )}
            </div>
          </div>
        )}
        {activeAllergies.map((a, i) => (
          <div key={i} className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-amber-900">{a.allergen}</span>
              {a.reaction && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 font-medium">
                  Reaction: {a.reaction}
                </span>
              )}
            </div>
            <SourceSentence sentence={a.source_sentence} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 2. Vital Signs Card
// ═══════════════════════════════════════════════════════════

function VitalsCard({ vitals }) {
  const [selectedVital, setSelectedVital] = useState(null);

  return (
    <div className="card">
      <div className="card-header">
        <span className="text-cyan-600">📊</span>
        Vital Signs
        {vitals && vitals.length > 0 && (
          <span className="ml-auto text-xs text-gray-400 font-normal">{vitals.length}</span>
        )}
      </div>
      {!vitals || vitals.length === 0 ? (
        <div className="p-4">
          <EmptyState />
        </div>
      ) : (
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {vitals.map((v, i) => (
              <div
                key={i}
                onClick={() => setSelectedVital(selectedVital === i ? null : i)}
                className={`cursor-pointer rounded-lg p-3 border transition-all text-center ${
                  selectedVital === i
                    ? 'bg-cyan-50 border-cyan-300 ring-2 ring-cyan-200'
                    : 'bg-gradient-to-br from-gray-50 to-blue-50/40 border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">{v.name}</div>
                <div className="text-lg font-bold text-gray-900 mt-1">{v.value}</div>
                <div className="text-xs text-gray-400">{v.unit}</div>
              </div>
            ))}
          </div>

          {/* Show source sentence for selected vital or all */}
          <div className="pt-2 border-t border-gray-100 space-y-1">
            {vitals.map((v, i) => (
              (selectedVital === null || selectedVital === i) && (
                <div key={i} className="text-xs text-gray-600 flex items-start gap-1">
                  <span className="font-semibold text-gray-700 min-w-[110px]">{v.name}:</span>
                  <SourceSentence sentence={v.source_sentence} />
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 3. Symptoms Card (Present, Absent, Uncertain, Historical)
// ═══════════════════════════════════════════════════════════

function SymptomsCard({ symptoms }) {
  const [filter, setFilter] = useState('all');

  const filterOptions = [
    { id: 'all', label: 'All' },
    { id: 'present', label: 'Present' },
    { id: 'absent', label: 'Absent (Negated)' },
    { id: 'uncertain', label: 'Uncertain' },
    { id: 'historical', label: 'Historical' },
  ];

  const filtered = useMemo(() => {
    if (!symptoms || filter === 'all') return symptoms || [];
    return symptoms.filter((s) => s.status === filter);
  }, [symptoms, filter]);

  return (
    <div className="card">
      <div className="card-header">
        <span className="text-blue-600">🩺</span>
        Symptoms
        {symptoms && symptoms.length > 0 && (
          <span className="ml-auto text-xs text-gray-400 font-normal">{symptoms.length}</span>
        )}
      </div>
      <div className="p-4">
        {!symptoms || symptoms.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <FilterPills options={filterOptions} activeFilter={filter} setActiveFilter={setFilter} />
            {filtered.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {filtered.map((s, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={s.status} />
                      <span className="font-medium text-gray-900 text-sm">{s.text}</span>
                      {s.normalized_term && s.normalized_term !== s.text.toLowerCase() && (
                        <span className="text-xs text-gray-400">→ {s.normalized_term}</span>
                      )}
                    </div>
                    <SourceSentence sentence={s.source_sentence} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 4. Conditions Card (Current, Historical, Uncertain)
// ═══════════════════════════════════════════════════════════

function ConditionsCard({ diagnoses }) {
  const [filter, setFilter] = useState('all');

  const filterOptions = [
    { id: 'all', label: 'All' },
    { id: 'present', label: 'Current / Active' },
    { id: 'historical', label: 'Historical' },
    { id: 'uncertain', label: 'Uncertain / Differential' },
  ];

  const filtered = useMemo(() => {
    if (!diagnoses || filter === 'all') return diagnoses || [];
    return diagnoses.filter((d) => d.status === filter);
  }, [diagnoses, filter]);

  return (
    <div className="card">
      <div className="card-header">
        <span className="text-purple-600">📋</span>
        Conditions & Diagnoses
        {diagnoses && diagnoses.length > 0 && (
          <span className="ml-auto text-xs text-gray-400 font-normal">{diagnoses.length}</span>
        )}
      </div>
      <div className="p-4">
        {!diagnoses || diagnoses.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <FilterPills options={filterOptions} activeFilter={filter} setActiveFilter={setFilter} />
            {filtered.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {filtered.map((d, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={d.status} />
                      <span className="font-medium text-gray-900 text-sm">{d.text}</span>
                      {d.normalized_term && d.normalized_term !== d.text.toLowerCase() && (
                        <span className="text-xs text-gray-400">→ {d.normalized_term}</span>
                      )}
                    </div>
                    <SourceSentence sentence={d.source_sentence} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 5. Family History Card
// ═══════════════════════════════════════════════════════════

function FamilyHistoryCard({ familyHistory }) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="text-indigo-600">👨‍👩‍👧</span>
        Family Medical History
        {familyHistory && familyHistory.length > 0 && (
          <span className="ml-auto text-xs text-gray-400 font-normal">{familyHistory.length}</span>
        )}
      </div>
      <div className="p-4">
        {!familyHistory || familyHistory.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {familyHistory.map((f, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100 hover:bg-indigo-50 transition-colors">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="badge badge-family_history">Family Hx</span>
                  <span className="font-semibold text-gray-900 text-sm">{f.text}</span>
                  {f.normalized_term && f.normalized_term !== f.text.toLowerCase() && (
                    <span className="text-xs text-gray-500">→ {f.normalized_term}</span>
                  )}
                </div>
                <SourceSentence sentence={f.source_sentence} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 6. Medications Card
// ═══════════════════════════════════════════════════════════

function MedicationsCard({ medications }) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="text-green-600">💊</span>
        Medications
        {medications && medications.length > 0 && (
          <span className="ml-auto text-xs text-gray-400 font-normal">{medications.length}</span>
        )}
      </div>
      {!medications || medications.length === 0 ? (
        <div className="p-4">
          <EmptyState />
        </div>
      ) : (
        <div className="p-4 space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Medication</th>
                  <th className="px-3 py-2 text-left font-medium">Dosage</th>
                  <th className="px-3 py-2 text-left font-medium">Frequency</th>
                  <th className="px-3 py-2 text-left font-medium">Route</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {medications.map((m, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2.5 font-medium text-gray-900">{m.name}</td>
                    <td className="px-3 py-2.5 text-gray-600">{m.dosage || '—'}</td>
                    <td className="px-3 py-2.5 text-gray-600">{m.frequency || '—'}</td>
                    <td className="px-3 py-2.5 text-gray-600">{m.route || '—'}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={m.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Source sentences for medications */}
          <div className="pt-2 border-t border-gray-100 space-y-1">
            {medications.map((m, i) => (
              <div key={i} className="text-xs text-gray-600 flex items-start gap-1">
                <span className="font-semibold text-gray-700 min-w-[100px]">{m.name}:</span>
                <SourceSentence sentence={m.source_sentence} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 7. Lab Results Card
// ═══════════════════════════════════════════════════════════

function LabResultsCard({ labs }) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="text-orange-600">🧪</span>
        Laboratory Results
        {labs && labs.length > 0 && (
          <span className="ml-auto text-xs text-gray-400 font-normal">{labs.length}</span>
        )}
      </div>
      {!labs || labs.length === 0 ? (
        <div className="p-4">
          <EmptyState />
        </div>
      ) : (
        <div className="p-4 space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Test</th>
                  <th className="px-3 py-2 text-left font-medium">Result</th>
                  <th className="px-3 py-2 text-left font-medium">Unit</th>
                  <th className="px-3 py-2 text-left font-medium">Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {labs.map((l, i) => (
                  <tr
                    key={i}
                    className={`hover:bg-gray-50 transition-colors ${
                      l.flag === 'CRITICAL'
                        ? 'bg-red-50/70 font-semibold'
                        : l.flag === 'HIGH' || l.flag === 'LOW'
                        ? 'bg-amber-50/40'
                        : ''
                    }`}
                  >
                    <td className="px-3 py-2.5 font-medium text-gray-900">{l.normalized_test}</td>
                    <td className="px-3 py-2.5 font-mono text-gray-800">{l.value}</td>
                    <td className="px-3 py-2.5 text-gray-500">{l.unit || '—'}</td>
                    <td className="px-3 py-2.5"><LabFlagBadge flag={l.flag} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Source sentences for labs */}
          <div className="pt-2 border-t border-gray-100 space-y-1">
            {labs.map((l, i) => (
              <div key={i} className="text-xs text-gray-600 flex items-start gap-1">
                <span className="font-semibold text-gray-700 min-w-[100px]">{l.normalized_test}:</span>
                <SourceSentence sentence={l.source_sentence} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Main Dashboard
// ═══════════════════════════════════════════════════════════

export default function ResultsDashboard({ results, loading }) {
  if (loading) {
    return (
      <div className="card">
        <div className="p-16 text-center">
          <svg className="animate-spin h-10 w-10 mx-auto text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="mt-4 text-gray-700 font-semibold">Extracting clinical entities...</p>
          <p className="text-sm text-gray-400 mt-1">Running deterministic local NLP pipeline</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="card">
        <div className="p-16 text-center">
          <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
          </svg>
          <p className="mt-4 text-gray-700 font-semibold">No extraction results yet</p>
          <p className="text-sm text-gray-400 mt-1">Enter a clinical note or upload a document and click "Extract Clinical Data"</p>
        </div>
      </div>
    );
  }

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(results, null, 2));
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mediextract-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Mandatory Clinical Disclaimer Banner */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-base">⚠️</span>
          <span className="font-semibold">Notice:</span>
          <span>Rule-based extraction for demonstration. Not for clinical use.</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopyJSON}
            className="text-xs px-2.5 py-1 rounded-md bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 transition-colors font-medium"
          >
            Copy JSON
          </button>
          <button
            onClick={handleDownloadJSON}
            className="text-xs px-2.5 py-1 rounded-md bg-amber-600 text-white hover:bg-amber-700 transition-colors font-medium"
          >
            Download JSON
          </button>
        </div>
      </div>

      {/* Metadata Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-gray-500 bg-white/60 p-2.5 rounded-lg border border-gray-100">
        <div className="flex items-center gap-3">
          {results.metadata?.processing_time_ms && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-md font-medium">
              ⚡ {results.metadata.processing_time_ms}ms
            </span>
          )}
          {results.metadata?.sentence_count && (
            <span>{results.metadata.sentence_count} sentences</span>
          )}
          {results.metadata?.char_count && (
            <span>{results.metadata.char_count.toLocaleString()} chars</span>
          )}
          {results.metadata?.source_type && (
            <span className="capitalize">Source: {results.metadata.source_type}</span>
          )}
        </div>
        <span className="text-gray-400 font-mono">MediExtract Local Engine v1.0</span>
      </div>

      {/* KPI Strip */}
      <KPIStrip counts={results.counts} />

      {/* Section 1: Allergies */}
      <AllergiesCard allergies={results.allergies} />

      {/* Section 2: Vital Signs */}
      <VitalsCard vitals={results.vital_signs} />

      {/* Section 3 & 4: Symptoms and Conditions */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <SymptomsCard symptoms={results.symptoms} />
        <ConditionsCard diagnoses={results.diagnoses} />
      </div>

      {/* Section 5: Family History */}
      <FamilyHistoryCard familyHistory={results.family_history} />

      {/* Section 6: Medications */}
      <MedicationsCard medications={results.medications} />

      {/* Section 7: Lab Results */}
      <LabResultsCard labs={results.lab_results} />
    </div>
  );
}
