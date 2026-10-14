import React from 'react';
import { useAttendance } from '../../context/AttendanceContext.jsx';

export default function BottomNav() {
  const { activeTab, setActiveTab } = useAttendance();

  const navItems = [
    { id: 'beranda', label: 'Beranda', icon: 'dashboard' },
    { id: 'presensi', label: 'Presensi', icon: 'qr_code_scanner' },
    { id: 'jadwal', label: 'Jadwal', icon: 'calendar_month' },
    { id: 'izin', label: 'Izin', icon: 'assignment_turned_in' },
    { id: 'riwayat', label: 'Riwayat', icon: 'history' },
    { id: 'profil', label: 'Profil', icon: 'person' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 pb-safe bg-[#f8f9ff]/95 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-2px_12px_rgba(0,0,0,0.04)]">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[52px] min-h-[44px] transition-all rounded-lg active:scale-95 ${
                isActive
                  ? 'text-[#0050cb] font-semibold'
                  : 'text-slate-500 hover:text-[#0050cb]'
              }`}
              type="button"
            >
              <div className="relative">
                <span
                  className="material-symbols-outlined text-[23px] transition-transform"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {item.icon}
                </span>
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#0050cb]"></span>
                )}
              </div>
              <span className={`text-[10.5px] tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
