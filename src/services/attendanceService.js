import { supabase, uploadFile, getSignedUrl, withRetry, STORAGE_BUCKETS } from './supabase.js';
import { validateAttendanceEligibility } from '../lib/validator.js';
import { getTodayISODate } from '../lib/dateUtils.js';

/**
 * Attendance Service
 * 
 * Handles all attendance-related operations:
 * - Submit attendance with QR scan + selfie validation
 * - Query attendance history with RLS enforcement
 * - Check daily attendance status
 * 
 * Enforces correctness properties:
 * - Property 1: Attendance Immutability (no updates after creation)
 * - Property 2: Unique Daily Attendance (max one record per student per day)
 * - Property 4: Self-Owned Data Access (students only see their own records)
 * - Property 6: File Upload Persistence (selfies stored in Supabase Storage)
 */

export const attendanceService = {
  /**
   * Submit attendance with QR code + selfie capture
   * Uploads selfie to Supabase Storage and creates attendance record in database
   * 
   * @param {string} siswaId - Student profile ID (UUID)
   * @param {Object} data - Attendance data
   * @param {string} data.qrData - Scanned QR code data
   * @param {Blob} data.selfieFile - Captured selfie image
   * @param {string} data.locationName - Optional location name
   * @param {number} data.radiusMeters - Optional distance from school
   * @returns {Promise<{success: boolean, attendanceId: string, selfieUrl: string, message: string}>}
   */
  async submitAttendance(siswaId, { qrData, selfieFile, locationName, radiusMeters }) {
    if (!siswaId) {
      throw new Error('Siswa ID diperlukan untuk presensi.');
    }

    if (!selfieFile) {
      throw new Error('Foto selfie diperlukan untuk presensi.');
    }

    if (!qrData) {
      throw new Error('QR code diperlukan untuk presensi.');
    }

    const todayISO = getTodayISODate();

    try {
      // Check if student has already submitted attendance today (Property 2)
      const { data: existingAttendance, error: checkError } = await supabase
        .from('absen')
        .select('id')
        .eq('siswa_id', siswaId)
        .eq('tanggal', todayISO)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingAttendance) {
        throw new Error('Anda sudah melakukan presensi hari ini.');
      }

      // Upload selfie to Supabase Storage
      const timestamp = Date.now();
      const fileName = `${siswaId}_${timestamp}.jpg`;
      const filePath = `${siswaId}/${fileName}`;

      await withRetry(async () => {
        await uploadFile(STORAGE_BUCKETS.ATTENDANCE_SELFIES, filePath, selfieFile);
      });

      // Get signed URL for selfie (valid for 30 days)
      const selfieUrl = await getSignedUrl(
        STORAGE_BUCKETS.ATTENDANCE_SELFIES,
        filePath,
        30 * 24 * 60 * 60 // 30 days in seconds
      );

      // Create attendance record in database
      const now = new Date();
      const { data: newRecord, error: insertError } = await supabase
        .from('absen')
        .insert([
          {
            siswa_id: siswaId,
            tanggal: todayISO,
            status: 'Hadir',
            qr_scan_time: now.toISOString(),
            selfie_url: selfieUrl || filePath,
            created_at: now.toISOString(),
            updated_at: now.toISOString()
          }
        ])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      return {
        success: true,
        attendanceId: newRecord.id,
        record: newRecord,
        selfieUrl: selfieUrl || filePath,
        message: 'Presensi berhasil dicatat secara resmi.'
      };
    } catch (error) {
      console.error('Attendance submission error:', error);
      throw new Error(error.message || 'Gagal mencatat presensi. Coba lagi.');
    }
  },

  /**
   * Get attendance history for a student
   * Enforces RLS: students only see their own attendance records (Property 4)
   * 
   * @param {string} siswaId - Student profile ID (UUID)
   * @param {Object} filters - Query filters
   * @param {string} filters.status - Filter by status (Hadir/Sakit/Izin/Alpha)
   * @param {string} filters.startDate - Filter by start date (YYYY-MM-DD)
   * @param {string} filters.endDate - Filter by end date (YYYY-MM-DD)
   * @param {number} filters.limit - Pagination limit (default: 10)
   * @param {number} filters.offset - Pagination offset (default: 0)
   * @returns {Promise<{data: Array, total: number, error?: string}>}
   */
  async getAttendanceHistory(siswaId, filters = {}) {
    if (!siswaId) {
      throw new Error('Siswa ID diperlukan.');
    }

    try {
      const {
        status,
        startDate,
        endDate,
        limit = 10,
        offset = 0
      } = filters;

      let query = supabase
        .from('absen')
        .select('*', { count: 'exact' })
        .eq('siswa_id', siswaId)
        .order('tanggal', { ascending: false });

      // Apply filters
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (startDate) {
        query = query.gte('tanggal', startDate);
      }

      if (endDate) {
        query = query.lte('tanggal', endDate);
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        data: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('Get attendance history error:', error);
      throw new Error(error.message || 'Gagal mengambil riwayat presensi.');
    }
  },

  /**
   * Check if student has marked attendance today
   * 
   * @param {string} siswaId - Student profile ID (UUID)
   * @returns {Promise<{hasAttended: boolean, record: Object|null}>}
   */
  async getTodayAttendance(siswaId) {
    if (!siswaId) {
      throw new Error('Siswa ID diperlukan.');
    }

    try {
      const todayISO = getTodayISODate();

      const { data: record, error } = await supabase
        .from('absen')
        .select('*')
        .eq('siswa_id', siswaId)
        .eq('tanggal', todayISO)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return {
        hasAttended: !!record,
        record: record || null
      };
    } catch (error) {
      console.error('Get today attendance error:', error);
      throw new Error(error.message || 'Gagal mengecek presensi hari ini.');
    }
  },

  /**
   * Get attendance statistics for a student
   * 
   * @param {string} siswaId - Student profile ID (UUID)
   * @param {Object} range - Date range
   * @param {string} range.startDate - Start date (YYYY-MM-DD)
   * @param {string} range.endDate - End date (YYYY-MM-DD)
   * @returns {Promise<{hadir: number, sakit: number, izin: number, alpha: number, total: number}>}
   */
  async getAttendanceStats(siswaId, range = {}) {
    if (!siswaId) {
      throw new Error('Siswa ID diperlukan.');
    }

    try {
      let query = supabase
        .from('absen')
        .select('status')
        .eq('siswa_id', siswaId);

      if (range.startDate) {
        query = query.gte('tanggal', range.startDate);
      }

      if (range.endDate) {
        query = query.lte('tanggal', range.endDate);
      }

      const { data: records, error } = await query;

      if (error) {
        throw error;
      }

      const stats = {
        hadir: 0,
        sakit: 0,
        izin: 0,
        alpha: 0,
        total: records?.length || 0
      };

      records?.forEach((record) => {
        const status = record.status?.toLowerCase();
        if (status === 'hadir') stats.hadir++;
        else if (status === 'sakit') stats.sakit++;
        else if (status === 'izin') stats.izin++;
        else if (status === 'alpha') stats.alpha++;
      });

      return stats;
    } catch (error) {
      console.error('Get attendance stats error:', error);
      throw new Error(error.message || 'Gagal mengambil statistik presensi.');
    }
  },

  /**
   * Get selfie URL with new signed URL if needed
   * Refreshes signed URL to ensure file remains accessible
   * 
   * @param {string} attendanceId - Attendance record ID (UUID)
   * @returns {Promise<{selfieUrl: string}>}
   */
  async getSelfieUrl(attendanceId) {
    if (!attendanceId) {
      throw new Error('Attendance ID diperlukan.');
    }

    try {
      const { data: record, error } = await supabase
        .from('absen')
        .select('selfie_url')
        .eq('id', attendanceId)
        .single();

      if (error) {
        throw error;
      }

      if (!record?.selfie_url) {
        throw new Error('Selfie tidak ditemukan.');
      }

      // If the URL is already a signed URL, return it
      if (record.selfie_url.includes('token=')) {
        return { selfieUrl: record.selfie_url };
      }

      // Otherwise, generate a new signed URL
      const signedUrl = await getSignedUrl(
        STORAGE_BUCKETS.ATTENDANCE_SELFIES,
        record.selfie_url,
        24 * 60 * 60 // 24 hours
      );

      return {
        selfieUrl: signedUrl || record.selfie_url
      };
    } catch (error) {
      console.error('Get selfie URL error:', error);
      throw new Error(error.message || 'Gagal mengambil URL selfie.');
    }
  }
};

export default attendanceService;
