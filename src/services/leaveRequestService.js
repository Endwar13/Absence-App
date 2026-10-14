import { supabase, uploadFile, getSignedUrl, withRetry, STORAGE_BUCKETS } from './supabase.js';
import { validateLeaveDate, validateLeaveDescription } from '../lib/validator.js';

/**
 * Leave Request Service
 * 
 * Handles all leave request operations:
 * - Submit leave requests with optional proof file
 * - Query leave request history
 * - Get leave request details
 * - Track leave request statistics
 * 
 * Enforces correctness properties:
 * - Property 3: Leave Request Temporal Constraint (date validation by category)
 * - Property 4: Self-Owned Data Access (students only see their own requests)
 * - Property 5: Leave Request Status Progression (pending → approved/rejected)
 * - Property 6: File Upload Persistence (proof files stored in Supabase Storage)
 */

export const leaveRequestService = {
  /**
   * Submit a leave request
   * Validates date constraints based on category and uploads proof file if provided
   * 
   * @param {string} siswaId - Student profile ID (UUID)
   * @param {Object} formData - Leave request form data
   * @param {string} formData.kategori - Leave category ('Izin', 'Sakit', 'Lainnya')
   * @param {string} formData.tanggal - Absence date (YYYY-MM-DD)
   * @param {string} formData.deskripsi - Description/reason
   * @param {Blob} formData.fileData - Optional proof file (medical letter, etc.)
   * @returns {Promise<{success: boolean, requestId: string, proofFileUrl: string|null, message: string}>}
   */
  async submitLeaveRequest(siswaId, formData) {
    const { kategori, tanggal, deskripsi, fileData } = formData;

    if (!siswaId) {
      throw new Error('Siswa ID diperlukan.');
    }

    if (!kategori) {
      throw new Error('Kategori izin wajib dipilih.');
    }

    if (!tanggal) {
      throw new Error('Tanggal tidak hadir wajib dipilih.');
    }

    if (!deskripsi) {
      throw new Error('Deskripsi alasan wajib diisi.');
    }

    try {
      // Validate temporal constraint (Property 3)
      const dateValidation = validateLeaveDate(tanggal, kategori);
      if (!dateValidation.valid) {
        throw new Error(dateValidation.error);
      }

      // Validate description
      const descriptionValidation = validateLeaveDescription(deskripsi);
      if (!descriptionValidation.valid) {
        throw new Error(descriptionValidation.error);
      }

      // Validate medical note requirement for 'Sakit'
      if (kategori === 'Sakit' && !fileData) {
        throw new Error('Kategori Sakit wajib melampirkan surat dokter atau klinik.');
      }

      let proofUrl = null;

      // Upload proof file to Supabase Storage if provided
      if (fileData) {
        const timestamp = Date.now();
        const fileExtension = fileData.name.split('.').pop() || 'pdf';
        const fileName = `${siswaId}_${timestamp}.${fileExtension}`;
        const filePath = `${siswaId}/${fileName}`;

        await withRetry(async () => {
          await uploadFile(STORAGE_BUCKETS.LEAVE_PROOF, filePath, fileData);
        });

        // Get signed URL for proof file (valid for 30 days)
        proofUrl = await getSignedUrl(
          STORAGE_BUCKETS.LEAVE_PROOF,
          filePath,
          30 * 24 * 60 * 60 // 30 days in seconds
        ) || filePath;
      }

      // Create leave request record in database
      const now = new Date();
      const { data: newRequest, error: insertError } = await supabase
        .from('pengajuan_ijin')
        .insert([
          {
            siswa_id: siswaId,
            tanggal_tidak_hadir: tanggal,
            kategori: kategori,
            deskripsi: deskripsi.trim(),
            bukti_url: proofUrl,
            status: 'pending', // Property 5: Always starts as pending
            approved_by: null,
            approved_at: null,
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
        requestId: newRequest.id,
        record: newRequest,
        proofFileUrl: proofUrl,
        message: 'Pengajuan dispensasi berhasil dikirim dan menunggu verifikasi wali kelas.'
      };
    } catch (error) {
      console.error('Leave request submission error:', error);
      throw new Error(error.message || 'Gagal mengajukan dispensasi. Coba lagi.');
    }
  },

  /**
   * Get all leave requests for a student
   * Enforces RLS: students only see their own leave requests (Property 4)
   * 
   * @param {string} siswaId - Student profile ID (UUID)
   * @param {Object} filters - Query filters
   * @param {string} filters.status - Filter by status (pending/approved/rejected)
   * @param {string} filters.startDate - Filter by start date (YYYY-MM-DD)
   * @param {string} filters.endDate - Filter by end date (YYYY-MM-DD)
   * @param {number} filters.limit - Pagination limit (default: 10)
   * @param {number} filters.offset - Pagination offset (default: 0)
   * @returns {Promise<{data: Array, total: number, stats: Object}>}
   */
  async getLeaveRequests(siswaId, filters = {}) {
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
        .from('pengajuan_ijin')
        .select('*', { count: 'exact' })
        .eq('siswa_id', siswaId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (startDate) {
        query = query.gte('tanggal_tidak_hadir', startDate);
      }

      if (endDate) {
        query = query.lte('tanggal_tidak_hadir', endDate);
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data: requests, error, count } = await query;

      if (error) {
        throw error;
      }

      // Calculate statistics
      const stats = {
        pending: 0,
        approved: 0,
        rejected: 0
      };

      requests?.forEach((request) => {
        const requestStatus = request.status?.toLowerCase();
        if (requestStatus === 'pending') stats.pending++;
        else if (requestStatus === 'approved') stats.approved++;
        else if (requestStatus === 'rejected') stats.rejected++;
      });

      return {
        data: requests || [],
        total: count || 0,
        stats
      };
    } catch (error) {
      console.error('Get leave requests error:', error);
      throw new Error(error.message || 'Gagal mengambil daftar pengajuan izin.');
    }
  },

  /**
   * Get single leave request detail by ID
   * 
   * @param {string} requestId - Leave request ID (UUID)
   * @returns {Promise<Object>} - Leave request record
   */
  async getLeaveRequestDetail(requestId) {
    if (!requestId) {
      throw new Error('Request ID diperlukan.');
    }

    try {
      const { data: request, error } = await supabase
        .from('pengajuan_ijin')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Pengajuan izin tidak ditemukan.');
        }
        throw error;
      }

      return request;
    } catch (error) {
      console.error('Get leave request detail error:', error);
      throw new Error(error.message || 'Gagal mengambil detail pengajuan izin.');
    }
  },

  /**
   * Get proof file URL with new signed URL if needed
   * Refreshes signed URL to ensure file remains accessible
   * 
   * @param {string} requestId - Leave request ID (UUID)
   * @returns {Promise<{proofUrl: string}>}
   */
  async getProofFileUrl(requestId) {
    if (!requestId) {
      throw new Error('Request ID diperlukan.');
    }

    try {
      const { data: request, error } = await supabase
        .from('pengajuan_ijin')
        .select('bukti_url')
        .eq('id', requestId)
        .single();

      if (error) {
        throw error;
      }

      if (!request?.bukti_url) {
        throw new Error('Bukti file tidak ditemukan.');
      }

      // If the URL is already a signed URL, return it
      if (request.bukti_url.includes('token=')) {
        return { proofUrl: request.bukti_url };
      }

      // Otherwise, generate a new signed URL
      const signedUrl = await getSignedUrl(
        STORAGE_BUCKETS.LEAVE_PROOF,
        request.bukti_url,
        24 * 60 * 60 // 24 hours
      );

      return {
        proofUrl: signedUrl || request.bukti_url
      };
    } catch (error) {
      console.error('Get proof file URL error:', error);
      throw new Error(error.message || 'Gagal mengambil URL file bukti.');
    }
  },

  /**
   * Get leave request statistics for a student
   * 
   * @param {string} siswaId - Student profile ID (UUID)
   * @returns {Promise<{pending: number, approved: number, rejected: number, total: number}>}
   */
  async getLeaveStats(siswaId) {
    if (!siswaId) {
      throw new Error('Siswa ID diperlukan.');
    }

    try {
      const { data: requests, error } = await supabase
        .from('pengajuan_ijin')
        .select('status')
        .eq('siswa_id', siswaId);

      if (error) {
        throw error;
      }

      const stats = {
        pending: 0,
        approved: 0,
        rejected: 0,
        total: requests?.length || 0
      };

      requests?.forEach((request) => {
        const status = request.status?.toLowerCase();
        if (status === 'pending') stats.pending++;
        else if (status === 'approved') stats.approved++;
        else if (status === 'rejected') stats.rejected++;
      });

      return stats;
    } catch (error) {
      console.error('Get leave stats error:', error);
      throw new Error(error.message || 'Gagal mengambil statistik pengajuan izin.');
    }
  }
};

export default leaveRequestService;
