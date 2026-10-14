import React, { useState } from 'react';
import { SCHEDULE_DATA } from '../utils/constants.js';
import { useAttendance } from '../context/AttendanceContext.jsx';

export default function SchedulePage() {
  const { showToast } = useAttendance();
  const [selectedDay, setSelectedDay] = useState('senin');
  const [isDownloading, setIsDownloading] = useState(false);

  const currentSchedule = SCHEDULE_DATA[selectedDay] || SCHEDULE_DATA.senin;

  const handleDownloadPDF = () => {
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      showToast({
        type: 'success',
        title: 'Jadwal Berhasil Diunduh!',
        message: 'File Jadwal_Pelajaran_XII_RPL_1_Ganjil.pdf telah disimpan.'
      });
    }, 1200);
  };

  const days = [
    { key: 'senin', label: 'Senin', badge: 'Hari Ini' },
    { key: 'selasa', label: 'Selasa', badge: '5 Sesi' },
    { key: 'rabu', label: 'Rabu', badge: '4 Sesi' },
    { key: 'kamis', label: 'Kamis', badge: '5 Sesi' },
    { key: 'jumat', label: 'Jumat', badge: '3 Sesi' },
    { key: 'sabtu', label: 'Sabtu', badge: 'Eskul' }
  ];

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-4 pb-24 pt-3 gap-4">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0050cb] via-[#0066ff] to-[#7715e4] p-5 text-white shadow-lg">
        <div className="relative z-10 flex flex-col gap-1">
          <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-white/20 px-3 py-1 backdrop-blur-md">
            <span className="material-symbols-outlined text-[16px] text-teal-200">school</span>
            <span className="text-[11px] font-bold text-white tracking-wide">Tahun Ajaran Aktif</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">Jadwal Pelajaran</h2>
          <p className="text-xs text-blue-100 opacity-95">Semester Ganjil 2024/2025 • Kelas XII RPL 1</p>
        </div>
        <div className="absolute -right-6 -bottom-8 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none"></div>
        <div className="absolute right-4 top-3 text-white/15 pointer-events-none">
          <span className="material-symbols-outlined text-[72px]">auto_stories</span>
        </div>
      </section>

      {/* Day Selector Tabs */}
      <section className="w-full">
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar snap-x">
          {days.map((day) => {
            const isSelected = selectedDay === day.key;
            return (
              <button
                key={day.key}
                onClick={() => setSelectedDay(day.key)}
                className={`snap-start shrink-0 flex flex-col items-center justify-center min-w-[76px] py-2 px-3 rounded-xl transition-all active:scale-95 border ${
                  isSelected
                    ? 'bg-[#0050cb] text-white shadow-sm border-[#0050cb]'
                    : 'bg-white text-[#0b1c30] border-slate-200/80 hover:bg-slate-50'
                }`}
                type="button"
              >
                <span className="text-xs font-bold">{day.label}</span>
                <span
                  className={`mt-0.5 inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    isSelected ? 'bg-white/25 text-white' : 'text-slate-500'
                  }`}
                >
                  {day.badge}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Active Session Card (If Monday / Active) */}
      {currentSchedule.activeSession && (
        <section className="rounded-2xl bg-white p-4 shadow-xs border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-bold text-[#0050cb] tracking-wider uppercase">
                Sedang Berlangsung
              </span>
            </div>
            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
              {currentSchedule.activeSession.sisaWaktu}
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#0b1c30]">
              {currentSchedule.activeSession.mapel}
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#0050cb]">schedule</span>
              {currentSchedule.activeSession.jam} • {currentSchedule.activeSession.ruangan}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <img
                className="w-6 h-6 rounded-full object-cover shadow-xs border border-slate-200"
                alt={currentSchedule.activeSession.guru}
                src={currentSchedule.activeSession.avatar}
              />
              <span className="text-xs font-bold text-[#0b1c30]">
                {currentSchedule.activeSession.guru}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center text-[11px] text-slate-500">
              <span>Sesi Dimulai (07:30)</span>
              <span className="text-[#0050cb] font-bold">
                {currentSchedule.activeSession.progressPercent}% Selesai
              </span>
              <span>Berakhir (09:30)</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#0050cb] h-full rounded-full transition-all duration-500"
                style={{ width: `${currentSchedule.activeSession.progressPercent}%` }}
              ></div>
            </div>
          </div>
        </section>
      )}

      {/* Rincian Kegiatan Hari Ini */}
      <div className="flex items-center justify-between pt-1 px-1">
        <h3 className="text-sm font-bold text-[#0b1c30]">
          Rincian Kegiatan {currentSchedule.label}
        </h3>
        <span className="text-xs text-[#0050cb] font-bold">
          {currentSchedule.items.length} Agenda
        </span>
      </div>

      {/* Agenda Timeline List */}
      <section className="space-y-2.5 pb-1">
        {currentSchedule.items.map((item) => {
          const isFinished = item.status === 'selesai';
          const isActive = item.status === 'aktif';
          const isBreak = item.type === 'break';

          if (isBreak) {
            return (
              <div
                key={item.id}
                className="rounded-2xl bg-[#eff4ff] p-3 border border-blue-100/70 shadow-2xs flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-amber-500 shadow-xs">
                    <span className="material-symbols-outlined text-[18px]">
                      {item.icon || 'local_cafe'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">{item.jam}</span>
                    <h4 className="text-xs font-bold text-[#0b1c30]">{item.mapel}</h4>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                  {item.statusLabel}
                </span>
              </div>
            );
          }

          if (isActive) {
            return (
              <div
                key={item.id}
                className="rounded-2xl bg-white p-4 shadow-sm border-2 border-[#0050cb] relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#0050cb]"></div>
                <div className="flex items-start justify-between gap-2 pl-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#0050cb] font-bold">{item.jam}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-[#0050cb]">
                        <span className="material-symbols-outlined text-[14px]">play_arrow</span> Aktif
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-[#0b1c30] mt-0.5">{item.mapel}</h4>
                  </div>
                  <span className="rounded-full bg-[#0050cb] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
                    {item.statusLabel}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 rounded-xl bg-slate-50 p-2.5 pl-3 ml-2 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#0050cb]">
                      desktop_windows
                    </span>
                    <span className="text-xs text-slate-700">
                      <strong className="font-bold text-[#0b1c30]">Ruang:</strong> {item.lokasi}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#0050cb]">badge</span>
                    <div className="text-xs text-slate-700 flex flex-col">
                      <span>
                        <strong className="font-bold text-[#0b1c30]">Guru:</strong> {item.pengajar}
                      </span>
                      {item.nip && (
                        <span className="text-[10px] text-slate-500 font-mono">NIP: {item.nip}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={item.id}
              className={`rounded-2xl bg-white p-3.5 shadow-xs border border-slate-200/80 transition-all ${
                isFinished ? 'opacity-85' : 'hover:border-blue-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex items-center justify-center w-7 h-7 rounded-full shrink-0 ${
                      isFinished
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isFinished ? 'check_circle' : 'schedule'}
                    </span>
                  </span>
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">{item.jam}</span>
                    <h4 className="text-xs font-bold text-[#0b1c30]">{item.mapel}</h4>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    isFinished
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-blue-50 text-[#0050cb]'
                  }`}
                >
                  {item.statusLabel}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-slate-500 text-xs pl-9">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-[#0050cb]">
                    location_on
                  </span>
                  <span className="text-[11px]">{item.lokasi}</span>
                </div>
                {item.guruAvatar ? (
                  <div className="flex items-center gap-1.5">
                    <img
                      className="w-4 h-4 rounded-full object-cover"
                      alt={item.pengajar}
                      src={item.guruAvatar}
                    />
                    <span className="text-[11px]">{item.pengajar}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-[#0050cb]">group</span>
                    <span className="text-[11px]">{item.pengajar}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {/* Tata Tertib Praktikum Lab */}
      <section className="rounded-2xl bg-[#eff4ff] p-4 border border-blue-100 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-[#0050cb]/10 flex items-center justify-center text-[#0050cb] shrink-0">
            <span className="material-symbols-outlined text-[20px]">info</span>
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-[#0b1c30]">Tata Tertib Praktikum Lab</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Siswa wajib hadir 5 menit sebelum sesi lab dimulai, mengenakan alas kaki bersih, serta melakukan checkout QR presensi sebelum berganti mata pelajaran.
            </p>
          </div>
        </div>

        <button
          disabled={isDownloading}
          onClick={handleDownloadPDF}
          className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-[#0050cb] hover:bg-[#003fa4] text-white text-xs font-bold shadow-xs active:scale-[0.98] transition-all disabled:opacity-75"
          type="button"
        >
          {isDownloading ? (
            <>
              <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
              <span>Menyiapkan Dokumen...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Unduh Jadwal Kelas (PDF)</span>
            </>
          )}
        </button>
      </section>
    </div>
  );
}
