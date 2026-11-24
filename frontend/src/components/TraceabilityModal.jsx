import React from 'react';
import { ShieldCheck, X, FileText, CheckCircle2, Tag, BookOpen, Layers } from 'lucide-react';

export default function TraceabilityModal({ isOpen, onClose, entity }) {
  if (!isOpen || !entity) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-in space-y-5">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Extraction Traceability
              </h3>
              <p className="text-xs text-slate-400">Deterministic rule-based provenance verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Traceability Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Matched Text Span</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
              "{entity.text || entity.name || entity.test_name || entity.allergen}"
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Normalized Concept</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {entity.normalized_term || entity.normalized_test || entity.name || entity.allergen}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Assertion Status</span>
            <span className="font-semibold uppercase text-emerald-600 dark:text-emerald-400">
              {entity.status || (entity.is_nkda ? 'NKDA' : 'AFFIRMED')}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Trigger / Context</span>
            <span className="font-semibold text-purple-600 dark:text-purple-400 font-mono">
              {entity.trigger_word || 'Clause Direct Match'}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 col-span-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Rule Identifier</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono text-[11px]">
              {entity.rule_id || 'RULE-DETERMINISTIC-LONGEST-MATCH-01'}
            </span>
          </div>
        </div>

        {/* Source Sentence Box */}
        <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-blue-900 dark:text-blue-200 mb-1">
            <FileText className="w-3.5 h-3.5" />
            <span>Preserved Source Sentence</span>
          </div>
          <p className="italic text-slate-700 dark:text-slate-300 leading-relaxed">
            "{entity.source_sentence || 'Sentence span not available'}"
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Close Traceability Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
