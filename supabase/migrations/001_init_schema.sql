/**
 * Nexus-Connect Absence App - Supabase PostgreSQL Schema
 * Migration: 001_init_schema.sql
 * 
 * This migration creates the complete database schema for the Siswa Role MVP:
 * - Authentication tables (managed by Supabase Auth)
 * - Student profiles
 * - Classes and teachers
 * - Attendance records
 * - Leave requests
 * - Class schedules
 * - Row-Level Security (RLS) policies
 * 
 * Execute this file in Supabase SQL Editor to set up the database.
 */

-- ============================================================================
-- 1. CORE TABLES
-- ============================================================================

/**
 * Table: guru
 * 
 * Teacher/staff information. References Supabase auth.users for authentication.
 * Stores teacher profile data: name, NIP, role, assigned class, specialization.
 * 
 * Roles:
 * - 'guru_mapel': Subject teacher
 * - 'wali_kelas': Homeroom teacher
 * - 'keduanya': Both subject and homeroom teacher
 */
CREATE TABLE IF NOT EXISTS guru (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  nip TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('guru_mapel', 'wali_kelas', 'keduanya')),
  id_kelas UUID,
  speciality TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/**
 * Table: kelas
 * 
 * Class information. Groups students and teachers.
 * Each class has one homeroom teacher (wali_kelas).
 * 
 * Example: XII Rekayasa Perangkat Lunak 1
 */
CREATE TABLE IF NOT EXISTS kelas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_kelas TEXT NOT NULL UNIQUE,
  tahun_ajaran TEXT NOT NULL,
  wali_kelas_id UUID NOT NULL REFERENCES guru(id) ON DELETE RESTRICT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key for guru.id_kelas after kelas is created
ALTER TABLE guru 
ADD CONSTRAINT fk_guru_id_kelas 
FOREIGN KEY (id_kelas) REFERENCES kelas(id) ON DELETE SET NULL;

/**
 * Table: profiles_siswa
 * 
 * Student profile information. One record per student.
 * References auth.users for authentication and kelas for class assignment.
 * 
 * Required fields (Property 8: Student Profile Completeness):
 * - nama: Student full name
 * - nisn: National Student ID (unique)
 * - nis: School Student ID (unique)
 * - jenis_kelamin: Gender (L/P)
 * - id_kelas: Class assignment
 */
CREATE TABLE IF NOT EXISTS profiles_siswa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  nisn TEXT UNIQUE NOT NULL,
  nis TEXT UNIQUE NOT NULL,
  jenis_kelamin TEXT NOT NULL CHECK (jenis_kelamin IN ('L', 'P')),
  id_kelas UUID NOT NULL REFERENCES kelas(id) ON DELETE RESTRICT,
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/**
 * Table: absen
 * 
 * Attendance records. One record per student per day.
 * Immutable after creation (Property 1: Attendance Immutability).
 * Enforces unique daily attendance (Property 2: Unique Daily Attendance).
 * 
 * Status values: 'Hadir' (Present), 'Sakit' (Sick), 'Izin' (Leave), 'Alpha' (Absent)
 * 
 * Fields:
 * - siswa_id: Reference to student profile
 * - tanggal: Attendance date (DATE format)
 * - status: Attendance status
 * - qr_scan_time: When QR was scanned
 * - selfie_url: Path/URL to selfie in Supabase Storage
 */
CREATE TABLE IF NOT EXISTS absen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id UUID NOT NULL REFERENCES profiles_siswa(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')),
  qr_scan_time TIMESTAMP,
  selfie_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Property 2: Unique daily attendance constraint
  UNIQUE(siswa_id, tanggal)
);

/**
 * Table: pengajuan_ijin
 * 
 * Leave requests submitted by students.
 * Tracks status progression: pending → approved/rejected (Property 5).
 * Optional proof file upload for medical letters, permission letters, etc.
 * 
 * Categories: 'Izin' (Leave), 'Sakit' (Sick), 'Lainnya' (Other)
 * Status: 'pending' (awaiting approval), 'approved', 'rejected'
 */
CREATE TABLE IF NOT EXISTS pengajuan_ijin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id UUID NOT NULL REFERENCES profiles_siswa(id) ON DELETE CASCADE,
  tanggal_tidak_hadir DATE NOT NULL,
  kategori TEXT NOT NULL CHECK (kategori IN ('Izin', 'Sakit', 'Lainnya')),
  deskripsi TEXT NOT NULL,
  bukti_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES guru(id) ON DELETE SET NULL,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/**
 * Table: jadwal_pelajaran
 * 
 * Class schedule/timetable. Defines lessons, teachers, and locations.
 * Links class to teacher(s) for specific subjects at specific times.
 * 
 * Days: Senin, Selasa, Rabu, Kamis, Jumat, Sabtu
 */
CREATE TABLE IF NOT EXISTS jadwal_pelajaran (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_kelas UUID NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
  guru_id UUID NOT NULL REFERENCES guru(id) ON DELETE RESTRICT,
  hari_dalam_minggu TEXT NOT NULL,
  jam_mulai TIME NOT NULL,
  jam_selesai TIME NOT NULL,
  mapel TEXT NOT NULL,
  ruangan TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. INDEXES FOR QUERY OPTIMIZATION
-- ============================================================================

-- Profile indexes
CREATE INDEX IF NOT EXISTS idx_profiles_siswa_user_id ON profiles_siswa(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_siswa_id_kelas ON profiles_siswa(id_kelas);
CREATE INDEX IF NOT EXISTS idx_profiles_siswa_nisn ON profiles_siswa(nisn);
CREATE INDEX IF NOT EXISTS idx_profiles_siswa_nis ON profiles_siswa(nis);

-- Attendance indexes
CREATE INDEX IF NOT EXISTS idx_absen_siswa_id ON absen(siswa_id);
CREATE INDEX IF NOT EXISTS idx_absen_tanggal ON absen(tanggal);
CREATE INDEX IF NOT EXISTS idx_absen_status ON absen(status);
CREATE INDEX IF NOT EXISTS idx_absen_siswa_tanggal ON absen(siswa_id, tanggal);

-- Leave request indexes
CREATE INDEX IF NOT EXISTS idx_pengajuan_ijin_siswa_id ON pengajuan_ijin(siswa_id);
CREATE INDEX IF NOT EXISTS idx_pengajuan_ijin_status ON pengajuan_ijin(status);
CREATE INDEX IF NOT EXISTS idx_pengajuan_ijin_tanggal ON pengajuan_ijin(tanggal_tidak_hadir);
CREATE INDEX IF NOT EXISTS idx_pengajuan_ijin_created_at ON pengajuan_ijin(created_at);

-- Schedule indexes
CREATE INDEX IF NOT EXISTS idx_jadwal_pelajaran_kelas ON jadwal_pelajaran(id_kelas);
CREATE INDEX IF NOT EXISTS idx_jadwal_pelajaran_guru ON jadwal_pelajaran(guru_id);
CREATE INDEX IF NOT EXISTS idx_jadwal_pelajaran_hari ON jadwal_pelajaran(hari_dalam_minggu);

-- Teacher indexes
CREATE INDEX IF NOT EXISTS idx_guru_user_id ON guru(user_id);
CREATE INDEX IF NOT EXISTS idx_guru_id_kelas ON guru(id_kelas);
CREATE INDEX IF NOT EXISTS idx_guru_status ON guru(status);

-- Class indexes
CREATE INDEX IF NOT EXISTS idx_kelas_wali_kelas_id ON kelas(wali_kelas_id);

-- ============================================================================
-- 3. ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

/**
 * IMPORTANT: Enable RLS on all tables
 * This ensures data access control at the database level
 */

-- ==================== profiles_siswa RLS ====================

ALTER TABLE profiles_siswa ENABLE ROW LEVEL SECURITY;

-- Students can read their own profile
CREATE POLICY "Students read own profile" ON profiles_siswa
  FOR SELECT
  USING (auth.uid() = user_id);

-- Teachers can read profiles of students in their class
CREATE POLICY "Teachers read class students" ON profiles_siswa
  FOR SELECT
  USING (
    id_kelas IN (
      SELECT id FROM kelas WHERE wali_kelas_id IN (
        SELECT id FROM guru WHERE user_id = auth.uid()
      )
    )
  );

-- Students cannot modify their own profile (admin only)
CREATE POLICY "Prevent direct student profile modification" ON profiles_siswa
  FOR UPDATE
  USING (false);

CREATE POLICY "Prevent direct student profile deletion" ON profiles_siswa
  FOR DELETE
  USING (false);

-- ==================== absen RLS ====================

ALTER TABLE absen ENABLE ROW LEVEL SECURITY;

-- Students can read their own attendance records
CREATE POLICY "Students read own attendance" ON absen
  FOR SELECT
  USING (
    siswa_id IN (
      SELECT id FROM profiles_siswa WHERE user_id = auth.uid()
    )
  );

-- Teachers can read attendance for their class
CREATE POLICY "Teachers read class attendance" ON absen
  FOR SELECT
  USING (
    siswa_id IN (
      SELECT id FROM profiles_siswa 
      WHERE id_kelas IN (
        SELECT id FROM kelas WHERE wali_kelas_id IN (
          SELECT id FROM guru WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Students can create their own attendance records
CREATE POLICY "Students create own attendance" ON absen
  FOR INSERT
  WITH CHECK (
    siswa_id IN (
      SELECT id FROM profiles_siswa WHERE user_id = auth.uid()
    )
  );

-- Attendance records are immutable after creation (Property 1)
CREATE POLICY "Prevent attendance modification" ON absen
  FOR UPDATE
  USING (false);

CREATE POLICY "Prevent attendance deletion" ON absen
  FOR DELETE
  USING (false);

-- ==================== pengajuan_ijin RLS ====================

ALTER TABLE pengajuan_ijin ENABLE ROW LEVEL SECURITY;

-- Students can read their own leave requests
CREATE POLICY "Students read own leave requests" ON pengajuan_ijin
  FOR SELECT
  USING (
    siswa_id IN (
      SELECT id FROM profiles_siswa WHERE user_id = auth.uid()
    )
  );

-- Teachers can read leave requests from their class
CREATE POLICY "Teachers read class leave requests" ON pengajuan_ijin
  FOR SELECT
  USING (
    siswa_id IN (
      SELECT id FROM profiles_siswa 
      WHERE id_kelas IN (
        SELECT id FROM kelas WHERE wali_kelas_id IN (
          SELECT id FROM guru WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Students can create their own leave requests
CREATE POLICY "Students create own leave requests" ON pengajuan_ijin
  FOR INSERT
  WITH CHECK (
    siswa_id IN (
      SELECT id FROM profiles_siswa WHERE user_id = auth.uid()
    )
  );

-- Students cannot modify their requests
CREATE POLICY "Students cannot modify own requests" ON pengajuan_ijin
  FOR UPDATE
  USING (false);

CREATE POLICY "Students cannot delete own requests" ON pengajuan_ijin
  FOR DELETE
  USING (false);

-- ==================== jadwal_pelajaran RLS ====================

ALTER TABLE jadwal_pelajaran ENABLE ROW LEVEL SECURITY;

-- Students can read schedules for their own class
CREATE POLICY "Students read own class schedule" ON jadwal_pelajaran
  FOR SELECT
  USING (
    id_kelas IN (
      SELECT id_kelas FROM profiles_siswa WHERE user_id = auth.uid()
    )
  );

-- Teachers can read schedules for their classes
CREATE POLICY "Teachers read own schedules" ON jadwal_pelajaran
  FOR SELECT
  USING (
    id_kelas IN (
      SELECT id FROM kelas WHERE wali_kelas_id IN (
        SELECT id FROM guru WHERE user_id = auth.uid()
      )
    )
    OR
    guru_id IN (
      SELECT id FROM guru WHERE user_id = auth.uid()
    )
  );

-- No one can modify schedules (admin only, managed outside RLS)
CREATE POLICY "Prevent schedule modification" ON jadwal_pelajaran
  FOR UPDATE
  USING (false);

CREATE POLICY "Prevent schedule deletion" ON jadwal_pelajaran
  FOR DELETE
  USING (false);

-- ==================== guru RLS ====================

ALTER TABLE guru ENABLE ROW LEVEL SECURITY;

-- Teachers can read their own profile
CREATE POLICY "Teachers read own profile" ON guru
  FOR SELECT
  USING (auth.uid() = user_id);

-- Students can read teacher info for their class teachers
CREATE POLICY "Students read class teachers" ON guru
  FOR SELECT
  USING (
    id IN (
      SELECT wali_kelas_id FROM kelas 
      WHERE id IN (
        SELECT id_kelas FROM profiles_siswa WHERE user_id = auth.uid()
      )
    )
    OR
    id IN (
      SELECT guru_id FROM jadwal_pelajaran
      WHERE id_kelas IN (
        SELECT id_kelas FROM profiles_siswa WHERE user_id = auth.uid()
      )
    )
  );

-- No one can modify teachers (admin only)
CREATE POLICY "Prevent teacher modification" ON guru
  FOR UPDATE
  USING (false);

CREATE POLICY "Prevent teacher deletion" ON guru
  FOR DELETE
  USING (false);

-- ==================== kelas RLS ====================

ALTER TABLE kelas ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read class info
-- (Teachers need to see classes they teach, students need to see their class)
CREATE POLICY "Authenticated read classes" ON kelas
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- No one can modify classes (admin only)
CREATE POLICY "Prevent class modification" ON kelas
  FOR UPDATE
  USING (false);

CREATE POLICY "Prevent class deletion" ON kelas
  FOR DELETE
  USING (false);

-- ============================================================================
-- 4. STORAGE BUCKET SETUP (Execute in Supabase Storage UI)
-- ============================================================================

/**
 * Create these storage buckets in Supabase Storage:
 * 
 * 1. attendance-selfies
 *    - Private bucket
 *    - Stores selfie photos from attendance submission
 *    - File path format: {studentId}/{timestamp}.jpg
 *    - Retention: 30 days (set via lifecycle policy)
 *    - Max file size: 5MB
 * 
 * 2. leave-request-proof
 *    - Private bucket
 *    - Stores proof documents (medical letters, permission letters, etc.)
 *    - File path format: {studentId}/{timestamp}.{ext}
 *    - Retention: 30 days (set via lifecycle policy)
 *    - Max file size: 10MB
 * 
 * 3. profile-photos
 *    - Private bucket
 *    - Stores student profile photos
 *    - File path format: {profileId}_{timestamp}.jpg
 *    - Retention: 1 year (set via lifecycle policy)
 *    - Max file size: 5MB
 */

-- ============================================================================
-- 5. FUNCTIONS AND TRIGGERS (Optional, for advanced features)
-- ============================================================================

/**
 * Function: update_updated_at_timestamp()
 * 
 * Automatically updates the updated_at timestamp when a record is modified.
 * Used by triggers on all tables.
 */
CREATE OR REPLACE FUNCTION update_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update timestamp trigger to all tables
CREATE TRIGGER update_guru_updated_at BEFORE UPDATE ON guru
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_timestamp();

CREATE TRIGGER update_kelas_updated_at BEFORE UPDATE ON kelas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_timestamp();

CREATE TRIGGER update_profiles_siswa_updated_at BEFORE UPDATE ON profiles_siswa
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_timestamp();

CREATE TRIGGER update_absen_updated_at BEFORE UPDATE ON absen
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_timestamp();

CREATE TRIGGER update_pengajuan_ijin_updated_at BEFORE UPDATE ON pengajuan_ijin
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_timestamp();

CREATE TRIGGER update_jadwal_pelajaran_updated_at BEFORE UPDATE ON jadwal_pelajaran
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_timestamp();

-- ============================================================================
-- 6. SAMPLE DATA (Optional - for testing/development)
-- ============================================================================

/**
 * Uncomment and execute this section to populate sample data.
 * Replace UUIDs and credentials with real values from your environment.
 * 
 * IMPORTANT: Only run this in development environment!
 */

-- -- Insert sample teachers (requires auth.users to be created via Supabase Auth UI)
INSERT INTO guru (id, user_id, nama, nip, status, speciality) VALUES
('teacher-001', 'auth-user-teacher-001', 'Budi Santoso, S.Pd., M.Kom', '19800315200501100008', 'keduanya', 'Rekayasa Perangkat Lunak');

-- -- Insert sample class
INSERT INTO kelas (id, nama_kelas, tahun_ajaran, wali_kelas_id) VALUES
('class-001', 'XII Rekayasa Perangkat Lunak 1', 'TA 2024/2025', 'teacher-001');

-- -- Insert sample student profiles (requires auth.users to be created via Supabase Auth UI)
INSERT INTO profiles_siswa (id, user_id, nama, nisn, nis, jenis_kelamin, id_kelas) VALUES
('student-001', 'auth-user-student-001', 'Bayu Setiawan', '0054819231', '21221045', 'L', 'class-001');

-- -- Insert sample attendance record
INSERT INTO absen (id, siswa_id, tanggal, status, selfie_url) VALUES
('att-001', 'student-001', CURRENT_DATE, 'Hadir', 'attendance-selfies/student-001/1729000000000.jpg');

-- -- Insert sample leave request
INSERT INTO pengajuan_ijin (id, siswa_id, tanggal_tidak_hadir, kategori, deskripsi, status) VALUES
('leave-001', 'student-001', CURRENT_DATE + INTERVAL '1 day', 'Sakit', 'Demam dan flu', 'pending');

-- -- Insert sample schedule
INSERT INTO jadwal_pelajaran (id, id_kelas, guru_id, hari_dalam_minggu, jam_mulai, jam_selesai, mapel, ruangan) VALUES
('schedule-001', 'class-001', 'teacher-001', 'Senin', '07:00:00', '08:30:00', 'Pemrograman Web', 'Lab RPL 1');

-- ============================================================================
-- 7. VERIFICATION QUERIES
-- ============================================================================

/**
 * Run these queries to verify the schema is set up correctly:
 */

-- Check all tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check indexes
SELECT schemaname, tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename;

-- Check RLS policies
SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;

-- ============================================================================
-- END OF SCHEMA MIGRATION
-- ============================================================================
