import { useAttendance } from '../context/AttendanceContext.jsx';
import leaveRequestService from '../services/leaveRequestService.js';
import { useState, useCallback } from 'react';

export function useLeaveRequest() {
  const { leaveRequests, createLeaveRequest } = useAttendance();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submitLeave = useCallback(
    async (formData) => {
      setLoading(true);
      setError(null);
      try {
        const res = await leaveRequestService.submitLeaveRequest('siswa-001', formData);
        createLeaveRequest(formData);
        return res;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [createLeaveRequest]
  );

  return {
    leaveRequests,
    submitLeave,
    loading,
    error
  };
}

export default useLeaveRequest;
