import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  RefreshCw,
  RotateCcw,
  Download,
  Copy,
  Printer,
  ChevronDown,
  Search,
  FileSpreadsheet,
  X,
  FileCheck,
} from 'lucide-react';

export default function Header({
  currentSection,
  apiStatus,
  onRefreshHealth,
  onResetExtraction,
  hasResults,
  onCopySummary,
  onCopyJSON,
  onDownloadJSON,
  onExportCSV,
  onDownloadPDF,
  onPrintReport,
  setMobileOpen,
  globalSearch = '',
  setGlobalSearch = () => {},
}) {
  const [exportOpen, setExportOpen] = useState(false);
  const dropdownRef = useRef(null);

  const sectionTitles = {
    overview: 'Clinical Dashboard',
    documents: 'Document Center',
    extraction: 'Medical Extraction',
    symptoms: 'Symptoms Analysis',
    conditions: 'Conditions Analysis',
    medications: 'Medication Analytics',
    labs: 'Laboratory Analytics',
    vitals: 'Vital Signs',
    allergies: 'Allergies & Reactions',
    family_history: 'Family Medical History',
    timeline: 'Medical Timeline',
    comparison: 'Document Comparison',
    analytics: 'Analytics Center',
    reports: 'Report Generator',
    settings: 'Settings & Privacy',
  };

  const statusConfig = {
    healthy: {
      color: 'bg-emerald-500',
      ring: 'ring-emerald-200 dark:ring-emerald-900',
      badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      label: 'API Connected',
      pulse: false,
    },
    offline: {
      color: 'bg-rose-500',
      ring: 'ring-rose-200 dark:ring-rose-900',
      badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      label: 'API Offline',
      pulse: false,
    },
    checking: {
      color: 'bg-amber-500',
      ring: 'ring-amber-200 dark:ring-amber-900',
      badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      label: 'Checking API...',
      pulse: true,
    },
  };

  const status = statusConfig[apiStatus] || statusConfig.checking;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="no-print h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 transition-colors gap-4">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg flex-shrink-0"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 min-w-0">
          <span className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors hidden sm:inline">Platform</span>
          <span className="mx-2 text-slate-300 dark:text-slate-600 hidden sm:inline">/</span>
          <span className="text-slate-900 dark:text-slate-100 font-semibold truncate">
            {sectionTitles[currentSection] || 'Clinical Intelligence'}
          </span>
        </nav>
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search symptoms, conditions, meds, labs, vitals..."
            className="w-full pl-9 pr-8 py-1.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
          {globalSearch && (
            <button
              onClick={() => setGlobalSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Backend Status Pill */}
        <div
          onClick={onRefreshHealth}
          className={`cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium transition-all hover:scale-102 ${status.badge}`}
          title="Click to check backend health status"
        >
          <span className="relative flex h-2 w-2">
            {status.pulse && (
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${status.color} opacity-75`} />
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${status.color}`} />
          </span>
          <span className="hidden sm:inline font-semibold">{status.label}</span>
          <RefreshCw className="w-3 h-3 opacity-60 hover:opacity-100" />
        </div>

        {/* Export Menu Dropdown */}
        {hasResults && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/70 dark:text-blue-300 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {exportOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-scale-in text-xs font-medium">
                <button
                  onClick={() => { onCopySummary(); setExportOpen(false); }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>Copy Clinical Summary</span>
                </button>
                <button
                  onClick={() => { onCopyJSON(); setExportOpen(false); }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>Copy JSON Payload</span>
                </button>
                <button
                  onClick={() => { onDownloadJSON(); setExportOpen(false); }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <Download className="w-4 h-4 text-slate-400" />
                  <span>Download JSON File</span>
                </button>
                <button
                  onClick={() => { onExportCSV(); setExportOpen(false); }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-slate-400" />
                  <span>Download CSV Table</span>
                </button>
                <button
                  onClick={() => { onDownloadPDF && onDownloadPDF(); setExportOpen(false); }}
                  className="w-full text-left px-3.5 py-2 hover:bg-teal-50 dark:hover:bg-teal-950/40 flex items-center gap-2 text-teal-700 dark:text-teal-400 font-medium transition-colors"
                >
                  <Download className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>Download PDF Report</span>
                </button>
                <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                <button
                  onClick={() => { onPrintReport(); setExportOpen(false); }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <Printer className="w-4 h-4 text-slate-400" />
                  <span>Print Clinical Report</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Reset Results Button */}
        {hasResults && (
          <button
            onClick={onResetExtraction}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Reset Active Extraction"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
