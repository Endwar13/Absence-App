# Email-to-Student Account Mapping Integration Guide

## Overview

This document describes the email-to-student account mapping system implementation that ensures each student email address is uniquely linked to exactly one student profile.

**Problem Solved:**
- Previously: No strict mapping between email and student profile
- Now: Each email maps to exactly one complete student profile
- Login guarantees: Every successful login loads the correct student account

## Architecture

### Three-Layer Verification

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Email Authentication (Supabase Auth)              │
│ - Email + Password login                                    │
│ - JWT token issued                                          │
│ - Session stored                                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: Email-to-Profile Verification                     │
│ - Verify email has exactly one profile_siswa record        │
│ - Validate profile completeness                            │
│ - Check for data consistency                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Student Data Loading                              │
│ - Load student profile with relations                      │
│ - Load attendance records                                  │
│ - Load leave requests, schedule                            │
│ - Display in StudentContext                                │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Changes

### 1. Database Changes (Migration 002)

**New Functions:**
- `get_student_profile_by_user_id()` - Get profile by user_id with class info
- `get_student_by_email()` - Get student profile by email (admin only)
- `verify_email_student_mapping()` - Validate email-to-profile mapping
- `validate_student_profile_completeness()` - Trigger function for validation

**New Views:**
- `v_student_accounts` - Unified view of email + profile + status
- `v_active_student_accounts` - Only complete, valid accounts

**Enhanced Constraints:**
- `validate_profile_completeness()` trigger enforces required fields
- Existing UNIQUE constraints on user_id, NISN, NIS

### 2. Service Layer Changes

#### `profileService.js` - New Methods

```javascript
// Verify email-to-student mapping validity
async verifyEmailStudentMapping(email)
  → { valid: boolean, profile: Object, error: string }

// Get profile after login (auto-discovery)
async getStudentProfileAfterLogin(userId)
  → { profile: Object, status: 'complete'|'incomplete'|'not_found', error: string }
```

### 3. Context Changes

#### `StudentContext.jsx` - Enhanced

```javascript
// New state field
profileStatus: 'complete' | 'incomplete' | 'not_found' | null

// Uses getStudentProfileAfterLogin() to load profile
// Validates profile completeness before loading related data
// Handles profile verification errors gracefully
```

### 4. Page Changes

#### `LoginPage.jsx` - Two-Step Process

**Old Flow:**
```
Email + Password → Auth Login → Success (may fail if no profile)
```

**New Flow:**
```
Email + Password → Auth Login → Email Mapping Verification → Load Profile → Dashboard
                   (Step 1)        (Step 2)                  (Step 3)
```

### 5. Utility Functions

#### `emailStudentValidator.js` - Comprehensive Validation

```javascript
// Format validation
validateEmailFormat(email) → boolean
validateNISNFormat(nisn) → boolean
validateNISFormat(nis) → boolean

// Completeness validation
validateStudentProfileCompleteness(profile) → { isComplete, missingFields }

// Business logic validation
validateSchoolEmailDomain(email) → boolean
checkEmailStudentMapping(email) → { isValid, profile, error }

// Comprehensive validation
validateStudentAccount(data) → { isValid, errors }

// Helper functions
normalizeEmail(email) → string
getEmailMappingErrorMessage(errorCode) → string
```

## Login Flow - Detailed Steps

### Step-by-Step Login Process

```
User enters email + password
         ↓
[LoginPage.handleSubmit() called]
         ↓
1. AUTH STEP
   - Call AuthContext.login(email, password)
   - Supabase.auth.signInWithPassword()
   - If fails: Show error, return
   - If success: Auth session established, JWT token issued
         ↓
2. VERIFICATION STEP
   - Call profileService.verifyEmailStudentMapping(email)
   - Check database via verify_email_student_mapping() function
   - Validate: Email exists, has 1 profile, profile is complete
   - If fails: Show error, clear auth, return
   - If success: Get full profile with relations
         ↓
3. PROFILE LOADING STEP
   - Call refreshStudentData() in StudentContext
   - StudentContext calls getStudentProfileAfterLogin(userId)
   - Load: Profile, Attendance, Leave Requests, Schedule
   - Set profileStatus = 'complete'
         ↓
4. NAVIGATION STEP
   - ProtectedLayout detects isAuthenticated = true
   - Renders main app layout with student dashboard
   - User navigates normally
```

### Error Handling at Each Step

**Step 1 (Auth) Errors:**
- Invalid email/password → Show error message in red alert
- Network error → Retry with exponential backoff
- Email not registered → Suggest registration

**Step 2 (Verification) Errors:**
- Email has no profile → Contact administrator
- Email has multiple profiles → Data corruption detected
- Profile incomplete → Contact administrator
- Network error → Show retry button

**Step 3 (Loading) Errors:**
- Attendance/schedule not available → Show warning, continue with base profile
- Database access denied → Check RLS policies
- Network timeout → Show retry

## Database Integrity Checks

### Before Going Live

```sql
-- 1. Check email uniqueness
SELECT email, COUNT(*) FROM auth.users GROUP BY email HAVING COUNT(*) > 1;

-- 2. Check profile-to-email uniqueness
SELECT 
  au.email, 
  COUNT(ps.id) as profile_count
FROM auth.users au
LEFT JOIN profiles_siswa ps ON au.id = ps.user_id
GROUP BY au.email
HAVING COUNT(ps.id) != 1;

-- 3. Check NISN uniqueness
SELECT nisn, COUNT(*) FROM profiles_siswa WHERE nisn IS NOT NULL GROUP BY nisn HAVING COUNT(*) > 1;

-- 4. Check NIS uniqueness
SELECT nis, COUNT(*) FROM profiles_siswa WHERE nis IS NOT NULL GROUP BY nis HAVING COUNT(*) > 1;

-- 5. Check profile completeness
SELECT * FROM profiles_siswa 
WHERE nama IS NULL OR nisn IS NULL OR nis IS NULL OR jenis_kelamin IS NULL OR id_kelas IS NULL;

-- 6. View all student accounts
SELECT * FROM v_student_accounts;

-- 7. View only active accounts
SELECT * FROM v_active_student_accounts;
```

## Testing Checklist

### Pre-Testing Setup

- [ ] Deploy migration 002_email_student_mapping.sql to Supabase
- [ ] Verify all new functions created successfully
- [ ] Verify all views created successfully
- [ ] Verify RLS policies are enabled
- [ ] Run integrity checks (see above)

### Unit Testing

- [ ] Test `validateEmailFormat()` with valid/invalid emails
- [ ] Test `validateNISNFormat()` with valid/invalid NISN
- [ ] Test `validateNISFormat()` with valid/invalid NIS
- [ ] Test `validateStudentProfileCompleteness()` with complete/incomplete profiles
- [ ] Test `normalizeEmail()` with mixed case, spaces

### Integration Testing - Happy Path

**Test Case 1: Standard Login**
```
Email: bayu.setiawan@siswa.nexus.sch.id
Password: 123456
Expected:
  ✓ Auth login successful
  ✓ Email mapping verified
  ✓ Profile loaded: Bayu Setiawan, NISN: 0054819231, Class: XII RPL 1
  ✓ Redirected to dashboard
  ✓ Student name displayed in navbar
  ✓ Attendance records shown
```

**Test Case 2: Profile Auto-Loading**
```
After login:
  ✓ StudentContext.profileStatus === 'complete'
  ✓ StudentContext.studentProfile populated with all fields
  ✓ StudentContext.classSchedule loaded
  ✓ Can access attendance, leave request pages without additional loading
```

**Test Case 3: Demo Account**
```
Click "Masuk Demo Siswa: Bayu Setiawan"
Expected:
  ✓ Same flow as manual login
  ✓ Message: "Akun Demo Aktif - Masuk sebagai Bayu Setiawan"
```

### Integration Testing - Error Cases

**Test Case 4: Invalid Email Format**
```
Email: notanemail.invalid
Password: 123456
Expected:
  ✓ Show error: "Format email tidak valid"
  ✓ No auth attempt made
  ✓ User stays on login page
```

**Test Case 5: Unregistered Email**
```
Email: nonexistent@siswa.nexus.sch.id
Password: anypassword
Expected:
  ✓ Auth fails with "Email atau kata sandi tidak valid"
  ✓ Verification step not reached
  ✓ User stays on login page
```

**Test Case 6: Email with No Profile**
```
Setup: Create auth.users entry without profiles_siswa record
Email: noprofile@siswa.nexus.sch.id
Password: 123456
Expected:
  ✓ Auth successful
  ✓ Verification fails: "Profil siswa tidak ditemukan"
  ✓ Error shown in red alert
  ✓ User stays on login page
```

**Test Case 7: Incomplete Profile**
```
Setup: Create profile with missing field (e.g., no id_kelas)
Email: incomplete@siswa.nexus.sch.id
Password: 123456
Expected:
  ✓ Auth successful
  ✓ Verification fails: "Profil siswa tidak lengkap"
  ✓ Error shows missing fields
  ✓ User stays on login page
```

**Test Case 8: Multiple Profiles (Data Corruption)**
```
Setup: Create 2 profiles for same email (shouldn't be possible, but test recovery)
Email: duplicate@siswa.nexus.sch.id
Password: 123456
Expected:
  ✓ Auth successful
  ✓ Verification fails: "Multiple profil siswa ditemukan (data corrupt)"
  ✓ Alert user to contact admin
  ✓ User stays on login page
```

### Integration Testing - Profile Status

**Test Case 9: Profile Status Values**
```
After login:
  ✓ profileStatus === 'complete' → All data loaded, dashboard accessible
  ✓ profileStatus === 'incomplete' → Profile shown but with warning
  ✓ profileStatus === 'not_found' → Error message, prompt to contact admin
  ✓ profileStatus === 'error' → Network error, show retry button
```

### End-to-End Testing

**Test Case 10: Full User Journey**
```
1. Start at login page
2. Enter credentials
3. See loading spinners: "Memproses...", then "Memverifikasi..."
4. Success toast appears: "Selamat datang, [Student Name]!"
5. Redirected to dashboard
6. Check navbar shows student name
7. Check attendance section loads
8. Check leave request section loads
9. Check schedule section loads
10. Click logout
11. Redirected back to login
12. Repeat - verify session cleared
```

**Test Case 11: Browser Refresh After Login**
```
1. Login successfully
2. Refresh page with F5/Ctrl+R
3. ProtectedLayout should detect existing session
4. Student data should be preserved
5. Dashboard should render without re-login
```

**Test Case 12: Multiple Tabs**
```
1. Login in Tab A
2. Open same app in Tab B
3. Both tabs should show logged-in state
4. Data should sync (if using real-time updates)
5. Logout in Tab A
6. Tab B should also log out (via auth listener)
```

## RLS (Row Level Security) Verification

### Testing RLS Enforcement

**Test Case 13: Cross-Student Data Isolation**
```
Setup: Create 2 student accounts with different profiles
Login as Student A:
  ✓ Can read: Own profile, own attendance, own leave requests, own class schedule
  ✗ Cannot read: Student B's profile, attendance, requests, schedule
  
Login as Student B:
  ✓ Can read: Own profile, own attendance, own leave requests, own class schedule
  ✗ Cannot read: Student A's profile, attendance, requests, schedule

Verify via:
  - Query profiles_siswa → Only own profile visible
  - Query absen → Only own attendance visible
  - Query pengajuan_ijin → Only own requests visible
  - Query jadwal_pelajaran → Only own class schedule visible
```

## Performance Considerations

### Query Optimization

- ✓ Indexed on: user_id, id_kelas, NISN, NIS (for lookups)
- ✓ Composite index on (siswa_id, tanggal) for attendance
- ✓ Views pre-compute relationships
- ✓ Single query per verification (not N+1)

### Caching Strategy

- StudentContext caches profile (no re-fetch on tab change)
- Refresh only on explicit user action or login
- localStorage persists JWT (Supabase handles this)

### Loading States

- Navbar shows spinner during profile load
- Dashboard shows "Memverifikasi..." during verification
- Each section can load independently

## Troubleshooting Guide

### Issue: "Profil siswa tidak ditemukan"

**Possible Causes:**
1. Auth user created but no profiles_siswa record
2. user_id mismatch between auth.users and profiles_siswa
3. RLS policy blocking access

**Solution:**
1. Check database: `SELECT * FROM v_student_accounts WHERE email = 'user@example.com'`
2. If no profile, create one via admin panel
3. Verify user_id matches between auth.users and profiles_siswa
4. Check RLS policies are correctly set

### Issue: "Multiple profil siswa ditemukan"

**Possible Causes:**
1. Duplicate profile records (data corruption)
2. Foreign key constraint violated

**Solution:**
1. Identify duplicate: `SELECT * FROM profiles_siswa WHERE user_id = 'xxx'`
2. Verify which is correct (check timestamps, completeness)
3. Delete duplicate (careful with cascade!)
4. Re-check RLS policies

### Issue: "Profil siswa tidak lengkap"

**Possible Causes:**
1. Profile created but fields left NULL
2. Trigger didn't validate on creation
3. Old data before validation was added

**Solution:**
1. Identify missing fields: `SELECT id, nama, nisn, nis, jenis_kelamin, id_kelas FROM profiles_siswa WHERE id = 'xxx'`
2. Update via admin or direct query
3. Verify with: `SELECT * FROM v_student_accounts WHERE id = 'xxx'`

### Issue: "Failed to load profile after multiple retries"

**Possible Causes:**
1. Network connectivity issue
2. Supabase service down
3. Database timeout

**Solution:**
1. Check internet connection
2. Check Supabase status
3. Increase timeout in supabase.js: `VITE_API_TIMEOUT=60000`
4. Check database query performance

## Deployment Checklist

- [ ] Run migration 002_email_student_mapping.sql
- [ ] Verify functions created: `SELECT * FROM information_schema.routines WHERE routine_schema = 'public'`
- [ ] Verify views created: `SELECT * FROM information_schema.views WHERE table_schema = 'public'`
- [ ] Verify RLS policies: `SELECT * FROM pg_policies WHERE schemaname = 'public'`
- [ ] Run integrity checks (see Testing Checklist section)
- [ ] Test with demo account
- [ ] Test with multiple student accounts
- [ ] Monitor error logs for first 24 hours
- [ ] Check performance metrics (query times, API response times)

## Files Modified/Created

### New Files
- `supabase/migrations/002_email_student_mapping.sql` - Database migration
- `src/lib/emailStudentValidator.js` - Validation utilities

### Modified Files
- `src/services/profileService.js` - Added email mapping methods
- `src/context/StudentContext.jsx` - Auto-load profile after login
- `src/pages/LoginPage.jsx` - Two-step verification flow

### No Changes Needed
- `src/context/AuthContext.jsx` - Auth context unchanged
- `src/App.jsx` - App structure unchanged
- `src/components/Layout/ProtectedLayout.jsx` - Already guards with isAuthenticated

## Key Design Decisions

1. **Two-Step Verification:**
   - Why: Separates concerns (auth vs profile mapping)
   - Benefit: Can detect email-profile mismatches
   - Trade-off: Slightly longer login time (~500ms)

2. **Database Functions vs Application Logic:**
   - Why: Enforce data consistency at DB level
   - Benefit: Works even with direct DB queries
   - Trade-off: More complex SQL

3. **Views for Account Status:**
   - Why: Unified view of email + profile
   - Benefit: Easier to query and debug
   - Trade-off: Need to keep views in sync

4. **Trigger for Validation:**
   - Why: Prevent incomplete profiles from creation
   - Benefit: Catch errors early
   - Trade-off: May reject valid partial data

## Migration Path (If Updating Existing System)

For systems that already have users without proper email-to-profile mapping:

1. **Audit Phase:**
   ```sql
   SELECT * FROM v_student_accounts WHERE account_status != 'complete';
   ```

2. **Fix Phase:**
   - For each incomplete profile: Contact admin to complete
   - For orphaned auth users: Create profile or delete account
   - For duplicate profiles: Identify correct one, delete duplicates

3. **Validation Phase:**
   ```sql
   SELECT * FROM v_active_student_accounts;
   -- Should return only complete, valid accounts
   ```

4. **Go Live:**
   - Deploy code changes
   - Monitor error logs
   - Be ready to roll back if issues

---

**Last Updated:** October 14, 2026
**System:** Nexus-Connect Absence App - Siswa Role MVP
**Status:** Ready for Testing & Deployment
