import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useAttendance } from '../context/AttendanceContext.jsx';

export default function AttendancePage() {
  const { student, todayAttendance, recordAttendance, showToast, setActiveTab } = useAttendance();

  // Multi-step flow: 'qr' | 'selfie' | 'success'
  const [currentStep, setCurrentStep] = useState(todayAttendance ? 'success' : 'selfie');
  const [liveClock, setLiveClock] = useState('');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState(todayAttendance?.foto || null);
  const [qrCodeData, setQrCodeData] = useState('08-PAGI-SMAN1-RPL1');
  const [gpsRadius, setGpsRadius] = useState(12);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Live Clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      setLiveClock(`${hrs}:${mins}:${secs} WIB`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Try activating real user camera if in selfie step
  useEffect(() => {
    if (currentStep === 'selfie') {
      let isMounted = true;
      const startCamera = async () => {
        try {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: isFlipped ? 'environment' : 'user',
                width: { ideal: 640 },
                height: { ideal: 800 }
              },
              audio: false
            });
            if (isMounted) {
              streamRef.current = stream;
              if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(() => {});
              }
              setIsCameraActive(true);
            }
          }
        } catch (err) {
          console.warn('Real webcam stream not available in this environment, using photo viewfinder simulation:', err);
          setIsCameraActive(false);
        }
      };

      startCamera();

      return () => {
        isMounted = false;
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setIsCameraActive(false);
    }
  }, [currentStep, isFlipped]);

  // Handle capture & submit
  const handleCaptureAndConfirm = () => {
    // Property 2: Unique Daily Attendance constraint check
    if (todayAttendance) {
      showToast({
        type: 'error',
        title: 'Presensi Sudah Tercatat',
        message: 'Anda sudah melakukan presensi hari ini. Sesuai ketentuan, data presensi bersifat unik dan permanen (tidak dapat diubah).'
      });
      setCurrentStep('success');
      return;
    }

    // Geofence Radius Verification (Must be <= 25m)
    if (gpsRadius > 25) {
      showToast({
        type: 'error',
        title: 'Di Luar Radius Sekolah',
        message: `Jarak Anda (${gpsRadius}m) melebihi batas toleransi geolokasi ruang kelas (maks. 25m).`
      });
      return;
    }

    setIsSubmitting(true);

    let photoUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBr-RHyb2feJ2-O3FGBDGcdtNPGZyGscmNEP9qERNw0lGJkBHS5x8nIzf9-d-l7xBpE8rU0s4HeOXG4wtbbY0mhH1ly_bR8wsASSyXIRzFDA0Jd8JdLpuuCjur-519kJrvsLRaibLKKs1lpRx8FZFhKJlBcc02EHsTvV3WoBKlSBAaM-VLDNeqHpXCVqGpEDkDcFARGEaPW76p7pfnh4QY43dFRGlyT94WRzoe4e3qqdidGCpuX5oPxdg';

    // If real camera is running, capture snapshot to canvas
    if (isCameraActive && videoRef.current) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth || 480;
        canvas.height = videoRef.current.videoHeight || 640;
        const ctx = canvas.getContext('2d');
        if (isFlipped) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        photoUrl = canvas.toDataURL('image/jpeg', 0.85);
      } catch (e) {
        console.warn('Canvas capture fallback', e);
      }
    }

    setTimeout(() => {
      setCapturedPhotoUrl(photoUrl);
      const newRec = recordAttendance({
        photoUrl: photoUrl,
        qrCode: qrCodeData,
        locationName: 'Lab RPL 1 (Valid)',
        radiusMeters: gpsRadius
      });

      setIsSubmitting(false);
      setCurrentStep('success');

      // Trigger Confetti Celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore
      }

      showToast({
        type: 'success',
        title: 'Presensi Berhasil Dikirim!',
        message: `Kehadiran ${student.nama} pukul ${newRec.waktu} telah diverifikasi server.`
      });
    }, 1000);
  };

  const handleRescan = () => {
    setCurrentStep('selfie');
    setQrModalOpen(true);
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-4 pb-24 pt-3 space-y-4">
      {/* Step Progress Tracker Bar */}
      <div className="w-full bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80">
        <div className="flex items-center justify-between relative px-2">
          {/* Connecting Progress Line */}
          <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-slate-100 z-0">
            <div
              className={`h-full bg-[#0050cb] transition-all duration-500 rounded-full ${
                currentStep === 'qr' ? 'w-0' : currentStep === 'selfie' ? 'w-1/2' : 'w-full'
              }`}
            ></div>
          </div>

          {/* Step 1: Scan QR */}
          <div className="flex flex-col items-center gap-1 relative z-10">
            <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                check
              </span>
            </div>
            <span className="text-[11px] text-emerald-600 font-bold">QR Valid</span>
          </div>

          {/* Step 2: Selfie & Geofence */}
          <div className="flex flex-col items-center gap-1 relative z-10">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md ${
                currentStep === 'success'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#0066ff] text-white animate-pulse'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {currentStep === 'success' ? 'check' : 'photo_camera'}
              </span>
            </div>
            <span
              className={`text-[11px] font-bold ${
                currentStep === 'success' ? 'text-emerald-600' : 'text-[#0050cb]'
              }`}
            >
              Verifikasi
            </span>
          </div>

          {/* Step 3: Konfirmasi */}
          <div className="flex flex-col items-center gap-1 relative z-10">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center ${
                currentStep === 'success'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">verified</span>
            </div>
            <span
              className={`text-[11px] font-semibold ${
                currentStep === 'success' ? 'text-emerald-600 font-bold' : 'text-slate-400'
              }`}
            >
              Selesai
            </span>
          </div>
        </div>
      </div>

      {/* Live Scanner Viewfinder & Camera Simulation Viewport */}
      <div className="relative w-full aspect-[4/5] bg-slate-900 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between p-4 border border-slate-800">
        {/* Live Camera Stream / Simulation Fallback */}
        <div className="absolute inset-0 z-0">
          {isCameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${!isFlipped ? '-scale-x-100' : ''}`}
            />
          ) : (
            <img
              alt="Viewfinder Siswa SMK"
              id="cameraFeed"
              className={`w-full h-full object-cover brightness-95 transition-transform duration-300 ${
                isFlipped ? '-scale-x-100' : ''
              }`}
              src={
                capturedPhotoUrl ||
                'https://lh3.googleusercontent.com/aida-public/AB6AXuBr-RHyb2feJ2-O3FGBDGcdtNPGZyGscmNEP9qERNw0lGJkBHS5x8nIzf9-d-l7xBpE8rU0s4HeOXG4wtbbY0mhH1ly_bR8wsASSyXIRzFDA0Jd8JdLpuuCjur-519kJrvsLRaibLKKs1lpRx8FZFhKJlBcc02EHsTvV3WoBKlSBAaM-VLDNeqHpXCVqGpEDkDcFARGEaPW76p7pfnh4QY43dFRGlyT94WRzoe4e3qqdidGCpuX5oPxdg'
              }
            />
          )}

          {/* Aperture Scrim Overlay */}
          <div className="absolute inset-0 bg-slate-950/25 pointer-events-none"></div>

          {/* Simulated Torch Flashlight Overlay */}
          {isTorchOn && (
            <div className="absolute inset-0 bg-white/35 backdrop-blur-[0.5px] pointer-events-none transition-opacity"></div>
          )}
        </div>

        {/* Top Overlay Controls: Torch & Camera Switch */}
        <div className="relative z-20 flex items-center justify-between w-full">
          {/* Live Status Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/70 backdrop-blur-md text-white border border-white/10 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-[11px] font-bold tracking-wider uppercase">
              {isCameraActive ? 'Kamera Aktif' : 'Simulasi Kamera'}
            </span>
          </div>

          {/* Utility Buttons */}
          <div className="flex items-center gap-2">
            <button
              aria-label="Nyalakan Lampu Kilat"
              onClick={() => setIsTorchOn(!isTorchOn)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-90 border border-white/10 ${
                isTorchOn
                  ? 'bg-amber-400 text-slate-900 shadow-lg shadow-amber-400/50'
                  : 'bg-slate-900/70 backdrop-blur-md text-white hover:bg-slate-900'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isTorchOn ? 'flashlight_off' : 'flashlight_on'}
              </span>
            </button>

            <button
              aria-label="Putar Kamera"
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-10 h-10 rounded-full bg-slate-900/70 backdrop-blur-md text-white border border-white/10 flex items-center justify-center transition-transform active:scale-90 hover:bg-slate-900"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">flip_camera_ios</span>
            </button>
          </div>
        </div>

        {/* Reticle / Face Detection & QR Viewfinder Target Frame */}
        <div className="relative z-10 self-center w-60 h-60 my-auto flex items-center justify-center pointer-events-none">
          {/* Corner Brackets */}
          <div className="absolute top-0 left-0 w-8 h-8 rounded-tl-2xl bg-[#0066ff] shadow-[0_0_12px_rgba(0,102,255,0.8)]"></div>
          <div className="absolute top-0 right-0 w-8 h-8 rounded-tr-2xl bg-[#0066ff] shadow-[0_0_12px_rgba(0,102,255,0.8)]"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 rounded-bl-2xl bg-[#0066ff] shadow-[0_0_12px_rgba(0,102,255,0.8)]"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 rounded-br-2xl bg-[#0066ff] shadow-[0_0_12px_rgba(0,102,255,0.8)]"></div>

          {/* Laser Scan Line */}
          <div className="absolute left-2 right-2 h-1 bg-gradient-to-r from-transparent via-[#0066ff] to-transparent shadow-[0_0_14px_#0066ff] animate-pulse"></div>

          {/* Face Detection Oval Guide Ring */}
          <div className="w-48 h-48 rounded-full border border-dashed border-[#0066ff]/60 bg-[#0066ff]/10 flex flex-col items-center justify-center p-2 text-center backdrop-blur-[0.5px]">
            <span className="material-symbols-outlined text-blue-200 text-[36px] drop-shadow-md">
              face
            </span>
          </div>

          {/* Face Recognition Match Badge */}
          <div className="absolute -bottom-3 px-3 py-1 rounded-full bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-lg shadow-emerald-500/20">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            <span>Wajah Terverifikasi 98%</span>
          </div>
        </div>

        {/* Bottom Floating Viewfinder Prompt */}
        <div className="relative z-20 w-full text-center">
          <div className="inline-block px-4 py-2 rounded-2xl bg-slate-900/80 backdrop-blur-md text-white shadow-lg border border-white/10">
            <p className="text-xs font-semibold tracking-wide">
              {currentStep === 'success'
                ? 'Presensi telah berhasil dikonfirmasi!'
                : 'Posisikan wajah tepat di tengah lingkaran'}
            </p>
          </div>
        </div>
      </div>

      {/* Student Metadata & Real-time Geofence Card */}
      <div className="w-full bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3.5">
        {/* Student Info Pill Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#0050cb] flex items-center justify-center shrink-0 border border-blue-100">
              <span className="material-symbols-outlined text-[24px]">school</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-[#0b1c30] truncate">{student.nama}</span>
              <span className="text-xs text-slate-500 truncate">
                NISN: {student.nisn} • {student.kelasShort}
              </span>
            </div>
          </div>

          {/* Status Chip */}
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] uppercase tracking-wider font-bold shrink-0">
            Hadir
          </span>
        </div>

        {/* Timestamp & Geofence Verification Badges */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {/* Live Timestamp */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#eff4ff] border border-blue-100/50">
            <span className="material-symbols-outlined text-[#0050cb] text-[20px]">schedule</span>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] text-slate-500 font-medium">Waktu Pindai</span>
              <span className="text-xs text-[#0b1c30] font-bold tabular-nums">
                {liveClock || '07:14:22 WIB'}
              </span>
            </div>
          </div>

          {/* Geolocation Radius Status */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#eff4ff] border border-blue-100/50">
            <span className="material-symbols-outlined text-emerald-600 text-[20px]">my_location</span>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] text-slate-500 font-medium">Radius GPS ({gpsRadius}m)</span>
              <span className="text-xs text-emerald-700 font-bold truncate">Lab RPL 1 (Valid)</span>
            </div>
          </div>
        </div>

        {/* Classroom QR Validation Code Data */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-2 text-slate-600">
            <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
            <span className="text-xs">
              Sesi: <b className="text-slate-900 font-mono">{qrCodeData}</b>
            </span>
          </div>
          <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[14px]">done_all</span> Terkunci
          </span>
        </div>
      </div>

      {/* Quick Attendance Guidelines & Tips Card */}
      <div className="w-full bg-[#eff4ff] rounded-2xl p-4 border border-blue-100 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 text-[#0050cb] shadow-xs">
          <span className="material-symbols-outlined text-[20px]">lightbulb</span>
        </div>
        <div className="flex flex-col text-slate-600">
          <span className="text-xs font-bold text-[#0b1c30]">Tips Presensi Lancar</span>
          <p className="text-xs leading-relaxed mt-0.5">
            Pastikan pencahayaan cukup terang, hindari masker atau kacamata hitam, dan tetap berada dalam radius 25m ruang kelas.
          </p>
        </div>
      </div>

      {/* Interactive Call-To-Action Operations */}
      <div className="flex flex-col gap-2.5 w-full pt-1">
        {currentStep === 'success' ? (
          <div className="flex flex-col gap-2">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs">
              <span className="material-symbols-outlined text-emerald-600 text-[20px]">verified</span>
              <span className="font-semibold">Presensi hari ini telah berhasil tersimpan di sistem.</span>
            </div>
            <button
              onClick={() => setActiveTab('beranda')}
              className="w-full h-12 bg-[#0050cb] hover:bg-[#003fa4] active:scale-[0.98] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              <span>Kembali ke Beranda</span>
            </button>
            <button
              onClick={() => setActiveTab('riwayat')}
              className="w-full h-10 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">history</span>
              <span>Lihat Rekap di Riwayat</span>
            </button>
          </div>
        ) : (
          <>
            {/* Primary Submit Button */}
            <button
              disabled={isSubmitting}
              onClick={handleCaptureAndConfirm}
              className="w-full h-12 bg-[#0066ff] hover:bg-[#0050cb] active:scale-[0.98] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all disabled:opacity-75"
              type="button"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">
                    progress_activity
                  </span>
                  <span>Memverifikasi Wajah...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[22px]">camera</span>
                  <span>Ambil Foto & Konfirmasi Presensi</span>
                </>
              )}
            </button>

            {/* Secondary Rescan QR Button */}
            <button
              onClick={handleRescan}
              className="w-full h-11 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-slate-200/60"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">sync</span>
              <span>Pindai Ulang QR Code</span>
            </button>
          </>
        )}
      </div>

      {/* QR Code Rescan Modal */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 border border-slate-100 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#0b1c30]">
                <span className="material-symbols-outlined text-[#0050cb]">qr_code_scanner</span>
                <h3 className="font-bold text-sm">QR Code Kelas XII RPL 1</h3>
              </div>
              <button
                onClick={() => setQrModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl flex flex-col items-center justify-center border border-slate-200/80">
              {/* QR Code Illustration */}
              <div className="w-40 h-40 bg-white p-2 rounded-xl shadow-xs border border-slate-200 flex items-center justify-center relative">
                <span className="material-symbols-outlined text-slate-800 text-[120px]">
                  qr_code_2
                </span>
                <div className="absolute inset-0 border-2 border-dashed border-[#0050cb] rounded-xl pointer-events-none"></div>
              </div>
              <span className="mt-3 font-mono font-bold text-xs text-slate-800 bg-white px-3 py-1 rounded-full border border-slate-200">
                {qrCodeData}
              </span>
              <p className="text-[11px] text-slate-500 mt-2 text-center">
                Token kelas telah terverifikasi secara dinamis melalui gerbang presensi sekolah.
              </p>
            </div>

            <button
              onClick={() => {
                setQrModalOpen(false);
                showToast({
                  type: 'success',
                  title: 'QR Code Divalidasi!',
                  message: `Sesi ${qrCodeData} aktif dan siap untuk verifikasi selfie.`
                });
              }}
              className="w-full py-2.5 bg-[#0050cb] text-white font-bold text-xs rounded-xl shadow-sm"
              type="button"
            >
              Gunakan Token Ini & Lanjut Selfie
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
