/**
 * Date and Time Utilities for Nexus Connect Absence App
 */

export function formatDate(dateInput, format = 'long') {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';

  if (format === 'short') {
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  if (format === 'iso') {
    return date.toISOString().slice(0, 10);
  }

  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function formatTime(dateInput) {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';

  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }) + ' WIB';
}

export function isTodayOrFuture(dateString) {
  if (!dateString) return false;
  const target = new Date(dateString);
  target.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return target.getTime() >= today.getTime();
}

export function isTomorrowOrFuture(dateString) {
  if (!dateString) return false;
  const target = new Date(dateString);
  target.setHours(0, 0, 0, 0);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  return target.getTime() >= tomorrow.getTime();
}

export function getDaysBetween(startDate, endDate) {
  const d1 = new Date(startDate);
  const d2 = new Date(endDate);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

export function getTodayISODate() {
  return new Date().toISOString().slice(0, 10);
}

export function getTomorrowISODate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().slice(0, 10);
}
