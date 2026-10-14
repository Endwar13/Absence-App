import { supabase } from './supabase.js';

/**
 * Class Service
 * 
 * Handles class schedule and class-related operations:
 * - Get class schedule for a student
 * - Get daily schedule
 * - Get teacher schedule
 * - Get class information
 * 
 * Enforces correctness properties:
 * - Property 4: Self-Owned Data Access (students only see their class schedule)
 * - Property 7: Class Schedule Consistency (schedule must match student's class)
 */

export const classService = {
  /**
   * Get class schedule for a student
   * Enforces RLS: students only see schedule for their own class (Properties 4, 7)
   * 
   * @param {string} studentId - Student profile ID (UUID)
   * @param {string} day - Optional day filter (Senin, Selasa, etc.)
   * @returns {Promise<Array>} - Schedule records sorted by day and time
   */
  async getStudentClassSchedule(studentId) {
    if (!studentId) {
      throw new Error('Student ID diperlukan.');
    }

    try {
      // Get student profile to find their class ID
      const { data: studentProfile, error: profileError } = await supabase
        .from('profiles_siswa')
        .select('id_kelas')
        .eq('id', studentId)
        .single();

      if (profileError) {
        throw profileError;
      }

      // Get class schedule
      return await this.getClassSchedule(studentProfile.id_kelas);
    } catch (error) {
      console.error('Get student class schedule error:', error);
      throw new Error(error.message || 'Gagal mengambil jadwal kelas.');
    }
  },

  /**
   * Get class schedule by class ID
   * Can filter by day of week if needed
   * 
   * @param {string} classId - Class ID (UUID)
   * @param {string} day - Optional day filter (Senin, Selasa, Rabu, Kamis, Jumat, Sabtu)
   * @returns {Promise<Array>} - Schedule records sorted by hari_dalam_minggu and jam_mulai
   */
  async getClassSchedule(classId, day = null) {
    if (!classId) {
      throw new Error('Class ID diperlukan.');
    }

    try {
      let query = supabase
        .from('jadwal_pelajaran')
        .select(`
          id,
          id_kelas,
          guru_id,
          hari_dalam_minggu,
          jam_mulai,
          jam_selesai,
          mapel,
          ruangan,
          created_at,
          updated_at,
          guru:guru_id(id, nama, nip)
        `)
        .eq('id_kelas', classId)
        .order('hari_dalam_minggu', { ascending: true })
        .order('jam_mulai', { ascending: true });

      // Filter by day if provided
      if (day) {
        const validDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        if (!validDays.includes(day)) {
          throw new Error(`Hari tidak valid: ${day}`);
        }
        query = query.eq('hari_dalam_minggu', day);
      }

      const { data: schedule, error } = await query;

      if (error) {
        throw error;
      }

      return schedule || [];
    } catch (error) {
      console.error('Get class schedule error:', error);
      throw new Error(error.message || 'Gagal mengambil jadwal pelajaran.');
    }
  },

  /**
   * Get today's schedule for a student
   * 
   * @param {string} studentId - Student profile ID (UUID)
   * @returns {Promise<Array>} - Today's schedule
   */
  async getTodaySchedule(studentId) {
    if (!studentId) {
      throw new Error('Student ID diperlukan.');
    }

    try {
      // Get today's day name
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const todayDay = days[new Date().getDay()];

      // Get student profile to find their class ID
      const { data: studentProfile, error: profileError } = await supabase
        .from('profiles_siswa')
        .select('id_kelas')
        .eq('id', studentId)
        .single();

      if (profileError) {
        throw profileError;
      }

      // Get today's schedule
      return await this.getClassSchedule(studentProfile.id_kelas, todayDay);
    } catch (error) {
      console.error('Get today schedule error:', error);
      throw new Error(error.message || 'Gagal mengambil jadwal hari ini.');
    }
  },

  /**
   * Get class information with teacher details
   * 
   * @param {string} classId - Class ID (UUID)
   * @returns {Promise<Object>} - Class information with homeroom teacher
   */
  async getClassInfo(classId) {
    if (!classId) {
      throw new Error('Class ID diperlukan.');
    }

    try {
      const { data: classInfo, error } = await supabase
        .from('kelas')
        .select(`
          id,
          nama_kelas,
          tahun_ajaran,
          created_at,
          updated_at,
          guru:wali_kelas_id(id, nama, nip, speciality)
        `)
        .eq('id', classId)
        .single();

      if (error) {
        throw error;
      }

      return classInfo;
    } catch (error) {
      console.error('Get class info error:', error);
      throw new Error(error.message || 'Gagal mengambil informasi kelas.');
    }
  },

  /**
   * Get all students in a class
   * NOTE: For admin/teacher use only - not accessible by regular students
   * 
   * @param {string} classId - Class ID (UUID)
   * @returns {Promise<Array>} - Array of student profiles
   */
  async getClassStudents(classId) {
    if (!classId) {
      throw new Error('Class ID diperlukan.');
    }

    try {
      const { data: students, error } = await supabase
        .from('profiles_siswa')
        .select(`
          id,
          user_id,
          nama,
          nisn,
          nis,
          jenis_kelamin,
          photo_url,
          created_at
        `)
        .eq('id_kelas', classId)
        .order('nama', { ascending: true });

      if (error) {
        throw error;
      }

      return students || [];
    } catch (error) {
      console.error('Get class students error:', error);
      throw new Error(error.message || 'Gagal mengambil daftar siswa kelas.');
    }
  },

  /**
   * Get schedule for a specific day with formatted times
   * 
   * @param {string} classId - Class ID (UUID)
   * @param {string} day - Day name (Senin, Selasa, etc.)
   * @returns {Promise<Array>} - Formatted schedule for the day
   */
  async getDaySchedule(classId, day) {
    if (!classId) {
      throw new Error('Class ID diperlukan.');
    }

    if (!day) {
      throw new Error('Day diperlukan.');
    }

    try {
      const schedule = await this.getClassSchedule(classId, day);

      // Format times for display
      return schedule.map((item) => ({
        ...item,
        jam_mulai_display: this.formatTime(item.jam_mulai),
        jam_selesai_display: this.formatTime(item.jam_selesai)
      }));
    } catch (error) {
      console.error('Get day schedule error:', error);
      throw new Error(error.message || 'Gagal mengambil jadwal hari tersebut.');
    }
  },

  /**
   * Helper function to format time
   * @param {string} time - Time string (HH:MM:SS)
   * @returns {string} - Formatted time (HH:MM)
   */
  formatTime(time) {
    if (!time) return '';
    const [hour, minute] = time.split(':');
    return `${hour}:${minute}`;
  }
};

export default classService;
