import React, { useRef, useState } from 'react';

const ALLOWED_EXTS = ['.pdf', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export default function InputPanel({
  mode, setMode, text, setText, file, setFile,
  loading, onExtract, onClear, onPreset, presets,
}) {
  const fileRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState(null);

  const validateAndSetFile = (selected) => {
    setFileError(null);
    if (!selected) return;

    const ext = '.' + selected.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      setFileError(`Unsupported file format '${ext}'. Please select a .pdf, .docx, or .txt file.`);
      setFile(null);
      return;
    }

    if (selected.size === 0) {
      setFileError('The selected file is empty (0 bytes).');
      setFile(null);
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      const sizeMb = (selected.size / (1024 * 1024)).toFixed(1);
      setFileError(`File size (${sizeMb} MB) exceeds maximum 10 MB limit.`);
      setFile(null);
      return;
    }

    setFile(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
      setMode('file');
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      validateAndSetFile(selected);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="card">
      <div className="card-header">
        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Clinical Input</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Mode Switcher */}
        <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
          <button
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${
              mode === 'text'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            onClick={() => setMode('text')}
          >
            Clinical Note Text
          </button>
          <button
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${
              mode === 'file'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            onClick={() => setMode('file')}
          >
            Upload Document
          </button>
        </div>

        {/* Presets */}
        {mode === 'text' && (
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Quick Presets</p>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onPreset(p.text)}
                  className="text-xs px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800/80 transition-colors"
                  title={p.description}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Text Input */}
        {mode === 'text' && (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste or type a clinical note here...&#10;&#10;Example: Patient presents with chest pain, shortness of breath. BP 140/90 mmHg, HR 98 bpm. Labs show Troponin 0.12 ng/mL, WBC 14.2 K/uL. Denies nausea. Family history of CAD (father had MI)."
            className="w-full h-64 p-4 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-slate-50 dark:bg-slate-950/70 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
          />
        )}

        {/* File Upload */}
        {mode === 'file' && (
          <div className="space-y-2">
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                dragOver
                  ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40'
                  : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/40'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              {file ? (
                <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                    <svg className="w-5 h-5 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="text-left">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{file.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{formatSize(file.size)}</p>
                    </div>
                    <button
                      onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                      className="ml-2 text-slate-400 hover:text-red-500 transition-colors"
                      title="Remove file"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <svg className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                      Choose a file
                    </span>
                    {' '}or drag and drop
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">PDF, DOCX, TXT, or Medical Images (JPG, PNG, WEBP) — up to 10 MB</p>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
              />
            </div>

            {fileError && (
              <div className="p-2.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 rounded-lg text-xs text-red-600 dark:text-red-300 flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{fileError}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onExtract}
            disabled={loading || (mode === 'text' && text.trim().length < 5) || (mode === 'file' && !file)}
            className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Extracting Clinical Data...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Extract Clinical Data</span>
              </>
            )}
          </button>
          <button
            onClick={() => {
              setFileError(null);
              onClear();
              if (fileRef.current) fileRef.current.value = '';
            }}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
