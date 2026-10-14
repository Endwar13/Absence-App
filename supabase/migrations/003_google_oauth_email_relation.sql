/**
 * Nexus-Connect Absence App - Google OAuth and Student Email Relationship
 * Migration: 003_google_oauth_email_relation.sql
 * 
 * This migration establishes a strict 1-to-1 relationship between:
 * 1. Supabase Auth Google OAuth users (auth.users)
 * 2. Student Profile table (profiles_siswa)
 * 
 * Requirements:
 * - profiles_siswa has an explicit UNIQUE 'email' column
 * - Google OAuth logins automatically link with existing student profiles by email
 * - If a new student authenticates with Google, an initial profile is provisioned
 * - Each email is strictly bound to at most ONE student profile
 */

-- ============================================================================
-- 1. ALTER profiles_siswa TO ADD EXPLICIT EMAIL COLUMN & UNIQUE CONSTRAINT
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles_siswa' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles_siswa ADD COLUMN email TEXT;
  END IF;
END $$;

-- Populate email from existing auth.users for existing profiles
UPDATE profiles_siswa ps
SET email = au.email
FROM auth.users au
WHERE ps.user_id = au.id AND ps.email IS NULL;

-- Enforce UNIQUE constraint on email in profiles_siswa
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_profiles_siswa_email'
  ) THEN
    ALTER TABLE profiles_siswa ADD CONSTRAINT uq_profiles_siswa_email UNIQUE (email);
  END IF;
END $$;

-- Create index for email searches
CREATE INDEX IF NOT EXISTS idx_profiles_siswa_email ON profiles_siswa (LOWER(email));

-- ============================================================================
-- 2. FUNCTION TO LINK OR PROVISION GOOGLE OAUTH STUDENT PROFILE
-- ============================================================================

CREATE OR REPLACE FUNCTION link_google_oauth_student_profile(
  p_user_id UUID,
  p_email TEXT,
  p_nama TEXT DEFAULT NULL,
  p_photo_url TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_clean_email TEXT := LOWER(TRIM(p_email));
  v_existing_profile profiles_siswa%ROWTYPE;
  v_result JSON;
  v_class_id UUID;
BEGIN
  -- 1. Check if profile exists by email
  SELECT * INTO v_existing_profile
  FROM profiles_siswa
  WHERE LOWER(email) = v_clean_email;

  IF FOUND THEN
    -- If profile was found, update user_id to link with Google Auth
    UPDATE profiles_siswa
    SET 
      user_id = p_user_id,
      email = v_clean_email,
      photo_url = COALESCE(photo_url, p_photo_url),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = v_existing_profile.id;

    RETURN json_build_object(
      'status', 'linked',
      'profile_id', v_existing_profile.id,
      'email', v_clean_email,
      'nama', v_existing_profile.nama,
      'message', 'Profil siswa berhasil ditautkan dengan Google OAuth'
    );
  END IF;

  -- 2. If not found by email, check by user_id
  SELECT * INTO v_existing_profile
  FROM profiles_siswa
  WHERE user_id = p_user_id;

  IF FOUND THEN
    -- Update email
    UPDATE profiles_siswa
    SET 
      email = v_clean_email,
      photo_url = COALESCE(photo_url, p_photo_url),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = v_existing_profile.id;

    RETURN json_build_object(
      'status', 'updated',
      'profile_id', v_existing_profile.id,
      'email', v_clean_email,
      'nama', v_existing_profile.nama,
      'message', 'Email akun siswa diperbarui dengan akun Google'
    );
  END IF;

  -- 3. Auto-provision new student profile for newly authenticated Google account
  -- Get default class
  SELECT id INTO v_class_id FROM kelas LIMIT 1;

  INSERT INTO profiles_siswa (
    user_id,
    email,
    nama,
    nisn,
    nis,
    jenis_kelamin,
    id_kelas,
    photo_url
  ) VALUES (
    p_user_id,
    v_clean_email,
    COALESCE(p_nama, SPLIT_PART(v_clean_email, '@', 1)),
    '00' || LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0'),
    '2122' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
    'L',
    v_class_id,
    p_photo_url
  )
  RETURNING * INTO v_existing_profile;

  RETURN json_build_object(
    'status', 'provisioned',
    'profile_id', v_existing_profile.id,
    'email', v_clean_email,
    'nama', v_existing_profile.nama,
    'message', 'Profil siswa baru berhasil dibuat dan terikat dengan Google OAuth'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. UPDATE verify_email_student_mapping TO USE EMAIL COLUMN
-- ============================================================================

CREATE OR REPLACE FUNCTION verify_email_student_mapping(p_email TEXT)
RETURNS JSON AS $$
DECLARE
  v_clean_email TEXT := LOWER(TRIM(p_email));
  v_profile profiles_siswa%ROWTYPE;
BEGIN
  -- Direct check in profiles_siswa table by email
  SELECT * INTO v_profile
  FROM profiles_siswa
  WHERE LOWER(email) = v_clean_email;

  IF FOUND THEN
    RETURN json_build_object(
      'valid', true,
      'user_id', v_profile.user_id,
      'profile_id', v_profile.id,
      'email', v_profile.email,
      'nama', v_profile.nama,
      'nisn', v_profile.nisn,
      'nis', v_profile.nis,
      'message', 'Email Google terverifikasi dan terikat dengan tabel siswa'
    );
  END IF;

  RETURN json_build_object(
    'valid', false,
    'error', 'Email belum terikat dengan profil siswa',
    'user_id', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
