/**
 * MediExtract AI — Export Utilities
 * Pure client-side generators for CSV, JSON, formatted text summary, and print reports.
 * Does not store any sensitive data or communicate with external services.
 */

export function filterResultsBySections(results, sections) {
  if (!results || !sections) return results;

  const filtered = {
    metadata: results.metadata || {},
    disclaimer: 'Automated rule-based extraction for demonstration purposes. Not a medical diagnosis. Not for clinical use.',
    generated_at: new Date().toISOString(),
  };

  if (sections.summary) {
    filtered.counts = results.counts || {};
  }
  if (sections.allergies) {
    filtered.allergies = results.allergies || [];
  }
  if (sections.vital_signs) {
    filtered.vital_signs = results.vital_signs || [];
  }
  if (sections.symptoms) {
    filtered.symptoms = results.symptoms || [];
  }
  if (sections.diagnoses) {
    filtered.diagnoses = results.diagnoses || [];
  }
  if (sections.medications) {
    filtered.medications = results.medications || [];
  }
  if (sections.lab_results) {
    filtered.lab_results = results.lab_results || [];
  }
  if (sections.family_history) {
    filtered.family_history = results.family_history || [];
  }
  if (sections.timeline) {
    filtered.timeline = results.timeline || [];
  }

  return filtered;
}

export function downloadJSON(data, filename = `mediextract-export-${Date.now()}.json`, sections = null) {
  const exportData = sections ? filterResultsBySections(data, sections) : data;
  const jsonStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCSV(results, filename = `mediextract-data-${Date.now()}.csv`, sections = null) {
  if (!results) return;

  const rows = [];
  rows.push(['"Category"', '"Item / Name"', '"Normalized Concept"', '"Value / Dose"', '"Unit / Freq"', '"Status / Flag"', '"Source Sentence"']);

  // Symptoms
  if (!sections || sections.symptoms) {
    (results.symptoms || []).forEach((s) => {
      rows.push(['"Symptom"', `"${(s.text || '').replace(/"/g, '""')}"`, `"${(s.normalized_term || '').replace(/"/g, '""')}"`, '""', '""', `"${s.status || 'present'}"`, `"${(s.source_sentence || '').replace(/"/g, '""')}"`]);
    });
  }

  // Diagnoses
  if (!sections || sections.diagnoses) {
    (results.diagnoses || []).forEach((d) => {
      rows.push(['"Condition"', `"${(d.text || '').replace(/"/g, '""')}"`, `"${(d.normalized_term || '').replace(/"/g, '""')}"`, '""', '""', `"${d.status || 'present'}"`, `"${(d.source_sentence || '').replace(/"/g, '""')}"`]);
    });
  }

  // Family History
  if (!sections || sections.family_history) {
    (results.family_history || []).forEach((f) => {
      rows.push(['"Family History"', `"${(f.text || '').replace(/"/g, '""')}"`, `"${(f.normalized_term || '').replace(/"/g, '""')}"`, '""', '""', `"${f.status || 'family_history'}"`, `"${(f.source_sentence || '').replace(/"/g, '""')}"`]);
    });
  }

  // Medications
  if (!sections || sections.medications) {
    (results.medications || []).forEach((m) => {
      rows.push(['"Medication"', `"${(m.name || '').replace(/"/g, '""')}"`, '""', `"${(m.dosage || '').replace(/"/g, '""')}"`, `"${([m.frequency, m.route].filter(Boolean).join(' ') || '').replace(/"/g, '""')}"`, `"${m.status || 'active'}"`, `"${(m.source_sentence || '').replace(/"/g, '""')}"`]);
    });
  }

  // Labs
  if (!sections || sections.lab_results) {
    (results.lab_results || []).forEach((l) => {
      rows.push(['"Lab Result"', `"${(l.test_name || '').replace(/"/g, '""')}"`, `"${(l.normalized_test || '').replace(/"/g, '""')}"`, `"${(l.value || '').replace(/"/g, '""')}"`, `"${(l.unit || '').replace(/"/g, '""')}"`, `"${l.flag || 'NORMAL'}"`, `"${(l.source_sentence || '').replace(/"/g, '""')}"`]);
    });
  }

  // Vitals
  if (!sections || sections.vital_signs) {
    (results.vital_signs || []).forEach((v) => {
      rows.push(['"Vital Sign"', `"${(v.name || '').replace(/"/g, '""')}"`, '""', `"${(v.value || '').replace(/"/g, '""')}"`, `"${(v.unit || '').replace(/"/g, '""')}"`, '""', `"${(v.source_sentence || '').replace(/"/g, '""')}"`]);
    });
  }

  // Allergies
  if (!sections || sections.allergies) {
    (results.allergies || []).forEach((a) => {
      rows.push(['"Allergy"', `"${(a.allergen || '').replace(/"/g, '""')}"`, `"${a.is_nkda ? 'NKDA' : ''}"`, `"${(a.reaction || '').replace(/"/g, '""')}"`, '""', `"${a.is_nkda ? 'NKDA' : 'Active'}"`, `"${(a.source_sentence || '').replace(/"/g, '""')}"`]);
    });
  }

  // Timeline
  if (sections && sections.timeline && results.timeline) {
    (results.timeline || []).forEach((t) => {
      rows.push(['"Timeline Event"', `"${(t.entity_text || '').replace(/"/g, '""')}"`, `"${(t.event_date || '').replace(/"/g, '""')}"`, '""', '""', `"${t.category || ''}"`, `"${(t.source_sentence || '').replace(/"/g, '""')}"`]);
    });
  }

  const csvContent = rows.map((r) => r.join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadPDF(results, filename = `mediextract-report-${Date.now()}.pdf`, reviewer = null) {
  if (!results) return;

  try {
    const response = await fetch('/api/export/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ results, reviewer }),
    });

    if (!response.ok) {
      throw new Error(`PDF generation endpoint returned status ${response.status}`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.warn('Backend PDF endpoint error, falling back to window.print():', err);
    window.print();
    return false;
  }
}

export function generateSummaryText(results, sections = null, reviewer = null) {
  if (!results) return 'No clinical extraction results available.';

  const s = sections || {
    summary: true,
    warnings: true,
    symptoms: true,
    diagnoses: true,
    family_history: true,
    medications: true,
    lab_results: true,
    vital_signs: true,
    allergies: true,
    timeline: true,
  };

  const lines = [
    '===========================================================',
    'MEDICLINICAL EXTRACTION SUMMARY REPORT',
    `Generated: ${new Date().toLocaleString()}`,
    'Engine: MediExtract AI (Deterministic Local Clinical NLP)',
    'Notice: Automated rule-based extraction for demonstration purposes. Not a medical diagnosis. Not for clinical use.',
    '===========================================================',
    '',
  ];

  if (s.summary) {
    lines.push(
      `Source Type: ${results.metadata?.source_type || 'Clinical Document'}`,
      `Processing Time: ${results.metadata?.processing_time_ms || 0} ms`,
      `Total Symptoms Detected: ${results.counts?.symptoms || 0}`,
      `Total Conditions Identified: ${results.counts?.diagnoses || 0}`,
      `Family Medical History: ${results.counts?.family_history || 0}`,
      `Medications Extracted: ${results.counts?.medications || 0}`,
      `Laboratory Results: ${results.counts?.lab_results || 0}`,
      `Vital Signs: ${results.counts?.vital_signs || 0}`,
      `Allergies / NKDA: ${results.counts?.allergies || 0}`,
      ''
    );
  }

  // Allergies
  if (s.allergies) {
    lines.push('--- ALLERGIES ---');
    if (results.allergies?.length) {
      results.allergies.forEach((a) => {
        lines.push(a.is_nkda ? '• NKDA (No Known Drug Allergies)' : `• ${a.allergen}${a.reaction ? ` (Reaction: ${a.reaction})` : ''}`);
      });
    } else {
      lines.push('• None detected');
    }
    lines.push('');
  }

  // Vital Signs
  if (s.vital_signs) {
    lines.push('--- VITAL SIGNS ---');
    if (results.vital_signs?.length) {
      results.vital_signs.forEach((v) => {
        lines.push(`• ${v.name}: ${v.value} ${v.unit}`.trim());
      });
    } else {
      lines.push('• None detected');
    }
    lines.push('');
  }

  // Symptoms
  if (s.symptoms) {
    lines.push('--- SYMPTOMS ---');
    if (results.symptoms?.length) {
      results.symptoms.forEach((sym) => {
        lines.push(`• [${(sym.status || 'present').toUpperCase()}] ${sym.text}${sym.normalized_term && sym.normalized_term !== sym.text.toLowerCase() ? ` -> ${sym.normalized_term}` : ''}`);
      });
    } else {
      lines.push('• None detected');
    }
    lines.push('');
  }

  // Diagnoses
  if (s.diagnoses) {
    lines.push('--- CONDITIONS & DIAGNOSES ---');
    if (results.diagnoses?.length) {
      results.diagnoses.forEach((d) => {
        lines.push(`• [${(d.status || 'present').toUpperCase()}] ${d.text}${d.normalized_term && d.normalized_term !== d.text.toLowerCase() ? ` -> ${d.normalized_term}` : ''}`);
      });
    } else {
      lines.push('• None detected');
    }
    lines.push('');
  }

  // Family History
  if (s.family_history) {
    lines.push('--- FAMILY MEDICAL HISTORY ---');
    if (results.family_history?.length) {
      results.family_history.forEach((f) => {
        lines.push(`• ${f.text}${f.normalized_term && f.normalized_term !== f.text.toLowerCase() ? ` -> ${f.normalized_term}` : ''}`);
      });
    } else {
      lines.push('• None detected');
    }
    lines.push('');
  }

  // Medications
  if (s.medications) {
    lines.push('--- MEDICATIONS ---');
    if (results.medications?.length) {
      results.medications.forEach((m) => {
        lines.push(`• ${m.name} ${m.dosage || ''} ${m.frequency || ''} ${m.route || ''} [${m.status || 'active'}]`.replace(/\s+/g, ' ').trim());
      });
    } else {
      lines.push('• None detected');
    }
    lines.push('');
  }

  // Labs
  if (s.lab_results) {
    lines.push('--- LABORATORY RESULTS ---');
    if (results.lab_results?.length) {
      results.lab_results.forEach((l) => {
        lines.push(`• ${l.normalized_test}: ${l.value} ${l.unit || ''} [Flag: ${l.flag || 'NORMAL'}]`.trim());
      });
    } else {
      lines.push('• None detected');
    }
    lines.push('');
  }

  // Timeline
  if (s.timeline && results.timeline?.length) {
    lines.push('--- DATED CLINICAL TIMELINE ---');
    results.timeline.forEach((t) => {
      lines.push(`• [${t.event_date}] ${t.entity_text} (${t.category}) — "${t.source_sentence}"`);
    });
    lines.push('');
  }

  // Reviewer sign-off
  if (reviewer && (reviewer.name || reviewer.notes)) {
    lines.push('--- CLINICIAN REVIEW & SIGN-OFF ---');
    if (reviewer.name) lines.push(`Reviewer: ${reviewer.name}`);
    if (reviewer.department) lines.push(`Department: ${reviewer.department}`);
    if (reviewer.date) lines.push(`Date: ${reviewer.date}`);
    if (reviewer.notes) lines.push(`Clinical Notes: ${reviewer.notes}`);
    lines.push('');
  }

  return lines.join('\n');
}
