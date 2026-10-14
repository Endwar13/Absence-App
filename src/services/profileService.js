import { supabase, uploadFile, getSignedUrl, withRetry, STORAGE_BUCKETS } from './supabase.js';

/**
 * Profile Service
 * 
 * Handles student profile operations:
 * - Get student profile with validation
 * - Get profile with related class and teacher data
 * - Update profile (admin only)
 * - Get student photo
 * 
 * Enforces correctness properties:
 * - Property 4: Self-Owned Data Access (students only see their own profile)
 * - Property 8: Student Profile Completeness (validates required fields)
 */

export const profileService = {
  /**
   * Get student profile by user ID
   * Enforces RLS: students only see their own profile (Property 4)
   * Enforces completeness: all required fields must be present (Property 8)
   * 
   * @param {string} userId - Supabase Auth user ID (UUID)
   * @returns {Promise<Object>} - Student profile record
   */
  async getStudentProfile(userId) {
    if (!userId) {
      throw new Error('User ID diperlukan.');
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles_siswa')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Profil siswa tidak ditemukan. Hubungi administrator sekolah.');
        }
        throw error;
      }

      // Validate completeness (Property 8)
      if (!profile.nama || !profile.nisn || !profile.nis || !profile.jenis_kelamin || !profile.id_kelas) {
        throw new Error('Data profil siswa tidak lengkap. Hubungi administrator sekolah.');
      }

      return profile;
    } catch (error) {
      console.error('Get student profile error:', error);
      throw new Error(error.message || 'Gagal mengambil profil siswa.');
    }
  },

  /**
   * Get student profile with related class and teacher information
   * 
   * @param {string} userId - Supabase Auth user ID (UUID)
   * @returns {Promise<Object>} - Enriched profile with class and teacher details
   */
  async getProfileWithRelations(userId) {
    if (!userId) {
      throw new Error('User ID diperlukan.');
    }

    try {
      // Get student profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles_siswa')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        throw profileError;
      }

      // Get class information
      const { data: classData, error: classError } = await supabase
        .from('kelas')
        .select('id, nama_kelas, tahun_ajaran')
        .eq('id', profile.id_kelas)
        .single();

      if (classError) {
        throw classError;
      }

      // Get homeroom teacher information
      const { data: teacherData, error: teacherError } = await supabase
        .from('guru')
        .select('id, nama, nip, speciality')
        .eq('id', classData.wali_kelas_id)
        .single();

      if (teacherError) {
        throw teacherError;
      }

      return {
        ...profile,
        kelas_detail: {
          id: classData.id,
          nama_kelas: classData.nama_kelas,
          tahun_ajaran: classData.tahun_ajaran,
          wali_kelas: {
            id: teacherData.id,
            nama: teacherData.nama,
            nip: teacherData.nip,
            speciality: teacherData.speciality
          }
        }
      };
    } catch (error) {
      console.error('Get profile with relations error:', error);
      throw new Error(error.message || 'Gagal mengambil data profil lengkap.');
    }
  },

  /**
   * Update student profile
   * NOTE: Enforces RLS policy - students cannot modify their own profile
   * Only administrators can update student profiles
   * 
   * @param {string} profileId - Student profile ID (UUID)
   * @param {Object} updateData - Fields to update
   * @throws {Error} - Always throws as per RLS policy
   */
  async updateProfile(profileId, updateData) {
    // In accordance with RLS policy: Students cannot modify their profile directly (admin only)
    // This is enforced both on client and server side via Supabase RLS
    throw new Error('Pembaruan data profil hanya dapat dilakukan oleh Administrator Sekolah.');
  },

  /**
   * Get student photo URL with new signed URL if needed
   * 
   * @param {string} profileId - Student profile ID (UUID)
   * @returns {Promise<{photoUrl: string}>}
   */
  async getPhotoUrl(profileId) {
    if (!profileId) {
      throw new Error('Profile ID diperlukan.');
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles_siswa')
        .select('photo_url')
        .eq('id', profileId)
        .single();

      if (error) {
        throw error;
      }

      if (!profile?.photo_url) {
        return { photoUrl: null };
      }

      // If the URL is already a signed URL, return it
      if (profile.photo_url.includes('token=')) {
        return { photoUrl: profile.photo_url };
      }

      // Otherwise, generate a new signed URL
      const signedUrl = await getSignedUrl(
        STORAGE_BUCKETS.PROFILE_PHOTOS,
        profile.photo_url,
        24 * 60 * 60 // 24 hours
      );

      return {
        photoUrl: signedUrl || profile.photo_url
      };
    } catch (error) {
      console.error('Get photo URL error:', error);
      return { photoUrl: null };
    }
  },

  /**
   * Upload student photo
   * NOTE: Can only be done by admin or during profile setup
   * 
   * @param {string} profileId - Student profile ID (UUID)
   * @param {Blob} photoFile - Photo image file
   * @returns {Promise<{photoUrl: string}>}
   */
  async uploadPhoto(profileId, photoFile) {
    if (!profileId) {
      throw new Error('Profile ID diperlukan.');
    }

    if (!photoFile) {
      throw new Error('File foto diperlukan.');
    }

    try {
      const timestamp = Date.now();
      const filePath = `${profileId}_${timestamp}.jpg`;

      await withRetry(async () => {
        await uploadFile(STORAGE_BUCKETS.PROFILE_PHOTOS, filePath, photoFile);
      });

      const photoUrl = await getSignedUrl(
        STORAGE_BUCKETS.PROFILE_PHOTOS,
        filePath,
        365 * 24 * 60 * 60 // 1 year
      );

      // Update profile with new photo URL
      const { error: updateError } = await supabase
        .from('profiles_siswa')
        .update({ photo_url: photoUrl || filePath })
        .eq('id', profileId);

      if (updateError) {
        throw updateError;
      }

      return {
        photoUrl: photoUrl || filePath
      };
    } catch (error) {
      console.error('Upload photo error:', error);
      throw new Error(error.message || 'Gagal mengupload foto profil.');
    }
  },

  /**
   * Get all required profile fields for completeness validation
   * 
   * @param {string} userId - Supabase Auth user ID (UUID)
   * @returns {Promise<{isComplete: boolean, missingFields: Array}>}
   */
  async validateProfileCompleteness(userId) {
    if (!userId) {
      throw new Error('User ID diperlukan.');
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles_siswa')
        .select('nama, nisn, nis, jenis_kelamin, id_kelas')
        .eq('user_id', userId)
        .single();

      if (error) {
        throw error;
      }

      const missingFields = [];
      if (!profile.nama) missingFields.push('nama');
      if (!profile.nisn) missingFields.push('nisn');
      if (!profile.nis) missingFields.push('nis');
      if (!profile.jenis_kelamin) missingFields.push('jenis_kelamin');
      if (!profile.id_kelas) missingFields.push('id_kelas');

      return {
        isComplete: missingFields.length === 0,
        missingFields
      };
    } catch (error) {
      console.error('Validate profile completeness error:', error);
      throw new Error(error.message || 'Gagal memvalidasi kelengkapan profil.');
    }
  }
};

export default profileService;
