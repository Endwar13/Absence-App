import React, { useEffect } from 'react';

export default function SuccessNotification({
  message,
  title = 'Berhasil!',
  onDismiss,
  duration = 3500
}) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      if (onDismiss) onDismiss();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, onDismiss, duration]);

  if (!message) return null;

  return (
    <div className="fixed top-20 left-4 right-4 z-50 max-w-sm mx-auto p-4 rounded-xl bg-white text-[#0b1c30] shadow-xl border border-emerald-200 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
      <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-[22px]">check_circle</span>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold text-emerald-900 leading-tight">{title}</h4>
        <p className="text-xs text-slate-600 truncate mt-0.5">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 rounded-full text-slate-400 hover:text-slate-600"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      )}
    </div>
  );
}
