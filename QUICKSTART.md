# Quick Start Guide - Absence App Siswa Role

Panduan cepat untuk mulai menggunakan Absence App dengan Supabase backend yang sudah dikonfigurasi.

## ✅ Setup Status

- [x] Node modules terinstall (esbuild conflict sudah diperbaiki)
- [x] Supabase credentials sudah dikonfigurasi di `.env.local`
- [x] Build process verified

## 📋 Prerequisites

- Node.js 16+ (sudah terinstall)
- npm 8+ atau bun (sudah terinstall)
- Akun Supabase dengan project sudah dibuat
- Modern web browser (Chrome, Firefox, Safari, Edge)

## 🚀 Running the Application

### 1. Start Development Server

```bash
cd Siswa-Role
npm run dev
```

**Output yang diharapkan:**
```
VITE v8.3.4  ready in 123 ms

➜  Local:   http://localhost:3000
➜  press h to show help
```

### 2. Open in Browser

Buka http://localhost:3000 di browser Anda

## 🔐 First Time Setup

### Step 1: Setup Database Schema

Jika belum pernah membuat schema di Supabase:

1. Buka https://supabase.com dan login ke project Anda
2. Klik **SQL Editor** di sidebar
3. Klik **New query**
4. Copy-paste seluruh isi file `supabase/migrations/001_init_schema.sql`
5. Klik tombol **Run** (atau Ctrl+Enter)
6. Tunggu sampai sukses (warna hijau)

### Step 2: Create Storage Buckets

1. Di Supabase dashboard, klik **Storage** di sidebar
2. Klik **New bucket** dan buat 3 bucket:

**Bucket 1: attendance-selfies**
- Name: `attendance-selfies`
- Privacy: Private
- Max file size: 5 MB

**Bucket 2: leave-request-proof**
- Name: `leave-request-proof`
- Privacy: Private
- Max file size: 10 MB

**Bucket 3: profile-photos**
- Name: `profile-photos`
- Privacy: Private
- Max file size: 5 MB

### Step 3: Create Test Users

1. Di Supabase dashboard, klik **Authentication** > **Users**
2. Klik **Invite user** atau gunakan "Sign up" link di aplikasi
3. Buat akun test:

```
Email: bayu.setiawan@student.local
Password: password123
```

### Step 4: Test Login

1. Buka http://localhost:3000
2. Masukkan kredensial test
3. Login should be successful

## 📝 Environment Configuration

File `.env.local` sudah berisi credentials. Pastikan **jangan** commit ke Git:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_ENV=development
VITE_API_TIMEOUT=30000
VITE_MAX_FILE_SIZE=10485760
```

### Mengubah Credentials

Jika ingin menggunakan project Supabase yang berbeda:

1. Edit `.env.local`
2. Copy URL dan Anon Key dari Supabase project baru
3. Restart dev server (Ctrl+C lalu `npm run dev`)

## 🧪 Testing Features

### Test Attendance Submission

1. Login dengan student account
2. Buka **Attendance** page
3. Klik **Mark Attendance**
4. Scan QR code atau input manual
5. Capture selfie
6. Submit

**Expected**: Record created dalam database

### Test Leave Request

1. Login dengan student account
2. Buka **Leave Request** page
3. Klik **New Request**
4. Isi form:
   - Category: Sakit
   - Date: Hari ini atau kemarin
   - Description: Alasan apapun
   - Upload proof file (optional)
5. Submit

**Expected**: Request created dengan status 'pending'

### Test Data Access Control (RLS)

Open browser console dan run:

```javascript
// Test 1: Get own profile (should work)
import { supabase } from '@/services/supabase'
const { data } = await supabase
  .from('profiles_siswa')
  .select('*')
  .single()
console.log('Own profile:', data)

// Test 2: Try get other student's profile (should fail/empty)
const { data: other } = await supabase
  .from('profiles_siswa')
  .select('*')
  .eq('id', 'different-student-uuid')
console.log('Other profile:', other)  // Should be null or []
```

## 🛠️ Common Commands

### Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Clean build artifacts
npm run clean

# Run linter
npm run lint
```

### Debugging

```bash
# View build stats
npm run build -- --stats

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for security vulnerabilities
npm audit
npm audit fix
```

## 📚 Project Structure

```
Siswa-Role/
├── src/
│   ├── components/
│   │   ├── Common/           # Reusable UI components
│   │   └── Layout/           # Page layout components
│   ├── context/
│   │   ├── AuthContext.jsx   # Authentication state (Supabase)
│   │   ├── StudentContext.jsx # Student data state
│   │   └── AttendanceContext.jsx
│   ├── services/
│   │   ├── supabase.js       # Supabase client & helpers
│   │   ├── attendanceService.js
│   │   ├── leaveRequestService.js
│   │   ├── profileService.js
│   │   └── classService.js
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── AttendancePage.jsx
│   │   ├── LeaveRequestPage.jsx
│   │   ├── HistoryPage.jsx
│   │   ├── ProfilePage.jsx
│   │   └── SchedulePage.jsx
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility libraries
│   ├── utils/                # Helper functions
│   ├── App.jsx
│   └── main.jsx
├── supabase/
│   ├── migrations/
│   │   └── 001_init_schema.sql
│   ├── SETUP.md              # Detailed setup guide
│   ├── README.md             # API documentation
│   └── INTEGRATION_VERIFICATION.md
├── public/                   # Static assets
├── .env.example              # Environment template
├── .env.local                # Environment (DO NOT COMMIT)
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── QUICKSTART.md             # This file
```

## 🔗 API Integration

Semua services sudah terintegrasi dengan Supabase:

### Authentication
```javascript
import { useAuth } from '@/context/AuthContext'
const { user, login, logout, isLoading } = useAuth()
```

### Attendance
```javascript
import attendanceService from '@/services/attendanceService'
await attendanceService.submitAttendance(studentId, data)
const { data } = await attendanceService.getAttendanceHistory(studentId)
```

### Leave Requests
```javascript
import leaveRequestService from '@/services/leaveRequestService'
await leaveRequestService.submitLeaveRequest(studentId, formData)
const { data, stats } = await leaveRequestService.getLeaveRequests(studentId)
```

### Student Profile
```javascript
import profileService from '@/services/profileService'
const profile = await profileService.getStudentProfile(userId)
const enriched = await profileService.getProfileWithRelations(userId)
```

### Class Schedule
```javascript
import classService from '@/services/classService'
const schedule = await classService.getStudentClassSchedule(studentId)
const today = await classService.getTodaySchedule(studentId)
```

## 🐛 Troubleshooting

### Issue: Build fails dengan "ERESOLVE"

**Solution**: Sudah diperbaiki dengan update esbuild ke ^0.28.0

Jika masih error:
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Issue: "Missing Supabase configuration"

**Solution**: Check `.env.local` ada dan benar:
```bash
cat .env.local
# Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY exist
```

Then restart dev server:
```bash
npm run dev
```

### Issue: Login fails dengan "auth/invalid-api-key"

**Solution**: 
1. Verify `.env.local` has correct Supabase URL dan Anon Key
2. Check tidak ada spasi atau newline di credentials
3. Pastikan using Anon Key, bukan Service Key

### Issue: "RLS policy violation"

**Solution**: User belum login atau belum ada di database
1. Check user sudah dibuat di Supabase Auth
2. Check student profile sudah ada di `profiles_siswa` table
3. Check user_id match antara auth dan profile

### Issue: Port 3000 already in use

**Solution**: 
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- --port 3001
```

## 📖 Documentation

- **Setup Guide**: `supabase/SETUP.md` - Detailed Supabase configuration
- **Database Schema**: `supabase/migrations/001_init_schema.sql` - SQL schema
- **API Docs**: `supabase/README.md` - Service layer documentation
- **Integration Tests**: `supabase/INTEGRATION_VERIFICATION.md` - Test procedures
- **Migration Summary**: `../MIGRATION_SUMMARY.md` - JSON to Supabase migration

## 🚢 Production Deployment

Untuk production, ikuti:

1. Update `.env.local` dengan production Supabase credentials
2. Run build: `npm run build`
3. Deploy `dist/` folder ke hosting (Vercel, Netlify, Firebase, dll)
4. Configure environment variables di hosting platform
5. Setup SSL/TLS (usually automatic dengan modern hosting)
6. Test dengan live domain

See `supabase/SETUP.md` section 8 untuk production checklist.

## 🤝 Support

- **Supabase Issues**: https://supabase.com/docs
- **React Issues**: https://react.dev
- **Vite Issues**: https://vitejs.dev
- **Schema Questions**: Check `supabase/migrations/001_init_schema.sql`

## 📝 Notes

- **DO NOT commit** `.env.local` file - contains sensitive credentials
- **DO NOT push** `node_modules` to Git
- Keep `package-lock.json` updated when adding new dependencies
- Test locally sebelum push ke production
- Backup Supabase data regularly (automated by Supabase)

## ✅ Checklist untuk Production Ready

- [ ] Database schema migrated
- [ ] Storage buckets created
- [ ] Test users created
- [ ] All features tested locally
- [ ] Build passing (`npm run build`)
- [ ] No console errors
- [ ] RLS policies working
- [ ] File upload working
- [ ] Authentication working
- [ ] Production Supabase project created
- [ ] Environment variables configured
- [ ] SSL/TLS enabled
- [ ] Monitoring setup
- [ ] Backup configured

## 🎉 You're Ready!

```bash
npm run dev
# Open http://localhost:3000
# Start building!
```

---

**Version**: 1.0  
**Last Updated**: October 2026  
**Status**: ✅ Ready for Development
