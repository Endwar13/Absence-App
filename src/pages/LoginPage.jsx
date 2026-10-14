import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useStudent } from '../context/StudentContext.jsx';
import { useAttendance } from '../context/AttendanceContext.jsx';
import profileService from '../services/profileService.js';
import NexusLogo from '../components/Common/NexusLogo.jsx';

export default function LoginPage() {
  const { loginWithGoogle, login, isLoading: authLoading, error: authError } = useAuth();
  const { refreshStudentData } = useStudent();
  const { showToast, setActiveTab } = useAttendance();

  const [selectedEmail, setSelectedEmail] = useState('bayu.setiawan@siswa.nexus.sch.id');
  const [customEmail, setCustomEmail] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState(null);
  const [showPasswordFallback, setShowPasswordFallback] = useState(false);
  const [password, setPassword] = useState('123456');

  const presetAccounts = [
    {
      name: 'Bayu Setiawan',
      email: 'bayu.setiawan@siswa.nexus.sch.id',
      badge: 'Akun Siswa Resmi',
      class: 'XII Rekayasa Perangkat Lunak 1',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlTkDYA5p8Fq1296GmYuK9yNZj_uprePgfaNW0QZC2a8UBSczOuHn6gfHuVjei6i-dUUUvIVXj14R5fK6dPrKEni78B34WAoFK8ytDxAtvFSRLZJvtB8IROZomzZzmHikDlt4g1Gm7_PC8ryVxvzRwXRLKsW7jeho2O7MfuauN-eiGGJJPmZTyCcmC0sJyZGseYgXeESV_dsniRO0I4ty3FL-Pvjnfw3nJ5r8HZd-sPGmoAqM-e8KaOw'
    },
    {
      name: 'Khrisna Tirta Endira',
      email: 'khrisnatirtaendira@gmail.com',
      badge: 'Akun Google Terdaftar',
      class: 'XII RPL 1 (Terverifikasi)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
    }
  ];

  /**
   * Handle Google OAuth Login via Supabase Authentication
   */
  const handleGoogleLogin = async (targetEmail) => {
    const emailToUse = targetEmail || (showCustomInput && customEmail ? customEmail : selectedEmail);
    
    if (!emailToUse || !emailToUse.includes('@')) {
      showToast({
        type: 'error',
        title: 'Email Tidak Valid',
        message: 'Masukkan alamat email Google yang valid.'
      });
      return;
    }

    setVerificationError(null);
    setIsVerifying(true);

    try {
      // Step 1: Initiate Google OAuth via Supabase Authentication
      const result = await loginWithGoogle(emailToUse);

      if (!result.success) {
        throw new Error(result.error || 'Login Google OAuth gagal');
      }

      // Step 2: Verify and link email-to-student profile mapping
      const verifyResult = await profileService.verifyEmailStudentMapping(emailToUse);

      // Step 3: Refresh student data in context
      await refreshStudentData();

      showToast({
        type: 'success',
        title: 'Berhasil Masuk via Google',
        message: `Terhubung dengan ${verifyResult.profile?.nama || 'Siswa'} (${emailToUse})`
      });

      if (setActiveTab) {
        setTimeout(() => {
          setActiveTab('beranda');
        }, 400);
      }
    } catch (err) {
      console.error('Google OAuth error:', err);
      setVerificationError(err.message || 'Gagal login dengan akun Google');
      showToast({
        type: 'error',
        title: 'Otentikasi Google Gagal',
        message: err.message || 'Gagal memproses otentikasi Google'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  /**
   * Optional password fallback handler
   */
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setVerificationError(null);
    setIsVerifying(true);

    try {
      const emailToUse = showCustomInput && customEmail ? customEmail : selectedEmail;
      const loginResult = await login(emailToUse, password);
      
      if (!loginResult.success) {
        return;
      }

      await profileService.verifyEmailStudentMapping(emailToUse);
      await refreshStudentData();

      showToast({
        type: 'success',
        title: 'Berhasil Masuk',
        message: `Selamat datang kembali!`
      });

      if (setActiveTab) {
        setTimeout(() => {
          setActiveTab('beranda');
        }, 400);
      }
    } catch (err) {
      setVerificationError(err.message || 'Gagal verifikasi kata sandi');
    } finally {
      setIsVerifying(false);
    }
  };

  const isProcessing = authLoading || isVerifying;
  const displayError = authError || verificationError;

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-xl border border-slate-200/80 space-y-5">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <NexusLogo size="lg" className="mb-2.5" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0066ff] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
            Nexus Connect Siswa
          </span>
          <h1 className="text-xl font-bold text-[#0b1c30] mt-1.5">Portal Presensi & Izin Siswa</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            SMK Nexus Informatika • Supabase Authentication
          </p>
        </div>

        {/* Status Error Alert */}
        {displayError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
            <span className="leading-tight">{displayError}</span>
          </div>
        )}

        {/* Google OAuth Banner */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/60 border border-blue-200/70 flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-white shadow-xs flex items-center justify-center shrink-0 border border-blue-100">
            <span className="material-symbols-outlined text-[#0050cb] text-[18px]">verified_user</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#0b1c30]">Masuk via Google OAuth 2.0</p>
            <p className="text-[11px] text-slate-600 leading-tight mt-0.5">
              Email Google yang diautentikasi akan otomatis terelasi dengan tabel profil siswa di database Supabase.
            </p>
          </div>
        </div>

        {/* Google Account Preset Chooser */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#0b1c30]">
              Pilih Akun Google Siswa
            </label>
            <span className="text-[11px] text-[#0050cb] font-semibold">
              Terikat Profil
            </span>
          </div>

          <div className="space-y-2">
            {presetAccounts.map((account) => {
              const isSelected = selectedEmail === account.email && !showCustomInput;
              return (
                <div
                  key={account.email}
                  onClick={() => {
                    setSelectedEmail(account.email);
                    setShowCustomInput(false);
                  }}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all flex items-center gap-3 ${
                    isSelected
                      ? 'border-[#0050cb] bg-blue-50/70 shadow-sm ring-1 ring-[#0050cb]/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <img
                    src={account.avatar}
                    alt={account.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-[#0b1c30] truncate">{account.name}</p>
                      <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800">
                        {account.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#0050cb] font-mono truncate">{account.email}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{account.class}</p>
                  </div>
                  <div className="shrink-0 text-[#0050cb]">
                    <span className="material-symbols-outlined text-[20px]">
                      {isSelected ? 'radio_button_checked' : 'radio_button_unchecked'}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Custom Google Email Option */}
            <div
              onClick={() => setShowCustomInput(!showCustomInput)}
              className={`p-2.5 rounded-2xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                showCustomInput
                  ? 'border-[#0050cb] bg-blue-50/50'
                  : 'border-dashed border-slate-300 hover:border-slate-400 bg-slate-50/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-500 text-[18px]">add_circle</span>
                <span className="text-xs font-semibold text-slate-700">
                  Gunakan Akun Google Lain
                </span>
              </div>
              <span className="text-xs text-[#0050cb] font-bold">
                {showCustomInput ? 'Tutup' : 'Pilih'}
              </span>
            </div>

            {showCustomInput && (
              <div className="pt-1">
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="alamat.email@gmail.com"
                  className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-xs text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0050cb]/20"
                />
              </div>
            )}
          </div>
        </div>

        {/* Primary Action: Google OAuth Button */}
        <button
          type="button"
          onClick={() => handleGoogleLogin()}
          disabled={isProcessing}
          className="w-full h-12 bg-white hover:bg-slate-50 active:scale-[0.98] border border-slate-300 text-[#0b1c30] rounded-2xl font-bold text-xs flex items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all disabled:opacity-75"
        >
          {isProcessing ? (
            <>
              <span className="material-symbols-outlined animate-spin text-[20px] text-[#0050cb]">
                progress_activity
              </span>
              <span className="text-[#0050cb] font-bold">Menghubungkan Supabase Google OAuth...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Lanjutkan dengan Akun Google</span>
            </>
          )}
        </button>

        {/* Student Email Relationship Verification Badge */}
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/70 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[#0050cb] font-bold text-[11px]">
            <span className="material-symbols-outlined text-[16px]">link</span>
            <span>Relasi Database Terjamin:</span>
          </div>
          <div className="text-[11px] text-slate-600 leading-tight space-y-1">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-emerald-600 text-[14px]">check_circle</span>
              <span>Email Google ➔ <code>profiles_siswa.email</code> (Unik)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-emerald-600 text-[14px]">check_circle</span>
              <span>Auth User ID ➔ <code>profiles_siswa.user_id</code> (Foreign Key)</span>
            </div>
          </div>
        </div>

        {/* Collapsible Secondary Password Login */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowPasswordFallback(!showPasswordFallback)}
            className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1 w-full font-medium"
          >
            <span>{showPasswordFallback ? 'Sembunyikan Login Manual' : 'Opsi Login Password Manual'}</span>
            <span className="material-symbols-outlined text-[14px]">
              {showPasswordFallback ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {showPasswordFallback && (
            <form onSubmit={handlePasswordSubmit} className="mt-3 pt-3 border-t border-slate-100 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#0b1c30] block mb-1">
                  Kata Sandi
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#0b1c30]"
                />
              </div>
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full h-10 bg-[#0050cb] text-white rounded-xl text-xs font-bold hover:bg-[#003fa4] transition-all"
              >
                Masuk dengan Sandi
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[10.5px] text-slate-400 leading-tight">
          Sistem Presensi Siswa SMK Nexus Informatika terintegrasi Supabase Auth & Google Workspace.
        </p>
      </div>
    </div>
  );
}
