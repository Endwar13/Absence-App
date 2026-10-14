import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import LoadingSpinner from '../Common/LoadingSpinner.jsx';
import LoginPage from '../../pages/LoginPage.jsx';

export default function ProtectedLayout({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9ff]">
        <LoadingSpinner text="Memverifikasi sesi akun siswa..." size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <>{children}</>;
}
