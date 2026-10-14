import React from 'react';
import { useAttendance } from '../../context/AttendanceContext.jsx';

export default function NotificationModal({ isOpen, onClose }) {
  const { notifications, markAllNotificationsAsRead, unreadCount } = useAttendance();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden mt-16 border border-slate-100 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">notifications</span>
            <h3 className="font-bold text-base text-[#0b1c30]">Notifikasi</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500 text-white">
                {unreadCount} Baru
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsAsRead}
                className="text-xs text-primary font-semibold hover:underline px-2 py-1"
              >
                Tandai dibaca
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/50"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">
                notifications_off
              </span>
              <p className="text-sm">Belum ada notifikasi baru</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl flex items-start gap-3 transition-colors ${
                  !item.read ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    item.type === 'success'
                      ? 'bg-emerald-100 text-emerald-700'
                      : item.type === 'error'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon || 'notifications'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-semibold text-xs text-[#0b1c30] truncate">{item.title}</h4>
                    <span className="text-[11px] text-slate-400 shrink-0">{item.time}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{item.message}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 text-center border-t border-slate-100">
          <p className="text-[11px] text-slate-500">
            Pemberitahuan otomatis terintegrasi dengan WhatsApp Orang Tua & Guru Piket
          </p>
        </div>
      </div>
    </div>
  );
}
