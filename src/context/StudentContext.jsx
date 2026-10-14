import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import profileService from '../services/profileService.js';
import attendanceService from '../services/attendanceService.js';
import leaveRequestService from '../services/leaveRequestService.js';
import classService from '../services/classService.js';

export const StudentContext = createContext(null);

export function StudentProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [studentProfile, setStudentProfile] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [classSchedule, setClassSchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshStudentData = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [profileData, attendanceData, leaveData, scheduleData] = await Promise.all([
        profileService.getStudentProfile(user.id),
        attendanceService.getAttendanceHistory(user.id),
        leaveRequestService.getLeaveRequests(user.id),
        classService.getClassSchedule()
      ]);

      setStudentProfile(profileData);
      setAttendanceRecords(attendanceData.data);
      setLeaveRequests(leaveData.data);
      setClassSchedule(scheduleData);
    } catch (err) {
      setError(err.message || 'Gagal memuat data siswa');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    refreshStudentData();
  }, [refreshStudentData]);

  return (
    <StudentContext.Provider
      value={{
        studentProfile,
        attendanceRecords,
        leaveRequests,
        classSchedule,
        loading,
        error,
        refreshStudentData
      }}
    >
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
}

export default StudentContext;
