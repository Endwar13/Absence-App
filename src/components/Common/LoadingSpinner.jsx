import React from 'react';

export default function LoadingSpinner({ text = 'Memuat data...', size = 'md' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-7 h-7 border-3',
    lg: 'w-10 h-10 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 gap-2 text-slate-500">
      <div
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full border-blue-200 border-t-[#0050cb] animate-spin`}
      ></div>
      {text && <span className="text-xs font-medium tracking-wide">{text}</span>}
    </div>
  );
}
