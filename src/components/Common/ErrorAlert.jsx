import React from 'react';

export default function ErrorAlert({ message, onDismiss, title = 'Terjadi Kesalahan' }) {
  if (!message) return null;

  return (
    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 text-xs animate-in fade-in">
      <span className="material-symbols-outlined text-[20px] text-rose-600 shrink-0 mt-0.5">
        error
      </span>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-rose-900 leading-tight">{title}</h4>
        <p className="mt-0.5 leading-relaxed text-rose-700">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-rose-400 hover:text-rose-700 p-0.5 rounded-full"
          type="button"
          aria-label="Tutup pesan"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      )}
    </div>
  );
}
