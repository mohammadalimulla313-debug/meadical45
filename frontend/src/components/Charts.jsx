import React, { useState } from 'react';

/**
 * MediExtract AI — Interactive Clinical Visualizations Engine
 * Native, responsive SVG and CSS charts calculated exclusively from actual extracted backend data.
 * Zero external heavy graphing libraries, zero fabricated data, smooth hover tooltips.
 */

// ═══════════════════════════════════════════════════════════
// Helper: SVG Donut Chart Component
// ═══════════════════════════════════════════════════════════
export function SvgDonutChart({ data = [], size = 160, strokeWidth = 24, centerLabel = '', centerValue = '' }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-36 text-xs text-slate-400 italic">
        No data available for chart.
      </div>
    );
  }

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100 dark:text-slate-800"
          />
          {data.map((item, idx) => {
            const percent = item.value / total;
            const strokeDashoffset = circumference - percent * circumference;
            const rotation = accumulatedPercent * 360;
            accumulatedPercent += percent;

            return (
              <circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={hoveredIdx === idx ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{
                  transformOrigin: 'center',
                  transform: `rotate(${rotation}deg)`,
                  transition: 'all 0.3s ease-out',
                }}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {hoveredIdx !== null ? data[hoveredIdx].value : centerValue || total}
          </span>
          <span className="text-[10px] text-slate-400 font-medium max-w-[80px] truncate">
            {hoveredIdx !== null ? data[hoveredIdx].label : centerLabel || 'Total'}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-1.5 text-xs min-w-[140px]">
        {data.map((item, idx) => {
          const pct = ((item.value / total) * 100).toFixed(0);
          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`flex items-center justify-between p-1.5 rounded-lg transition-colors cursor-pointer ${
                hoveredIdx === idx ? 'bg-slate-100 dark:bg-slate-800 font-semibold' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-700 dark:text-slate-300 truncate max-w-[100px]">{item.label}</span>
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-100">{item.value} ({pct}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 1. Category Distribution Bar Chart
// ═══════════════════════════════════════════════════════════
export function CategoryDistributionChart({ counts }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const categories = [
    { label: 'Symptoms', key: 'symptoms', color: '#2563eb', bg: 'bg-blue-600', icon: '🩺' },
    { label: 'Conditions', key: 'diagnoses', color: '#9333ea', bg: 'bg-purple-600', icon: '📋' },
    { label: 'Family Hx', key: 'family_history', color: '#4f46e5', bg: 'bg-indigo-600', icon: '👨‍👩‍👧' },
    { label: 'Medications', key: 'medications', color: '#16a34a', bg: 'bg-green-600', icon: '💊' },
    { label: 'Lab Results', key: 'lab_results', color: '#ea580c', bg: 'bg-orange-600', icon: '🧪' },
    { label: 'Vital Signs', key: 'vital_signs', color: '#0891b2', bg: 'bg-cyan-600', icon: '📊' },
    { label: 'Allergies', key: 'allergies', color: '#dc2626', bg: 'bg-red-600', icon: '⚠️' },
  ];

  const data = categories.map((cat) => ({
    ...cat,
    count: counts?.[cat.key] ?? 0,
  }));

  const total = data.reduce((sum, d) => sum + d.count, 0);
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  if (total === 0) {
    return <div className="py-8 text-center text-sm text-slate-400 italic">No entities detected yet for distribution analysis.</div>;
  }

  return (
    <div className="space-y-3">
      {data.map((item, idx) => {
        const percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) : 0;
        const barWidth = Math.max((item.count / maxCount) * 100, item.count > 0 ? 4 : 0);
        const isHovered = hoveredIdx === idx;

        return (
          <div
            key={item.key}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              isHovered ? 'bg-slate-100 dark:bg-slate-800 shadow-sm' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{item.count}</span>
                <span className="text-slate-400 text-[10px]">({percentage}%)</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full ${item.bg} rounded-full transition-all duration-500 ease-out`}
                style={{
                  width: `${barWidth}%`,
                  opacity: hoveredIdx !== null && !isHovered ? 0.4 : 1,
                  transform: isHovered ? 'scaleY(1.3)' : 'scaleY(1)',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 2. Symptom Polarity Donut Chart
// ═══════════════════════════════════════════════════════════
export function SymptomPolarityChart({ symptoms = [] }) {
  const present = symptoms.filter((s) => s.status === 'present').length;
  const absent = symptoms.filter((s) => s.status === 'absent').length;
  const uncertain = symptoms.filter((s) => s.status === 'uncertain').length;
  const historical = symptoms.filter((s) => s.status === 'historical').length;

  const chartData = [
    { label: 'Present', value: present, color: '#10b981' },
    { label: 'Absent (Negated)', value: absent, color: '#f43f5e' },
    { label: 'Uncertain / RO', value: uncertain, color: '#f59e0b' },
    { label: 'Historical', value: historical, color: '#0ea5e9' },
  ].filter((d) => d.value > 0);

  return <SvgDonutChart data={chartData} centerLabel="Symptoms" centerValue={symptoms.length} />;
}

// ═══════════════════════════════════════════════════════════
// 3. Condition Classification Donut Chart
// ═══════════════════════════════════════════════════════════
export function ConditionStatusChart({ diagnoses = [] }) {
  const active = diagnoses.filter((d) => d.status === 'present').length;
  const historical = diagnoses.filter((d) => d.status === 'historical').length;
  const uncertain = diagnoses.filter((d) => d.status === 'uncertain').length;

  const chartData = [
    { label: 'Active', value: active, color: '#10b981' },
    { label: 'Historical', value: historical, color: '#38bdf8' },
    { label: 'Differential', value: uncertain, color: '#f59e0b' },
  ].filter((d) => d.value > 0);

  return <SvgDonutChart data={chartData} centerLabel="Conditions" centerValue={diagnoses.length} />;
}

// ═══════════════════════════════════════════════════════════
// 4. Lab Results Abnormalities Flag Chart
// ═══════════════════════════════════════════════════════════
export function LabFlagsChart({ labResults = [] }) {
  const normal = labResults.filter((l) => !l.flag || l.flag === 'NORMAL').length;
  const high = labResults.filter((l) => l.flag === 'HIGH').length;
  const low = labResults.filter((l) => l.flag === 'LOW').length;
  const critical = labResults.filter((l) => l.flag === 'CRITICAL').length;
  const total = labResults.length;

  if (total === 0) {
    return <div className="py-6 text-center text-xs text-slate-400 italic">No laboratory values extracted.</div>;
  }

  const flags = [
    { label: 'Normal', count: normal, color: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300' },
    { label: 'High', count: high, color: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-300' },
    { label: 'Low', count: low, color: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300' },
    { label: 'Critical', count: critical, color: 'bg-red-700', text: 'text-red-900 dark:text-red-200' },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {flags.map((f, idx) => (
          <div
            key={idx}
            className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900 text-center"
          >
            <div className={`text-xs font-semibold ${f.text}`}>{f.label}</div>
            <div className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">{f.count}</div>
            <div className="text-[10px] text-slate-400">{((f.count / total) * 100).toFixed(0)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 5. Medication Frequency Bar Chart
// ═══════════════════════════════════════════════════════════
export function MedicationFrequencyChart({ medications = [] }) {
  const freqMap = {};
  medications.forEach((m) => {
    const f = (m.frequency || 'Unspecified').toLowerCase();
    freqMap[f] = (freqMap[f] || 0) + 1;
  });

  const entries = Object.entries(freqMap).sort((a, b) => b[1] - a[1]);

  if (!entries.length) {
    return <div className="py-6 text-center text-xs text-slate-400 italic">No medications documented.</div>;
  }

  const maxVal = Math.max(...entries.map((e) => e[1]), 1);

  return (
    <div className="space-y-2">
      {entries.map(([freq, count], i) => (
        <div key={i} className="text-xs">
          <div className="flex justify-between mb-1">
            <span className="font-medium capitalize text-slate-700 dark:text-slate-300">{freq}</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{count}</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(count / maxVal) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 6. Medication Route Donut Chart
// ═══════════════════════════════════════════════════════════
export function MedicationRouteChart({ medications = [] }) {
  const routeMap = {};
  medications.forEach((m) => {
    const r = (m.route || 'Oral / Standard').toUpperCase();
    routeMap[r] = (routeMap[r] || 0) + 1;
  });

  const colors = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
  const chartData = Object.entries(routeMap).map(([route, count], i) => ({
    label: route,
    value: count,
    color: colors[i % colors.length],
  }));

  return <SvgDonutChart data={chartData} centerLabel="Routes" centerValue={medications.length} />;
}

// ═══════════════════════════════════════════════════════════
// 7. Blood Pressure & Heart Rate Analysis
// ═══════════════════════════════════════════════════════════
export function BloodPressureComparisonChart({ vitals = [] }) {
  const bp = vitals.find((v) => v.name.toLowerCase().includes('blood pressure'));
  const hr = vitals.find((v) => v.name.toLowerCase().includes('heart rate'));

  if (!bp && !hr) {
    return <div className="py-6 text-center text-xs text-slate-400 italic">No cardiovascular vitals extracted.</div>;
  }

  let sys = null;
  let dia = null;
  if (bp && bp.value.includes('/')) {
    const [s, d] = bp.value.split('/');
    sys = parseInt(s, 10);
    dia = parseInt(d, 10);
  }

  const heartRate = hr ? parseInt(hr.value, 10) : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-center">
        {sys && (
          <div className="p-3 bg-blue-50/50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Systolic BP</span>
            <span className="text-xl font-bold text-blue-700 dark:text-blue-300 font-mono">{sys} mmHg</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Reference: &lt;120 mmHg</span>
          </div>
        )}
        {dia && (
          <div className="p-3 bg-cyan-50/50 dark:bg-cyan-950/40 rounded-xl border border-cyan-200 dark:border-cyan-900">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Diastolic BP</span>
            <span className="text-xl font-bold text-cyan-700 dark:text-cyan-300 font-mono">{dia} mmHg</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Reference: &lt;80 mmHg</span>
          </div>
        )}
      </div>

      {heartRate && (
        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Resting Heart Rate</span>
          <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{heartRate} bpm</span>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 8. Family History Relationship Breakdown
// ═══════════════════════════════════════════════════════════
export function FamilyHistoryDistributionChart({ familyHistory = [] }) {
  if (!familyHistory.length) {
    return <div className="py-6 text-center text-xs text-slate-400 italic">No family history documented.</div>;
  }

  const relMap = { Father: 0, Mother: 0, Sibling: 0, Grandparent: 0, 'General Family': 0 };

  familyHistory.forEach((f) => {
    const s = (f.source_sentence || f.text).toLowerCase();
    if (s.includes('father') || s.includes('paternal') || s.includes('dad')) relMap.Father += 1;
    else if (s.includes('mother') || s.includes('maternal') || s.includes('mom')) relMap.Mother += 1;
    else if (s.includes('brother') || s.includes('sister') || s.includes('sibling')) relMap.Sibling += 1;
    else if (s.includes('grandmother') || s.includes('grandfather') || s.includes('grandparent')) relMap.Grandparent += 1;
    else relMap['General Family'] += 1;
  });

  const chartData = Object.entries(relMap)
    .filter(([_, count]) => count > 0)
    .map(([rel, count]) => ({
      label: rel,
      value: count,
      color: rel === 'Father' ? '#3b82f6' : rel === 'Mother' ? '#ec4899' : '#8b5cf6',
    }));

  return <SvgDonutChart data={chartData} centerLabel="Records" centerValue={familyHistory.length} />;
}
