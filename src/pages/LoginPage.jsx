import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useAttendance } from '../context/AttendanceContext.jsx';
import NexusLogo from '../components/Common/NexusLogo.jsx';

export default function LoginPage() {
  const { login, isLoading, error } = useAuth();
  const { showToast } = useAttendance();

  const [email, setEmail] = useState('bayu.setiawan@siswa.nexus.sch.id');
  const [password, setPassword] = useState('123456');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) {
      showToast({
        type: 'success',
        title: 'Berhasil Masuk',
        message: 'Selamat datang kembali di Nexus Connect Siswa!'
      });
    }
  };

  const handleQuickDemoLogin = async () => {
    setEmail('bayu.setiawan@siswa.nexus.sch.id');
    setPassword('123456');
    const result = await login('bayu.setiawan@siswa.nexus.sch.id', '123456');
    if (result.success) {
      showToast({
        type: 'success',
        title: 'Akun Demo Aktif',
        message: 'Masuk sebagai Bayu Setiawan (XII RPL 1)'
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-xl border border-slate-200/80 space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <NexusLogo size="lg" className="mb-3" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#0066ff]">
            Nexus Connect
          </span>
          <h1 className="text-xl font-bold text-[#0b1c30] mt-0.5">Portal Presensi Siswa</h1>
          <p className="text-xs text-slate-500 mt-1">
            SMK Nexus Informatika • Tahun Ajaran 2024/2025
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-[#0b1c30] block mb-1">
              Email Akun Sekolah
            </label>
            <div className="relative flex items-center">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@siswa.nexus.sch.id"
                className="w-full h-11 pl-10 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0050cb]/20"
              />
              <span className="absolute left-3 text-slate-400 material-symbols-outlined text-[18px]">
                mail
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#0b1c30]">Kata Sandi</label>
              <span className="text-[11px] text-[#0050cb] font-semibold cursor-pointer">
                Lupa sandi?
              </span>
            </div>
            <div className="relative flex items-center">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 pl-10 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0050cb]/20"
              />
              <span className="absolute left-3 text-slate-400 material-symbols-outlined text-[18px]">
                lock
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-[#0050cb] hover:bg-[#003fa4] active:scale-[0.98] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all disabled:opacity-75"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[18px]">
                  progress_activity
                </span>
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">login</span>
                <span>Masuk ke Akun</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full"></div>
          <span className="bg-white px-3 text-[11px] text-slate-400 font-medium absolute">atau</span>
        </div>

        {/* Fast Demo Login */}
        <button
          type="button"
          onClick={handleQuickDemoLogin}
          className="w-full py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100/80 text-[#0050cb] border border-blue-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[18px]">badge</span>
          <span>Masuk Demo Siswa: Bayu Setiawan</span>
        </button>

        <p className="text-center text-[10.5px] text-slate-400 leading-tight">
          Aplikasi resmi Presensi Siswa terintegrasi WhatsApp & AI Face Match.
        </p>
      </div>
    </div>
  );
}
