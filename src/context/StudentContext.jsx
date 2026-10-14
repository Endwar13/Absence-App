import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import profileService from '../services/profileService.js';
import attendanceService from '../services/attendanceService.js';
import leaveRequestService from '../services/leaveRequestService.js';
import classService from '../services/classService.js';

export const StudentContext = createContext(null);

/**
 * StudentProvider
 * 
 * Manages student-related state and data loading:
 * - Student profile (name, NISN, NIS, class, etc.)
 * - Attendance records for current student
 * - Leave requests submitted by student
 * - Class schedule for student's class
 * 
 * Auto-loads profile after login to ensure email-to-student mapping is established.
 * Validates profile completeness before allowing attendance operations.
 */
export function StudentProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [studentProfile, setStudentProfile] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [classSchedule, setClassSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileStatus, setProfileStatus] = useState(null); // 'complete' | 'incomplete' | 'not_found'

  const refreshStudentData = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setStudentProfile(null);
      setAttendanceRecords([]);
      setLeaveRequests([]);
      setClassSchedule([]);
      setProfileStatus(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // CRITICAL: Get student profile with email-to-student mapping validation
      // This ensures the user's email is properly mapped to a student profile
      const profileResult = await profileService.getStudentProfileAfterLogin(user.id);
      
      if (profileResult.status === 'not_found') {
        setStudentProfile(null);
        setProfileStatus('not_found');
        setError(profileResult.error);
        setAttendanceRecords([]);
        setLeaveRequests([]);
        setClassSchedule([]);
        return;
      }

      if (profileResult.status === 'incomplete') {
        setStudentProfile(profileResult.profile);
        setProfileStatus('incomplete');
        setError(profileResult.error);
        setAttendanceRecords([]);
        setLeaveRequests([]);
        setClassSchedule([]);
        return;
      }

      // Profile is complete, load all data in parallel
      setStudentProfile(profileResult.profile);
      setProfileStatus('complete');

      // Fetch related data
      const [attendanceData, leaveData, scheduleData] = await Promise.all([
        attendanceService.getAttendanceHistory(profileResult.profile.id),
        leaveRequestService.getLeaveRequests(profileResult.profile.id),
        classService.getClassSchedule(profileResult.profile.id_kelas)
      ]);

      setAttendanceRecords(attendanceData.data || []);
      setLeaveRequests(leaveData.data || []);
      setClassSchedule(scheduleData || []);
    } catch (err) {
      console.error('Error refreshing student data:', err);
      setError(err.message || 'Gagal memuat data siswa');
      setProfileStatus('error');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Refresh student data when authentication state changes
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
        profileStatus,
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
