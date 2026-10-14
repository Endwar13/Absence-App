import { isTodayOrFuture, isTomorrowOrFuture } from './dateUtils.js';

/**
 * Validation rules specified in design.md Section 8 & Section 16 (Correctness Properties)
 */

export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email wajib diisi' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { valid: false, error: 'Format email tidak valid (harus sesuai standar sekolah)' };
  }
  return { valid: true };
}

export function validatePassword(password) {
  if (!password) {
    return { valid: false, error: 'Kata sandi wajib diisi' };
  }
  if (password.length < 6) {
    return { valid: false, error: 'Kata sandi minimal 6 karakter' };
  }
  return { valid: true };
}

export function validateQRCode(code) {
  if (!code || typeof code !== 'string') {
    return { valid: false, error: 'QR Code tidak terdeteksi atau kosong' };
  }
  // Expected classroom token structure e.g. 08-PAGI-SMAN1-RPL1 or prefixed SMAN1/NEXUS
  if (code.length < 5) {
    return { valid: false, error: 'Format QR Code presensi tidak valid' };
  }
  return { valid: true };
}

export function validateFile(file, options = {}) {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
  } = options;

  if (!file) {
    return { valid: false, error: 'File dokumen belum dipilih' };
  }

  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    return { valid: false, error: `Ukuran file maksimal ${maxMB}MB` };
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Format file harus berupa JPG, PNG, atau PDF' };
  }

  return { valid: true };
}

/**
 * Property 3: Leave Request Temporal Constraint
 * For category "Izin": date must be at least tomorrow (H-1 or later)
 * For category "Sakit": date can be today or future
 */
export function validateLeaveDate(dateString, category) {
  if (!dateString) {
    return { valid: false, error: 'Tanggal tidak hadir wajib dipilih' };
  }

  if (category === 'izin') {
    if (!isTomorrowOrFuture(dateString)) {
      return {
        valid: false,
        error: 'Pengajuan izin wajib diajukan minimal H-1 (mulai besok atau tanggal setelahnya)'
      };
    }
  } else {
    // Sakit or Lainnya can be today or future
    if (!isTodayOrFuture(dateString)) {
      return {
        valid: false,
        error: 'Tanggal pengajuan tidak boleh berada di masa lampau'
      };
    }
  }

  return { valid: true };
}

/**
 * Validation for description text: min 10 characters, max 500 characters
 */
export function validateLeaveDescription(text) {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: 'Deskripsi alasan izin wajib diisi' };
  }
  const clean = text.trim();
  if (clean.length < 10) {
    return { valid: false, error: 'Deskripsi alasan terlalu singkat (minimal 10 karakter)' };
  }
  if (clean.length > 500) {
    return { valid: false, error: 'Deskripsi alasan maksimal 500 karakter' };
  }
  return { valid: true };
}

/**
 * Property 2: Unique Daily Attendance & Property 8: Student Profile Completeness
 */
export function validateAttendanceEligibility(student, existingAttendanceRecords, todayISODate) {
  // Property 8: Student Profile Completeness
  if (!student || !student.nama || !student.nisn || !student.nis || !student.kelas) {
    return {
      valid: false,
      code: 'INCOMPLETE_PROFILE',
      error: 'Profil siswa belum lengkap. Silakan lengkapi data profil terlebih dahulu.'
    };
  }

  // Property 2: Unique Daily Attendance
  const alreadyAttended = existingAttendanceRecords.some(
    (record) => record.rawDate === todayISODate || record.tanggal?.includes(todayISODate)
  );

  if (alreadyAttended) {
    return {
      valid: false,
      code: 'DUPLICATE_ATTENDANCE',
      error: 'Anda sudah melakukan presensi hari ini. Presensi harian bersifat unik dan hanya berlaku satu kali per hari.'
    };
  }

  return { valid: true };
}
