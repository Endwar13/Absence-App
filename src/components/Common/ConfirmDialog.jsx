import React from 'react';

export default function ConfirmDialog({
  isOpen,
  title = 'Konfirmasi Tindakan',
  message = 'Apakah Anda yakin ingin melanjutkan?',
  confirmText = 'Lanjutkan',
  cancelText = 'Batal',
  isDestructive = false,
  onConfirm,
  onCancel
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-slate-100 space-y-4">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isDestructive ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-[#0050cb]'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">
              {isDestructive ? 'warning' : 'help'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm text-[#0b1c30] leading-tight">{title}</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 shadow-xs ${
              isDestructive ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#0050cb] hover:bg-[#003fa4]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
