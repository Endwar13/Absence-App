import React from 'react';
import { useAttendance } from '../../context/AttendanceContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import NexusLogo from '../Common/NexusLogo.jsx';

export default function Sidebar({ isOpen, onClose }) {
  const { activeTab, setActiveTab, student } = useAttendance();
  const { logout } = useAuth();

  const navLinks = [
    { id: 'beranda', label: 'Beranda', icon: 'dashboard', desc: 'Ringkasan & status harian' },
    { id: 'presensi', label: 'Presensi', icon: 'qr_code_scanner', desc: 'Scan QR & verifikasi selfie' },
    { id: 'jadwal', label: 'Jadwal Pelajaran', icon: 'calendar_month', desc: 'Jadwal sesi & guru mapel' },
    { id: 'izin', label: 'Layanan Izin', icon: 'assignment_turned_in', desc: 'Pengajuan dispensasi & sakit' },
    { id: 'riwayat', label: 'Riwayat Kehadiran', icon: 'history', desc: 'Rekap presensi bulanan' },
    { id: 'profil', label: 'Profil Saya', icon: 'person', desc: 'Data siswa & keamanan akun' }
  ];

  const handleSelect = (tabId) => {
    setActiveTab(tabId);
    if (onClose) onClose();
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200/80 shadow-2xl flex flex-col justify-between transition-transform duration-300 md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Top Header */}
      <div>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <NexusLogo size="md" />
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0066ff]">
                Nexus Connect
              </span>
              <span className="text-xs font-bold text-[#0b1c30]">Portal Siswa SMK</span>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
        </div>

        {/* Student Mini Card */}
        <div className="p-3 mx-3 my-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
          <img
            src={student.avatarUrl}
            alt={student.nama}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-[#0066ff]/20"
          />
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-xs text-[#0b1c30] truncate">{student.nama}</span>
            <span className="text-[11px] text-slate-500 font-medium truncate">
              {student.kelasShort}
            </span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="p-3 space-y-1">
          {navLinks.map((link) => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleSelect(link.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                  isActive
                    ? 'bg-[#0050cb] text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-[#0050cb]'
                }`}
                type="button"
              >
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {link.icon}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold leading-tight">{link.label}</span>
                  <span
                    className={`text-[10px] truncate leading-tight ${
                      isActive ? 'text-white/80' : 'text-slate-400'
                    }`}
                  >
                    {link.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Logout */}
      <div className="p-3 border-t border-slate-100">
        <button
          onClick={() => {
            if (window.confirm('Keluar dari akun Nexus Connect?')) {
              logout();
            }
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-colors"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span>Keluar Akun</span>
        </button>
      </div>
    </aside>
  );
}
