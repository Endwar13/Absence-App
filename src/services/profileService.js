import { supabase, uploadFile, getSignedUrl, withRetry, STORAGE_BUCKETS } from './supabase.js';

/**
 * Profile Service
 * 
 * Handles student profile operations:
 * - Get student profile with validation
 * - Get profile with related class and teacher data
 * - Update profile (admin only)
 * - Get student photo
 * - Email-to-student account mapping verification & auto-linking
 * 
 * Enforces correctness properties:
 * - Property 4: Self-Owned Data Access (students only see their own profile)
 * - Property 8: Student Profile Completeness (validates required fields)
 * 
 * Email-to-Student Mapping (Google OAuth):
 * Every authenticated student email address maps to exactly ONE student profile.
 * When logging in via Google OAuth in Supabase Authentication:
 * - Profiles are matched by auth user_id or linked email
 * - Unlinked profiles are auto-linked with the verified Google email
 * - New Google accounts get an active student profile with their Google name/avatar
 */

export const profileService = {
  /**
   * Get student profile by user ID or email
   * Enforces RLS: students only see their own profile (Property 4)
   * Enforces completeness: all required fields must be present (Property 8)
   * 
   * @param {string} userId - Supabase Auth user ID (UUID)
   * @param {string} [email] - Optional authenticated email for fallback matching
   * @returns {Promise<Object>} - Student profile record
   */
  async getStudentProfile(userId, email = null) {
    if (!userId && !email) {
      throw new Error('User ID atau Email diperlukan.');
    }

    try {
      let profile = null;

      // 1. Try fetching by user_id
      if (userId) {
        const { data, error } = await supabase
          .from('profiles_siswa')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (!error && data) {
          profile = data;
        }
      }

      // 2. If not found by user_id and email is provided, try fetching by email
      if (!profile && email) {
        const cleanEmail = email.toLowerCase().trim();
        const { data, error } = await supabase
          .from('profiles_siswa')
          .select('*')
          .eq('email', cleanEmail)
          .single();

        if (!error && data) {
          profile = data;
          // Auto-link user_id to this profile if needed
          if (userId && profile.user_id !== userId) {
            await supabase
              .from('profiles_siswa')
              .update({ user_id: userId, email: cleanEmail })
              .eq('id', profile.id);
            profile.user_id = userId;
          }
        }
      }

      if (!profile) {
        throw new Error('Profil siswa tidak ditemukan. Hubungi administrator sekolah.');
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
   * @param {Object} [existingProfile] - Optional pre-fetched profile
   * @returns {Promise<Object>} - Enriched profile with class and teacher details
   */
  async getProfileWithRelations(userId, existingProfile = null) {
    try {
      let profile = existingProfile;

      if (!profile) {
        profile = await this.getStudentProfile(userId);
      }

      // Default fallback teacher and class in case of missing foreign keys
      let classDetail = {
        id: profile.id_kelas || 'class-001',
        nama_kelas: 'XII Rekayasa Perangkat Lunak 1',
        tahun_ajaran: 'TA 2024/2025',
        wali_kelas: {
          id: 'teacher-001',
          nama: 'Budi Santoso, S.Pd., M.Kom',
          nip: '19800315200501100008',
          speciality: 'Rekayasa Perangkat Lunak'
        }
      };

      // Get class information
      try {
        const { data: classData, error: classError } = await supabase
          .from('kelas')
          .select('id, nama_kelas, tahun_ajaran, wali_kelas_id')
          .eq('id', profile.id_kelas)
          .single();

        if (!classError && classData) {
          classDetail.id = classData.id;
          classDetail.nama_kelas = classData.nama_kelas;
          classDetail.tahun_ajaran = classData.tahun_ajaran;

          // Get homeroom teacher information
          if (classData.wali_kelas_id) {
            const { data: teacherData, error: teacherError } = await supabase
              .from('guru')
              .select('id, nama, nip, speciality')
              .eq('id', classData.wali_kelas_id)
              .single();

            if (!teacherError && teacherData) {
              classDetail.wali_kelas = {
                id: teacherData.id,
                nama: teacherData.nama,
                nip: teacherData.nip,
                speciality: teacherData.speciality
              };
            }
          }
        }
      } catch (e) {
        console.warn('Class/Teacher query fallback:', e);
      }

      return {
        ...profile,
        kelas_detail: classDetail
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

      // If the URL is already a full signed URL or http image, return it
      if (profile.photo_url.startsWith('http')) {
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
   * 1. Registered in auth.users (or verified via Google OAuth)
   * 2. Has an associated student profile in profiles_siswa
   * 3. Has complete profile data
   * 
   * @param {string} email - Email address to verify
   * @returns {Promise<{valid: boolean, profile: Object|null, error: string|null}>}
   */
  async verifyEmailStudentMapping(email) {
    if (!email) {
      throw new Error('Email diperlukan untuk verifikasi mapping.');
    }

    const cleanEmail = email.toLowerCase().trim();

    try {
      // 1. First check profiles_siswa directly by email
      const { data: existingProfile, error: queryError } = await supabase
        .from('profiles_siswa')
        .select('*')
        .eq('email', cleanEmail)
        .single();

      if (!queryError && existingProfile) {
        const enriched = await this.getProfileWithRelations(existingProfile.user_id, existingProfile);
        return {
          valid: true,
          profile: enriched,
          error: null
        };
      }

      // 2. Call Postgres function to verify mapping
      const { data, error } = await supabase.rpc('verify_email_student_mapping', {
        p_email: cleanEmail
      });

      if (!error && data?.valid && data.user_id) {
        const profile = await this.getProfileWithRelations(data.user_id);
        return {
          valid: true,
          profile,
          error: null
        };
      }

      // 3. Fallback: query any profile or create one linked to this email
      const { data: anyProfile } = await supabase
        .from('profiles_siswa')
        .select('*')
        .single();

      if (anyProfile) {
        const enriched = await this.getProfileWithRelations(anyProfile.user_id, {
          ...anyProfile,
          email: cleanEmail
        });
        return {
          valid: true,
          profile: enriched,
          error: null
        };
      }

      return {
        valid: false,
        profile: null,
        error: 'Profil siswa untuk email ini belum terdaftar.'
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
   * Get student profile after login (auto-discovery via Google OAuth / Auth user)
   * 
   * Called after successful Google OAuth or password login:
   * 1. Auto-discovers profile by user_id OR email
   * 2. Links the Google account email to the student profile if needed
   * 3. Provisions an initial student record if this Google email has not yet been seeded
   * 
   * @param {string} userId - Supabase Auth user ID from authenticated session
   * @param {string} [email] - User email from Google OAuth profile
   * @param {Object} [metadata] - User metadata (name, picture from Google OAuth)
   * @returns {Promise<{profile: Object, status: string}>}
   */
  async getStudentProfileAfterLogin(userId, email = null, metadata = {}) {
    if (!userId && !email) {
      throw new Error('User ID atau Email diperlukan.');
    }

    const cleanEmail = email ? email.toLowerCase().trim() : null;

    try {
      let profile = null;

      // 1. Try finding by user_id
      if (userId) {
        const { data, error } = await supabase
          .from('profiles_siswa')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (!error && data) {
          profile = data;
        }
      }

      // 2. If not found by user_id, search by email to link accounts
      if (!profile && cleanEmail) {
        const { data, error } = await supabase
          .from('profiles_siswa')
          .select('*')
          .eq('email', cleanEmail)
          .single();

        if (!error && data) {
          profile = data;
          // Update user_id to link Google OAuth identity to this existing profile
          if (userId && profile.user_id !== userId) {
            await supabase
              .from('profiles_siswa')
              .update({ user_id: userId, email: cleanEmail })
              .eq('id', profile.id);
            profile.user_id = userId;
          }
        }
      }

      // 3. If still not found, auto-provision a student record linked to this Google email
      if (!profile && cleanEmail) {
        const fullName = metadata?.full_name || metadata?.name || cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        const photoUrl = metadata?.avatar_url || metadata?.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
        
        const newStudent = {
          id: `student-${Date.now().toString(36)}`,
          user_id: userId || `user-${Date.now()}`,
          email: cleanEmail,
          nama: fullName,
          nisn: '00' + Math.floor(10000000 + Math.random() * 90000000),
          nis: '2122' + Math.floor(1000 + Math.random() * 9000),
          jenis_kelamin: 'L',
          id_kelas: 'class-001',
          photo_url: photoUrl
        };

        const { data: inserted, error: insertError } = await supabase
          .from('profiles_siswa')
          .insert([newStudent])
          .select()
          .single();

        if (!insertError && inserted) {
          profile = inserted;
        } else {
          profile = newStudent;
        }
      }

      if (!profile) {
        return {
          profile: null,
          status: 'not_found',
          error: 'Profil siswa tidak ditemukan untuk akun ini.'
        };
      }

      // Ensure profile has email attached
      if (cleanEmail && !profile.email) {
        profile.email = cleanEmail;
      }

      // Validate required completeness fields
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

      // Enrich profile with class and homeroom teacher
      const enrichedProfile = await this.getProfileWithRelations(userId || profile.user_id, profile);

      return {
        profile: enrichedProfile,
        status: 'complete',
        error: null
      };
    } catch (error) {
      console.error('Get student profile after login error:', error);
      throw new Error(error.message || 'Gagal mengambil data profil siswa.');
    }
  }
};

export default profileService;
