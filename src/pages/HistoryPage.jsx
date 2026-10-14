import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext.jsx';

export default function HistoryPage() {
  const { student, attendanceLogs, showToast } = useAttendance();

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'hadir' | 'sakit' | 'izin' | 'alpha'
  const [expandedCardId, setExpandedCardId] = useState('att-1');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('Oktober 2024');

  const toggleExpand = (id) => {
    setExpandedCardId((prev) => (prev === id ? null : id));
  };

  const filteredLogs = attendanceLogs.filter((log) => {
    if (activeFilter === 'all') return true;
    return log.status === activeFilter;
  });

  const handleExportPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      showToast({
        type: 'success',
        title: 'Rekap Presensi Tersimpan',
        message: 'Laporan Rekap_Presensi_Oktober_2024.pdf berhasil diunduh.'
      });
    }, 1200);
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-4 pb-24 pt-3 gap-4">
      {/* Month Selector & Attendance Metric Bento Card */}
      <div className="flex flex-col w-full bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4 gap-4">
        {/* Month Navigation Bar */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">
              Periode Akademik
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="material-symbols-outlined text-[#0050cb] text-[22px]">
                calendar_month
              </span>
              <span className="text-base font-bold text-[#0b1c30]">{selectedMonth}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-full border border-slate-200/60">
            <button
              aria-label="Bulan sebelumnya"
              onClick={() => {
                setSelectedMonth((prev) => (prev === 'Oktober 2024' ? 'September 2024' : 'Oktober 2024'));
              }}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white text-slate-600 active:scale-95 transition-all"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <span className="w-1.5 h-1.5 rounded-full bg-[#0050cb]"></span>
            <button
              aria-label="Bulan berikutnya"
              onClick={() => {
                setSelectedMonth((prev) => (prev === 'Oktober 2024' ? 'November 2024' : 'Oktober 2024'));
              }}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white text-slate-600 active:scale-95 transition-all"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Attendance Performance Gauge & KPI Split */}
        <div className="flex items-center gap-4 bg-[#eff4ff] rounded-2xl p-4 border border-blue-100/70">
          {/* Lightweight SVG Gauge */}
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              {/* Background track */}
              <circle
                className="text-blue-100"
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                stroke="currentColor"
                strokeWidth="9"
              />
              {/* Progress indicator (95.2% circumference) */}
              <circle
                className="text-emerald-500 transition-all duration-1000"
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                stroke="currentColor"
                strokeDasharray="251.32"
                strokeDashoffset="12.06"
                strokeLinecap="round"
                strokeWidth="9"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-base font-bold text-[#0b1c30] leading-none">
                {student.stats.kehadiranRate}
                <span className="text-xs font-semibold">%</span>
              </span>
              <span className="text-[10px] text-slate-500 mt-1 font-medium">Kehadiran</span>
            </div>
          </div>

          {/* Quick Metrics Counter Matrix */}
          <div className="grid grid-cols-2 gap-2 flex-1">
            <div className="bg-white p-2 rounded-xl flex items-center gap-2 border border-slate-100 shadow-2xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-slate-500 font-medium truncate">Hadir</span>
                <span className="text-xs font-bold text-[#0b1c30]">{student.stats.hadir} Hari</span>
              </div>
            </div>

            <div className="bg-white p-2 rounded-xl flex items-center gap-2 border border-slate-100 shadow-2xs">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-slate-500 font-medium truncate">Sakit</span>
                <span className="text-xs font-bold text-[#0b1c30]">{student.stats.sakit} Hari</span>
              </div>
            </div>

            <div className="bg-white p-2 rounded-xl flex items-center gap-2 border border-slate-100 shadow-2xs">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0"></span>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-slate-500 font-medium truncate">Izin</span>
                <span className="text-xs font-bold text-[#0b1c30]">{student.stats.izin} Hari</span>
              </div>
            </div>

            <div className="bg-white p-2 rounded-xl flex items-center gap-2 border border-slate-100 shadow-2xs">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-slate-500 font-medium truncate">Alpha</span>
                <span className="text-xs font-bold text-[#0b1c30]">{student.stats.alpha} Hari</span>
              </div>
            </div>
          </div>
        </div>

        {/* Micro Motivation Banner */}
        <div className="flex items-center gap-2.5 bg-emerald-100 text-emerald-900 px-3.5 py-2 rounded-xl border border-emerald-200">
          <span className="material-symbols-outlined text-[20px] text-emerald-700">verified</span>
          <span className="text-xs font-medium flex-1">
            Konsistensi jempolan! Target kehadiran di atas 90% tercapai.
          </span>
        </div>
      </div>

      {/* Interactive Filter Category Pills */}
      <div className="flex flex-col w-full gap-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-[#0b1c30]">Catatan Presensi</span>
          <span className="text-xs text-slate-500 font-medium">
            {filteredLogs.length} Catatan Ditampilkan
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
              activeFilter === 'all'
                ? 'bg-[#0050cb] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            type="button"
          >
            Semua ({attendanceLogs.length})
          </button>

          <button
            onClick={() => setActiveFilter('hadir')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
              activeFilter === 'hadir'
                ? 'bg-[#0050cb] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            type="button"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Hadir ({attendanceLogs.filter((l) => l.status === 'hadir').length})
          </button>

          <button
            onClick={() => setActiveFilter('sakit')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
              activeFilter === 'sakit'
                ? 'bg-[#0050cb] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            type="button"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Sakit ({attendanceLogs.filter((l) => l.status === 'sakit').length})
          </button>

          <button
            onClick={() => setActiveFilter('izin')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
              activeFilter === 'izin'
                ? 'bg-[#0050cb] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            type="button"
          >
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            Izin ({attendanceLogs.filter((l) => l.status === 'izin').length})
          </button>

          <button
            onClick={() => setActiveFilter('alpha')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
              activeFilter === 'alpha'
                ? 'bg-[#0050cb] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            type="button"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Alpha (0)
          </button>
        </div>
      </div>

      {/* Attendance Log Stream */}
      <div className="flex flex-col w-full gap-2.5">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-slate-200/80 text-center shadow-xs">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
              <span className="material-symbols-outlined text-[32px]">event_busy</span>
            </div>
            <span className="text-sm font-bold text-[#0b1c30]">Tidak Ada Data</span>
            <p className="text-xs text-slate-500 max-w-xs mt-0.5">
              Belum ada rekap presensi untuk kategori ini pada periode {selectedMonth}.
            </p>
          </div>
        ) : (
          filteredLogs.map((item) => {
            const isExpanded = expandedCardId === item.id;
            const isHadir = item.status === 'hadir';
            const isSakit = item.status === 'sakit';
            const isIzin = item.status === 'izin';

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 transition-all"
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex gap-3 items-center">
                    {/* Thumbnail */}
                    {item.foto ? (
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 shadow-2xs border border-slate-200">
                        <img
                          alt="Selfie Presensi"
                          className="w-full h-full object-cover"
                          src={item.foto}
                        />
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-[10px] text-white">
                            check
                          </span>
                        </span>
                      </div>
                    ) : (
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                          isSakit
                            ? 'bg-amber-100 text-amber-600'
                            : isIzin
                            ? 'bg-sky-100 text-sky-600'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[24px]">
                          {isSakit ? 'medical_services' : 'assignment_turned_in'}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-xs text-[#0b1c30] truncate">
                        {item.tanggal}
                      </span>
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
                        {item.waktu && item.waktu !== '-' ? (
                          <>
                            <span className="material-symbols-outlined text-[14px] text-[#0050cb]">
                              schedule
                            </span>
                            <span>{item.waktu}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-emerald-700 font-semibold">{item.keterangan}</span>
                          </>
                        ) : (
                          <span className="font-medium text-slate-700">{item.keterangan}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Badge */}
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                      isHadir
                        ? 'bg-emerald-100 text-emerald-800'
                        : isSakit
                        ? 'bg-amber-100 text-amber-800'
                        : isIzin
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {item.statusLabel}
                  </span>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-slate-600 text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="material-symbols-outlined text-[16px] text-slate-400 shrink-0">
                      {isHadir ? 'meeting_room' : isSakit ? 'health_and_safety' : 'description'}
                    </span>
                    <span className="truncate text-[11px]">{item.lokasi}</span>
                  </div>

                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="flex items-center gap-0.5 text-xs text-[#0050cb] font-bold hover:underline shrink-0"
                    type="button"
                  >
                    Detail
                    <span
                      className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    >
                      expand_more
                    </span>
                  </button>
                </div>

                {/* Expandable Detail Drawer */}
                {isExpanded && (
                  <div className="mt-2.5 pt-2.5 bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 block">Metode Verifikasi</span>
                        <span className="text-[#0b1c30] font-bold">{item.metode || 'QR Code + Selfie'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Koordinat / Validasi</span>
                        <span className="text-emerald-700 font-bold">
                          {item.radius || 'Valid dalam radius sekolah'}
                        </span>
                      </div>
                    </div>

                    {item.lampiran && (
                      <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 text-xs">
                        <span className="material-symbols-outlined text-[#0050cb] text-[18px]">
                          attach_file
                        </span>
                        <span className="text-[#0050cb] font-semibold truncate flex-1">
                          {item.lampiran}
                        </span>
                        <span className="text-slate-400 text-[10px]">{item.lampiranSize}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Cetak Rekap Bulanan Action Card */}
      <div className="flex items-center justify-between bg-blue-100/70 border border-blue-200 text-[#001849] p-4 rounded-2xl shadow-xs mt-1">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[#0050cb] text-white flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold truncate">Unduh Rekap Bulanan</span>
            <span className="text-[11px] text-slate-600 truncate">
              Format PDF tanda tangan digital
            </span>
          </div>
        </div>

        <button
          disabled={isExporting}
          onClick={handleExportPDF}
          className="px-4 py-2 bg-[#0050cb] hover:bg-[#003fa4] text-white rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 transition-all shrink-0 shadow-xs disabled:opacity-75"
          type="button"
        >
          {isExporting ? (
            <>
              <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
              <span>Mengunduh...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Cetak</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
