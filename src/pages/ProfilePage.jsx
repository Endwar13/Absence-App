import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProfilePage() {
  const { student, parentWaEnabled, setParentWaEnabled, showToast } = useAttendance();
  const { logout } = useAuth();

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleToggleParentWa = (e) => {
    const isChecked = e.target.checked;
    setParentWaEnabled(isChecked);
    showToast({
      type: 'info',
      title: 'Pengaturan Disimpan',
      message: `Notifikasi WhatsApp ke orang tua telah ${isChecked ? 'diaktifkan' : 'dinonaktifkan'}.`
    });
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast({
        type: 'error',
        title: 'Sandi Terlalu Pendek',
        message: 'Kata sandi baru minimal 6 karakter.'
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast({
        type: 'error',
        title: 'Konfirmasi Sandi Gagal',
        message: 'Kata sandi baru dan konfirmasi tidak cocok.'
      });
      return;
    }

    setPasswordModalOpen(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast({
      type: 'success',
      title: 'Kata Sandi Diperbarui',
      message: 'Kata sandi akun Anda berhasil diganti.'
    });
  };

  const handleLogout = () => {
    const confirmed = window.confirm('Apakah Anda yakin ingin keluar dari akun Nexus Connect?');
    if (confirmed) {
      logout();
    }
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-4 pb-24 pt-3 gap-4">
      {/* Profile Identity Card with Gradient Glow */}
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-xs border border-slate-200/80 p-5">
        <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-blue-100/50 blur-2xl pointer-events-none"></div>
        <div className="absolute -left-12 -bottom-12 w-40 h-40 rounded-full bg-purple-100/50 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Avatar with Dynamic Status Badge */}
          <div className="relative mb-3">
            <div className="w-24 h-24 rounded-full p-1 bg-slate-100 shadow-xs border-2 border-slate-200">
              <img
                alt={student.nama}
                className="w-full h-full object-cover rounded-full"
                src={student.avatarUrl}
              />
            </div>
            <div className="absolute bottom-0 right-0 translate-x-1 translate-y-1 bg-emerald-500 text-white rounded-full p-1 shadow flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified
              </span>
            </div>
          </div>

          {/* Student Name and Badges */}
          <h2 className="text-xl font-bold text-[#0b1c30] leading-tight">{student.nama}</h2>
          <p className="text-xs font-semibold text-[#0050cb] mt-0.5">{student.kelas}</p>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Siswa Aktif
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold border border-slate-200">
              {student.tahunAjaran}
            </span>
          </div>

          {/* Student Credentials Bar */}
          <div className="grid grid-cols-2 gap-2 w-full mt-4 pt-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">NISN</span>
              <span className="text-xs font-bold text-[#0b1c30] tracking-wide font-mono mt-0.5">
                {student.nisn}
              </span>
            </div>
            <div className="flex flex-col items-center border-l border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">NIS</span>
              <span className="text-xs font-bold text-[#0b1c30] tracking-wide font-mono mt-0.5">
                {student.nis}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Academic Stats & Attendance Overview Widget */}
      <div className="rounded-2xl bg-white shadow-xs border border-slate-200/80 p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#0050cb]">
              <span className="material-symbols-outlined text-[20px]">insights</span>
            </div>
            <span className="text-xs font-bold text-[#0b1c30]">Performa Kehadiran</span>
          </div>
          <span className="text-[11px] font-bold text-[#0050cb] px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100">
            Semester Ganjil
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mt-1">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">Tingkat Hadir</span>
              <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
            </div>
            <div className="mt-2">
              <span className="text-xl font-bold text-[#0b1c30] leading-none">
                {student.stats.kehadiranRate}%
              </span>
              <p className="text-[11px] text-emerald-700 mt-1 font-semibold">Konsisten Baik</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">Kuota Izin</span>
              <span className="material-symbols-outlined text-sky-600 text-[18px]">event_available</span>
            </div>
            <div className="mt-2">
              <span className="text-xl font-bold text-[#0b1c30] leading-none">
                {student.stats.sisaKuotaIzin} Hari
              </span>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                Dari {student.stats.totalKuotaIzin} Hari / Sem.
              </p>
            </div>
          </div>
        </div>

        {/* Attendance Meter Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 mt-1 overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-700"
            style={{ width: `${student.stats.kehadiranRate}%` }}
          ></div>
        </div>
      </div>

      {/* Wali Kelas Card */}
      <div className="rounded-2xl bg-white shadow-xs border border-slate-200/80 p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#0050cb]">
              <span className="material-symbols-outlined text-[20px]">supervisor_account</span>
            </div>
            <span className="text-xs font-bold text-[#0b1c30]">Wali Kelas</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">{student.kelasShort}</span>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
          <img
            alt={student.waliKelas.nama}
            className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200"
            src={student.waliKelas.avatarUrl}
          />
          <div className="flex flex-col min-w-0 flex-1">
            <h3 className="font-bold text-xs text-[#0b1c30] truncate">{student.waliKelas.nama}</h3>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">NIP: {student.waliKelas.nip}</p>
            <span className="text-[11px] text-[#0050cb] font-semibold mt-1">
              {student.waliKelas.peran}
            </span>
          </div>
        </div>

        <a
          href={`https://wa.me/${student.waliKelas.noWa}?text=Halo%20Pak%20Budi,%20saya%20${encodeURIComponent(
            student.nama
          )}%20dari%20kelas%20${encodeURIComponent(student.kelasShort)}.`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2.5 px-4 rounded-xl bg-[#008164] hover:bg-[#00664e] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-xs"
        >
          <span className="material-symbols-outlined text-[20px]">chat</span>
          <span>Hubungi WhatsApp Wali Kelas</span>
        </a>
      </div>

      {/* Personal Information Details (Data Diri) */}
      <div className="rounded-2xl bg-white shadow-xs border border-slate-200/80 p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#0050cb]">
              <span className="material-symbols-outlined text-[20px]">badge</span>
            </div>
            <span className="text-xs font-bold text-[#0b1c30]">Data Pribadi Siswa</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">
            <span className="material-symbols-outlined text-[13px]">lock</span> Terverifikasi
          </span>
        </div>

        <div className="flex flex-col divide-y divide-slate-100 text-xs">
          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2.5 text-slate-500">
              <span className="material-symbols-outlined text-[18px]">transgender</span>
              <span>Jenis Kelamin</span>
            </div>
            <span className="font-bold text-[#0b1c30]">{student.jenisKelamin}</span>
          </div>

          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2.5 text-slate-500">
              <span className="material-symbols-outlined text-[18px]">cake</span>
              <span>Tempat, Tgl Lahir</span>
            </div>
            <span className="font-bold text-[#0b1c30]">{student.tempatTglLahir}</span>
          </div>

          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2.5 text-slate-500">
              <span className="material-symbols-outlined text-[18px]">mail</span>
              <span>Email Google Terikat</span>
            </div>
            <div className="flex items-center gap-1.5 max-w-[210px] justify-end">
              <span className="font-bold text-[#0050cb] truncate text-right">
                {student.email}
              </span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                Google OAuth
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2.5 text-slate-500">
              <span className="material-symbols-outlined text-[18px]">phone_iphone</span>
              <span>WhatsApp / HP</span>
            </div>
            <span className="font-bold text-[#0b1c30]">{student.noHp}</span>
          </div>

          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2.5 text-slate-500">
              <span className="material-symbols-outlined text-[18px]">family_restroom</span>
              <span>Wali Murid</span>
            </div>
            <span className="font-bold text-[#0b1c30]">{student.waliMurid}</span>
          </div>

          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2.5 text-slate-500">
              <span className="material-symbols-outlined text-[18px]">school</span>
              <span>Satuan Pendidikan</span>
            </div>
            <span className="font-bold text-[#0b1c30]">{student.satuanPendidikan}</span>
          </div>
        </div>
      </div>

      {/* Settings & Security (Pengaturan & Keamanan) */}
      <div className="rounded-2xl bg-white shadow-xs border border-slate-200/80 p-4 flex flex-col gap-2.5">
        <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#0050cb]">
            <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
          </div>
          <span className="text-xs font-bold text-[#0b1c30]">Pengaturan & Keamanan</span>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          {/* Ubah Kata Sandi */}
          <button
            onClick={() => setPasswordModalOpen(true)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-left transition-colors active:scale-[0.99] border border-slate-100"
            type="button"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#0050cb] shadow-2xs">
                <span className="material-symbols-outlined text-[18px]">key</span>
              </div>
              <div>
                <p className="text-xs font-bold text-[#0b1c30]">Ubah Kata Sandi</p>
                <p className="text-[11px] text-slate-500">Pembaruan sandi akun siswa</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[20px] text-slate-400">chevron_right</span>
          </button>

          {/* Notifikasi WA Orang Tua Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-teal-600 shadow-2xs">
                <span className="material-symbols-outlined text-[18px]">send_to_mobile</span>
              </div>
              <div>
                <p className="text-xs font-bold text-[#0b1c30]">Notifikasi WA Orang Tua</p>
                <p className="text-[11px] text-slate-500">Kirim bukti presensi instan</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={parentWaEnabled}
                onChange={handleToggleParentWa}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0050cb]"></div>
            </label>
          </div>

          {/* Digital Attendance Terms */}
          <button
            onClick={() => setTermsModalOpen(true)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-left transition-colors active:scale-[0.99] border border-slate-100"
            type="button"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-600 shadow-2xs">
                <span className="material-symbols-outlined text-[18px]">policy</span>
              </div>
              <div>
                <p className="text-xs font-bold text-[#0b1c30]">Syarat & Ketentuan Presensi</p>
                <p className="text-[11px] text-slate-500">Kebijakan geolokasi & selfie AI</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[20px] text-slate-400">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Logout Button Section */}
      <div className="pt-1 flex flex-col gap-2">
        <button
          onClick={handleLogout}
          className="w-full py-3 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span>Keluar dari Akun</span>
        </button>
        <p className="text-center text-[10.5px] text-slate-400">
          Nexus Connect Siswa • Versi 2.4.0 (Build 2025)
        </p>
      </div>

      {/* Change Password Modal */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0050cb]">lock_reset</span>
                <h3 className="font-bold text-sm text-[#0b1c30]">Ubah Kata Sandi</h3>
              </div>
              <button
                onClick={() => setPasswordModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Kata Sandi Lama
                </label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan sandi saat ini"
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0050cb]/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Kata Sandi Baru
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 karakter"
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0050cb]/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Konfirmasi Kata Sandi Baru
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi sandi baru"
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0050cb]/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0050cb] text-white hover:bg-[#003fa4] shadow-xs"
                >
                  Simpan Sandi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Terms & Conditions Modal */}
      {termsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-100 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0050cb]">policy</span>
                <h3 className="font-bold text-sm text-[#0b1c30]">Ketentuan Presensi Digital</h3>
              </div>
              <button
                onClick={() => setTermsModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="overflow-y-auto space-y-2.5 text-xs text-slate-600 pr-1 leading-relaxed">
              <p>
                <strong>1. Verifikasi Biometrik:</strong> Foto selfie dilakukan secara langsung (live-capture) untuk mencocokkan wajah siswa dengan seragam sekolah yang berlaku.
              </p>
              <p>
                <strong>2. Geolokasi Sekolah:</strong> Presensi hanya diakui sah jika berada di dalam radius toleransi 25 meter dari titik koordinat gerbang atau lab SMK Nexus Informatika.
              </p>
              <p>
                <strong>3. Batas Jam Masuk:</strong> Presensi gerbang dibuka pukul 06:15 WIB dan ditutup pukul 07:15 WIB. Melewati waktu tersebut tercatat sebagai terlambat atau alpha.
              </p>
              <p>
                <strong>4. Pemberitahuan Otomatis:</strong> Setiap presensi masuk dan dispensasi izin akan dikirimkan notifikasinya secara otomatis ke nomor WhatsApp orang tua terdaftar.
              </p>
            </div>

            <button
              onClick={() => setTermsModalOpen(false)}
              className="w-full py-2 bg-[#0050cb] text-white text-xs font-bold rounded-xl"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
