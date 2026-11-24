import React, { useState } from 'react';
import { Calendar, Clock, FileText, ChevronRight, ShieldAlert, Sparkles, Filter } from 'lucide-react';

export default function TimelineSection({ results }) {
  const [filterType, setFilterType] = useState('all'); // 'all' | 'document_date' | 'medical_event'

  const timelineEvents = results?.timeline || [];

  const filteredEvents = timelineEvents.filter((ev) => {
    if (filterType === 'all') return true;
    return ev.event_type === filterType;
  });

  return (
    <div className="space-y-6 max-w-5xl animate-fade-in">
      {/* Timeline Header Card */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Chronological Medical Timeline
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Events and encounter dates explicitly detected within the processed clinical record. Zero invented dates.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-xs font-semibold text-blue-700 dark:text-blue-300">
              {timelineEvents.length} Dated Events
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <button
            onClick={() => setFilterType('all')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterType === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All Dates ({timelineEvents.length})
          </button>
          <button
            onClick={() => setFilterType('document_date')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterType === 'document_date'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Document Dates ({timelineEvents.filter((e) => e.event_type === 'document_date').length})
          </button>
          <button
            onClick={() => setFilterType('medical_event')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterType === 'medical_event'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Clinical Findings ({timelineEvents.filter((e) => e.event_type === 'medical_event').length})
          </button>
        </div>
      </div>

      {/* Timeline Visualizer */}
      <div className="card p-6">
        {filteredEvents.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm italic">No explicit dates detected in the active clinical document.</p>
            <p className="text-xs text-slate-400 mt-1">
              Dates must be explicitly stated in the text (e.g. "03/15/2024", "January 2023", "status post CABG in 2021").
            </p>
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-blue-200 dark:before:bg-blue-900/60">
            {filteredEvents.map((ev, idx) => {
              const isDocDate = ev.event_type === 'document_date';

              return (
                <div key={idx} className="relative group">
                  {/* Timeline Dot */}
                  <div
                    className={`absolute -left-6 sm:-left-8 top-1.5 w-5 h-5 rounded-full border-4 border-white dark:border-slate-900 transition-transform group-hover:scale-125 shadow-sm ${
                      isDocDate ? 'bg-cyan-500' : 'bg-blue-600'
                    }`}
                  />

                  {/* Event Card */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 transition-all shadow-xs space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {ev.date_str}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            isDocDate
                              ? 'bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300'
                              : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300'
                          }`}
                        >
                          {isDocDate ? 'Document Date' : 'Medical Event / Finding'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {ev.rule_id || 'RULE-TIMELINE-DATE-01'}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {ev.description}
                    </p>

                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 italic">
                      <span className="font-medium text-slate-400 not-italic mr-1">Source sentence:</span>
                      "{ev.source_sentence}"
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
