import React from 'react';
import { useAttendance } from '../../context/AttendanceContext.jsx';

export default function Toast() {
  const { toast, hideToast } = useAttendance();

  if (!toast) return null;

  const isSuccess = toast.type === 'success' || !toast.type;
  const isError = toast.type === 'error';

  return (
    <div
      className="fixed top-20 left-4 right-4 z-50 transition-all duration-300 ease-out bg-white text-[#0b1c30] p-4 rounded-xl shadow-xl border border-slate-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 max-w-md mx-auto"
      role="alert"
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          isSuccess
            ? 'bg-emerald-500/15 text-emerald-600'
            : isError
            ? 'bg-rose-500/15 text-rose-600'
            : 'bg-blue-500/15 text-blue-600'
        }`}
      >
        <span className="material-symbols-outlined text-[24px]">
          {isSuccess ? 'task_alt' : isError ? 'error' : 'info'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-[#0b1c30]">{toast.title || 'Informasi'}</p>
        <p className="text-xs text-slate-500 truncate">{toast.message}</p>
      </div>
      <button
        className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        onClick={hideToast}
        type="button"
        aria-label="Tutup notifikasi"
      >
        <span className="material-symbols-outlined text-[20px]">close</span>
      </button>
    </div>
  );
}
