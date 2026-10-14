import React, { useState, useEffect } from 'react';
import { useAttendance } from '../context/AttendanceContext.jsx';

export default function DashboardPage() {
  const { student, todayAttendance, setActiveTab } = useAttendance();
  const [currentTime, setCurrentTime] = useState('');
  const [currentDateFormatted, setCurrentDateFormatted] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}:${seconds}`);

      const dateStr = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      setCurrentDateFormatted(dateStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isCheckedIn = !!todayAttendance;

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-4 pb-24 pt-3 gap-4">
      {/* Greeting & Live Time Card */}
      <div className="relative overflow-hidden rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80">
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-100/60 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-start justify-between relative z-10">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-[#0b1c30]">Halo, {student.nama.split(' ')[0]}!</span>
              <span className="text-xl animate-bounce">👋</span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {student.kelasShort} • NISN {student.nisn}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-lg font-bold text-[#0050cb] tracking-tight tabular-nums">
              {currentTime || '07:00:00'}
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              {currentDateFormatted || 'Senin, 21 Okt 2024'}
            </span>
          </div>
        </div>

        {/* Attendance Status Card / Reminder */}
        <div className="mt-3.5 rounded-xl bg-[#eff4ff] p-3.5 flex flex-col gap-2.5 border border-blue-100/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-2.5 w-2.5 rounded-full ${
                  isCheckedIn ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                }`}
              ></span>
              <span className="text-xs font-bold text-[#0b1c30]">Status Hari Ini</span>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                isCheckedIn
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {isCheckedIn ? 'Sudah Presensi' : 'Belum Presensi'}
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {isCheckedIn ? (
              <>
                Presensi masuk tercatat pukul{' '}
                <strong className="text-emerald-700 font-bold">{todayAttendance.waktu}</strong>. Selamat belajar dan beraktivitas!
              </>
            ) : (
              <>
                Batas waktu presensi masuk gerbang sekolah pukul{' '}
                <strong className="text-[#0b1c30]">07:15 WIB</strong>. Jangan terlambat!
              </>
            )}
          </p>

          <button
            onClick={() => setActiveTab('presensi')}
            className={`flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-[0.98] ${
              isCheckedIn
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-[#0050cb] hover:bg-[#003fa4] text-white'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">
              {isCheckedIn ? 'check_circle' : 'qr_code_scanner'}
            </span>
            <span>{isCheckedIn ? 'Lihat Bukti Presensi' : 'Lakukan Presensi Sekarang'}</span>
          </button>
        </div>
      </div>

      {/* Quick Action Two-Column Touch Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div
          onClick={() => setActiveTab('presensi')}
          className="flex flex-col justify-between p-4 rounded-2xl bg-[#0050cb] text-white active:scale-95 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
          role="button"
          tabIndex={0}
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <span className="material-symbols-outlined text-[24px] text-white">photo_camera</span>
          </div>
          <div className="mt-4 flex flex-col">
            <span className="font-bold text-sm text-white">Scan & Selfie</span>
            <span className="text-xs text-white/80">Validasi Wajah</span>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('izin')}
          className="flex flex-col justify-between p-4 rounded-2xl bg-white text-[#0b1c30] border border-slate-200/80 active:scale-95 transition-all shadow-sm cursor-pointer hover:border-blue-200"
          role="button"
          tabIndex={0}
        >
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">note_alt</span>
          </div>
          <div className="mt-4 flex flex-col">
            <span className="font-bold text-sm text-[#0b1c30]">Ajukan Izin</span>
            <span className="text-xs text-slate-500">Surat / Dokter</span>
          </div>
        </div>
      </div>

      {/* Attendance Metrics / Summary Stats */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#0b1c30]">Rekap Kehadiran Bulan Ini</h2>
          <button
            onClick={() => setActiveTab('riwayat')}
            className="text-xs font-semibold text-[#0050cb] hover:underline"
            type="button"
          >
            Detail
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {/* Hadir */}
          <div className="flex flex-col items-center justify-center py-3 px-1 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-1">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
            </span>
            <span className="text-base font-bold text-[#0b1c30] leading-tight">
              {student.stats.hadir}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Hadir</span>
          </div>

          {/* Sakit */}
          <div className="flex flex-col items-center justify-center py-3 px-1 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-1">
              <span className="material-symbols-outlined text-[18px]">medical_services</span>
            </span>
            <span className="text-base font-bold text-[#0b1c30] leading-tight">
              {student.stats.sakit}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Sakit</span>
          </div>

          {/* Izin */}
          <div className="flex flex-col items-center justify-center py-3 px-1 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <span className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mb-1">
              <span className="material-symbols-outlined text-[18px]">outgoing_mail</span>
            </span>
            <span className="text-base font-bold text-[#0b1c30] leading-tight">
              {student.stats.izin}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Izin</span>
          </div>

          {/* Alpha */}
          <div className="flex flex-col items-center justify-center py-3 px-1 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <span className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-1">
              <span className="material-symbols-outlined text-[18px]">cancel</span>
            </span>
            <span className="text-base font-bold text-[#0b1c30] leading-tight">
              {student.stats.alpha}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Alpha</span>
          </div>
        </div>
      </div>

      {/* Class Schedule Preview */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#0b1c30]">Jadwal Kelas Hari Ini</h2>
          <button
            onClick={() => setActiveTab('jadwal')}
            className="text-xs font-semibold text-slate-500 hover:text-primary flex items-center gap-0.5"
            type="button"
          >
            <span>Senin</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {/* Class 1 */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex flex-col items-center justify-center min-w-[56px] py-1 px-1.5 rounded-xl bg-slate-100 text-[#0b1c30]">
              <span className="text-xs font-bold leading-tight">07:30</span>
              <span className="text-[10px] text-slate-500 leading-tight">09:30</span>
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-bold text-sm text-[#0b1c30] truncate">Pemrograman Web</span>
              <span className="text-xs text-slate-500 truncate">Pak Budi Santoso • Lab RPL 1</span>
            </div>
            <span className="material-symbols-outlined text-[#0050cb] text-[20px]">terminal</span>
          </div>

          {/* Class 2 */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex flex-col items-center justify-center min-w-[56px] py-1 px-1.5 rounded-xl bg-slate-100 text-[#0b1c30]">
              <span className="text-xs font-bold leading-tight">10:00</span>
              <span className="text-[10px] text-slate-500 leading-tight">11:30</span>
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-bold text-sm text-[#0b1c30] truncate">Basis Data Relasional</span>
              <span className="text-xs text-slate-500 truncate">Bu Siti Aminah • Lab RPL 2</span>
            </div>
            <span className="material-symbols-outlined text-purple-600 text-[20px]">database</span>
          </div>
        </div>
      </div>

      {/* Announcement Card */}
      <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#eff4ff] border border-blue-100 text-[#0b1c30]">
        <div className="w-8 h-8 rounded-full bg-[#0050cb]/10 flex items-center justify-center text-[#0050cb] shrink-0 mt-0.5">
          <span className="material-symbols-outlined text-[20px]">campaign</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-[#0050cb] uppercase tracking-wide">
            Pengumuman Sekolah
          </span>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
            Ujian Praktik Kejuruan dimulai pekan depan. Pastikan presensi kehadiran minimal 90% untuk verifikasi kartu peserta.
          </p>
        </div>
      </div>

      {/* Visual Delight: Student Community Activity */}
      <div className="rounded-2xl overflow-hidden shadow-xs bg-white border border-slate-200/80">
        <img
          className="w-full h-36 object-cover"
          alt="Siswa RPL Berkolaborasi"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGO9n8JvXoEG11u3m9yYNo7Qdi5SXDPkMjbt138bQs0sCDzhgAdwA7bFMhca52ubzAmnqX1GeWLAdvkozBbiu4Ja4w3kofw_cwyRmcgcMl1XeDk2QovYiZYCnQr4rHa1y068pfUvxbg_A1uISJjCoukkssPZ_gEuzMRheXbQPL_6anvjs6GpB2C7W24krpfO-N61RdttbNFkW_rHJ-iVnj6vhG956XPWV7HrsdRedzG15LGXMhV2znpw"
        />
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-bold text-xs text-[#0b1c30]">Pekan Kolaborasi Kreatif RPL</span>
            <span className="text-[11px] text-slate-500">Kumpulkan mini-project kamu di Nexus Hub</span>
          </div>
          <button
            onClick={() => setActiveTab('jadwal')}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-[#0050cb] active:scale-95 transition-all"
            type="button"
            aria-label="Buka agenda"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
