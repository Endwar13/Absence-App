# Supabase Integration - Absence App

Direktori ini berisi semua file Supabase untuk backend Absence App.

## File Structure

```
supabase/
├── migrations/
│   └── 001_init_schema.sql      # Database schema (tables, indexes, RLS policies)
├── SETUP.md                      # Setup guide lengkap
└── README.md                     # File ini
```

## Quick Start

### 1. Setup Supabase Project

Ikuti panduan lengkap di `SETUP.md`:

```bash
# Read setup guide
cat SETUP.md
```

### 2. Configure Environment

Buat `.env.local` di root project:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run Database Migration

Di Supabase SQL Editor, execute file `001_init_schema.sql`

### 4. Create Storage Buckets

Via Supabase Storage UI, create buckets:
- `attendance-selfies`
- `leave-request-proof`
- `profile-photos`

### 5. Setup Authentication

Create test users via Supabase Auth > Users

### 6. Test Connection

```bash
npm run dev
# Test login at http://localhost:5173
```

## Database Schema Overview

### Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `guru` | Teachers/Staff | user_id, nama, nip, status (guru_mapel/wali_kelas/keduanya) |
| `kelas` | Classes | nama_kelas, tahun_ajaran, wali_kelas_id |
| `profiles_siswa` | Student profiles | user_id, nama, nisn, nis, jenis_kelamin, id_kelas |
| `absen` | Attendance records | siswa_id, tanggal, status, selfie_url (immutable) |
| `pengajuan_ijin` | Leave requests | siswa_id, tanggal_tidak_hadir, kategori, bukti_url, status |
| `jadwal_pelajaran` | Class schedules | id_kelas, guru_id, hari, jam_mulai, jam_selesai, mapel |

### Row-Level Security (RLS)

All tables have RLS enabled with policies:

- **profiles_siswa**: Students read own, teachers read class students
- **absen**: Students create/read own, immutable after creation
- **pengajuan_ijin**: Students create/read own, teachers read class requests
- **jadwal_pelajaran**: Students read own class schedule
- **guru**: Teachers read own, students read class teachers
- **kelas**: All authenticated users can read

### Storage Buckets

| Bucket | Size Limit | File Type | Purpose |
|--------|-----------|-----------|---------|
| attendance-selfies | 5 MB | JPEG, PNG | Selfie verification for attendance |
| leave-request-proof | 10 MB | PDF, JPEG, PNG | Medical letters, permission letters |
| profile-photos | 5 MB | JPEG, PNG, WebP | Student profile pictures |

## Correctness Properties Enforced

### Property 1: Attendance Immutability ✓
- Attendance records cannot be modified or deleted after creation
- Implemented via RLS policy: `Prevent attendance modification` and `Prevent attendance deletion`

### Property 2: Unique Daily Attendance ✓
- Maximum one attendance record per student per day
- Implemented via UNIQUE constraint: `UNIQUE(siswa_id, tanggal)`
- Enforced in code: check before insert

### Property 3: Leave Request Temporal Constraint ✓
- Izin requests must be H-1 or later
- Sakit requests can be same day or future
- Validated in `leaveRequestService.submitLeaveRequest()`

### Property 4: Self-Owned Data Access ✓
- Students only access their own records
- Implemented via RLS policies with `auth.uid()` checks

### Property 5: Leave Request Status Progression ✓
- Status transitions: pending → approved/rejected
- Enforced in code: requests start as 'pending'
- Status change only via teacher/admin (not in student RLS)

### Property 6: File Upload Persistence ✓
- Files stored in Supabase Storage with signed URLs
- 30-day auto-delete via lifecycle policies

### Property 7: Class Schedule Consistency ✓
- Students only see their assigned class schedule
- Enforced via query: filter by student's `id_kelas`

### Property 8: Student Profile Completeness ✓
- All required fields (nama, nisn, nis, jenis_kelamin, id_kelas) must be present
- Validated in `profileService.validateProfileCompleteness()`
- NOT NULL constraints in schema

## API Reference

### Authentication Service

```javascript
import { supabase } from '@/services/supabase'

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'student@school.com',
  password: 'password'
})

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'student@school.com',
  password: 'password'
})

// Logout
await supabase.auth.signOut()

// Get current user
const { data: { user } } = await supabase.auth.getUser()

// Listen for auth changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event)
})
```

### Attendance Service

```javascript
import attendanceService from '@/services/attendanceService'

// Submit attendance
const result = await attendanceService.submitAttendance(siswaId, {
  qrData: 'QR_CODE_DATA',
  selfieFile: blobFromCamera,
  locationName: 'Lab RPL 1',
  radiusMeters: 12
})

// Get attendance history
const { data, total } = await attendanceService.getAttendanceHistory(siswaId, {
  status: 'Hadir',
  limit: 10,
  offset: 0
})

// Check today's attendance
const { hasAttended, record } = await attendanceService.getTodayAttendance(siswaId)

// Get attendance stats
const stats = await attendanceService.getAttendanceStats(siswaId, {
  startDate: '2024-10-01',
  endDate: '2024-10-31'
})
```

### Leave Request Service

```javascript
import leaveRequestService from '@/services/leaveRequestService'

// Submit leave request
const result = await leaveRequestService.submitLeaveRequest(siswaId, {
  kategori: 'Sakit',  // 'Izin', 'Sakit', 'Lainnya'
  tanggal: '2024-10-25',
  deskripsi: 'Demam dan flu',
  fileData: blobFromFileInput  // optional
})

// Get leave requests
const { data, total, stats } = await leaveRequestService.getLeaveRequests(siswaId, {
  status: 'pending',  // 'pending', 'approved', 'rejected'
  limit: 10,
  offset: 0
})

// Get leave request detail
const request = await leaveRequestService.getLeaveRequestDetail(requestId)

// Get leave stats
const stats = await leaveRequestService.getLeaveStats(siswaId)
```

### Profile Service

```javascript
import profileService from '@/services/profileService'

// Get student profile
const profile = await profileService.getStudentProfile(userId)

// Get profile with class and teacher info
const enrichedProfile = await profileService.getProfileWithRelations(userId)

// Validate profile completeness
const { isComplete, missingFields } = await profileService.validateProfileCompleteness(userId)

// Get student photo
const { photoUrl } = await profileService.getPhotoUrl(profileId)

// Upload student photo (admin only)
const { photoUrl } = await profileService.uploadPhoto(profileId, photoFile)
```

### Class Service

```javascript
import classService from '@/services/classService'

// Get student's class schedule
const schedule = await classService.getStudentClassSchedule(studentId)

// Get specific class schedule
const schedule = await classService.getClassSchedule(classId, 'Senin')

// Get today's schedule
const todaySchedule = await classService.getTodaySchedule(studentId)

// Get class info with teacher
const classInfo = await classService.getClassInfo(classId)

// Get class students (admin only)
const students = await classService.getClassStudents(classId)
```

## Common Operations

### Query Data

```sql
-- Get all attendance for a student
SELECT * FROM absen 
WHERE siswa_id = 'student-uuid'
ORDER BY tanggal DESC;

-- Get pending leave requests
SELECT * FROM pengajuan_ijin 
WHERE status = 'pending'
ORDER BY created_at DESC;

-- Get class schedule
SELECT * FROM jadwal_pelajaran 
WHERE id_kelas = 'class-uuid'
ORDER BY hari_dalam_minggu, jam_mulai;

-- Get students by class
SELECT * FROM profiles_siswa 
WHERE id_kelas = 'class-uuid'
ORDER BY nama;
```

### Aggregate Data

```sql
-- Attendance statistics
SELECT 
  status,
  COUNT(*) as count
FROM absen
WHERE siswa_id = 'student-uuid'
GROUP BY status;

-- Leave requests by category
SELECT 
  kategori,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
  SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
FROM pengajuan_ijin
WHERE siswa_id = 'student-uuid'
GROUP BY kategori;

-- Monthly attendance overview
SELECT 
  DATE_TRUNC('month', tanggal) as month,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'Hadir' THEN 1 ELSE 0 END) as hadir,
  SUM(CASE WHEN status = 'Sakit' THEN 1 ELSE 0 END) as sakit,
  SUM(CASE WHEN status = 'Izin' THEN 1 ELSE 0 END) as izin,
  SUM(CASE WHEN status = 'Alpha' THEN 1 ELSE 0 END) as alpha
FROM absen
WHERE siswa_id = 'student-uuid'
GROUP BY DATE_TRUNC('month', tanggal)
ORDER BY month DESC;
```

## Testing

### Test Users

Create these test accounts via Supabase Auth:

| Email | Password | Role | Purpose |
|-------|----------|------|---------|
| `bayu.setiawan@student.local` | `password123` | Student | General student testing |
| `budi.santoso@teacher.local` | `password123` | Teacher | Teacher/homeroom testing |
| `admin@school.local` | `password123` | Admin | Admin testing (future) |

### Test Scenarios

1. **Student Login Flow**
   - Login dengan student account
   - Verify profile loads
   - Verify own data only visible

2. **Attendance Submission**
   - Submit QR + selfie
   - Verify record created
   - Verify duplicate prevention

3. **Leave Request Submission**
   - Submit dengan kategori Sakit + file
   - Submit dengan kategori Izin (future date)
   - Verify validation errors

4. **Data Access Control**
   - Login dengan student A
   - Try access student B's data → should fail
   - Login dengan teacher
   - Verify can see class data

## Performance Optimization

### Indexes

Automatically created by schema:
- `profiles_siswa(user_id)` - Auth lookup
- `absen(siswa_id, tanggal)` - Daily unique check
- `pengajuan_ijin(siswa_id, created_at)` - Leave requests list
- `jadwal_pelajaran(id_kelas, hari_dalam_minggu)` - Schedule lookup

### Query Optimization Tips

1. Use pagination for large result sets:
```javascript
const { data, count } = await supabase
  .from('absen')
  .select('*', { count: 'exact' })
  .range(0, 9)  // Get 10 items
```

2. Select only needed columns:
```javascript
const { data } = await supabase
  .from('absen')
  .select('id, tanggal, status')  // Not *
  .eq('siswa_id', studentId)
```

3. Use filters instead of post-processing:
```javascript
// Good - filtered server-side
const { data } = await supabase
  .from('absen')
  .select('*')
  .eq('status', 'Hadir')

// Bad - filtered client-side
const all = await supabase.from('absen').select('*')
const filtered = all.filter(r => r.status === 'Hadir')
```

## Monitoring & Debugging

### Enable Query Logging

In Supabase dashboard > SQL Editor, use:

```sql
-- Show recent queries
SELECT * FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Show table sizes
SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename)) 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename) DESC;
```

### Check RLS Policies

```sql
-- List all policies
SELECT * FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test RLS with specific user
SET ROLE authenticated;
SET SESSION "request.jwt.claims" = '{"sub":"user-uuid"}';
SELECT * FROM profiles_siswa;
```

### Monitor Realtime Activity (Pro)

In Supabase dashboard > Realtime, see active subscriptions and message throughput.

## Troubleshooting

### Issue: "Row level security (RLS) violation"

**Cause**: RLS policy blocking query

**Solution**:
1. Verify `auth.uid()` is set correctly
2. Check RLS policy logic
3. Verify user has necessary table access

### Issue: "Unique violation"

**Cause**: Duplicate value in unique column (nisn, nis, user_id)

**Solution**:
1. Check for existing records with same value
2. Delete duplicate if test data
3. Ensure unique validation on client side

### Issue: "Foreign key constraint violation"

**Cause**: Referenced record doesn't exist

**Solution**:
1. Verify parent record exists (e.g., class before creating student)
2. Use ON DELETE CASCADE or SET NULL appropriately
3. Check referential integrity

### Issue: Slow queries

**Solution**:
1. Check indexes are created: `\di` in SQL Editor
2. Use `EXPLAIN ANALYZE` to find bottlenecks
3. Add missing indexes as needed
4. Contact Supabase support

## Links

- [Setup Guide](./SETUP.md)
- [Database Schema](./migrations/001_init_schema.sql)
- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

**Version**: 1.0  
**Last Updated**: October 2026  
**Schema Version**: PostgreSQL 15+ (Supabase standard)
