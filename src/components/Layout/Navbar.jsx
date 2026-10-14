import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext.jsx';
import NotificationModal from '../Common/NotificationModal.jsx';
import NexusLogo from '../Common/NexusLogo.jsx';

export default function Navbar({ onOpenSidebar }) {
  const { activeTab, setActiveTab, student, unreadCount } = useAttendance();
  const [showNotifications, setShowNotifications] = useState(false);

  const getPageTitle = () => {
    switch (activeTab) {
      case 'beranda':
        return 'Beranda';
      case 'presensi':
        return 'Presensi';
      case 'jadwal':
        return 'Jadwal';
      case 'izin':
        return 'Izin';
      case 'riwayat':
        return 'Riwayat';
      case 'profil':
        return 'Profil';
      default:
        return 'Nexus Connect';
    }
  };

  return (
    <>
      <header className="fixed top-0 w-full z-40 pt-safe bg-[#f8f9ff]/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-slate-200/60">
        <div className="max-w-md mx-auto h-16 px-4 flex items-center justify-between">
          {/* Logo & Page Title */}
          <div className="flex items-center gap-2">
            {onOpenSidebar && (
              <button
                type="button"
                onClick={onOpenSidebar}
                className="w-9 h-9 rounded-xl text-slate-600 hover:text-[#0066ff] hover:bg-slate-100 flex items-center justify-center transition-colors md:hidden"
                aria-label="Menu navigasi"
              >
                <span className="material-symbols-outlined text-[22px]">menu</span>
              </button>
            )}
            <div
              className="flex items-center gap-2.5 cursor-pointer select-none group"
              onClick={() => setActiveTab('beranda')}
            >
              <NexusLogo size="md" className="group-hover:scale-105 transition-transform" />
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0066ff] leading-tight">
                  Nexus Connect
                </span>
                <h1 className="text-lg font-bold text-[#0b1c30] leading-tight">
                  {getPageTitle()}
                </h1>
              </div>
            </div>
          </div>

          {/* Right Actions: Notifications & Avatar */}
          <div className="flex items-center gap-1.5">
            <button
              aria-label="Notifikasi"
              onClick={() => setShowNotifications(true)}
              className="relative w-10 h-10 flex items-center justify-center rounded-full text-slate-500 hover:text-primary hover:bg-slate-100 transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined text-[24px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('profil')}
              aria-label="Profil Siswa"
              className="w-10 h-10 flex items-center justify-center transition-transform active:scale-95"
              type="button"
            >
              <img
                alt={student.nama}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/25 shadow-xs"
                src={student.avatarUrl}
              />
            </button>
          </div>
        </div>
      </header>

      <NotificationModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
}
