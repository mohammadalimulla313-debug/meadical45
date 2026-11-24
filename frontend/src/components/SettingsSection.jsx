import React from 'react';
import {
  Settings,
  Moon,
  Sun,
  Monitor,
  Zap,
  Sliders,
  Trash2,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

export default function SettingsSection({
  theme,
  setTheme,
  reducedMotion,
  setReducedMotion,
  density,
  setDensity,
  onClearSession,
}) {
  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      {/* Header */}
      <div className="card p-6">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          Dashboard & Privacy Settings
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure your local visual preferences, animation fidelity, and current session state.
        </p>

        {/* 1. Theme Configuration */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
            Interface Theme
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button
              onClick={() => setTheme('light')}
              className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                theme === 'light'
                  ? 'border-blue-500 bg-blue-50/70 text-blue-700 shadow-sm font-semibold'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-500" />
              <div className="text-left text-xs">
                <span className="block">Light Theme</span>
                <span className="text-[10px] text-slate-400">Crisp medical slate</span>
              </div>
            </button>

            <button
              onClick={() => setTheme('dark')}
              className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                theme === 'dark'
                  ? 'border-blue-500 bg-blue-950/60 text-blue-300 shadow-sm font-semibold'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Moon className="w-4 h-4 text-blue-400" />
              <div className="text-left text-xs">
                <span className="block">Dark Theme</span>
                <span className="text-[10px] text-slate-400">High contrast dark</span>
              </div>
            </button>
          </div>
        </div>

        {/* 2. Motion & Animations */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
            Animation & Accessibility
          </label>
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <Zap className="w-4 h-4 text-indigo-500" />
              <div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                  Reduced Motion Mode
                </span>
                <span className="text-[11px] text-slate-400">
                  Minimizes transitions, hover lifts, and keyframe animations.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(e) => setReducedMotion(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 3. Session Security & Privacy Assurance */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
            Privacy & In-Memory Isolation
          </label>
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 text-xs flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Zero Persistent Patient Data Storage</p>
              <p className="mt-1 opacity-90 leading-relaxed text-[11px]">
                MediExtract AI operates on an in-memory session model. Extracted clinical entities and patient documents are never saved to browser localStorage, indexedDB, cookies, or external telemetric servers. Closing the tab or refreshing clears all patient data automatically.
              </p>
            </div>
          </div>
        </div>

        {/* 4. Session Controls */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
              Clear Current Session
            </span>
            <span className="text-[11px] text-slate-400">
              Resets all active extractions, queued documents, and session metrics.
            </span>
          </div>
          <button
            onClick={onClearSession}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Session</span>
          </button>
        </div>
      </div>
    </div>
  );
}
