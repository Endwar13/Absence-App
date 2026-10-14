import { useAttendance } from '../context/AttendanceContext.jsx';
import profileService from '../services/profileService.js';
import { useState, useCallback } from 'react';

export function useStudentProfile() {
  const { student, setStudent } = useAttendance();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await profileService.getProfileWithRelations('siswa-001');
      setStudent(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setStudent]);

  return {
    profile: student,
    loading,
    error,
    refreshProfile
  };
}

export default useStudentProfile;
