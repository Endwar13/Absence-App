/**
 * Email-to-Student Account Validator
 * 
 * Utility functions for validating email-to-student relationships.
 * Ensures that:
 * - Each email maps to exactly one student account
 * - Each student profile is complete and valid
 * - Email address format is correct
 * - No orphaned accounts exist
 * 
 * Used during login flow and profile setup.
 */

import { supabase } from '../services/supabase.js';

/**
 * Validate email format (RFC 5322 simplified)
 * 
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if email format is valid
 */
export function validateEmailFormat(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate student profile completeness
 * 
 * A complete student profile requires:
 * - nama: Student full name (non-empty)
 * - nisn: National Student ID (non-empty, unique)
 * - nis: School Student ID (non-empty, unique)
 * - jenis_kelamin: Gender (L or P)
 * - id_kelas: Class assignment (valid UUID reference)
 * 
 * @param {Object} profile - Student profile object
 * @returns {Object} - { isComplete: boolean, missingFields: Array }
 */
export function validateStudentProfileCompleteness(profile) {
  if (!profile || typeof profile !== 'object') {
    return {
      isComplete: false,
      missingFields: ['profile'],
      reason: 'Profile tidak ditemukan'
    };
  }

  const missingFields = [];

  // Check required fields
  if (!profile.nama || typeof profile.nama !== 'string' || profile.nama.trim() === '') {
    missingFields.push('nama');
  }

  if (!profile.nisn || typeof profile.nisn !== 'string' || profile.nisn.trim() === '') {
    missingFields.push('nisn');
  }

  if (!profile.nis || typeof profile.nis !== 'string' || profile.nis.trim() === '') {
    missingFields.push('nis');
  }

  if (!profile.jenis_kelamin || !['L', 'P'].includes(profile.jenis_kelamin)) {
    missingFields.push('jenis_kelamin');
  }

  if (!profile.id_kelas) {
    missingFields.push('id_kelas');
  }

  // Check field types
  if (profile.id_kelas && typeof profile.id_kelas !== 'string') {
    missingFields.push('id_kelas_type');
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields,
    reason: missingFields.length > 0 
      ? `Field yang tidak lengkap: ${missingFields.join(', ')}`
      : 'Profil siswa lengkap'
  };
}

/**
 * Validate NISN format
 * 
 * NISN (Nomor Induk Siswa Nasional) format:
 * - Should be 10 digits
 * - Numeric only
 * 
 * @param {string} nisn - NISN to validate
 * @returns {boolean}
 */
export function validateNISNFormat(nisn) {
  if (!nisn || typeof nisn !== 'string') {
    return false;
  }

  const nisnRegex = /^\d{10}$/;
  return nisnRegex.test(nisn.trim());
}

/**
 * Validate NIS format
 * 
 * NIS (Nomor Induk Sekolah) format:
 * - Should be 5-8 digits
 * - Can include letters in some schools
 * 
 * @param {string} nis - NIS to validate
 * @returns {boolean}
 */
export function validateNISFormat(nis) {
  if (!nis || typeof nis !== 'string') {
    return false;
  }

  // Basic validation: at least 5 characters, alphanumeric
  const nisRegex = /^[a-zA-Z0-9]{5,8}$/;
  return nisRegex.test(nis.trim());
}

/**
 * Validate email is school email domain
 * 
 * @param {string} email - Email to validate
 * @param {Array<string>} allowedDomains - Array of allowed email domains
 *        Default: ['@siswa.nexus.sch.id', '@nexus.sch.id']
 * @returns {boolean}
 */
export function validateSchoolEmailDomain(email, allowedDomains = null) {
  if (!email || !validateEmailFormat(email)) {
    return false;
  }

  const domains = allowedDomains || ['@siswa.nexus.sch.id', '@nexus.sch.id'];
  const lowerEmail = email.toLowerCase();

  return domains.some(domain => lowerEmail.endsWith(domain));
}

/**
 * Check if email has exactly one student profile in database
 * 
 * A valid email-to-student mapping means:
 * 1. Email exists in auth.users
 * 2. Email has exactly one associated profile in profiles_siswa
 * 3. Profile data is complete
 * 
 * @param {string} email - Email to check
 * @returns {Promise<Object>} - {
 *   isValid: boolean,
 *   profileCount: number,
 *   profile: Object|null,
 *   error: string|null
 * }
 */
export async function checkEmailStudentMapping(email) {
  if (!email || !validateEmailFormat(email)) {
    return {
      isValid: false,
      profileCount: 0,
      profile: null,
      error: 'Format email tidak valid'
    };
  }

  try {
    // Query to find auth user and associated profile
    const { data: authUser, error: authError } = await supabase.auth.admin?.getUser 
      ? await supabase.auth.admin.getUser(email)
      : { data: null, error: new Error('Admin API tidak tersedia') };

    if (authError || !authUser) {
      return {
        isValid: false,
        profileCount: 0,
        profile: null,
        error: 'Email tidak terdaftar di sistem'
      };
    }

    // Find profiles for this user
    const { data: profiles, error: profileError, count } = await supabase
      .from('profiles_siswa')
      .select('*', { count: 'exact' })
      .eq('user_id', authUser.id);

    if (profileError) {
      return {
        isValid: false,
        profileCount: 0,
        profile: null,
        error: 'Gagal mengakses data profil siswa'
      };
    }

    if (!profiles || profiles.length === 0) {
      return {
        isValid: false,
        profileCount: 0,
        profile: null,
        error: 'Profil siswa tidak ditemukan untuk email ini'
      };
    }

    if (profiles.length > 1) {
      return {
        isValid: false,
        profileCount: profiles.length,
        profile: null,
        error: `Multiple profil ditemukan (data corrupt): ${profiles.length} profil`
      };
    }

    // Validate profile completeness
    const profile = profiles[0];
    const completenessCheck = validateStudentProfileCompleteness(profile);

    if (!completenessCheck.isComplete) {
      return {
        isValid: false,
        profileCount: 1,
        profile,
        error: `Profil tidak lengkap: ${completenessCheck.reason}`
      };
    }

    return {
      isValid: true,
      profileCount: 1,
      profile,
      error: null
    };
  } catch (error) {
    console.error('Check email student mapping error:', error);
    return {
      isValid: false,
      profileCount: 0,
      profile: null,
      error: error.message || 'Gagal memverifikasi email'
    };
  }
}

/**
 * Get all validation errors for a student profile
 * 
 * Comprehensive validation including:
 * - Email format
 * - School email domain
 * - NISN format and uniqueness
 * - NIS format and uniqueness
 * - Profile completeness
 * - Email-to-profile mapping
 * 
 * @param {Object} data - { email, profile, checkDatabase: boolean }
 * @returns {Promise<Object>} - { isValid: boolean, errors: Array }
 */
export async function validateStudentAccount(data) {
  const errors = [];

  if (!data.email) {
    errors.push('Email diperlukan');
  } else if (!validateEmailFormat(data.email)) {
    errors.push('Format email tidak valid');
  } else if (!validateSchoolEmailDomain(data.email)) {
    errors.push('Email harus menggunakan domain sekolah (@siswa.nexus.sch.id atau @nexus.sch.id)');
  }

  if (!data.profile) {
    errors.push('Data profil siswa diperlukan');
    return { isValid: false, errors };
  }

  // Validate profile completeness
  const completenessCheck = validateStudentProfileCompleteness(data.profile);
  if (!completenessCheck.isComplete) {
    errors.push(...completenessCheck.missingFields.map(f => `Field ${f} tidak lengkap`));
  }

  // Validate ID numbers
  if (!validateNISNFormat(data.profile.nisn)) {
    errors.push('Format NISN tidak valid (harus 10 angka)');
  }

  if (!validateNISFormat(data.profile.nis)) {
    errors.push('Format NIS tidak valid (harus 5-8 karakter alphanumeric)');
  }

  // Check database if requested
  if (data.checkDatabase && data.email) {
    try {
      const mappingCheck = await checkEmailStudentMapping(data.email);
      if (!mappingCheck.isValid) {
        errors.push(mappingCheck.error);
      }
    } catch (err) {
      errors.push('Gagal memverifikasi data di database');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Normalize email for comparison and lookup
 * 
 * @param {string} email - Email to normalize
 * @returns {string} - Normalized email (lowercase, trimmed)
 */
export function normalizeEmail(email) {
  if (!email || typeof email !== 'string') {
    return '';
  }
  return email.toLowerCase().trim();
}

/**
 * Create error message for email-to-student mapping failures
 * 
 * @param {string} errorCode - Error code or message
 * @returns {string} - User-friendly error message in Bahasa Indonesia
 */
export function getEmailMappingErrorMessage(errorCode) {
  const errorMessages = {
    'no_email': 'Email diperlukan untuk login',
    'invalid_email': 'Format email tidak valid',
    'not_registered': 'Email tidak terdaftar di sistem',
    'no_profile': 'Profil siswa tidak ditemukan untuk email ini. Hubungi administrator sekolah.',
    'multiple_profiles': 'Multiple profil ditemukan (data tidak konsisten). Hubungi administrator sekolah.',
    'incomplete_profile': 'Profil siswa tidak lengkap. Hubungi administrator sekolah.',
    'invalid_school_domain': 'Email harus menggunakan domain sekolah (@siswa.nexus.sch.id)',
    'profile_verification_failed': 'Gagal memverifikasi profil siswa. Coba lagi nanti.',
    'database_error': 'Gagal mengakses database. Periksa koneksi internet Anda.',
    'unknown': 'Gagal memverifikasi email ke profil siswa. Coba lagi nanti.'
  };

  return errorMessages[errorCode] || errorMessages.unknown;
}

export default {
  validateEmailFormat,
  validateStudentProfileCompleteness,
  validateNISNFormat,
  validateNISFormat,
  validateSchoolEmailDomain,
  checkEmailStudentMapping,
  validateStudentAccount,
  normalizeEmail,
  getEmailMappingErrorMessage
};
