# Supabase Integration Verification Guide

Panduan lengkap untuk memverifikasi bahwa semua services sudah terintegrasi dengan benar dengan Supabase backend.

## Pre-Verification Checklist

Pastikan sudah selesai sebelum memulai verifikasi:

- [ ] Supabase project sudah dibuat
- [ ] `.env.local` sudah dikonfigurasi dengan Supabase URL dan API key
- [ ] Database schema sudah di-migrate via `001_init_schema.sql`
- [ ] 3 storage buckets sudah dibuat: `attendance-selfies`, `leave-request-proof`, `profile-photos`
- [ ] Test user accounts sudah dibuat di Supabase Auth
- [ ] Dev server running: `npm run dev`

## 1. Authentication Service Verification

### Test: Login with Valid Credentials

**Expected**: User successfully authenticated, JWT token received

**Steps**:
1. Buka http://localhost:5173
2. Klik tombol Login
3. Masukkan email: `bayu.setiawan@student.local`
4. Masukkan password: `password123`
5. Klik "Login"

**Verify**:
```javascript
// Di browser console, jalankan:
const { data: { user } } = await supabase.auth.getUser()
console.log('Current user:', user)
```

**Expected Output**:
```javascript
Current user: {
  id: "uuid-from-supabase",
  email: "bayu.setiawan@student.local",
  email_confirmed_at: "2024-10-13T...",
  ...
}
```

### Test: Login with Invalid Credentials

**Expected**: Error message displayed, user not authenticated

**Steps**:
1. Refresh page
2. Masukkan email: `wrong@email.com`
3. Masukkan password: `wrongpassword`
4. Klik "Login"

**Verify**: Error alert ditampilkan: "Email atau kata sandi tidak valid"

### Test: Session Persistence

**Expected**: User tetap login setelah refresh page

**Steps**:
1. Login successfully
2. Refresh page (F5)
3. Verifikasi user masih logged in tanpa perlu login ulang

**Verify**:
```javascript
// Di console setelah refresh
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)
```

### Test: Logout

**Expected**: Session cleared, redirect ke login page

**Steps**:
1. Login successfully
2. Klik tombol Logout
3. Verifikasi redirect ke login page

**Verify**:
```javascript
// Di console
const { data: { user } } = await supabase.auth.getUser()
console.log('User after logout:', user)  // Should be null
```

## 2. Profile Service Verification

### Test: Get Student Profile

**Expected**: Profile data loaded dari Supabase dengan semua required fields

**Steps**:
1. Login successfully
2. Navigate to Profile page
3. Verifikasi data ditampilkan

**Verify di Database**:
```sql
-- Di Supabase SQL Editor
SELECT * FROM profiles_siswa 
WHERE user_id = 'logged-in-user-id';

-- Should return student data with:
-- - nama
-- - nisn (unique)
-- - nis (unique)
-- - jenis_kelamin (L or P)
-- - id_kelas
-- - created_at, updated_at
```

**Check Console**:
```javascript
// Di browser console
import profileService from '@/services/profileService'
import { useAuth } from '@/context/AuthContext'
const { user } = useAuth()
const profile = await profileService.getStudentProfile(user.id)
console.log('Profile:', profile)
```

**Expected Output**:
```javascript
Profile: {
  id: "siswa-uuid",
  user_id: "auth-user-uuid",
  nama: "Bayu Setiawan",
  nisn: "0054819231",
  nis: "21221045",
  jenis_kelamin: "L",
  id_kelas: "class-uuid",
  photo_url: null,
  created_at: "2024-10-13T...",
  updated_at: "2024-10-13T..."
}
```

### Test: Get Profile with Relations

**Expected**: Profile dengan class dan teacher info

**Steps**:
1. Di console, run:
```javascript
const profile = await profileService.getProfileWithRelations(user.id)
console.log('Enriched profile:', profile)
```

**Expected Output**:
```javascript
{
  ...profileData,
  kelas_detail: {
    id: "class-uuid",
    nama_kelas: "XII RPL 1",
    tahun_ajaran: "TA 2024/2025",
    wali_kelas: {
      id: "guru-uuid",
      nama: "Budi Santoso",
      nip: "19800315200501100008",
      speciality: "Rekayasa Perangkat Lunak"
    }
  }
}
```

### Test: Profile Completeness Validation

**Expected**: Validation passes for complete profile

**Steps**:
```javascript
const { isComplete, missingFields } = await profileService.validateProfileCompleteness(user.id)
console.log('Is complete:', isComplete)  // Should be true
console.log('Missing fields:', missingFields)  // Should be []
```

## 3. Attendance Service Verification

### Test: Check Today's Attendance

**Expected**: If no record today, returns `hasAttended: false`

**Steps**:
```javascript
import attendanceService from '@/services/attendanceService'
const profile = await profileService.getStudentProfile(user.id)
const { hasAttended, record } = await attendanceService.getTodayAttendance(profile.id)
console.log('Has attended today:', hasAttended)
console.log('Record:', record)
```

**Expected Output** (if not yet attended):
```javascript
{
  hasAttended: false,
  record: null
}
```

### Test: Submit Attendance (Mock)

**Note**: Requires QR code dan selfie image. Untuk testing gunakan mock data.

**Steps**:
```javascript
// Create mock selfie blob
const canvas = document.createElement('canvas')
canvas.width = 320
canvas.height = 240
const ctx = canvas.getContext('2d')
ctx.fillStyle = '#00ff00'
ctx.fillRect(0, 0, 320, 240)
const selfieBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'))

// Submit attendance
try {
  const result = await attendanceService.submitAttendance(profile.id, {
    qrData: 'TEST-QR-08-PAGI-SMAN1-RPL1',
    selfieFile: selfieBlob,
    locationName: 'Lab RPL 1',
    radiusMeters: 12
  })
  console.log('Submission result:', result)
} catch (error) {
  console.error('Error:', error.message)
}
```

**Expected Output**:
```javascript
{
  success: true,
  attendanceId: "att-uuid",
  record: {
    id: "att-uuid",
    siswa_id: "student-uuid",
    tanggal: "2024-10-13",
    status: "Hadir",
    qr_scan_time: "2024-10-13T10:30:00.000Z",
    selfie_url: "signed-url-or-storage-path",
    created_at: "2024-10-13T10:30:00.000Z",
    updated_at: "2024-10-13T10:30:00.000Z"
  },
  selfieUrl: "signed-url",
  message: "Presensi berhasil dicatat secara resmi."
}
```

**Verify in Database**:
```sql
-- Di Supabase SQL Editor
SELECT * FROM absen 
WHERE siswa_id = 'student-uuid'
ORDER BY created_at DESC
LIMIT 1;

-- Should show today's attendance record
```

### Test: Attendance Immutability (Property 1)

**Expected**: Cannot modify or delete attendance record

**Steps**:
1. Submit attendance (dari test sebelumnya)
2. Try update:
```javascript
const { error } = await supabase
  .from('absen')
  .update({ status: 'Alpha' })
  .eq('id', 'att-uuid')

console.log('Update error:', error)  // Should have error
```

**Expected Output**: Error message indicating update policy violation

### Test: Unique Daily Attendance (Property 2)

**Expected**: Cannot submit attendance twice in one day

**Steps**:
1. Submit attendance sekali
2. Try submit again:
```javascript
try {
  await attendanceService.submitAttendance(profile.id, {
    qrData: 'ANOTHER-QR',
    selfieFile: selfieBlob2,
    locationName: 'Lab RPL 1'
  })
} catch (error) {
  console.log('Error:', error.message)  // Should mention already attended
}
```

**Expected Output**: Error message: "Anda sudah melakukan presensi hari ini."

### Test: Get Attendance History

**Expected**: List of past attendance records

**Steps**:
```javascript
const { data, total } = await attendanceService.getAttendanceHistory(profile.id, {
  status: 'Hadir',
  limit: 5,
  offset: 0
})
console.log('Total records:', total)
console.log('Records:', data)
```

**Verify**:
- `total` shows count of matching records
- `data` array contains attendance records

### Test: Get Attendance Stats

**Expected**: Aggregated attendance statistics

**Steps**:
```javascript
const stats = await attendanceService.getAttendanceStats(profile.id, {
  startDate: '2024-10-01',
  endDate: '2024-10-31'
})
console.log('Stats:', stats)
```

**Expected Output**:
```javascript
{
  hadir: 15,
  sakit: 2,
  izin: 1,
  alpha: 0,
  total: 18
}
```

## 4. Leave Request Service Verification

### Test: Submit Leave Request (Sakit)

**Expected**: Leave request created with pending status

**Steps**:
```javascript
// Create mock proof file
const canvas = document.createElement('canvas')
canvas.width = 210; canvas.height = 297
const ctx = canvas.getContext('2d')
ctx.fillStyle = '#ffffff'
ctx.fillRect(0, 0, 210, 297)
ctx.fillStyle = '#000000'
ctx.font = '12px Arial'
ctx.fillText('Surat Keterangan Sakit', 50, 30)
const proofBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))

try {
  const result = await leaveRequestService.submitLeaveRequest(profile.id, {
    kategori: 'Sakit',
    tanggal: new Date().toISOString().split('T')[0],  // Today
    deskripsi: 'Demam dan flu setelah kegiatan pramuka',
    fileData: proofBlob
  })
  console.log('Result:', result)
} catch (error) {
  console.error('Error:', error.message)
}
```

**Expected Output**:
```javascript
{
  success: true,
  requestId: "leave-uuid",
  record: {
    id: "leave-uuid",
    siswa_id: "student-uuid",
    tanggal_tidak_hadir: "2024-10-13",
    kategori: "Sakit",
    deskripsi: "Demam dan flu setelah kegiatan pramuka",
    bukti_url: "signed-url-or-storage-path",
    status: "pending",
    approved_by: null,
    approved_at: null,
    created_at: "2024-10-13T10:30:00.000Z",
    updated_at: "2024-10-13T10:30:00.000Z"
  },
  proofFileUrl: "signed-url",
  message: "Pengajuan dispensasi berhasil dikirim dan menunggu verifikasi wali kelas."
}
```

### Test: Leave Request Temporal Constraint (Property 3)

**Expected**: Izin requests must be H-1 or later

**Steps**:
```javascript
// Try submit Izin for yesterday (should fail)
const yesterday = new Date(Date.now() - 24*60*60*1000).toISOString().split('T')[0]

try {
  await leaveRequestService.submitLeaveRequest(profile.id, {
    kategori: 'Izin',
    tanggal: yesterday,
    deskripsi: 'Menghadiri acara keluarga',
    fileData: null
  })
} catch (error) {
  console.log('Error:', error.message)  // Should mention date in past
}
```

**Expected Output**: Error message about date constraint

### Test: Sakit Category Requires Proof (Property 3)

**Expected**: Sakit requests require medical proof file

**Steps**:
```javascript
try {
  await leaveRequestService.submitLeaveRequest(profile.id, {
    kategori: 'Sakit',
    tanggal: new Date().toISOString().split('T')[0],
    deskripsi: 'Demam',
    fileData: null  // No proof file
  })
} catch (error) {
  console.log('Error:', error.message)  // Should mention proof requirement
}
```

**Expected Output**: Error message: "Kategori Sakit wajib melampirkan surat dokter atau klinik."

### Test: Leave Status Progression (Property 5)

**Expected**: New requests start as 'pending'

**Steps**:
```sql
-- Di Supabase SQL Editor
SELECT id, status FROM pengajuan_ijin 
WHERE siswa_id = 'student-uuid'
ORDER BY created_at DESC
LIMIT 1;

-- Should show status = 'pending'
```

### Test: Get Leave Requests

**Expected**: List of leave requests with stats

**Steps**:
```javascript
const { data, total, stats } = await leaveRequestService.getLeaveRequests(profile.id, {
  status: 'pending',
  limit: 10,
  offset: 0
})
console.log('Total:', total)
console.log('Stats:', stats)
console.log('Data:', data)
```

**Expected Output**:
```javascript
{
  total: 3,
  data: [...],
  stats: {
    pending: 2,
    approved: 1,
    rejected: 0
  }
}
```

### Test: Get Leave Request Detail

**Expected**: Single leave request with all details

**Steps**:
```javascript
const request = await leaveRequestService.getLeaveRequestDetail('leave-uuid')
console.log('Request detail:', request)
```

## 5. Class Service Verification

### Test: Get Student's Class Schedule

**Expected**: Schedule for student's assigned class

**Steps**:
```javascript
import classService from '@/services/classService'
const profile = await profileService.getStudentProfile(user.id)
const schedule = await classService.getStudentClassSchedule(profile.id)
console.log('Schedule:', schedule)
```

**Expected Output**:
```javascript
[
  {
    id: "schedule-uuid",
    id_kelas: "class-uuid",
    guru_id: "teacher-uuid",
    hari_dalam_minggu: "Senin",
    jam_mulai: "07:00:00",
    jam_selesai: "08:30:00",
    mapel: "Pemrograman Web",
    ruangan: "Lab RPL 1",
    guru: {
      id: "teacher-uuid",
      nama: "Budi Santoso",
      nip: "19800315200501100008"
    }
  },
  ...
]
```

### Test: Get Schedule by Day

**Expected**: Schedule for specific day

**Steps**:
```javascript
const classId = profile.id_kelas
const mondaySchedule = await classService.getClassSchedule(classId, 'Senin')
console.log('Monday schedule:', mondaySchedule)
```

### Test: Get Today's Schedule

**Expected**: Today's schedule only

**Steps**:
```javascript
const todaySchedule = await classService.getTodaySchedule(profile.id)
console.log('Today schedule:', todaySchedule)
```

### Test: Class Schedule Consistency (Property 7)

**Expected**: Students only see their own class schedule

**Steps**:
```javascript
// Student A views their schedule (should work)
const schedule = await classService.getStudentClassSchedule(studentA.id)

// Try to view different class schedule directly with RLS
const { data, error } = await supabase
  .from('jadwal_pelajaran')
  .select('*')
  .eq('id_kelas', differentClassId)

// If RLS enabled, should get empty or error
console.log('Different class access:', error || data)
```

## 6. Row-Level Security (RLS) Verification

### Test: Student Cannot See Other Student's Data

**Expected**: Student A cannot query Student B's attendance

**Steps**:
1. Login dengan Student A
2. Di console, try query Student B's data:
```javascript
const { data: studentBData, error } = await supabase
  .from('profiles_siswa')
  .select('*')
  .eq('id', 'student-b-uuid')

console.log('Result:', data)  // Should be empty or null
console.log('Error:', error)  // Might have RLS policy violation
```

### Test: Student Cannot Modify Their Profile

**Expected**: Update operation blocked by RLS

**Steps**:
```javascript
const { data, error } = await supabase
  .from('profiles_siswa')
  .update({ nama: 'Different Name' })
  .eq('id', profile.id)

console.log('Update error:', error)  // Should have permission denied
```

**Expected Error**: Something like "new row violates row-level security policy"

### Test: Attendance Records Are Immutable

**Expected**: Cannot update attendance record

**Steps**:
```javascript
const { data, error } = await supabase
  .from('absen')
  .update({ status: 'Alpha' })
  .eq('id', 'att-uuid')

console.log('Update error:', error)  // Should be denied
```

## 7. Storage Integration Verification

### Test: Selfie File Upload

**Expected**: File successfully uploaded to storage bucket

**Check Storage**:
1. Di Supabase dashboard, buka **Storage**
2. Klik bucket `attendance-selfies`
3. Verifikasi folder dengan `student-uuid` ada
4. Verifikasi file ada di dalamnya

### Test: Leave Proof File Upload

**Expected**: File successfully uploaded to storage bucket

**Check Storage**:
1. Di Supabase dashboard, buka **Storage** > `leave-request-proof`
2. Verifikasi folder dengan `student-uuid` ada
3. Verifikasi file ada di dalamnya

### Test: Signed URL Access

**Expected**: Files accessible via signed URLs

**Steps**:
```javascript
// Get signed URL for selfie
const { selfieUrl } = await attendanceService.getSelfieUrl('att-uuid')
console.log('Signed URL:', selfieUrl)

// Try fetch file
const response = await fetch(selfieUrl)
console.log('File accessible:', response.ok)
```

## 8. Error Handling Verification

### Test: Network Error Handling

**Expected**: Graceful error handling, retry logic works

**Steps**:
1. Buka browser DevTools > Network tab
2. Set throttle ke "Offline"
3. Try submit attendance
4. Verifikasi error message ditampilkan
5. Restore connection
6. Try retry

### Test: Validation Error Messages

**Expected**: User-friendly error messages

**Test Cases**:
```javascript
// Missing fields
await leaveRequestService.submitLeaveRequest(profile.id, {
  kategori: 'Izin',
  tanggal: '',  // Empty
  deskripsi: 'Test',
  fileData: null
})

// Invalid description (too short)
await leaveRequestService.submitLeaveRequest(profile.id, {
  kategori: 'Izin',
  tanggal: '2024-10-20',
  deskripsi: 'Short',  // Less than 10 chars
  fileData: null
})
```

## 9. Performance Verification

### Test: Query Performance

**Expected**: Queries complete in <1 second

**Steps**:
```javascript
console.time('Get attendance history')
await attendanceService.getAttendanceHistory(profile.id, { limit: 100 })
console.timeEnd('Get attendance history')  // Should show <1000ms

console.time('Get leave requests')
await leaveRequestService.getLeaveRequests(profile.id, { limit: 100 })
console.timeEnd('Get leave requests')  // Should show <1000ms
```

### Test: Index Usage

**Expected**: Database queries use indexes

**Steps**:
```sql
-- Di Supabase SQL Editor, run EXPLAIN ANALYZE
EXPLAIN ANALYZE
SELECT * FROM absen 
WHERE siswa_id = 'student-uuid'
ORDER BY tanggal DESC
LIMIT 10;

-- Should show "Index Scan" in plan
```

## 10. Integration Summary Checklist

- [ ] Authentication (Login/Logout/Session)
- [ ] Profile Service (Get, Validate, Relations)
- [ ] Attendance (Submit, History, Stats, Immutability)
- [ ] Leave Requests (Submit, List, Temporal Constraint, Status)
- [ ] Class Schedule (Get, By Day, Today, Consistency)
- [ ] RLS Policies (Data access control working)
- [ ] Storage (File upload, Signed URLs)
- [ ] Error Handling (Validation, Network)
- [ ] Performance (Queries <1s, Indexes used)
- [ ] All 8 Correctness Properties Enforced

## Troubleshooting Common Issues

### Issue: "Missing Supabase configuration"

**Solution**:
1. Check `.env.local` exists
2. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
3. Restart dev server
4. Check `.env.local` not in `.gitignore`

### Issue: "CORS error"

**Solution**:
1. Verify Supabase URL is correct format (https://...)
2. Check API key is Anon key, not Service key
3. In Supabase dashboard, check CORS settings

### Issue: "RLS policy violation"

**Solution**:
1. Verify RLS policies created correctly
2. Check `auth.uid()` is set (login required)
3. Debug with:
```sql
SELECT current_user_id();
SET ROLE authenticated;
```

### Issue: "Unique constraint violation"

**Solution**:
1. Check for duplicate nisn, nis, user_id
2. Delete test data if needed
3. Ensure validators prevent duplicates on client

### Issue: "File upload fails"

**Solution**:
1. Check storage bucket exists and is private
2. Verify file size < limit
3. Check file type allowed
4. Ensure authenticated before upload

## Next Steps

Setelah verifikasi lengkap:

1. ✅ Semua services terhubung ke Supabase
2. ✅ Authentication working
3. ✅ Data persistence verified
4. ✅ RLS policies enforced
5. ✅ Storage integration working
6. ✅ Error handling tested
7. 📦 Ready for production deployment

---

**Version**: 1.0  
**Last Updated**: October 2026
