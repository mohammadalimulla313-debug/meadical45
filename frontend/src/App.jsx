import React, { useState, useEffect, useCallback } from 'react';
import { checkHealth, extractFromText, extractFromFile, extractFromImage } from './utils/api';
import { PRESETS } from './utils/presets';
import {
  downloadJSON,
  downloadCSV,
  downloadPDF,
  generateSummaryText,
} from './utils/exportUtils';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import InputPanel from './components/InputPanel';
import OverviewSection from './components/OverviewSection';
import DocumentCenter from './components/DocumentCenter';
import ClinicalSection from './components/ClinicalSection';
import AnalyticsSection from './components/AnalyticsSection';
import TimelineSection from './components/TimelineSection';
import ComparisonSection from './components/ComparisonSection';
import ReportGeneratorSection from './components/ReportGeneratorSection';
import SettingsSection from './components/SettingsSection';
import ToastNotification from './components/ToastNotification';
import ConfirmationModal from './components/ConfirmationModal';
import PrintReportView from './components/PrintReportView';

export default function App() {
  // Theme & Preferences
  const [theme, setTheme] = useState('light');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [density, setDensity] = useState('comfortable');

  // Navigation (15 sections)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState('overview');

  // Global Search Bar
  const [globalSearch, setGlobalSearch] = useState('');

  // Backend Connection
  const [apiStatus, setApiStatus] = useState('checking'); // 'healthy' | 'offline' | 'checking'

  // Clinical Extraction State (Strictly in-memory)
  const [results, setResults] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);

  // Input State (Text & File)
  const [inputMode, setInputMode] = useState('text'); // 'text' | 'file'
  const [selectedFile, setSelectedFile] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputError, setInputError] = useState(null);

  // UI Feedback
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  // Apply Theme class to document root
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Health check polling
  const pollHealth = useCallback(async () => {
    try {
      const data = await checkHealth();
      setApiStatus(data && data.status === 'healthy' ? 'healthy' : 'offline');
    } catch {
      // Don't mark offline on a single transient glitch; retry once after 1.2s
      try {
        await new Promise((r) => setTimeout(r, 1200));
        const retryData = await checkHealth();
        setApiStatus(retryData && retryData.status === 'healthy' ? 'healthy' : 'offline');
      } catch {
        setApiStatus('offline');
      }
    }
  }, []);

  useEffect(() => {
    pollHealth();
    const interval = setInterval(pollHealth, 20000);
    return () => clearInterval(interval);
  }, [pollHealth]);

  const showToast = (toastObj) => {
    setToast(toastObj);
  };

  const handleManualHealthRefresh = async () => {
    setApiStatus('checking');
    try {
      const data = await checkHealth();
      setApiStatus(data.status === 'healthy' ? 'healthy' : 'offline');
      showToast({ type: 'success', message: 'Backend service is online and healthy.' });
    } catch {
      setApiStatus('offline');
      showToast({ type: 'error', message: 'Cannot reach backend service on port 8000.' });
    }
  };

  // Process extraction (text or file)
  const handleExtract = async () => {
    setInputError(null);

    if (inputMode === 'text') {
      if (!textInput.trim() || textInput.trim().length < 5) {
        setInputError('Please enter at least 5 characters of clinical text.');
        return;
      }

      setLoading(true);
      try {
        const data = await extractFromText(textInput);
        setResults(data);

        const entityCount = Object.values(data.counts || {}).reduce((a, b) => a + b, 0);
        setSessionHistory((prev) => [
          ...prev,
          {
            title: textInput.slice(0, 30) + '...',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            entityCount,
            results: data,
          },
        ]);

        showToast({
          type: 'success',
          message: `Extracted ${entityCount} clinical concepts from note.`,
        });

        if (currentSection === 'documents') {
          setCurrentSection('overview');
        }
      } catch (err) {
        const msg = err.detail || err.message || 'Text extraction failed.';
        setInputError(msg);
        showToast({ type: 'error', message: msg });
      } finally {
        setLoading(false);
      }
    } else {
      if (!selectedFile) {
        setInputError('Please select a valid document or image (.pdf, .docx, .txt, .jpg, .png, .webp).');
        return;
      }

      setLoading(true);
      try {
        const isImg = ['.jpg', '.jpeg', '.png', '.webp'].some((ext) =>
          selectedFile.name.toLowerCase().endsWith(ext)
        );
        const data = isImg ? await extractFromImage(selectedFile) : await extractFromFile(selectedFile);
        handleDocumentExtracted(data, selectedFile.name);
      } catch (err) {
        const msg = err.detail || err.message || 'Extraction failed.';
        setInputError(msg);
        showToast({ type: 'error', message: msg });
      } finally {
        setLoading(false);
      }
    }
  };

  // Called when a document completes extraction in DocumentCenter
  const handleDocumentExtracted = (data, filename) => {
    setResults(data);

    const entityCount = Object.values(data.counts || {}).reduce((a, b) => a + b, 0);
    setSessionHistory((prev) => [
      ...prev,
      {
        title: filename,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        entityCount,
        results: data,
      },
    ]);

    showToast({
      type: 'success',
      message: `Parsed '${filename}' (${entityCount} concepts extracted).`,
    });
  };

  // Reset Extraction Handler (with confirmation)
  const promptResetExtraction = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset Active Extraction?',
      message: 'This will clear the current extraction view. Any unsaved results will be removed from your active screen.',
      onConfirm: () => {
        setResults(null);
        setTextInput('');
        setSelectedFile(null);
        setInputError(null);
        setConfirmModal({ isOpen: false });
        showToast({ type: 'warning', message: 'Extraction view has been reset.' });
      },
    });
  };

  // Clear Session Handler (with confirmation)
  const promptClearSession = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Clear Entire Session?',
      message: 'This will reset all active extractions, queued documents, and session activity logs. No clinical data will be retained.',
      onConfirm: () => {
        setResults(null);
        setSessionHistory([]);
        setTextInput('');
        setSelectedFile(null);
        setInputError(null);
        setConfirmModal({ isOpen: false });
        showToast({ type: 'warning', message: 'Session data cleared.' });
      },
    });
  };

  // Export actions
  const handleCopySummary = () => {
    if (!results) return;
    const summary = generateSummaryText(results);
    navigator.clipboard.writeText(summary);
    showToast({ type: 'success', message: 'Clinical summary copied to clipboard.' });
  };

  const handleCopyJSON = () => {
    if (!results) return;
    navigator.clipboard.writeText(JSON.stringify(results, null, 2));
    showToast({ type: 'success', message: 'Raw JSON payload copied to clipboard.' });
  };

  const handleDownloadJSON = () => {
    if (!results) return;
    downloadJSON(results, `mediextract-results-${Date.now()}.json`);
    showToast({ type: 'success', message: 'JSON report downloaded.' });
  };

  const handleExportCSV = () => {
    if (!results) return;
    downloadCSV(results, `mediextract-report-${Date.now()}.csv`);
    showToast({ type: 'success', message: 'CSV data table downloaded.' });
  };

  const handleDownloadPDF = async () => {
    if (!results) return;
    showToast({ type: 'info', message: 'Generating vector clinical PDF report...' });
    const ok = await downloadPDF(results, `mediextract-report-${Date.now()}.pdf`);
    if (ok) {
      showToast({ type: 'success', message: 'Clinical PDF report downloaded.' });
    }
  };

  const handlePrintReport = () => {
    if (!results) return;
    window.print();
  };

  const entityCounts = {
    total: results?.counts ? Object.values(results.counts).reduce((a, b) => a + b, 0) : 0,
    symptoms: results?.counts?.symptoms || 0,
    diagnoses: results?.counts?.diagnoses || 0,
    medications: results?.counts?.medications || 0,
    lab_results: results?.counts?.lab_results || 0,
    vital_signs: results?.counts?.vital_signs || 0,
    allergies: results?.counts?.allergies || 0,
    family_history: results?.counts?.family_history || 0,
  };

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200 ${reducedMotion ? 'motion-reduce' : ''}`}>
      {/* Interactive App Shell (Hidden completely in @media print) */}
      <div className="app-interactive-shell flex-1 flex min-w-0">
        {/* 1. Collapsible Sidebar (15 sections) */}
        <Sidebar
          currentSection={currentSection}
          setCurrentSection={setCurrentSection}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          mobileOpen={mobileNavOpen}
          setMobileOpen={setMobileNavOpen}
          theme={theme}
          setTheme={setTheme}
          counts={entityCounts}
        />

        {/* 2. Main Content Canvas */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
            sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
          }`}
        >
        {/* Top Header */}
        <Header
          currentSection={currentSection}
          apiStatus={apiStatus}
          onRefreshHealth={handleManualHealthRefresh}
          onResetExtraction={promptResetExtraction}
          hasResults={Boolean(results)}
          onCopySummary={handleCopySummary}
          onCopyJSON={handleCopyJSON}
          onDownloadJSON={handleDownloadJSON}
          onExportCSV={handleExportCSV}
          onDownloadPDF={handleDownloadPDF}
          onPrintReport={handlePrintReport}
          setMobileOpen={setMobileNavOpen}
          globalSearch={globalSearch}
          setGlobalSearch={setGlobalSearch}
        />

        {/* Dynamic Section Router (All 15 Platform Sections) */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* 1. SECTION: DASHBOARD */}
          {currentSection === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-5">
                  <InputPanel
                    mode={inputMode}
                    setMode={setInputMode}
                    text={textInput}
                    setText={setTextInput}
                    file={selectedFile}
                    setFile={setSelectedFile}
                    loading={loading}
                    onExtract={handleExtract}
                    onClear={() => {
                      setTextInput('');
                      setSelectedFile(null);
                      setInputError(null);
                    }}
                    onPreset={(pText) => {
                      setInputMode('text');
                      setTextInput(pText);
                      setInputError(null);
                    }}
                    presets={PRESETS}
                  />
                  {inputError && (
                    <div className="mt-2 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-lg text-xs text-rose-700 dark:text-rose-300">
                      {inputError}
                    </div>
                  )}
                </div>

                <div className="lg:col-span-7">
                  <OverviewSection
                    results={results}
                    sessionHistory={sessionHistory}
                    onSelectSessionItem={(histResults) => setResults(histResults)}
                    onNavigateToSection={(sec) => setCurrentSection(sec)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. SECTION: DOCUMENT CENTER */}
          {currentSection === 'documents' && (
            <DocumentCenter
              onExtractionSuccess={handleDocumentExtracted}
              onToast={showToast}
            />
          )}

          {/* 3. SECTION: MEDICAL EXTRACTION (ALL CATEGORIES) */}
          {currentSection === 'extraction' && (
            <ClinicalSection
              results={results}
              onToast={showToast}
              initialCategory="all"
              globalSearch={globalSearch}
            />
          )}

          {/* 4. SECTION: SYMPTOMS ANALYSIS */}
          {currentSection === 'symptoms' && (
            <ClinicalSection
              results={results}
              onToast={showToast}
              initialCategory="symptoms"
              globalSearch={globalSearch}
            />
          )}

          {/* 5. SECTION: CONDITIONS ANALYSIS */}
          {currentSection === 'conditions' && (
            <ClinicalSection
              results={results}
              onToast={showToast}
              initialCategory="conditions"
              globalSearch={globalSearch}
            />
          )}

          {/* 6. SECTION: MEDICATION ANALYTICS */}
          {currentSection === 'medications' && (
            <ClinicalSection
              results={results}
              onToast={showToast}
              initialCategory="medications"
              globalSearch={globalSearch}
            />
          )}

          {/* 7. SECTION: LABORATORY ANALYTICS */}
          {currentSection === 'labs' && (
            <ClinicalSection
              results={results}
              onToast={showToast}
              initialCategory="labs"
              globalSearch={globalSearch}
            />
          )}

          {/* 8. SECTION: VITAL SIGNS */}
          {currentSection === 'vitals' && (
            <ClinicalSection
              results={results}
              onToast={showToast}
              initialCategory="vitals"
              globalSearch={globalSearch}
            />
          )}

          {/* 9. SECTION: ALLERGIES */}
          {currentSection === 'allergies' && (
            <ClinicalSection
              results={results}
              onToast={showToast}
              initialCategory="allergies"
              globalSearch={globalSearch}
            />
          )}

          {/* 10. SECTION: FAMILY HISTORY */}
          {currentSection === 'family_history' && (
            <ClinicalSection
              results={results}
              onToast={showToast}
              initialCategory="family_history"
              globalSearch={globalSearch}
            />
          )}

          {/* 11. SECTION: MEDICAL TIMELINE */}
          {currentSection === 'timeline' && (
            <TimelineSection results={results} />
          )}

          {/* 12. SECTION: DOCUMENT COMPARISON */}
          {currentSection === 'comparison' && (
            <ComparisonSection
              sessionHistory={sessionHistory}
              onSelectDocument={(docResults) => setResults(docResults)}
            />
          )}

          {/* 13. SECTION: ANALYTICS CENTER */}
          {currentSection === 'analytics' && (
            <AnalyticsSection results={results} />
          )}

          {/* 14. SECTION: REPORT GENERATOR */}
          {currentSection === 'reports' && (
            <ReportGeneratorSection
              results={results}
              sessionHistory={sessionHistory}
              onSelectDocument={(docResults) => setResults(docResults)}
              onExtractText={async (text) => {
                const data = await extractFromText(text);
                setResults(data);
                const entityCount = Object.values(data.counts || {}).reduce((a, b) => a + b, 0);
                setSessionHistory((prev) => [
                  ...prev,
                  {
                    title: text.slice(0, 30) + '...',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    entityCount,
                    results: data,
                  },
                ]);
                return data;
              }}
              onToast={showToast}
            />
          )}

          {/* 15. SECTION: SETTINGS */}
          {currentSection === 'settings' && (
            <SettingsSection
              theme={theme}
              setTheme={setTheme}
              reducedMotion={reducedMotion}
              setReducedMotion={setReducedMotion}
              density={density}
              setDensity={setDensity}
              onClearSession={promptClearSession}
            />
          )}
        </main>

        {/* Global Footer */}
        <footer className="no-print text-center py-4 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 mt-12 space-y-1">
          <p className="font-semibold text-amber-700 dark:text-amber-400">
            Disclaimer: Rule-based extraction for demonstration. Not for clinical use.
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-[11px]">
            MediExtract AI v1.0.0 · 100% Local Rule-Based Medical NLP Engine · Zero Cloud APIs
          </p>
        </footer>
      </div>
    </div>

    {/* Dedicated Isolated Print Container: ONLY rendered when window.print() is executed */}
    <div id="mediextract-print-container" className="hidden print:block">
      <PrintReportView results={results} />
    </div>

    {/* Toast Feedback */}
    <ToastNotification toast={toast} onClose={() => setToast(null)} />

    {/* Confirmation Modal */}
    <ConfirmationModal
      isOpen={confirmModal.isOpen}
      title={confirmModal.title}
      message={confirmModal.message}
      onConfirm={confirmModal.onConfirm}
      onCancel={() => setConfirmModal({ isOpen: false })}
    />
  </div>
  );
}
