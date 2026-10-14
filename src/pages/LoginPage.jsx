import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useStudent } from '../context/StudentContext.jsx';
import { useAttendance } from '../context/AttendanceContext.jsx';
import profileService from '../services/profileService.js';
import NexusLogo from '../components/Common/NexusLogo.jsx';

export default function LoginPage() {
  const { login, isLoading: authLoading, error: authError } = useAuth();
  const { refreshStudentData, profileStatus } = useStudent();
  const { showToast, setActiveTab } = useAttendance();

  const [email, setEmail] = useState('bayu.setiawan@siswa.nexus.sch.id');
  const [password, setPassword] = useState('123456');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setVerificationError(null);

    // Step 1: Authenticate with email and password
    const loginResult = await login(email, password);
    
    if (!loginResult.success) {
      // Auth error is already set in AuthContext
      return;
    }

    // Step 2: Verify email-to-student mapping and load profile
    try {
      setIsVerifying(true);

      const verifyResult = await profileService.verifyEmailStudentMapping(email);

      if (!verifyResult.valid) {
        setVerificationError(verifyResult.error || 'Profil siswa tidak ditemukan');
        showToast({
          type: 'error',
          title: 'Profil Tidak Valid',
          message: verifyResult.error || 'Profil siswa tidak dapat diverifikasi'
        });
        return;
      }

      // Step 3: Refresh student data (already done by StudentContext, but we verify)
      await refreshStudentData();

      showToast({
        type: 'success',
        title: 'Berhasil Masuk',
        message: `Selamat datang, ${verifyResult.profile?.nama || 'Siswa'}!`
      });

      // Step 4: Navigation via ProtectedLayout re-render
      // When auth succeeds, ProtectedLayout detects isAuthenticated = true
      // and automatically renders MainAppContent instead of LoginPage.
      // No explicit navigation needed since the app uses tab-based navigation
      // through AttendanceContext, not React Router.
      if (setActiveTab) {
        setTimeout(() => {
          setActiveTab('beranda');
        }, 500);
      }
    } catch (err) {
      console.error('Profile verification error:', err);
      setVerificationError(err.message || 'Gagal memverifikasi profil siswa');
      showToast({
        type: 'error',
        title: 'Gagal Memverifikasi Profil',
        message: err.message || 'Gagal memverifikasi data siswa'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    const demoEmail = 'bayu.setiawan@siswa.nexus.sch.id';
    const demoPassword = '123456';
    
    setEmail(demoEmail);
    setPassword(demoPassword);
    setVerificationError(null);

    // Step 1: Authenticate
    const loginResult = await login(demoEmail, demoPassword);
    
    if (!loginResult.success) {
      return;
    }

    // Step 2: Verify email-to-student mapping
    try {
      setIsVerifying(true);

      const verifyResult = await profileService.verifyEmailStudentMapping(demoEmail);

      if (!verifyResult.valid) {
        setVerificationError(verifyResult.error);
        showToast({
          type: 'error',
          title: 'Profil Tidak Valid',
          message: verifyResult.error
        });
        return;
      }

      // Step 3: Refresh student data
      await refreshStudentData();

      showToast({
        type: 'success',
        title: 'Akun Demo Aktif',
        message: `Masuk sebagai ${verifyResult.profile?.nama || 'Siswa Demo'}`
      });

      // Step 4: Navigation via ProtectedLayout re-render
      if (setActiveTab) {
        setTimeout(() => {
          setActiveTab('beranda');
        }, 500);
      }
    } catch (err) {
      console.error('Demo login verification error:', err);
      setVerificationError(err.message);
      showToast({
        type: 'error',
        title: 'Gagal Masuk Demo',
        message: err.message || 'Gagal memverifikasi akun demo'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const isProcessing = authLoading || isVerifying;
  const displayError = authError || verificationError;

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
          {displayError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{displayError}</span>
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
                disabled={isProcessing}
                className="w-full h-11 pl-10 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0050cb]/20 disabled:opacity-75"
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
                disabled={isProcessing}
                className="w-full h-11 pl-10 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0050cb]/20 disabled:opacity-75"
              />
              <span className="absolute left-3 text-slate-400 material-symbols-outlined text-[18px]">
                lock
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full h-11 bg-[#0050cb] hover:bg-[#003fa4] active:scale-[0.98] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all disabled:opacity-75"
          >
            {isProcessing ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[18px]">
                  progress_activity
                </span>
                <span>{isVerifying ? 'Memverifikasi...' : 'Memproses...'}</span>
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
          disabled={isProcessing}
          className="w-full py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100/80 text-[#0050cb] border border-blue-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-75"
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
