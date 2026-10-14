import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext.jsx';
import { validateLeaveDate, validateLeaveDescription, validateFile } from '../lib/validator.js';
import ErrorAlert from '../components/Common/ErrorAlert.jsx';

export default function LeaveRequestPage() {
  const { student, leaveRequests, createLeaveRequest, showToast } = useAttendance();

  const [activeTab, setActiveTab] = useState('form'); // 'form' | 'history'
  const [leaveDate, setLeaveDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  });
  const [category, setCategory] = useState('sakit'); // 'sakit' | 'izin' | 'lainnya'
  const [description, setDescription] = useState('Gejala demam tinggi dan flu sejak kemarin malam.');
  const [uploadedFile, setUploadedFile] = useState({
    name: 'surat_dokter_21okt.jpg',
    size: '1.4 MB',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBHrJ_HmYs1ayko6JsFCk03EpLPeWmnNzGlgMCC19lgyQSjyNpDGNnp6aNaLsSSVnMxTKPEK3NX-8nS0i9WkZuAlH4WXapWKJx3kXCCBqXzx7XXQljPFJeFQt5UutqjVsrSqB2jTPab9h4h5-eGXJ1rZ1BpYBV47crKEXHAwnveY2gBOEdruOMGN1EgLQPjwskFgY9Vg6OTggcdcOxb13d2B3gtDiafLdRFwsesYSQDmc0epYgOqzP-yg'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [historyFilter, setHistoryFilter] = useState('all'); // 'all' | 'approved' | 'pending'
  const [previewModalFile, setPreviewModalFile] = useState(null);

  const handleFileUpload = (e) => {
    setFormError(null);
    const file = e.target.files?.[0];
    if (file) {
      const fileVal = validateFile(file, { maxSize: 10 * 1024 * 1024 });
      if (!fileVal.valid) {
        setFormError(fileVal.error);
        return;
      }
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const url = URL.createObjectURL(file);
      setUploadedFile({
        name: file.name,
        size: `${sizeMB} MB`,
        url: url
      });
      showToast({
        type: 'info',
        title: 'File Terunggah',
        message: `${file.name} (${sizeMB} MB) berhasil dilampirkan.`
      });
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError(null);

    // Property 3: Temporal constraint validation
    const dateVal = validateLeaveDate(leaveDate, category);
    if (!dateVal.valid) {
      setFormError(dateVal.error);
      showToast({
        type: 'error',
        title: 'Validasi Tanggal Gagal',
        message: dateVal.error
      });
      return;
    }

    // Description validation (10 - 500 chars)
    const descVal = validateLeaveDescription(description);
    if (!descVal.valid) {
      setFormError(descVal.error);
      showToast({
        type: 'error',
        title: 'Deskripsi Kurang',
        message: descVal.error
      });
      return;
    }

    // Property 6: Medical note required for Sakit
    if (category === 'sakit' && !uploadedFile) {
      const err = 'Kategori Sakit wajib melampirkan surat dokter/klinik resmi.';
      setFormError(err);
      showToast({
        type: 'error',
        title: 'Bukti Wajib Dilampirkan',
        message: err
      });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      createLeaveRequest({
        kategori: category,
        tanggal: leaveDate,
        deskripsi: description,
        fileData: uploadedFile
      });

      setIsSubmitting(false);
      showToast({
        type: 'success',
        title: 'Pengajuan Terkirim!',
        message: 'Wali kelas dan guru piket akan segera memvalidasi dispensasi.'
      });

      // Switch to history tab
      setActiveTab('history');
    }, 800);
  };

  // Filtered history list
  const filteredHistory = leaveRequests.filter((item) => {
    if (historyFilter === 'all') return true;
    return item.status === historyFilter;
  });

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-4 pb-24 pt-3 gap-4">
      {/* Student Header & Summary Banner */}
      <div className="bg-gradient-to-br from-[#0066ff] to-[#0050cb] text-white rounded-2xl p-5 shadow-md relative overflow-hidden">
        {/* Decorative Backdrop Geometry */}
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 pointer-events-none"></div>
        <div className="absolute right-12 top-2 w-16 h-16 rounded-full bg-white/5 pointer-events-none"></div>

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold backdrop-blur-sm">
              <span className="material-symbols-outlined text-[14px]">school</span>
              {student.kelasShort}
            </span>
            <h2 className="text-xl font-bold mt-1 text-white leading-tight">Layanan Izin & Sakit</h2>
            <p className="text-xs text-white/80 mt-0.5">Ajukan permohonan dispensasi resmi sekolah</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
            <span
              className="material-symbols-outlined text-[28px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              assignment_turned_in
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4 pt-2 bg-black/10 rounded-xl p-2.5 backdrop-blur-sm">
          <div className="flex flex-col">
            <span className="text-[11px] text-white/70">Sisa Kuota Izin</span>
            <span className="text-base font-bold text-white">
              {student.stats.sisaKuotaIzin} <span className="text-xs font-normal opacity-75">Hari / Sem.</span>
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-white/70">Status Kehadiran</span>
            <span className="text-base font-bold text-[#71face] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> {student.stats.kehadiranRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Segmented Tab Navigation */}
      <div className="bg-slate-200/80 p-1 rounded-xl flex items-center text-[#0b1c30] shadow-xs">
        <button
          onClick={() => setActiveTab('form')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'form'
              ? 'bg-white text-[#0050cb] shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          <span>Ajukan Izin Baru</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-white text-[#0050cb] shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">history</span>
          <span>Riwayat Pengajuan</span>
          <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-[#0050cb] text-[10px] font-bold">
            {leaveRequests.length}
          </span>
        </button>
      </div>

      {/* TAB 1: Leave Request Form Screen */}
      {activeTab === 'form' && (
        <section className="flex flex-col gap-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 flex flex-col gap-4"
          >
            {formError && (
              <ErrorAlert
                title="Peringatan Validasi"
                message={formError}
                onDismiss={() => setFormError(null)}
              />
            )}

            {/* Tanggal Tidak Hadir Input */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#0b1c30] flex items-center gap-1.5" htmlFor="leave-date">
                  <span className="material-symbols-outlined text-[#0050cb] text-[18px]">
                    calendar_today
                  </span>
                  Tanggal Tidak Hadir
                  <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs text-[#0050cb] font-bold">1 Hari</span>
              </div>
              <div className="relative flex items-center">
                <input
                  id="leave-date"
                  type="date"
                  value={leaveDate}
                  onChange={(e) => setLeaveDate(e.target.value)}
                  required
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 text-[#0b1c30] text-xs font-medium border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#0050cb]/20"
                />
              </div>

              {/* Dynamic Contextual Validation Hint */}
              <div className="flex items-start gap-1.5 text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="material-symbols-outlined text-amber-500 text-[16px] shrink-0 mt-0.5">
                  info
                </span>
                <p className="text-[11.5px] leading-tight">
                  {category === 'sakit' ? (
                    <>
                      Surat keterangan dokter/klinik <strong>wajib</strong> dilampirkan untuk kategori Sakit.
                    </>
                  ) : category === 'izin' ? (
                    <>
                      Ketentuan: Pengajuan <strong className="text-slate-900">Izin</strong> min.{' '}
                      <span className="text-[#0050cb] font-bold">H-1</span> sebelum tanggal.
                    </>
                  ) : (
                    <>
                      Lampirkan surat dispensasi tugas atau surat undangan kegiatan resmi.
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Kategori Alasan (LeaveReasonCategory) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#0b1c30] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#0050cb] text-[18px]">category</span>
                Kategori Alasan
                <span className="text-rose-500">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Option 1: Sakit */}
                <label
                  onClick={() => setCategory('sakit')}
                  className={`relative flex items-center p-3 rounded-xl cursor-pointer transition-all border ${
                    category === 'sakit'
                      ? 'bg-amber-500/10 border-amber-400 shadow-xs'
                      : 'bg-slate-50 border-slate-200/70 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 w-full">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">medical_services</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-[#0b1c30]">Sakit</span>
                      <span className="text-[10px] text-slate-500">Surat Dokter</span>
                    </div>
                    <span
                      className={`ml-auto material-symbols-outlined text-[20px] ${
                        category === 'sakit' ? 'text-amber-500' : 'text-slate-300'
                      }`}
                      style={category === 'sakit' ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >
                      {category === 'sakit' ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                  </div>
                </label>

                {/* Option 2: Izin Keluarga */}
                <label
                  onClick={() => setCategory('izin')}
                  className={`relative flex items-center p-3 rounded-xl cursor-pointer transition-all border ${
                    category === 'izin'
                      ? 'bg-sky-500/10 border-sky-400 shadow-xs'
                      : 'bg-slate-50 border-slate-200/70 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 w-full">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">family_restroom</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-[#0b1c30]">Izin</span>
                      <span className="text-[10px] text-slate-500">Keperluan Keluarga</span>
                    </div>
                    <span
                      className={`ml-auto material-symbols-outlined text-[20px] ${
                        category === 'izin' ? 'text-sky-500' : 'text-slate-300'
                      }`}
                      style={category === 'izin' ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >
                      {category === 'izin' ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                  </div>
                </label>

                {/* Option 3: Lainnya */}
                <label
                  onClick={() => setCategory('lainnya')}
                  className={`relative flex items-center p-3 rounded-xl cursor-pointer transition-all border ${
                    category === 'lainnya'
                      ? 'bg-purple-500/10 border-purple-400 shadow-xs'
                      : 'bg-slate-50 border-slate-200/70 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 w-full">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">pending</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-[#0b1c30]">Lainnya</span>
                      <span className="text-[10px] text-slate-500">Lomba/Dinas</span>
                    </div>
                    <span
                      className={`ml-auto material-symbols-outlined text-[20px] ${
                        category === 'lainnya' ? 'text-purple-600' : 'text-slate-300'
                      }`}
                      style={category === 'lainnya' ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >
                      {category === 'lainnya' ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Deskripsi Alasan */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#0b1c30] flex items-center gap-1.5" htmlFor="leave-desc">
                  <span className="material-symbols-outlined text-[#0050cb] text-[18px]">notes</span>
                  Deskripsi Alasan
                  <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-500 font-mono">
                  {description.length}/500 karakter
                </span>
              </div>
              <textarea
                id="leave-desc"
                rows={3}
                maxLength={500}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan alasan izin secara detail..."
                className="w-full p-3 rounded-xl bg-slate-50 text-[#0b1c30] text-xs leading-relaxed border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#0050cb]/20 resize-none"
              ></textarea>
            </div>

            {/* Upload Bukti (File Upload) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#0b1c30] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#0050cb] text-[18px]">attach_file</span>
                Upload Bukti Dokumen
                {category === 'sakit' && <span className="text-rose-500">*</span>}
              </label>

              {/* Tap / Drag Upload Box */}
              {!uploadedFile && (
                <label className="group relative flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-200 cursor-pointer transition-all text-center">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-[#0050cb] flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                  </div>
                  <p className="text-xs font-bold text-[#0b1c30]">Ketuk untuk Mengunggah Surat Bukti</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Format: JPG, PNG, PDF (Maks. 10MB)</p>
                </label>
              )}

              {/* Preview Chip of Uploaded File */}
              {uploadedFile && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-[#0b1c30]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">description</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold truncate text-[#0b1c30]">
                        {uploadedFile.name}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {uploadedFile.size} • Terlampir
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewModalFile(uploadedFile)}
                      type="button"
                      title="Lihat Pratinjau"
                      className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:text-[#0050cb] hover:bg-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">visibility</span>
                    </button>
                    <button
                      onClick={handleRemoveFile}
                      type="button"
                      title="Hapus Lampiran"
                      className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:text-rose-600 hover:bg-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Footer with Primary Button */}
            <div className="pt-1 flex flex-col gap-1.5">
              <button
                disabled={isSubmitting}
                className="w-full h-12 bg-[#0066ff] hover:bg-[#0050cb] active:scale-[0.98] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all disabled:opacity-75"
                type="submit"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[20px]">
                      progress_activity
                    </span>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">send</span>
                    <span>Kirim Pengajuan Izin</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-center text-slate-500">
                Pemberitahuan otomatis akan dikirim ke WhatsApp Orang Tua & Guru Piket.
              </p>
            </div>
          </form>

          {/* Quick Preview Section of Recent Requests */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-[#0b1c30]">Pengajuan Terakhir</h3>
              <button
                onClick={() => setActiveTab('history')}
                className="text-xs font-semibold text-[#0050cb] flex items-center gap-0.5 hover:underline"
                type="button"
              >
                Lihat Semua <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>

            {/* Quick List Item 1 */}
            <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">medication</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-xs text-[#0b1c30] truncate">Sakit - Flu & Demam</span>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                    <span>12 Okt 2024</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5 text-slate-600">
                      <span className="material-symbols-outlined text-[13px]">attachment</span> Surat Dokter
                    </span>
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 shrink-0">
                Disetujui
              </span>
            </div>

            {/* Quick List Item 2 */}
            <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">cottage</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-xs text-[#0b1c30] truncate">Izin - Urusan Keluarga</span>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                    <span>02 Okt 2024</span>
                    <span>•</span>
                    <span>Acara Pernikahan</span>
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 shrink-0">
                Disetujui
              </span>
            </div>
          </div>
        </section>
      )}

      {/* TAB 2: History List Pane */}
      {activeTab === 'history' && (
        <section className="flex flex-col gap-3">
          {/* Filter Chips for History */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setHistoryFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                historyFilter === 'all'
                  ? 'bg-[#0050cb] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              type="button"
            >
              Semua ({leaveRequests.length})
            </button>
            <button
              onClick={() => setHistoryFilter('approved')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                historyFilter === 'approved'
                  ? 'bg-[#0050cb] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              type="button"
            >
              Disetujui ({leaveRequests.filter((r) => r.status === 'approved').length})
            </button>
            <button
              onClick={() => setHistoryFilter('pending')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                historyFilter === 'pending'
                  ? 'bg-[#0050cb] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              type="button"
            >
              Menunggu ({leaveRequests.filter((r) => r.status === 'pending').length})
            </button>
          </div>

          {/* Leave Request Cards */}
          <div className="flex flex-col gap-2.5">
            {filteredHistory.map((item) => {
              const isApproved = item.status === 'approved';
              const isPending = item.status === 'pending';

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 flex flex-col gap-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          item.kategori === 'sakit'
                            ? 'bg-amber-100 text-amber-600'
                            : item.kategori === 'izin'
                            ? 'bg-sky-100 text-sky-600'
                            : 'bg-purple-100 text-purple-600'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {item.kategori === 'sakit'
                            ? 'medical_services'
                            : item.kategori === 'izin'
                            ? 'cottage'
                            : 'pending'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-[#0b1c30]">{item.judul}</h4>
                        <p className="text-[11px] text-slate-500">Diajukan: {item.diajukan}</p>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isApproved
                          ? 'bg-emerald-100 text-emerald-800'
                          : isPending
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {item.statusLabel}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed italic">
                    "{item.deskripsi}"
                  </p>

                  <div className="flex items-center justify-between pt-1 text-slate-500 text-xs">
                    {item.lampiranNama ? (
                      <button
                        onClick={() =>
                          setPreviewModalFile({
                            name: item.lampiranNama,
                            size: item.lampiranSize || '1 MB',
                            url: item.lampiranUrl
                          })
                        }
                        className="flex items-center gap-1 text-[#0050cb] font-semibold hover:underline"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px]">attachment</span>
                        <span className="truncate max-w-[170px]">{item.lampiranNama}</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400">Tanpa Lampiran</span>
                    )}

                    <span className="text-[11px] font-medium">Durasi: {item.durasi || '1 Hari'}</span>
                  </div>

                  {item.approver && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <span className="material-symbols-outlined text-emerald-600 text-[14px]">
                        verified
                      </span>
                      <span>Disetujui oleh: {item.approver}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* File Preview Modal */}
      {previewModalFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 space-y-3 border border-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0050cb]">description</span>
                <span className="font-bold text-xs truncate max-w-[200px]">
                  {previewModalFile.name}
                </span>
              </div>
              <button
                onClick={() => setPreviewModalFile(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl flex flex-col items-center justify-center border border-slate-200">
              <img
                alt="Pratinjau Surat Dokumen"
                className="w-full max-h-56 object-contain rounded-lg shadow-xs"
                src={
                  previewModalFile.url ||
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuBHrJ_HmYs1ayko6JsFCk03EpLPeWmnNzGlgMCC19lgyQSjyNpDGNnp6aNaLsSSVnMxTKPEK3NX-8nS0i9WkZuAlH4WXapWKJx3kXCCBqXzx7XXQljPFJeFQt5UutqjVsrSqB2jTPab9h4h5-eGXJ1rZ1BpYBV47crKEXHAwnveY2gBOEdruOMGN1EgLQPjwskFgY9Vg6OTggcdcOxb13d2B3gtDiafLdRFwsesYSQDmc0epYgOqzP-yg'
                }
              />
              <span className="text-[11px] text-slate-500 mt-2">
                Dokumen resmi terverifikasi tim tata usaha sekolah ({previewModalFile.size})
              </span>
            </div>

            <button
              onClick={() => setPreviewModalFile(null)}
              className="w-full py-2 bg-[#0050cb] text-white text-xs font-bold rounded-xl"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
