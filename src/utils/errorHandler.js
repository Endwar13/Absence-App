/**
 * Centralized Error Handler for Nexus Connect Absence App
 * Translates Supabase / Network / Validation errors into clean Bahasa Indonesia messages.
 */

export function handleSupabaseError(error) {
  if (!error) return 'Terjadi kesalahan sistem yang tidak diketahui.';

  const message = error.message || String(error);

  if (message.includes('unique constraint') || message.includes('absen_siswa_id_tanggal_key')) {
    return 'Anda sudah melakukan presensi pada hari ini.';
  }

  if (message.includes('JWT') || message.includes('token') || message.includes('auth')) {
    return 'Sesi autentikasi telah berakhir. Silakan masuk kembali.';
  }

  if (message.includes('row-level security') || message.includes('permission denied')) {
    return 'Akses ditolak: Anda hanya dapat mengakses data Anda sendiri.';
  }

  if (message.includes('network') || message.includes('Failed to fetch')) {
    return 'Koneksi jaringan terputus. Pastikan perangkat Anda terhubung ke internet.';
  }

  return message;
}

export function handleAuthError(error) {
  if (!error) return 'Gagal melakukan autentikasi.';
  const msg = error.message || String(error);
  if (msg.includes('Invalid login credentials') || msg.includes('invalid credentials')) {
    return 'Email atau kata sandi tidak sesuai. Silakan periksa kembali.';
  }
  return msg;
}

export function handleFileUploadError(error) {
  return error?.message || 'Gagal mengunggah file lampiran. Pastikan format JPG/PNG/PDF dan ukuran di bawah batas.';
}

export function logError(error, context = '') {
  console.error(`[NexusConnect Error] [${context}]:`, error);
}
