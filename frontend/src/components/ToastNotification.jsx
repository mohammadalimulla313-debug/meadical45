import React, { useEffect } from 'react';
import { Check, AlertTriangle, X } from 'lucide-react';

export default function ToastNotification({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || 3500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isError = toast.type === 'error';
  const isWarning = toast.type === 'warning';

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-in max-w-sm">
      <div
        className={`flex items-start gap-3 p-3.5 rounded-xl shadow-xl border backdrop-blur-md transition-all ${
          isError
            ? 'bg-rose-50/95 border-rose-200 text-rose-900 dark:bg-rose-950/90 dark:border-rose-800 dark:text-rose-200'
            : isWarning
            ? 'bg-amber-50/95 border-amber-200 text-amber-900 dark:bg-amber-950/90 dark:border-amber-800 dark:text-amber-200'
            : 'bg-emerald-50/95 border-emerald-200 text-emerald-900 dark:bg-emerald-950/90 dark:border-emerald-800 dark:text-emerald-200'
        }`}
      >
        <div className="mt-0.5 flex-shrink-0">
          {isError || isWarning ? (
            <AlertTriangle className={`w-4 h-4 ${isError ? 'text-rose-600' : 'text-amber-600'}`} />
          ) : (
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          )}
        </div>
        <div className="flex-1 text-xs">
          <p className="font-semibold">{toast.title || (isError ? 'Action Failed' : 'Success')}</p>
          <p className="mt-0.5 opacity-90">{toast.message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
