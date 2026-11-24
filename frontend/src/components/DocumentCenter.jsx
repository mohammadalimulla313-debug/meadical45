import React, { useRef, useState, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileCheck,
  Eye,
  Search,
  X,
  AlertTriangle,
  Image as ImageIcon,
  FileSpreadsheet,
  File,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  Filter,
  Check,
} from 'lucide-react';
import { extractFromFile, extractFromImage } from '../utils/api';
import MedicalImageViewerModal from './MedicalImageViewerModal';

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];
const DOC_EXTS = ['.pdf', '.docx', '.txt'];
const ALL_ALLOWED_EXTS = [...DOC_EXTS, ...IMAGE_EXTS];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export default function DocumentCenter({
  onExtractionSuccess,
  onToast,
}) {
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const [activeCategory, setActiveCategory] = useState('all'); // 'all' | 'pdf' | 'docx' | 'txt' | 'image'
  const [dragOver, setDragOver] = useState(false);
  const [fileQueue, setFileQueue] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [docSearch, setDocSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'image' | 'document'

  // Image Viewer Modal State
  const [selectedImageItem, setSelectedImageItem] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Text Document Preview Modal State
  const [previewDocItem, setPreviewDocItem] = useState(null);
  const [previewDocContent, setPreviewDocContent] = useState('');

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const isImageFile = (filename) => {
    const ext = '.' + filename.split('.').pop().toLowerCase();
    return IMAGE_EXTS.includes(ext);
  };

  const validateFile = (file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALL_ALLOWED_EXTS.includes(ext)) {
      return `Unsupported format '${ext}'. Allowed: PDF, DOCX, TXT, JPG, JPEG, PNG, WEBP.`;
    }
    if (file.size === 0) {
      return `File '${file.name}' is empty (0 bytes).`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File '${file.name}' (${(file.size / 1048576).toFixed(1)} MB) exceeds 10 MB limit.`;
    }
    return null;
  };

  const addFilesToQueue = (newFiles) => {
    const validItems = [];
    for (const f of newFiles) {
      const err = validateFile(f);
      if (err) {
        onToast && onToast({ type: 'error', message: err });
      } else {
        if (!fileQueue.some((q) => q.file.name === f.name && q.file.size === f.size)) {
          const ext = '.' + f.name.split('.').pop().toLowerCase();
          const isImg = IMAGE_EXTS.includes(ext);
          validItems.push({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            file: f,
            name: f.name,
            size: f.size,
            ext: ext,
            isImage: isImg,
            status: 'queued', // 'queued' | 'processing' | 'completed' | 'failed'
            errorMessage: null,
            result: null,
            thumbnailUrl: isImg ? URL.createObjectURL(f) : null,
          });
        }
      }
    }

    if (validItems.length > 0) {
      setFileQueue((prev) => [...prev, ...validItems]);
      onToast && onToast({
        type: 'success',
        message: `Added ${validItems.length} file(s) to extraction queue.`,
      });
    }
  };

  // Clean up thumbnail URLs when component unmounts or queue items removed
  useEffect(() => {
    return () => {
      fileQueue.forEach((item) => {
        if (item.thumbnailUrl) URL.revokeObjectURL(item.thumbnailUrl);
      });
    };
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) {
      addFilesToQueue(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files?.length) {
      addFilesToQueue(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const removeFile = (id) => {
    const item = fileQueue.find((q) => q.id === id);
    if (item?.thumbnailUrl) URL.revokeObjectURL(item.thumbnailUrl);
    setFileQueue((prev) => prev.filter((it) => it.id !== id));
  };

  const clearQueue = () => {
    fileQueue.forEach((item) => {
      if (item.thumbnailUrl) URL.revokeObjectURL(item.thumbnailUrl);
    });
    setFileQueue([]);
    setPreviewDocItem(null);
    setSelectedImageItem(null);
  };

  // Process a single item
  const processItem = async (item, index) => {
    setCurrentIndex(index);
    setFileQueue((prev) =>
      prev.map((q, idx) => (idx === index ? { ...q, status: 'processing', errorMessage: null } : q))
    );

    try {
      let res;
      if (item.isImage) {
        res = await extractFromImage(item.file);
      } else {
        res = await extractFromFile(item.file);
      }

      setFileQueue((prev) =>
        prev.map((q, idx) => (idx === index ? { ...q, status: 'completed', result: res } : q))
      );

      onExtractionSuccess && onExtractionSuccess(res, item.name);
      return true;
    } catch (err) {
      const msg = err.detail || err.message || 'Extraction failed.';
      setFileQueue((prev) =>
        prev.map((q, idx) => (idx === index ? { ...q, status: 'failed', errorMessage: msg } : q))
      );
      return false;
    }
  };

  // Process batch
  const processBatch = async () => {
    const queuedItems = fileQueue.filter((item) => item.status === 'queued' || item.status === 'failed');
    if (!queuedItems.length) return;

    setIsProcessing(true);

    for (let i = 0; i < fileQueue.length; i++) {
      const item = fileQueue[i];
      if (item.status === 'completed') continue;
      await processItem(item, i);
    }

    setIsProcessing(false);
    setCurrentIndex(-1);
    onToast && onToast({
      type: 'success',
      message: 'Batch processing completed.',
    });
  };

  // Inspect item (either Image Viewer or Doc Preview)
  const handleInspect = (item) => {
    if (item.isImage) {
      const imageItems = fileQueue.filter((q) => q.isImage);
      const imgIdx = imageItems.findIndex((q) => q.id === item.id);
      setSelectedImageIndex(imgIdx >= 0 ? imgIdx : 0);
      setSelectedImageItem(item);
    } else {
      setPreviewDocItem(item);
      if (item.ext === '.txt') {
        const reader = new FileReader();
        reader.onload = (e) => setPreviewDocContent(e.target.result);
        reader.readAsText(item.file);
      } else if (item.result) {
        const entityCount = Object.values(item.result.counts || {}).reduce((a, b) => a + b, 0);
        setPreviewDocContent(
          `Document: ${item.name}\n` +
          `Format: ${item.ext.toUpperCase()}\n` +
          `File Size: ${formatSize(item.size)}\n` +
          `Extracted Concepts: ${entityCount}\n` +
          `Processing Latency: ${item.result.metadata?.processing_time_ms || 0} ms\n` +
          `Recognized Sentences: ${item.result.metadata?.sentence_count || 0}\n\n` +
          `Extracted Findings Overview:\n` +
          `• Symptoms: ${item.result.counts?.symptoms || 0}\n` +
          `• Conditions: ${item.result.counts?.diagnoses || 0}\n` +
          `• Medications: ${item.result.counts?.medications || 0}\n` +
          `• Lab Results: ${item.result.counts?.lab_results || 0}\n` +
          `• Vital Signs: ${item.result.counts?.vital_signs || 0}\n` +
          `• Allergies: ${item.result.counts?.allergies || 0}`
        );
      } else {
        setPreviewDocContent(
          `Document preview: ${item.name} (${item.ext.toUpperCase()}).\nClick 'Extract All Queued' to run clinical natural language parsing.`
        );
      }
    }
  };

  // Filtered queue
  const filteredQueue = fileQueue.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(docSearch.toLowerCase());
    if (!matchesSearch) return false;
    if (filterType === 'image') return item.isImage;
    if (filterType === 'document') return !item.isImage;
    return true;
  });

  const imageQueueItems = fileQueue.filter((q) => q.isImage);

  // Four Category Cards metadata
  const categories = [
    {
      id: 'pdf',
      title: 'PDF Documents',
      exts: '.pdf',
      desc: 'Clinical discharge summaries, lab reports, referrals',
      icon: FileText,
      color: 'from-blue-500 to-indigo-600',
      accept: '.pdf',
    },
    {
      id: 'docx',
      title: 'Word Documents',
      exts: '.docx',
      desc: 'Physician progress notes, EHR narrative transcripts',
      icon: FileSpreadsheet,
      color: 'from-sky-500 to-blue-600',
      accept: '.docx',
    },
    {
      id: 'txt',
      title: 'Text Documents',
      exts: '.txt',
      desc: 'Plain text clinical records, bedside nursing notes',
      icon: File,
      color: 'from-slate-600 to-slate-800',
      accept: '.txt',
    },
    {
      id: 'image',
      title: 'Medical Images',
      exts: 'JPG, JPEG, PNG, WEBP',
      desc: 'Scanned prescriptions, chart photos, lab capture with local OCR',
      icon: ImageIcon,
      color: 'from-teal-500 to-emerald-600',
      badge: 'Local OCR',
      accept: '.jpg,.jpeg,.png,.webp',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* 1. Header Overview Strip */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <UploadCloud className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <span>Document & Image Intelligence Center</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Universal multimodal intake: Process PDF, Word, Text, and Medical Document Images with 100% local OCR.
          </p>
        </div>

        {fileQueue.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={clearQueue}
              disabled={isProcessing}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              Clear Queue
            </button>
            <button
              onClick={processBatch}
              disabled={isProcessing || fileQueue.every((q) => q.status === 'completed')}
              className="text-xs px-4 py-1.5 rounded-lg font-semibold bg-teal-600 hover:bg-teal-700 active:scale-95 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing Queue...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Extract All ({fileQueue.filter((q) => q.status !== 'completed').length})</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 2. Four Category Cards Workspace (Phase 2 Requirement) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = activeCategory === cat.id;

          return (
            <div
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                if (fileInputRef.current) {
                  fileInputRef.current.accept = cat.accept;
                  fileInputRef.current.click();
                }
              }}
              className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer group relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/20 shadow-md ring-2 ring-teal-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-400 hover:shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} text-white flex items-center justify-center shadow-xs transition-transform group-hover:scale-105`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  {cat.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                      {cat.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  {cat.title}
                </h3>
                <p className="text-[11px] font-mono text-teal-600 dark:text-teal-400 font-semibold mt-0.5">
                  {cat.exts}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  {cat.desc}
                </p>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 group-hover:text-teal-600 dark:group-hover:text-teal-400">
                <span>Max 10 MB</span>
                <span className="flex items-center gap-1">
                  Upload <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Universal Drag & Drop Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (fileInputRef.current) {
            fileInputRef.current.accept = '.pdf,.docx,.txt,.jpg,.jpeg,.png,.webp';
            fileInputRef.current.click();
          }
        }}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 relative overflow-hidden ${
          dragOver
            ? 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/40 scale-[1.01] shadow-lg'
            : 'border-slate-300 dark:border-slate-700 hover:border-teal-400 bg-slate-50/60 dark:bg-slate-900/50 hover:bg-teal-50/20'
        }`}
      >
        <div className="max-w-md mx-auto space-y-3 pointer-events-none">
          <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto shadow-xs">
            <UploadCloud className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Drag and drop medical documents or images here
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              or <span className="text-teal-600 dark:text-teal-400 font-semibold underline underline-offset-2">browse files</span> from your computer
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">PDF</span>
            <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">DOCX</span>
            <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">TXT</span>
            <span className="px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-bold">
              JPG / PNG / WEBP (OCR)
            </span>
            <span>· Max 10 MB per file</span>
          </div>
        </div>

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* 4. Processing Queue Section */}
      {fileQueue.length > 0 && (
        <div className="card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Intake Queue ({fileQueue.length} files)
              </h3>
              {/* Type Filter Tabs */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    filterType === 'all'
                      ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  All ({fileQueue.length})
                </button>
                <button
                  onClick={() => setFilterType('image')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    filterType === 'image'
                      ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Images ({imageQueueItems.length})
                </button>
                <button
                  onClick={() => setFilterType('document')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    filterType === 'document'
                      ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Docs ({fileQueue.length - imageQueueItems.length})
                </button>
              </div>
            </div>

            {/* Queue Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                placeholder="Search queued files..."
                className="w-full pl-8 pr-3 py-1 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Queue List Cards */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredQueue.map((item, idx) => {
              const entityCount = item.result
                ? Object.values(item.result.counts || {}).reduce((a, b) => a + b, 0)
                : 0;

              return (
                <div
                  key={item.id}
                  className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 px-3 rounded-xl transition-colors group"
                >
                  {/* Left: Thumbnail / Icon + Name */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Thumbnail for image or format icon for docs */}
                    {item.isImage && item.thumbnailUrl ? (
                      <div
                        onClick={() => handleInspect(item)}
                        className="w-11 h-11 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex-shrink-0 cursor-pointer shadow-xs hover:border-teal-500 transition-colors bg-slate-100 relative group/thumb"
                      >
                        <img
                          src={item.thumbnailUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                          <Eye className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                        {item.ext.replace('.', '')}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {item.name}
                        </p>
                        {item.isImage && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800 uppercase">
                            OCR
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                        <span>{formatSize(item.size)}</span>
                        {item.result && (
                          <span className="text-teal-600 dark:text-teal-400 font-semibold font-sans">
                            · {entityCount} concepts extracted ({item.result.metadata?.processing_time_ms || 0} ms)
                          </span>
                        )}
                        {item.errorMessage && (
                          <span className="text-rose-600 font-semibold truncate max-w-sm font-sans">
                            · {item.errorMessage}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Status Pill & Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.status === 'queued' && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        Queued
                      </span>
                    )}

                    {item.status === 'processing' && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 flex items-center gap-1.5 animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>{item.isImage ? 'OCR Extracting...' : 'Parsing...'}</span>
                      </span>
                    )}

                    {item.status === 'completed' && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        <span>Extracted</span>
                      </span>
                    )}

                    {item.status === 'failed' && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-600" />
                        <span>Failed</span>
                      </span>
                    )}

                    {/* Retry button if failed */}
                    {item.status === 'failed' && (
                      <button
                        onClick={() => processItem(item, idx)}
                        disabled={isProcessing}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Retry Extraction"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}

                    {/* Inspect View button */}
                    <button
                      onClick={() => handleInspect(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title={item.isImage ? 'Inspect Image & OCR Findings' : 'Preview Document Text'}
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Remove file button */}
                    <button
                      onClick={() => removeFile(item.id)}
                      disabled={isProcessing && item.status === 'processing'}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
                      title="Remove from queue"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Medical Image Viewer Modal (Phase 3 & 6) */}
      {selectedImageItem && (
        <MedicalImageViewerModal
          item={selectedImageItem}
          items={imageQueueItems}
          currentIndex={selectedImageIndex}
          onSelectIndex={(newIdx) => {
            setSelectedImageIndex(newIdx);
            setSelectedImageItem(imageQueueItems[newIdx]);
          }}
          onClose={() => setSelectedImageItem(null)}
          onToast={onToast}
        />
      )}

      {/* 6. Document Text Preview Modal (for PDF/DOCX/TXT) */}
      {previewDocItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-in space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                  Preview: {previewDocItem.name}
                </h3>
              </div>
              <button
                onClick={() => setPreviewDocItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200">
              {previewDocContent || 'Loading document preview...'}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPreviewDocItem(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
