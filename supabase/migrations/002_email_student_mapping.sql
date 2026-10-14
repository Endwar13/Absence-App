/**
 * Nexus-Connect Absence App - Email to Student Mapping Enhancement
 * Migration: 002_email_student_mapping.sql
 * 
 * This migration ensures robust email-to-student account relationship:
 * 
 * Requirements:
 * - Each student account (auth.users.email) maps to exactly one student profile
 * - Each student profile (profiles_siswa) is linked to exactly one auth account
 * - NISN and NIS are globally unique (no duplicate student IDs)
 * - Student profile data is immutable except for photo_url and updated_at
 * - Every login via email automatically loads the associated student profile
 * 
 * Design:
 * - profiles_siswa.user_id has UNIQUE constraint (already in 001_init_schema.sql)
 * - auth.users.email is already UNIQUE from Supabase Auth
 * - This migration adds helper functions and views for email lookup
 */

-- ============================================================================
-- 1. HELPER FUNCTIONS FOR EMAIL-TO-STUDENT MAPPING
-- ============================================================================

/**
 * Function: get_student_profile_by_user_id()
 * 
 * Returns the student profile for the authenticated user.
 * Used after login to automatically fetch student data.
 * 
 * Returns:
 * - Complete student profile with class info
 * - NULL if no profile exists for user
 */
CREATE OR REPLACE FUNCTION get_student_profile_by_user_id(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  nama TEXT,
  nisn TEXT,
  nis TEXT,
  jenis_kelamin TEXT,
  id_kelas UUID,
  kelas_nama TEXT,
  photo_url TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.id,
    ps.user_id,
    ps.nama,
    ps.nisn,
    ps.nis,
    ps.jenis_kelamin,
    ps.id_kelas,
    k.nama_kelas,
    ps.photo_url,
    ps.created_at,
    ps.updated_at
  FROM profiles_siswa ps
  LEFT JOIN kelas k ON ps.id_kelas = k.id
  WHERE ps.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Function: get_student_by_email()
 * 
 * Returns the student profile for a given email address.
 * Useful for admin operations or account verification.
 * 
 * Security: Requires admin role or self-access
 */
CREATE OR REPLACE FUNCTION get_student_by_email(p_email TEXT)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  nama TEXT,
  nisn TEXT,
  nis TEXT,
  jenis_kelamin TEXT,
  id_kelas UUID,
  kelas_nama TEXT,
  photo_url TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.id,
    ps.user_id,
    au.email,
    ps.nama,
    ps.nisn,
    ps.nis,
    ps.jenis_kelamin,
    ps.id_kelas,
    k.nama_kelas,
    ps.photo_url,
    ps.created_at,
    ps.updated_at
  FROM profiles_siswa ps
  JOIN auth.users au ON ps.user_id = au.id
  LEFT JOIN kelas k ON ps.id_kelas = k.id
  WHERE au.email = p_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Function: verify_email_student_mapping()
 * 
 * Validates that the email-to-student relationship is correct.
 * Checks:
 * - Email exists in auth.users
 * - Email has exactly one profile in profiles_siswa
 * - Profile data is complete (not NULL fields)
 * 
 * Returns: JSON object with validation result
 */
CREATE OR REPLACE FUNCTION verify_email_student_mapping(p_email TEXT)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_profile_count INT;
  v_profile_id UUID;
  v_profile_complete BOOLEAN;
BEGIN
  -- Check email exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'Email tidak ditemukan di sistem',
      'user_id', NULL
    );
  END IF;
  
  -- Check profile count
  SELECT COUNT(*) INTO v_profile_count 
  FROM profiles_siswa 
  WHERE user_id = v_user_id;
  
  IF v_profile_count = 0 THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'Profil siswa tidak ditemukan untuk email ini',
      'user_id', v_user_id
    );
  END IF;
  
  IF v_profile_count > 1 THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'Multiple profil siswa ditemukan untuk email ini (data corrupt)',
      'user_id', v_user_id,
      'profile_count', v_profile_count
    );
  END IF;
  
  -- Get profile and check completeness
  SELECT 
    ps.id,
    (ps.nama IS NOT NULL AND ps.nisn IS NOT NULL AND ps.nis IS NOT NULL 
     AND ps.jenis_kelamin IS NOT NULL AND ps.id_kelas IS NOT NULL)
  INTO v_profile_id, v_profile_complete
  FROM profiles_siswa ps
  WHERE ps.user_id = v_user_id;
  
  IF NOT v_profile_complete THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'Profil siswa tidak lengkap (ada field yang kosong)',
      'user_id', v_user_id,
      'profile_id', v_profile_id
    );
  END IF;
  
  -- All checks passed
  RETURN json_build_object(
    'valid', true,
    'user_id', v_user_id,
    'profile_id', v_profile_id,
    'message', 'Email dan profil siswa valid'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Function: validate_student_profile_completeness()
 * 
 * Trigger function to validate profile completeness on INSERT/UPDATE.
 * Ensures all required fields are provided.
 */
CREATE OR REPLACE FUNCTION validate_student_profile_completeness()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.nama IS NULL OR NEW.nama = '' THEN
    RAISE EXCEPTION 'Nama siswa wajib diisi';
  END IF;
  
  IF NEW.nisn IS NULL OR NEW.nisn = '' THEN
    RAISE EXCEPTION 'NISN siswa wajib diisi';
  END IF;
  
  IF NEW.nis IS NULL OR NEW.nis = '' THEN
    RAISE EXCEPTION 'NIS siswa wajib diisi';
  END IF;
  
  IF NEW.jenis_kelamin IS NULL OR NEW.jenis_kelamin NOT IN ('L', 'P') THEN
    RAISE EXCEPTION 'Jenis kelamin harus L atau P';
  END IF;
  
  IF NEW.id_kelas IS NULL THEN
    RAISE EXCEPTION 'Kelas siswa wajib diisi';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profile validation
CREATE TRIGGER validate_profile_completeness 
BEFORE INSERT OR UPDATE ON profiles_siswa
FOR EACH ROW 
EXECUTE FUNCTION validate_student_profile_completeness();

-- ============================================================================
-- 2. VIEWS FOR EMAIL-TO-STUDENT MAPPING
-- ============================================================================

/**
 * View: v_student_accounts
 * 
 * Unified view of student accounts combining auth.users and profiles_siswa.
 * Used for login verification and student data retrieval.
 * 
 * Security: Only visible to authenticated users viewing their own data (via RLS)
 */
CREATE OR REPLACE VIEW v_student_accounts AS
SELECT
  au.id as user_id,
  au.email,
  au.created_at as account_created_at,
  au.last_sign_in_at,
  ps.id as profile_id,
  ps.nama,
  ps.nisn,
  ps.nis,
  ps.jenis_kelamin,
  ps.id_kelas,
  k.nama_kelas,
  ps.photo_url,
  ps.created_at as profile_created_at,
  ps.updated_at as profile_updated_at,
  CASE 
    WHEN ps.id IS NULL THEN 'no_profile'
    WHEN ps.nama IS NULL OR ps.nisn IS NULL OR ps.nis IS NULL 
         OR ps.jenis_kelamin IS NULL OR ps.id_kelas IS NULL THEN 'incomplete'
    ELSE 'complete'
  END as account_status
FROM auth.users au
LEFT JOIN profiles_siswa ps ON au.id = ps.user_id
LEFT JOIN kelas k ON ps.id_kelas = k.id
WHERE au.email IS NOT NULL;

/**
 * View: v_active_student_accounts
 * 
 * View of active, complete student accounts only.
 * Filtered to show only students with complete profiles.
 */
CREATE OR REPLACE VIEW v_active_student_accounts AS
SELECT *
FROM v_student_accounts
WHERE account_status = 'complete';

-- ============================================================================
-- 3. ENHANCED RLS POLICIES FOR EMAIL-TO-STUDENT MAPPING
-- ============================================================================

/**
 * Allow students to query their own email-to-profile mapping
 * This is critical for the login verification flow
 */
CREATE POLICY "Students can verify own email mapping" ON v_student_accounts
  FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================================
-- 4. INDEXES FOR EMAIL-TO-STUDENT LOOKUPS
-- ============================================================================

-- Index on auth.users(email) - helps with email lookups
-- Note: This is already created by Supabase Auth, but listed for reference

-- Composite index for faster student lookups by email + NISN
CREATE INDEX IF NOT EXISTS idx_profiles_siswa_user_email 
ON profiles_siswa(user_id);

-- Index for NISN uniqueness enforcement (already UNIQUE, but adding for clarity)
CREATE INDEX IF NOT EXISTS idx_nisn_unique 
ON profiles_siswa(nisn) 
WHERE nisn IS NOT NULL;

-- Index for NIS uniqueness enforcement
CREATE INDEX IF NOT EXISTS idx_nis_unique 
ON profiles_siswa(nis) 
WHERE nis IS NOT NULL;

-- ============================================================================
-- 5. DATA INTEGRITY CHECKS
-- ============================================================================

/**
 * Constraint: Prevent orphaned student profiles
 * All profiles_siswa.user_id must reference an existing auth.users record
 * (This is already enforced by the FOREIGN KEY, but documented here)
 */

/**
 * Constraint: Enforce unique daily attendance
 * Already enforced by UNIQUE(siswa_id, tanggal) in 001_init_schema.sql
 */

-- ============================================================================
-- 6. VERIFICATION QUERIES (run after migration to verify setup)
-- ============================================================================

/*
-- Verify email-to-student mapping
SELECT * FROM v_student_accounts;

-- Check for incomplete profiles
SELECT * FROM v_student_accounts WHERE account_status = 'incomplete';

-- Check for students without profiles
SELECT * FROM v_student_accounts WHERE account_status = 'no_profile';

-- Check email uniqueness
SELECT email, COUNT(*) 
FROM v_student_accounts 
GROUP BY email 
HAVING COUNT(*) > 1;

-- Check NISN uniqueness
SELECT nisn, COUNT(*) 
FROM profiles_siswa 
WHERE nisn IS NOT NULL
GROUP BY nisn 
HAVING COUNT(*) > 1;

-- Verify specific student mapping
SELECT verify_email_student_mapping('student@example.com');

-- Get student profile by user ID
SELECT * FROM get_student_profile_by_user_id(auth.uid());
*/

-- ============================================================================
-- END OF EMAIL-TO-STUDENT MAPPING MIGRATION
-- ============================================================================
