import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Maximize2,
  Minimize2,
  Download,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Copy,
  Check,
  FileText,
  Activity,
  Heart,
  Pill,
  FlaskConical,
  ShieldAlert,
  Users,
  Search,
  Sparkles,
  Info,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { downloadJSON } from '../utils/exportUtils';

export default function MedicalImageViewerModal({
  item,
  items = [],
  onClose,
  onSelectIndex,
  currentIndex = 0,
  onToast,
}) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('text');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const modalRef = useRef(null);

  // Create and manage object URL for the image file
  useEffect(() => {
    if (!item?.file) return;
    const url = URL.createObjectURL(item.file);
    setImageUrl(url);

    // Reset zoom and rotation when item changes
    setZoom(1);
    setRotation(0);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [item]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && items.length > 1 && currentIndex < items.length - 1) {
        onSelectIndex(currentIndex + 1);
      } else if (e.key === 'ArrowLeft' && items.length > 1 && currentIndex > 0) {
        onSelectIndex(currentIndex - 1);
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, items, onClose, onSelectIndex]);

  if (!item) return null;

  const result = item.result;
  const ocrText = result?.ocr_text || result?.metadata?.ocr_text || '';
  const imageMeta = result?.image_metadata || result?.metadata?.image_metadata || {};
  const ocrEngine = result?.metadata?.ocr_engine || imageMeta.ocr_engine || 'Local Windows OCR';
  const processingTime = result?.metadata?.processing_time_ms || imageMeta.ocr_processing_time_ms || 0;
  const warnings = result?.warnings || result?.metadata?.warnings || [];

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotateRight = () => setRotation((prev) => (prev + 90) % 360);
  const handleRotateLeft = () => setRotation((prev) => (prev - 90 + 360) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = item.name || 'medical-document-image.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onToast && onToast({ type: 'success', message: 'Original image downloaded.' });
  };

  const handleCopyText = () => {
    if (!ocrText) return;
    navigator.clipboard.writeText(ocrText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onToast && onToast({ type: 'success', message: 'Extracted OCR text copied to clipboard.' });
  };

  const handleExportJSON = () => {
    if (!result) return;
    downloadJSON(result, `ocr-extraction-${Date.now()}.json`);
    onToast && onToast({ type: 'success', message: 'JSON report downloaded.' });
  };

  const tabs = [
    { id: 'text', label: 'OCR Text', icon: FileText, count: ocrText ? ocrText.split('\n').length : 0 },
    { id: 'symptoms', label: 'Symptoms', icon: Activity, count: result?.counts?.symptoms || 0 },
    { id: 'diagnoses', label: 'Conditions', icon: Heart, count: result?.counts?.diagnoses || 0 },
    { id: 'medications', label: 'Medications', icon: Pill, count: result?.counts?.medications || 0 },
    { id: 'labs', label: 'Lab Tests', icon: FlaskConical, count: result?.counts?.lab_results || 0 },
    { id: 'vitals', label: 'Vital Signs', icon: Sparkles, count: result?.counts?.vital_signs || 0 },
    { id: 'allergies', label: 'Allergies', icon: ShieldAlert, count: result?.counts?.allergies || 0 },
    { id: 'family', label: 'Family Hx', icon: Users, count: result?.counts?.family_history || 0 },
    { id: 'details', label: 'Traceability', icon: Info, count: null },
  ];

  return (
    <div
      ref={modalRef}
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in ${
        isFullscreen ? 'p-0' : ''
      }`}
    >
      <div
        className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden transition-all duration-200 ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-7xl h-[92vh]'
        }`}
      >
        {/* Modal Top Header */}
        <div className="px-5 py-3.5 bg-slate-50/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
              {item.ext?.replace('.', '') || 'IMG'}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {item.name}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span>{(item.size / (1024 * 1024)).toFixed(2)} MB</span>
                {imageMeta.width && imageMeta.height && (
                  <span>· {imageMeta.width} × {imageMeta.height} px</span>
                )}
                <span className="inline-flex items-center gap-1 font-semibold text-teal-600 dark:text-teal-400">
                  · {ocrEngine}
                </span>
                {processingTime > 0 && (
                  <span className="text-slate-400">({processingTime} ms)</span>
                )}
              </p>
            </div>
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {result && (
              <button
                onClick={handleExportJSON}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
                title="Download JSON Report"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export JSON</span>
              </button>
            )}

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Close Viewer (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Thumbnail Navigation Bar (when multiple items) */}
        {items.length > 1 && (
          <div className="px-5 py-2 bg-slate-100/60 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 overflow-x-auto text-xs">
            <div className="flex items-center gap-2 text-slate-500 font-semibold text-[11px] shrink-0">
              <span>Image {currentIndex + 1} of {items.length}</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {items.map((it, idx) => (
                <button
                  key={it.id || idx}
                  onClick={() => onSelectIndex(idx)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium truncate max-w-[160px] transition-all flex items-center gap-1.5 ${
                    idx === currentIndex
                      ? 'bg-teal-600 text-white shadow-xs font-semibold'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-teal-400'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                  <span className="truncate">{it.name}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onSelectIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30"
                title="Previous Image (Left Arrow)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => onSelectIndex(Math.min(items.length - 1, currentIndex + 1))}
                disabled={currentIndex === items.length - 1}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30"
                title="Next Image (Right Arrow)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Two-Column Inspection Workspace */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
          {/* LEFT PANEL: Interactive Image Viewer (7 cols on lg) */}
          <div className="lg:col-span-6 xl:col-span-7 bg-slate-900/95 flex flex-col relative border-b lg:border-b-0 lg:border-r border-slate-800 overflow-hidden">
            {/* Viewer Toolbar */}
            <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-1 bg-slate-900/80 backdrop-blur-md p-1 rounded-xl border border-slate-700 shadow-lg pointer-events-auto">
                <button
                  onClick={handleZoomIn}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  title="Zoom In (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  title="Zoom Out (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-mono text-slate-300 px-1.5 select-none font-bold">
                  {Math.round(zoom * 100)}%
                </span>
                <div className="w-px h-4 bg-slate-700 mx-0.5" />
                <button
                  onClick={handleRotateLeft}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  title="Rotate Left (-90°)"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRotateRight}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  title="Rotate Right (+90°)"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-slate-700 mx-0.5" />
                <button
                  onClick={handleReset}
                  className="px-2 py-1 text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  title="Reset Zoom & Rotation"
                >
                  Fit
                </button>
              </div>

              <div className="pointer-events-auto">
                <button
                  onClick={handleDownload}
                  className="p-2 bg-slate-900/80 backdrop-blur-md text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl border border-slate-700 shadow-lg transition-colors"
                  title="Download Original Image"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Image Canvas with Zoom & Rotation */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-6 select-none bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
              {imageUrl ? (
                <div
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transition: 'transform 0.15s ease-out',
                  }}
                  className="max-w-full max-h-full flex items-center justify-center shadow-2xl rounded-lg overflow-hidden"
                >
                  <img
                    src={imageUrl}
                    alt={item.name}
                    className="max-h-[75vh] w-auto object-contain rounded-md"
                  />
                </div>
              ) : (
                <div className="text-center text-slate-500">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Loading image stream...</p>
                </div>
              )}
            </div>

            {/* Bottom Image Status Bar */}
            <div className="px-4 py-2 bg-slate-950/90 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Local Offline Processing</span>
              </span>
              <span>Aspect Ratio Preserved · 100% Client-Side Inspection</span>
            </div>
          </div>

          {/* RIGHT PANEL: Extracted Clinical Information (5 cols on lg) */}
          <div className="lg:col-span-6 xl:col-span-5 bg-white dark:bg-slate-900 flex flex-col min-h-0 overflow-hidden">
            {/* Tabs Header */}
            <div className="border-b border-slate-200 dark:border-slate-800 px-4 pt-3 flex items-center gap-1 overflow-x-auto bg-slate-50/50 dark:bg-slate-950/40">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
                      isActive
                        ? 'border-teal-600 text-teal-700 dark:text-teal-400 bg-white dark:bg-slate-900'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    {tab.count !== null && tab.count > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isActive
                            ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Warnings Banner if any */}
            {warnings.length > 0 && (
              <div className="p-3 mx-4 mt-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-1">
                {warnings.map((w, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Tab Content Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {/* TAB 1: OCR TEXT */}
              {activeTab === 'text' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Raw Recognized OCR Output
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Extracted via {ocrEngine} ({ocrText.length} characters)
                      </p>
                    </div>
                    <button
                      onClick={handleCopyText}
                      disabled={!ocrText}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800/80 transition-all flex items-center gap-1.5"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy Text'}</span>
                    </button>
                  </div>

                  {ocrText ? (
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono leading-relaxed whitespace-pre-wrap text-slate-800 dark:text-slate-200 select-text max-h-[55vh] overflow-y-auto">
                      {ocrText}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400 space-y-2">
                      <FileText className="w-8 h-8 mx-auto opacity-40 text-teal-600" />
                      <p className="text-xs">No text recognized from this image.</p>
                      <p className="text-[11px]">Check image resolution or contrast.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: SYMPTOMS */}
              {activeTab === 'symptoms' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Symptoms Found ({result?.symptoms?.length || 0})
                    </span>
                  </div>
                  {result?.symptoms?.length ? (
                    <div className="space-y-2">
                      {result.symptoms.map((s, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 capitalize">
                              {s.text}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                                s.status === 'present'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/70 dark:text-rose-300'
                              }`}
                            >
                              {s.status}
                            </span>
                          </div>
                          {s.normalized_term && s.normalized_term !== s.text.toLowerCase() && (
                            <p className="text-[11px] text-teal-600 dark:text-teal-400 font-mono">
                              Normalized: {s.normalized_term}
                            </p>
                          )}
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                            "{s.source_sentence}"
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-1 font-mono">
                            <span>Rule: {s.rule_id || 'RULE-AFFIRMATIVE-01'}</span>
                            {s.trigger_word && <span>· Trigger: '{s.trigger_word}'</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-6">No symptoms detected in OCR text.</p>
                  )}
                </div>
              )}

              {/* TAB 3: CONDITIONS / DIAGNOSES */}
              {activeTab === 'diagnoses' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Medical Conditions ({result?.diagnoses?.length || 0})
                    </span>
                  </div>
                  {result?.diagnoses?.length ? (
                    <div className="space-y-2">
                      {result.diagnoses.map((d, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 capitalize">
                              {d.text}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                                d.status === 'present'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/70 dark:text-purple-300'
                                  : d.status === 'historical'
                                  ? 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300'
                                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300'
                              }`}
                            >
                              {d.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                            "{d.source_sentence}"
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-1 font-mono">
                            <span>Rule: {d.rule_id || 'RULE-DIAGNOSIS-01'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-6">No diagnoses detected in OCR text.</p>
                  )}
                </div>
              )}

              {/* TAB 4: MEDICATIONS */}
              {activeTab === 'medications' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Pharmacotherapy ({result?.medications?.length || 0})
                    </span>
                  </div>
                  {result?.medications?.length ? (
                    <div className="space-y-2">
                      {result.medications.map((m, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 capitalize">
                              {m.name}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                                m.status === 'active'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                  : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                            >
                              {m.status || 'active'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 flex flex-wrap gap-2">
                            {m.dosage && <span>Dose: <strong>{m.dosage}</strong></span>}
                            {m.frequency && <span>Freq: <strong>{m.frequency}</strong></span>}
                            {m.route && <span>Route: <strong>{m.route}</strong></span>}
                          </div>
                          <p className="text-[11px] text-slate-500 italic mt-1">"{m.source_sentence}"</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-6">No medications detected in OCR text.</p>
                  )}
                </div>
              )}

              {/* TAB 5: LAB RESULTS */}
              {activeTab === 'labs' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Laboratory Tests ({result?.lab_results?.length || 0})
                    </span>
                  </div>
                  {result?.lab_results?.length ? (
                    <div className="space-y-2">
                      {result.lab_results.map((l, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {l.normalized_test}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                                l.flag === 'CRITICAL'
                                  ? 'bg-rose-200 text-rose-900 font-extrabold'
                                  : l.flag === 'HIGH'
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  : l.flag === 'LOW'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              }`}
                            >
                              {l.flag || 'NORMAL'}
                            </span>
                          </div>
                          <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                            {l.value} {l.unit || ''}
                          </p>
                          <p className="text-[11px] text-slate-500 italic">"{l.source_sentence}"</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-6">No lab tests detected in OCR text.</p>
                  )}
                </div>
              )}

              {/* TAB 6: VITAL SIGNS */}
              {activeTab === 'vitals' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Vital Signs ({result?.vital_signs?.length || 0})
                    </span>
                  </div>
                  {result?.vital_signs?.length ? (
                    <div className="grid grid-cols-2 gap-2">
                      {result.vital_signs.map((v, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60"
                        >
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            {v.name}
                          </span>
                          <span className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
                            {v.value} {v.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-6">No vital signs detected in OCR text.</p>
                  )}
                </div>
              )}

              {/* TAB 7: ALLERGIES */}
              {activeTab === 'allergies' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Allergies & NKDA ({result?.allergies?.length || 0})
                    </span>
                  </div>
                  {result?.allergies?.length ? (
                    <div className="space-y-2">
                      {result.allergies.map((a, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60"
                        >
                          {a.is_nkda ? (
                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                              NKDA (No Known Drug Allergies)
                            </span>
                          ) : (
                            <div>
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                {a.allergen}
                              </span>
                              {a.reaction && (
                                <span className="text-xs text-slate-600 dark:text-slate-400">
                                  {' '}— Reaction: {a.reaction}
                                </span>
                              )}
                            </div>
                          )}
                          <p className="text-[11px] text-slate-500 italic mt-1">"{a.source_sentence}"</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-6">No allergies detected in OCR text.</p>
                  )}
                </div>
              )}

              {/* TAB 8: FAMILY HISTORY */}
              {activeTab === 'family' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Family Medical History ({result?.family_history?.length || 0})
                    </span>
                  </div>
                  {result?.family_history?.length ? (
                    <div className="space-y-2">
                      {result.family_history.map((f, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60"
                        >
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {f.text}
                          </span>
                          <p className="text-[11px] text-slate-500 italic mt-1">"{f.source_sentence}"</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-6">No family medical history detected.</p>
                  )}
                </div>
              )}

              {/* TAB 9: TRACEABILITY & DETAILS */}
              {activeTab === 'details' && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <h5 className="font-bold text-slate-800 dark:text-slate-200">Extraction Traceability & Metrics</h5>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                      <div>File Name: <span className="font-bold text-slate-800 dark:text-slate-200">{item.name}</span></div>
                      <div>Image Format: <span className="font-bold text-slate-800 dark:text-slate-200">{imageMeta.format || item.ext}</span></div>
                      <div>File Size: <span className="font-bold text-slate-800 dark:text-slate-200">{(item.size / 1024).toFixed(1)} KB</span></div>
                      <div>Dimensions: <span className="font-bold text-slate-800 dark:text-slate-200">{imageMeta.width || '—'} × {imageMeta.height || '—'} px</span></div>
                      <div>OCR Engine: <span className="font-bold text-teal-600 dark:text-teal-400">{ocrEngine}</span></div>
                      <div>Processing Latency: <span className="font-bold text-slate-800 dark:text-slate-200">{processingTime} ms</span></div>
                      <div>Recognized Sentences: <span className="font-bold text-slate-800 dark:text-slate-200">{result?.metadata?.sentence_count || 0}</span></div>
                      <div>Total Extracted Entities: <span className="font-bold text-slate-800 dark:text-slate-200">{result?.counts ? Object.values(result.counts).reduce((a, b) => a + b, 0) : 0}</span></div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 text-[11px] text-teal-900 dark:text-teal-200">
                    <p className="font-semibold mb-1">Deterministic Architecture Guarantee:</p>
                    <p>
                      Text recognized via local offline OCR was parsed through the same pure Python rule-based NLP pipeline used for PDF, Word, and Text documents. Zero cloud APIs, zero external network calls, zero native DLL dependencies.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Panel Footer */}
            <div className="p-3 bg-slate-50/80 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                MediExtract AI · Local OCR & Clinical NLP
              </span>
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-xs active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
