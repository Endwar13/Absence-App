import { supabase, uploadFile, getSignedUrl, withRetry, STORAGE_BUCKETS } from './supabase.js';

/**
 * Profile Service
 * 
 * Handles student profile operations:
 * - Get student profile with validation
 * - Get profile with related class and teacher data
 * - Update profile (admin only)
 * - Get student photo
 * - Email-to-student account mapping verification
 * 
 * Enforces correctness properties:
 * - Property 4: Self-Owned Data Access (students only see their own profile)
 * - Property 8: Student Profile Completeness (validates required fields)
 * 
 * Email-to-Student Mapping:
 * Every student email address maps to exactly ONE student profile.
 * Login flow uses this relationship to auto-load student data.
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
  },

  /**
   * Verify email-to-student account mapping
   * 
   * Ensures that a given email address is:
   * 1. Registered in auth.users
   * 2. Has exactly one associated student profile
   * 3. Has complete profile data
   * 
   * Used after login to validate the email-to-student relationship before
   * loading student data. This is critical for ensuring data consistency.
   * 
   * @param {string} email - Email address to verify
   * @returns {Promise<{valid: boolean, profile: Object|null, error: string|null}>}
   */
  async verifyEmailStudentMapping(email) {
    if (!email) {
      throw new Error('Email diperlukan untuk verifikasi mapping.');
    }

    try {
      // Call Postgres function to verify mapping
      const { data, error } = await supabase.rpc('verify_email_student_mapping', {
        p_email: email.toLowerCase().trim()
      });

      if (error) {
        console.error('Email mapping verification error:', error);
        return {
          valid: false,
          profile: null,
          error: 'Gagal memverifikasi email ke profil siswa'
        };
      }

      if (!data?.valid) {
        return {
          valid: false,
          profile: null,
          error: data?.error || 'Mapping email ke profil siswa tidak valid'
        };
      }

      // Mapping is valid, get full profile
      const profile = await this.getProfileWithRelations(data.user_id);

      return {
        valid: true,
        profile,
        error: null
      };
    } catch (error) {
      console.error('Verify email student mapping error:', error);
      return {
        valid: false,
        profile: null,
        error: error.message || 'Gagal memverifikasi email'
      };
    }
  },

  /**
   * Get student profile after login (auto-discovery via auth user)
   * 
   * Called after successful login to automatically fetch the student profile
   * associated with the authenticated user. This ensures that:
   * 1. Each login email maps to exactly one student
   * 2. Student data is always fresh from database
   * 3. Profile completeness is validated
   * 
   * @param {string} userId - Supabase Auth user ID from authenticated session
   * @returns {Promise<{profile: Object, status: string}>}
   *   - profile: Complete student profile with class info
   *   - status: 'complete' | 'incomplete' | 'not_found'
   */
  async getStudentProfileAfterLogin(userId) {
    if (!userId) {
      throw new Error('User ID diperlukan untuk mengambil profil siswa setelah login.');
    }

    try {
      // Get basic profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles_siswa')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // No profile found
          return {
            profile: null,
            status: 'not_found',
            error: 'Profil siswa tidak ditemukan. Hubungi administrator sekolah.'
          };
        }
        throw profileError;
      }

      // Validate profile completeness
      const missingFields = [];
      if (!profile.nama) missingFields.push('nama');
      if (!profile.nisn) missingFields.push('nisn');
      if (!profile.nis) missingFields.push('nis');
      if (!profile.jenis_kelamin) missingFields.push('jenis_kelamin');
      if (!profile.id_kelas) missingFields.push('id_kelas');

      if (missingFields.length > 0) {
        return {
          profile,
          status: 'incomplete',
          error: `Profil siswa tidak lengkap. Field yang hilang: ${missingFields.join(', ')}`
        };
      }

      // Get enriched profile with class info
      try {
        const enrichedProfile = await this.getProfileWithRelations(userId);
        return {
          profile: enrichedProfile,
          status: 'complete',
          error: null
        };
      } catch (enrichError) {
        // Return basic profile if enrichment fails
        console.warn('Failed to enrich profile with relations:', enrichError);
        return {
          profile,
          status: 'complete',
          error: null,
          warning: 'Data kelas tidak dapat dimuat sepenuhnya'
        };
      }
    } catch (error) {
      console.error('Get student profile after login error:', error);
      throw new Error(error.message || 'Gagal mengambil profil siswa setelah login.');
    }
  }
};

export default profileService;
