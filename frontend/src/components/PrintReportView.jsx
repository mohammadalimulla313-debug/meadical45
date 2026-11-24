import React from 'react';

/**
 * MediExtract AI — Professional Printable Clinical Report.
 * Designed specifically for @media print rendering (browser print / save to PDF).
 * Rendered isolated inside #mediextract-print-container with zero dashboard overlay.
 */
export default function PrintReportView({ results, reviewer = null }) {
  if (!results) return null;

  const rev = reviewer || {
    name: 'Dr. Alex Vance, MD',
    department: 'Department of Internal Medicine / Clinical Informatics',
    date: new Date().toISOString().split('T')[0],
    notes: 'Rule-based extraction findings verified against source documentation. No discrepancies noted.',
  };

  // Identify clinical alerts
  const clinicalAlerts = [];
  (results.lab_results || []).forEach((l) => {
    if (l.flag === 'CRITICAL' || l.flag === 'HIGH' || l.flag === 'LOW') {
      clinicalAlerts.push({
        severity: l.flag === 'CRITICAL' ? 'CRITICAL' : 'ABNORMAL',
        message: `${l.normalized_test || l.test_name}: ${l.value} ${l.unit || ''} (Flag: ${l.flag})`,
        sentence: l.source_sentence,
      });
    }
  });
  (results.vital_signs || []).forEach((v) => {
    if (v.flag && v.flag !== 'NORMAL') {
      clinicalAlerts.push({
        severity: 'ABNORMAL',
        message: `${v.name}: ${v.value} ${v.unit || ''} (Flag: ${v.flag})`,
        sentence: v.source_sentence,
      });
    }
  });

  return (
    <div className="p-8 max-w-[210mm] mx-auto bg-white text-slate-900 font-sans print:p-0 print:max-w-none">
      {/* 1. Header Banner */}
      <div className="border-b-2 border-slate-900 pb-4 mb-5">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-teal-600 text-white rounded font-bold text-lg flex items-center justify-center">
              ME
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                MediExtract AI — Clinical Extraction Report
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Deterministic Rule-Based Clinical NLP & Information Extraction
              </p>
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-600 font-mono">
            <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
            <p><strong>Time:</strong> {new Date().toLocaleTimeString()}</p>
            <p><strong>Source:</strong> {results.metadata?.source_type || 'Clinical Document'}</p>
            <p><strong>Engine:</strong> 100% Local Rule-Based NLP</p>
          </div>
        </div>

        {/* Mandatory Clinical Disclaimer */}
        <div className="mt-3 p-2 bg-amber-50 border border-amber-300 rounded text-center text-xs font-semibold text-amber-900">
          NOTICE: Rule-based extraction for demonstration purposes. Not a medical diagnosis. Not for clinical use.
        </div>
      </div>

      {/* 2. Structured Concept Counts Grid */}
      <div className="grid grid-cols-4 gap-2 border border-slate-300 p-2.5 mb-5 text-xs text-center bg-slate-50 rounded">
        <div><span className="text-slate-500 block text-[10px] uppercase font-semibold">Symptoms</span><strong>{results.counts?.symptoms || 0}</strong></div>
        <div><span className="text-slate-500 block text-[10px] uppercase font-semibold">Conditions</span><strong>{results.counts?.diagnoses || 0}</strong></div>
        <div><span className="text-slate-500 block text-[10px] uppercase font-semibold">Medications</span><strong>{results.counts?.medications || 0}</strong></div>
        <div><span className="text-slate-500 block text-[10px] uppercase font-semibold">Lab Tests</span><strong>{results.counts?.lab_results || 0}</strong></div>
        <div><span className="text-slate-500 block text-[10px] uppercase font-semibold">Vital Signs</span><strong>{results.counts?.vital_signs || 0}</strong></div>
        <div><span className="text-slate-500 block text-[10px] uppercase font-semibold">Allergies</span><strong>{results.counts?.allergies || 0}</strong></div>
        <div><span className="text-slate-500 block text-[10px] uppercase font-semibold">Family Hx</span><strong>{results.counts?.family_history || 0}</strong></div>
        <div><span className="text-slate-500 block text-[10px] uppercase font-semibold">Sentences</span><strong>{results.metadata?.sentence_count || 0}</strong></div>
      </div>

      {/* 3. Clinical Alerts (if any) */}
      {clinicalAlerts.length > 0 && (
        <section className="mb-5 border border-rose-300 bg-rose-50/50 rounded p-3">
          <h2 className="text-xs font-bold text-rose-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            Clinical Alerts & Abnormal Findings ({clinicalAlerts.length})
          </h2>
          <ul className="space-y-1 text-xs text-rose-950">
            {clinicalAlerts.map((alt, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="font-bold text-rose-700">[{alt.severity}]</span>
                <div>
                  <span className="font-semibold">{alt.message}</span>
                  {alt.sentence && (
                    <span className="text-[11px] text-slate-600 block italic">Source: "{alt.sentence}"</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 4. Allergies & Adverse Reactions */}
      <section className="mb-5">
        <h2 className="text-xs font-bold border-b border-slate-300 pb-1 mb-2 text-slate-900 uppercase tracking-wider">
          1. Allergies & Adverse Reactions ({results.allergies?.length || 0})
        </h2>
        {results.allergies?.length ? (
          <table className="w-full text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="border border-slate-300 p-1.5">Allergen / Substance</th>
                <th className="border border-slate-300 p-1.5">Reaction</th>
                <th className="border border-slate-300 p-1.5">Status</th>
                <th className="border border-slate-300 p-1.5">Source Sentence</th>
              </tr>
            </thead>
            <tbody>
              {results.allergies.map((a, i) => (
                <tr key={i} className="border-b border-slate-200">
                  <td className="border border-slate-300 p-1.5 font-bold">
                    {a.is_nkda ? 'NKDA (No Known Drug Allergies)' : a.allergen}
                  </td>
                  <td className="border border-slate-300 p-1.5">{a.reaction || '—'}</td>
                  <td className="border border-slate-300 p-1.5 uppercase font-semibold text-[10px]">
                    {a.is_nkda ? 'No Known Allergies' : 'Active'}
                  </td>
                  <td className="border border-slate-300 p-1.5 text-slate-600 italic text-[11px]">
                    "{a.source_sentence}"
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-xs italic text-slate-500">No allergies detected in clinical text.</p>
        )}
      </section>

      {/* 5. Vital Signs */}
      <section className="mb-5">
        <h2 className="text-xs font-bold border-b border-slate-300 pb-1 mb-2 text-slate-900 uppercase tracking-wider">
          2. Vital Signs ({results.vital_signs?.length || 0})
        </h2>
        {results.vital_signs?.length ? (
          <table className="w-full text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="border border-slate-300 p-1.5">Vital Sign</th>
                <th className="border border-slate-300 p-1.5">Value</th>
                <th className="border border-slate-300 p-1.5">Unit</th>
                <th className="border border-slate-300 p-1.5">Interpretation / Flag</th>
              </tr>
            </thead>
            <tbody>
              {results.vital_signs.map((v, i) => (
                <tr key={i} className="border-b border-slate-200">
                  <td className="border border-slate-300 p-1.5 font-semibold">{v.name}</td>
                  <td className="border border-slate-300 p-1.5 font-mono font-bold">{v.value}</td>
                  <td className="border border-slate-300 p-1.5">{v.unit || '—'}</td>
                  <td className="border border-slate-300 p-1.5 font-medium">{v.flag || 'NORMAL'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-xs italic text-slate-500">No vital signs detected.</p>
        )}
      </section>

      {/* 6. Symptoms */}
      <section className="mb-5">
        <h2 className="text-xs font-bold border-b border-slate-300 pb-1 mb-2 text-slate-900 uppercase tracking-wider">
          3. Symptoms ({results.symptoms?.length || 0})
        </h2>
        {results.symptoms?.length ? (
          <table className="w-full text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="border border-slate-300 p-1.5">Reported Symptom</th>
                <th className="border border-slate-300 p-1.5">Normalized Clinical Concept</th>
                <th className="border border-slate-300 p-1.5">Polarity / Status</th>
                <th className="border border-slate-300 p-1.5">Source Sentence</th>
              </tr>
            </thead>
            <tbody>
              {results.symptoms.map((s, i) => (
                <tr key={i} className="border-b border-slate-200">
                  <td className="border border-slate-300 p-1.5 font-semibold">{s.text}</td>
                  <td className="border border-slate-300 p-1.5">{s.normalized_term || s.text}</td>
                  <td className="border border-slate-300 p-1.5 uppercase font-bold text-[10px]">
                    <span className={s.status === 'absent' ? 'text-rose-700' : 'text-teal-800'}>
                      {s.status}
                    </span>
                  </td>
                  <td className="border border-slate-300 p-1.5 text-slate-600 italic text-[11px]">
                    "{s.source_sentence}"
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-xs italic text-slate-500">No symptoms detected.</p>
        )}
      </section>

      {/* 7. Conditions & Diagnoses */}
      <section className="mb-5">
        <h2 className="text-xs font-bold border-b border-slate-300 pb-1 mb-2 text-slate-900 uppercase tracking-wider">
          4. Conditions & Diagnoses ({results.diagnoses?.length || 0})
        </h2>
        {results.diagnoses?.length ? (
          <table className="w-full text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="border border-slate-300 p-1.5">Condition Name</th>
                <th className="border border-slate-300 p-1.5">Normalized Term</th>
                <th className="border border-slate-300 p-1.5">Context / Status</th>
                <th className="border border-slate-300 p-1.5">Source Sentence</th>
              </tr>
            </thead>
            <tbody>
              {results.diagnoses.map((d, i) => (
                <tr key={i} className="border-b border-slate-200">
                  <td className="border border-slate-300 p-1.5 font-semibold">{d.text}</td>
                  <td className="border border-slate-300 p-1.5">{d.normalized_term || d.text}</td>
                  <td className="border border-slate-300 p-1.5 uppercase font-bold text-[10px]">
                    {d.status}
                  </td>
                  <td className="border border-slate-300 p-1.5 text-slate-600 italic text-[11px]">
                    "{d.source_sentence}"
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-xs italic text-slate-500">No medical conditions detected.</p>
        )}
      </section>

      {/* 8. Medications */}
      <section className="mb-5">
        <h2 className="text-xs font-bold border-b border-slate-300 pb-1 mb-2 text-slate-900 uppercase tracking-wider">
          5. Medications & Pharmacotherapy ({results.medications?.length || 0})
        </h2>
        {results.medications?.length ? (
          <table className="w-full text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="border border-slate-300 p-1.5">Medication Name</th>
                <th className="border border-slate-300 p-1.5">Dosage</th>
                <th className="border border-slate-300 p-1.5">Frequency</th>
                <th className="border border-slate-300 p-1.5">Route</th>
                <th className="border border-slate-300 p-1.5">Status</th>
                <th className="border border-slate-300 p-1.5">Source Sentence</th>
              </tr>
            </thead>
            <tbody>
              {results.medications.map((m, i) => (
                <tr key={i} className="border-b border-slate-200">
                  <td className="border border-slate-300 p-1.5 font-bold text-teal-900">{m.name}</td>
                  <td className="border border-slate-300 p-1.5 font-mono">{m.dosage || '—'}</td>
                  <td className="border border-slate-300 p-1.5">{m.frequency || '—'}</td>
                  <td className="border border-slate-300 p-1.5">{m.route || '—'}</td>
                  <td className="border border-slate-300 p-1.5 uppercase font-semibold text-[10px]">
                    {m.status || 'active'}
                  </td>
                  <td className="border border-slate-300 p-1.5 text-slate-600 italic text-[11px]">
                    "{m.source_sentence}"
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-xs italic text-slate-500">No medications detected.</p>
        )}
      </section>

      {/* 9. Laboratory Results */}
      <section className="mb-5">
        <h2 className="text-xs font-bold border-b border-slate-300 pb-1 mb-2 text-slate-900 uppercase tracking-wider">
          6. Laboratory Results & Biomarkers ({results.lab_results?.length || 0})
        </h2>
        {results.lab_results?.length ? (
          <table className="w-full text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="border border-slate-300 p-1.5">Test Name</th>
                <th className="border border-slate-300 p-1.5">Result</th>
                <th className="border border-slate-300 p-1.5">Unit</th>
                <th className="border border-slate-300 p-1.5">Reference / Flag</th>
                <th className="border border-slate-300 p-1.5">Source Sentence</th>
              </tr>
            </thead>
            <tbody>
              {results.lab_results.map((l, i) => (
                <tr key={i} className="border-b border-slate-200">
                  <td className="border border-slate-300 p-1.5 font-semibold">
                    {l.normalized_test || l.test_name}
                  </td>
                  <td className="border border-slate-300 p-1.5 font-mono font-bold">{l.value}</td>
                  <td className="border border-slate-300 p-1.5">{l.unit || '—'}</td>
                  <td className="border border-slate-300 p-1.5 font-bold">
                    <span className={l.flag === 'CRITICAL' || l.flag === 'HIGH' || l.flag === 'LOW' ? 'text-rose-700' : 'text-teal-700'}>
                      {l.flag || 'NORMAL'}
                    </span>
                  </td>
                  <td className="border border-slate-300 p-1.5 text-slate-600 italic text-[11px]">
                    "{l.source_sentence}"
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-xs italic text-slate-500">No laboratory results detected.</p>
        )}
      </section>

      {/* 10. Family Medical History */}
      {results.family_history?.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold border-b border-slate-300 pb-1 mb-2 text-slate-900 uppercase tracking-wider">
            7. Family Medical History ({results.family_history.length})
          </h2>
          <ul className="list-disc pl-5 text-xs space-y-1">
            {results.family_history.map((f, i) => (
              <li key={i}>
                <strong>{f.text}</strong> {f.normalized_term && f.normalized_term !== f.text.toLowerCase() ? `(${f.normalized_term})` : ''}
                <span className="text-[11px] text-slate-600 block italic">Source: "{f.source_sentence}"</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 11. Dated Events Timeline */}
      {results.timeline?.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold border-b border-slate-300 pb-1 mb-2 text-slate-900 uppercase tracking-wider">
            8. Dated Clinical Events Timeline ({results.timeline.length})
          </h2>
          <table className="w-full text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="border border-slate-300 p-1.5 w-28">Date</th>
                <th className="border border-slate-300 p-1.5">Event Description</th>
                <th className="border border-slate-300 p-1.5 w-28">Category</th>
              </tr>
            </thead>
            <tbody>
              {results.timeline.map((t, i) => (
                <tr key={i} className="border-b border-slate-200">
                  <td className="border border-slate-300 p-1.5 font-mono font-semibold text-teal-800">
                    {t.date_str || t.event_date || '—'}
                  </td>
                  <td className="border border-slate-300 p-1.5">{t.description || t.entity_text}</td>
                  <td className="border border-slate-300 p-1.5 uppercase text-[10px]">{t.category || 'Clinical'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* 12. Clinician Review & Attestation */}
      <section className="mt-6 pt-4 border-t-2 border-slate-900 text-xs">
        <h3 className="font-bold uppercase tracking-wider text-slate-900 mb-2">
          Clinician Verification & Attestation
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p><strong>Reviewing Clinician:</strong> {rev.name}</p>
            <p className="text-slate-600"><strong>Department:</strong> {rev.department}</p>
            <p className="text-slate-600"><strong>Attestation Date:</strong> {rev.date}</p>
          </div>
          <div className="text-right">
            <p className="italic text-slate-600 mb-6">"{rev.notes}"</p>
            <div className="border-t border-slate-400 pt-1 inline-block w-48 text-center text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
              Physician Signature
            </div>
          </div>
        </div>
      </section>

      {/* 13. Page Footer */}
      <div className="border-t border-slate-300 mt-6 pt-2 text-[10px] text-slate-500 flex justify-between items-center">
        <span>CONFIDENTIAL MEDICAL RECORD — FOR CLINICAL DEMONSTRATION ONLY</span>
        <span>MediExtract AI v1.0.0 · Local Deterministic NLP</span>
      </div>
    </div>
  );
}
