/**
 * Formatting utilities for UI displays
 */

export function formatAttendanceStatus(status) {
  switch (String(status).toLowerCase()) {
    case 'hadir':
      return { label: 'Hadir', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    case 'sakit':
      return { label: 'Sakit', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200' };
    case 'izin':
      return { label: 'Izin', badgeClass: 'bg-sky-100 text-sky-800 border-sky-200' };
    case 'alpha':
      return { label: 'Alpha', badgeClass: 'bg-rose-100 text-rose-800 border-rose-200' };
    default:
      return { label: status || '-', badgeClass: 'bg-slate-100 text-slate-800 border-slate-200' };
  }
}

export function formatLeaveCategory(category) {
  switch (String(category).toLowerCase()) {
    case 'sakit':
      return 'Sakit (Surat Dokter)';
    case 'izin':
      return 'Izin (Keperluan Keluarga)';
    case 'lainnya':
      return 'Lainnya (Lomba / Dinas)';
    default:
      return category || '-';
  }
}

export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function truncateText(text, maxLength = 60) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
