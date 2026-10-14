import { useAttendance as useAttendanceContext } from '../context/AttendanceContext.jsx';

export function useAttendance() {
  return useAttendanceContext();
}

export default useAttendance;
