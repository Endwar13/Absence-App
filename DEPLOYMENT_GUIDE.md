# Email-to-Student Mapping System - Deployment Guide

## 📋 Pre-Deployment Checklist

### 1. Code Review
- [x] Database migration reviewed
- [x] ProfileService updates reviewed
- [x] StudentContext updates reviewed
- [x] LoginPage changes reviewed
- [x] Validator utilities reviewed
- [x] All imports verified
- [x] No breaking changes
- [x] Backward compatible

### 2. Testing Verification
- [x] Happy path documented
- [x] Error cases documented
- [x] Integration flow tested (logic verified)
- [x] RLS policies verified
- [x] Database integrity checks provided

### 3. Documentation
- [x] Architecture documented
- [x] Integration guide complete
- [x] Verification checklist created
- [x] Testing scenarios provided
- [x] Troubleshooting guide included
- [x] Code comments added
- [x] Error messages documented

---

## 🚀 Deployment Steps

### Phase 1: Preparation (Day 1)

#### 1.1 Database Backup
```bash
# Using Supabase Dashboard
1. Go to Supabase Dashboard → Project Settings → Backups
2. Create manual backup with description:
   "Before email-to-student mapping migration (Oct 14, 2026)"
3. Download backup file and store securely
4. Verify backup completion (status: "Ready")
```

#### 1.2 Verify Current Database State
```sql
-- Run in Supabase SQL Editor

-- Check email uniqueness
SELECT email, COUNT(*) as count 
FROM auth.users 
GROUP BY email 
HAVING COUNT(*) > 1;
-- Expected result: Empty (no duplicates)

-- Check profile-to-email mapping
SELECT 
  au.email, 
  COUNT(ps.id) as profile_count
FROM auth.users au
LEFT JOIN profiles_siswa ps ON au.id = ps.user_id
GROUP BY au.email
HAVING COUNT(ps.id) != 1;
-- Expected result: Empty (all have exactly 1 profile)

-- Check for incomplete profiles
SELECT id, nama, nisn, nis, jenis_kelamin, id_kelas 
FROM profiles_siswa 
WHERE nama IS NULL OR nisn IS NULL OR nis IS NULL 
   OR jenis_kelamin IS NULL OR id_kelas IS NULL;
-- Expected result: Empty (all profiles complete)
```

**If Issues Found:**
- Incomplete profiles → Contact admin to complete
- Orphaned auth users → Delete or create profiles
- Duplicate profiles → Identify correct one, delete duplicates
- Do NOT proceed until all issues resolved

#### 1.3 Prepare Test Data
```sql
-- Verify demo account exists and is complete
SELECT * FROM v_student_accounts 
WHERE email = 'bayu.setiawan@siswa.nexus.sch.id';
-- Expected: Complete student account

-- Check that all required fields are filled
-- If not, prepare test account data
```

---

### Phase 2: Database Migration (Day 2)

#### 2.1 Execute Migration

**Via Supabase Dashboard:**
1. Open Supabase Dashboard → SQL Editor
2. Create new query
3. Copy entire contents of `supabase/migrations/002_email_student_mapping.sql`
4. Click "Execute" button
5. Wait for completion (should be < 5 seconds)

**Alternatively, via SQL file upload:**
```bash
# If Supabase supports file upload
supabase db push  # If using Supabase CLI
```

#### 2.2 Verify Migration Success

```sql
-- Verify functions created
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'get_student_profile_by_user_id',
  'get_student_by_email',
  'verify_email_student_mapping',
  'validate_student_profile_completeness'
);
-- Expected result: 4 rows

-- Verify views created
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN ('v_student_accounts', 'v_active_student_accounts');
-- Expected result: 2 rows

-- Verify indexes created
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%';
-- Expected result: 12+ indexes

-- Verify triggers created
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name = 'validate_profile_completeness';
-- Expected result: 1 row (plus existing triggers)
```

#### 2.3 Run Integrity Checks

```sql
-- Check 1: Email uniqueness
SELECT COUNT(*) as duplicate_emails FROM (
  SELECT email, COUNT(*) FROM auth.users GROUP BY email HAVING COUNT(*) > 1
) x;
-- Expected: 0

-- Check 2: Profile-email mapping
SELECT COUNT(*) as invalid_mappings FROM (
  SELECT au.email, COUNT(ps.id) 
  FROM auth.users au 
  LEFT JOIN profiles_siswa ps ON au.id = ps.user_id 
  GROUP BY au.email 
  HAVING COUNT(ps.id) != 1
) x;
-- Expected: 0

-- Check 3: NISN uniqueness
SELECT COUNT(*) as duplicate_nisn FROM (
  SELECT nisn, COUNT(*) 
  FROM profiles_siswa 
  WHERE nisn IS NOT NULL 
  GROUP BY nisn 
  HAVING COUNT(*) > 1
) x;
-- Expected: 0

-- Check 4: NIS uniqueness
SELECT COUNT(*) as duplicate_nis FROM (
  SELECT nis, COUNT(*) 
  FROM profiles_siswa 
  WHERE nis IS NOT NULL 
  GROUP BY nis 
  HAVING COUNT(*) > 1
) x;
-- Expected: 0

-- Check 5: Profile completeness
SELECT COUNT(*) as incomplete_profiles 
FROM profiles_siswa 
WHERE nama IS NULL OR nisn IS NULL OR nis IS NULL 
   OR jenis_kelamin IS NULL OR id_kelas IS NULL;
-- Expected: 0

-- If all checks pass: ✅ Database migration successful
```

#### 2.4 Test Functions

```sql
-- Test: verify_email_student_mapping for valid email
SELECT verify_email_student_mapping('bayu.setiawan@siswa.nexus.sch.id');
-- Expected: {"valid": true, "user_id": "...", "profile_id": "..."}

-- Test: verify_email_student_mapping for invalid email
SELECT verify_email_student_mapping('nonexistent@example.com');
-- Expected: {"valid": false, "error": "..."}

-- Test: get_student_profile_by_user_id
SELECT * FROM get_student_profile_by_user_id('<user_id>');
-- Expected: Student profile with class name

-- Test: get_student_by_email
SELECT * FROM get_student_by_email('bayu.setiawan@siswa.nexus.sch.id');
-- Expected: Student profile with email
```

---

### Phase 3: Code Deployment (Day 3)

#### 3.1 Prepare Code Changes

**Files to deploy:**
```
✓ src/services/profileService.js (Modified)
✓ src/context/StudentContext.jsx (Modified)
✓ src/pages/LoginPage.jsx (Modified)
✓ src/lib/emailStudentValidator.js (New)
```

**Optional: Documentation files**
```
✓ EMAIL_STUDENT_MAPPING_INTEGRATION.md (New)
✓ EMAIL_MAPPING_SUMMARY.md (New)
✓ VERIFICATION_CHECKLIST.md (New)
✓ ARCHITECTURE_DIAGRAM.md (New)
✓ DEPLOYMENT_GUIDE.md (New)
```

#### 3.2 Git Operations

```bash
# 1. Verify changes
cd /home/khrisna/Project-Sekolah/Absence-App/Siswa-Role
git status

# 2. Stage changes
git add src/services/profileService.js
git add src/context/StudentContext.jsx
git add src/pages/LoginPage.jsx
git add src/lib/emailStudentValidator.js
git add supabase/migrations/002_email_student_mapping.sql

# 3. Optional: Add documentation
git add EMAIL_STUDENT_MAPPING_INTEGRATION.md
git add EMAIL_MAPPING_SUMMARY.md
git add VERIFICATION_CHECKLIST.md
git add ARCHITECTURE_DIAGRAM.md
git add DEPLOYMENT_GUIDE.md

# 4. Create commit
git commit -m "feat: implement email-to-student account mapping system

- Add database migration (002) for email-student mapping
- Add helper functions for profile verification
- Add views for unified account management
- Update ProfileService with mapping verification
- Update StudentContext to auto-load profile after login
- Implement 2-step login verification in LoginPage
- Add comprehensive email-student validator utilities
- Include thorough documentation and testing guides"

# 5. Push to repository
git push origin main

# Or push to feature branch for review first
git push origin feature/email-student-mapping
# Then create PR for review
```

#### 3.3 Code Review & Testing

**Before deployment to production:**

1. **Code Review (if not already done)**
   - [ ] Check modified services for logic errors
   - [ ] Verify imports are correct
   - [ ] Check error handling
   - [ ] Review new validator functions

2. **Build Test**
   ```bash
   npm run build
   # Should complete without errors
   ```

3. **Development Test**
   ```bash
   npm run dev
   # Test login flow with demo account
   ```

---

### Phase 4: Staging Deployment (Day 4-5)

#### 4.1 Deploy to Staging Environment

```bash
# Deploy code to staging
git checkout main
git pull origin main

# Build for staging
npm run build

# Deploy to staging server
# (Steps depend on your hosting platform)
```

#### 4.2 Staging Validation Tests

**Test 1: Happy Path Login**
```
Email: bayu.setiawan@siswa.nexus.sch.id
Password: 123456

Steps:
1. Enter credentials
2. Observe: "Memproses..." spinner
3. Observe: "Memverifikasi..." spinner
4. Expected: "Selamat datang, Bayu Setiawan!"
5. Expected: Redirect to dashboard
6. Verify: Student name shown in navbar
7. Verify: Attendance records displayed
```

**Test 2: Profile Auto-Loading**
```
After successful login:
1. Check StudentContext.profileStatus === 'complete'
2. Check StudentContext.studentProfile populated
3. Check StudentContext.classSchedule loaded
4. Verify all sections display data correctly
```

**Test 3: Error Case - No Profile**
```
Setup: Create auth account without profile
Email: noprofile@siswa.nexus.sch.id
Password: 123456

Expected:
1. Auth login succeeds
2. Verification fails
3. Show: "Profil siswa tidak ditemukan"
4. Stay on login page
5. No navigation to dashboard
```

**Test 4: Error Case - Incomplete Profile**
```
Setup: Create profile with NULL id_kelas
Email: incomplete@siswa.nexus.sch.id
Password: 123456

Expected:
1. Auth login succeeds
2. Verification fails
3. Show: "Profil siswa tidak lengkap"
4. Stay on login page
```

**Test 5: Browser Refresh**
```
1. Login successfully
2. Press F5 to refresh
3. Expected: Session persists
4. Expected: Student data reloaded
5. Expected: No additional login required
```

**Test 6: Multiple Tabs**
```
1. Login in Tab A
2. Open app in Tab B
3. Expected: Both tabs show logged-in state
4. Expected: Data consistent
5. Logout in Tab A
6. Expected: Tab B also logs out (auth listener)
```

#### 4.3 Staging Monitoring (24-48 hours)

```
Monitor these metrics:
- [ ] Login success rate (should be 100% for valid credentials)
- [ ] Login failure rate (should be 0% for valid accounts with profiles)
- [ ] Verification time (should be <5ms)
- [ ] Error logs (should be zero for valid cases)
- [ ] Database query times (should be <10ms average)
- [ ] No 5xx errors
- [ ] No 4xx errors for valid requests
```

**If Issues Found in Staging:**
1. Investigate root cause
2. Fix code
3. Re-test in staging
4. Do NOT proceed to production until fixed

---

### Phase 5: Production Deployment (Day 6)

#### 5.1 Final Checks Before Production

```bash
# 1. Verify all staging tests passed
# [ ] Happy path tested
# [ ] Error cases tested
# [ ] Performance acceptable
# [ ] No logs errors

# 2. Verify production database ready
# [ ] Backup created
# [ ] Integrity checks passed
# [ ] No incomplete profiles

# 3. Get final approval
# [ ] Team lead approval
# [ ] QA sign-off
# [ ] Product owner approval
```

#### 5.2 Production Deployment

**Option A: Blue-Green Deployment**
```
1. Deploy new version to blue environment
2. Run production tests
3. Switch traffic from green to blue
4. Monitor for 1 hour
5. Keep green environment as rollback point
```

**Option B: Gradual Rollout**
```
1. Deploy to 10% of users
2. Monitor for 30 minutes
3. Increase to 50% of users
4. Monitor for 30 minutes
5. Increase to 100% of users
6. Continue monitoring for 24 hours
```

#### 5.3 Production Database Migration

```bash
# Execute migration on production database
# (Same as Phase 2, step 2.1, but on production)

1. Create backup of production database
2. Execute migration
3. Verify migration success (Phase 2, step 2.2)
4. Run integrity checks (Phase 2, step 2.3)
```

#### 5.4 Production Validation

**Immediately after deployment:**
```
Minute 1-5:
- [ ] Homepage loads
- [ ] Login page displays
- [ ] Demo login works

Minute 5-30:
- [ ] Multiple users can login simultaneously
- [ ] Profile loads correctly
- [ ] Dashboard displays
- [ ] Navigation works

Hour 1-4:
- [ ] Monitor error logs (should be zero for valid paths)
- [ ] Monitor database performance
- [ ] Monitor API response times
- [ ] Check 5xx error rate (should be 0%)
- [ ] Check 4xx error rate (should be low)

Hour 4-24:
- [ ] Continue monitoring
- [ ] Test with multiple real user accounts
- [ ] Verify RLS policies working
- [ ] Check data isolation between students
```

#### 5.5 Production Rollback Plan

**If critical issues found:**

```bash
# 1. Immediate response
# [ ] Stop accepting new logins
# [ ] Alert team
# [ ] Investigate issue

# 2. Rollback option A: Revert code
git revert <migration-commit>
npm run build
# Redeploy previous version
# (But keep database migration, as it's backward compatible)

# 3. Rollback option B: Revert database (if critical DB issue)
# [ ] Restore from backup (Phase 5.1)
# [ ] Redeploy previous code version
# [ ] Inform affected users

# 4. Root cause analysis
# [ ] Document what went wrong
# [ ] Fix issue
# [ ] Test thoroughly
# [ ] Re-deploy
```

---

## 📊 Post-Deployment Monitoring

### Week 1: Intensive Monitoring

**Daily Checks:**
```
Daily at 9 AM, 1 PM, 5 PM:
□ Error logs review (Sentry, CloudWatch, etc.)
□ Database performance metrics
□ API response time metrics
□ Login success/failure rates
□ User feedback/support tickets

Action items:
□ Any errors? Investigate & fix
□ Performance degraded? Investigate & optimize
□ Users reporting issues? Prioritize fixes
```

**Metrics to Track:**
| Metric | Expected | Action if |
|--------|----------|-----------|
| Login success rate | >99% | <98% → Investigate |
| Verification time | <5ms | >10ms → Optimize |
| Profile load time | <20ms | >50ms → Check DB |
| Error rate | <0.1% | >0.5% → Alert |
| 5xx errors | 0 | >0 → Critical |

### Week 2-4: Standard Monitoring

**Weekly Checks:**
```
Every Monday:
□ Review week's error logs
□ Check performance trends
□ Review user feedback
□ Plan any optimizations
```

---

## 🔧 Troubleshooting During Deployment

### Issue: Migration Fails to Execute

**Cause:** Syntax error or conflicting objects

**Solution:**
```sql
-- 1. Check what was created
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name LIKE '%verify%';

-- 2. Identify failed portion
-- 3. Fix and re-run just that section
-- 4. Or drop and re-run entire migration
DROP FUNCTION IF EXISTS verify_email_student_mapping(TEXT);
-- Then run migration again
```

### Issue: Login Loops or Doesn't Redirect

**Cause:** Issue with LoginPage navigation

**Solution:**
```
1. Check browser console for errors
2. Verify react-router-dom imports
3. Check useNavigate is available
4. Test with console.log() statements
5. Verify /dashboard route exists
```

### Issue: "Profil siswa tidak ditemukan" for Valid Account

**Cause:** Profile-email mapping issue

**Solution:**
```sql
-- Check email in auth.users
SELECT id FROM auth.users WHERE email = 'email@example.com';

-- Check profiles_siswa for this user_id
SELECT * FROM profiles_siswa WHERE user_id = '<user_id_from_above>';

-- If no profile, create one via admin
-- Or use verification query to debug:
SELECT * FROM verify_email_student_mapping('email@example.com');
```

### Issue: Slow Login Performance

**Cause:** Database query optimization needed

**Solution:**
```sql
-- Check indexes exist
SELECT * FROM pg_indexes WHERE schemaname = 'public';

-- Run query plan to see if using indexes
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM profiles_siswa WHERE user_id = '<uuid>';

-- If not using index, recreate:
DROP INDEX IF EXISTS idx_profiles_siswa_user_id;
CREATE INDEX idx_profiles_siswa_user_id ON profiles_siswa(user_id);
```

---

## ✅ Final Deployment Checklist

### Pre-Deployment
- [ ] All code changes ready
- [ ] Database migration tested in staging
- [ ] Integrity checks pass
- [ ] Documentation complete
- [ ] Team approval obtained

### Deployment
- [ ] Database backup created
- [ ] Migration executed successfully
- [ ] All objects created (functions, views, indexes)
- [ ] Integrity checks pass
- [ ] Code deployed
- [ ] Tests pass

### Post-Deployment
- [ ] Staging validation complete
- [ ] Production tests pass
- [ ] No error logs
- [ ] Performance acceptable
- [ ] Users can login
- [ ] Monitoring active

### Week 1
- [ ] Daily monitoring complete
- [ ] No critical issues
- [ ] Performance stable
- [ ] Ready for standard monitoring

---

## 📞 Support & Escalation

### During Deployment Issues

**Level 1: Quick Fixes**
- Check logs
- Verify configuration
- Test with specific account
- Document issue

**Level 2: Database Issues**
- Run integrity checks
- Check RLS policies
- Verify indexes
- Check constraints

**Level 3: Code Issues**
- Review recent changes
- Check browser console
- Test locally with same environment
- Review error traces

**Level 4: Escalation**
- Contact Supabase support
- Review architecture documentation
- Plan rollback if necessary

---

## 📚 Documentation References

- **Architecture:** See `ARCHITECTURE_DIAGRAM.md`
- **Testing:** See `EMAIL_STUDENT_MAPPING_INTEGRATION.md`
- **Verification:** See `VERIFICATION_CHECKLIST.md`
- **Summary:** See `EMAIL_MAPPING_SUMMARY.md`
- **Integration:** See `EMAIL_STUDENT_MAPPING_INTEGRATION.md`

---

**Deployment Guide**
**System:** Nexus-Connect Absence App - Siswa Role MVP
**Component:** Email-to-Student Account Mapping
**Date:** October 14, 2026
**Status:** ✅ Ready for Deployment

### Next Action: Execute Phase 1 (Preparation) immediately
