import React, { createContext, useContext, useState, useEffect } from 'react';
import { STUDENT_PROFILE, INITIAL_ATTENDANCE_LOGS, INITIAL_LEAVE_REQUESTS } from '../utils/constants.js';

const AttendanceContext = createContext(null);

const STORAGE_KEYS = {
  STUDENT: 'nxc_student_profile',
  ATTENDANCE: 'nxc_attendance_logs',
  LEAVE: 'nxc_leave_requests',
  TODAY: 'nxc_today_attendance',
  SETTINGS: 'nxc_user_settings',
  NOTIFICATIONS: 'nxc_notifications'
};

export function AttendanceProvider({ children }) {
  const [student, setStudent] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STUDENT);
      return saved ? JSON.parse(saved) : STUDENT_PROFILE;
    } catch {
      return STUDENT_PROFILE;
    }
  });

  const [attendanceLogs, setAttendanceLogs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE_LOGS;
    } catch {
      return INITIAL_ATTENDANCE_LOGS;
    }
  });

  const [leaveRequests, setLeaveRequests] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LEAVE);
      return saved ? JSON.parse(saved) : INITIAL_LEAVE_REQUESTS;
    } catch {
      return INITIAL_LEAVE_REQUESTS;
    }
  });

  const [todayAttendance, setTodayAttendance] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TODAY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [parentWaEnabled, setParentWaEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? JSON.parse(saved).parentWaEnabled ?? true : true;
    } catch {
      return true;
    }
  });

  const [activeTab, setActiveTab] = useState('beranda');

  const [toast, setToast] = useState(null);

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return saved ? JSON.parse(saved) : [
        {
          id: 'notif-1',
          title: 'Pengingat Presensi Masuk',
          message: 'Batas presensi jam 07:15 WIB. Jangan lupa scan QR dan verifikasi selfie.',
          time: '15 menit lalu',
          read: false,
          icon: 'schedule',
          type: 'info'
        },
        {
          id: 'notif-2',
          title: 'Dispensasi Disetujui',
          message: 'Permohonan Sakit tanggal 12 Okt telah diverifikasi oleh Bpk. Suryadi.',
          time: 'Kemarin',
          read: true,
          icon: 'task_alt',
          type: 'success'
        }
      ];
    } catch {
      return [];
    }
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STUDENT, JSON.stringify(student));
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [student]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendanceLogs));
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [attendanceLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LEAVE, JSON.stringify(leaveRequests));
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [leaveRequests]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TODAY, JSON.stringify(todayAttendance));
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [todayAttendance]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ parentWaEnabled }));
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [parentWaEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [notifications]);

  const showToast = (toastData) => {
    setToast(toastData);
    if (toastData.autoClose !== false) {
      setTimeout(() => {
        setToast(null);
      }, toastData.duration || 4000);
    }
  };

  const hideToast = () => {
    setToast(null);
  };

  // Submit attendance from live selfie & QR
  const recordAttendance = ({ photoUrl, photoBase64, qrCode, locationName, radiusMeters }) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    const dateFormatted = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const newRecord = {
      id: 'att-' + Date.now(),
      tanggal: dateFormatted,
      rawDate: now.toISOString().slice(0, 10),
      waktu: timeStr,
      status: 'hadir',
      statusLabel: 'Hadir',
      keterangan: 'Tepat Waktu',
      lokasi: locationName || 'Ruang Lab RPL 1 (Geotag Valid)',
      metode: 'Selfie AI + QR Gerbang (' + (qrCode || '08-PAGI-SMAN1-RPL1') + ')',
      radius: (radiusMeters || 12) + 'm dari Titik Sekolah',
      foto: photoUrl || photoBase64
    };

    setTodayAttendance(newRecord);

    setAttendanceLogs((prev) => [newRecord, ...prev]);

    // Recalculate stats
    setStudent((prev) => {
      const newHadir = prev.stats.hadir + 1;
      const totalDays = newHadir + prev.stats.sakit + prev.stats.izin + prev.stats.alpha;
      const rate = Math.round((newHadir / totalDays) * 1000) / 10;
      return {
        ...prev,
        stats: {
          ...prev.stats,
          hadir: newHadir,
          kehadiranRate: rate
        }
      };
    });

    // Add notification
    const newNotif = {
      id: 'notif-' + Date.now(),
      title: 'Presensi Sukses Tercatat',
      message: `Presensi masuk pukul ${timeStr} terverifikasi berhasil di ${locationName || 'Lab RPL 1'}.`,
      time: 'Baru saja',
      read: false,
      icon: 'check_circle',
      type: 'success'
    };
    setNotifications((prev) => [newNotif, ...prev]);

    return newRecord;
  };

  // Submit Leave Request
  const createLeaveRequest = ({ kategori, tanggal, deskripsi, fileData }) => {
    const now = new Date();
    const rawDateObj = new Date(tanggal);
    const dateFormatted = rawDateObj.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const categoryTitle =
      kategori === 'sakit'
        ? 'Sakit - Surat Keterangan'
        : kategori === 'izin'
        ? 'Izin - Keperluan Pribadi'
        : 'Lainnya - Dispensasi Khusus';

    const newRequest = {
      id: 'leave-' + Date.now(),
      judul: categoryTitle,
      kategori: kategori,
      tanggal: dateFormatted,
      rawDate: tanggal,
      durasi: '1 Hari',
      diajukan:
        now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) +
        ', ' +
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      status: 'pending',
      statusLabel: 'Menunggu',
      deskripsi: deskripsi,
      lampiranNama: fileData?.name || (kategori === 'sakit' ? 'surat_keterangan_sakit.jpg' : null),
      lampiranSize: fileData?.size || '1.1 MB',
      lampiranUrl: fileData?.url || null,
      approver: null
    };

    setLeaveRequests((prev) => [newRequest, ...prev]);

    // Notification
    const newNotif = {
      id: 'notif-' + Date.now(),
      title: 'Pengajuan Izin Dikirim',
      message: `Pengajuan ${kategori.toUpperCase()} untuk tanggal ${dateFormatted} telah diteruskan ke Guru Piket & Wali Kelas.`,
      time: 'Baru saja',
      read: false,
      icon: 'outgoing_mail',
      type: 'info'
    };
    setNotifications((prev) => [newNotif, ...prev]);

    return newRequest;
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AttendanceContext.Provider
      value={{
        student,
        setStudent,
        attendanceLogs,
        leaveRequests,
        todayAttendance,
        recordAttendance,
        createLeaveRequest,
        parentWaEnabled,
        setParentWaEnabled,
        activeTab,
        setActiveTab,
        toast,
        showToast,
        hideToast,
        notifications,
        markAllNotificationsAsRead,
        unreadCount
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
}
