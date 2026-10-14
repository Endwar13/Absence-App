import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext.jsx';
import { StudentProvider } from './context/StudentContext.jsx';
import { AttendanceProvider, useAttendance } from './context/AttendanceContext.jsx';
import ProtectedLayout from './components/Layout/ProtectedLayout.jsx';
import Navbar from './components/Layout/Navbar.jsx';
import BottomNav from './components/Layout/BottomNav.jsx';
import Sidebar from './components/Layout/Sidebar.jsx';
import Toast from './components/Common/Toast.jsx';

import DashboardPage from './pages/DashboardPage.jsx';
import AttendancePage from './pages/AttendancePage.jsx';
import LeaveRequestPage from './pages/LeaveRequestPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import SchedulePage from './pages/SchedulePage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';

function MainAppContent() {
  const { activeTab } = useAttendance();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'beranda':
        return <DashboardPage />;
      case 'presensi':
        return <AttendancePage />;
      case 'jadwal':
        return <SchedulePage />;
      case 'izin':
        return <LeaveRequestPage />;
      case 'riwayat':
        return <HistoryPage />;
      case 'profil':
        return <ProfilePage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col font-sans antialiased">
        <Toast />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <Navbar onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 w-full pt-16">
          {renderActiveView()}
        </main>
        <BottomNav />
      </div>
    </ProtectedLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StudentProvider>
        <AttendanceProvider>
          <MainAppContent />
        </AttendanceProvider>
      </StudentProvider>
    </AuthProvider>
  );
}

