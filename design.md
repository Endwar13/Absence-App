# Design: Nexus-Connect Absence App - Siswa Role MVP

## Overview

The Nexus-Connect Absence App (NXC) is a cloud-based attendance management system. This document covers the Student (Siswa) Role MVP, which allows students to mark attendance via QR scanning + selfie, view attendance status, request leave, and manage their account profile.

**Tech Stack:**
- Frontend: React.js with Vite
- Styling: Tailwind CSS + DaisyUI
- Backend: Supabase (PostgreSQL + Auth)
- Language: Pure JavaScript (no TypeScript)

---

## 1. Project Structure & Folder Layout

```
Frontend/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── ProtectedLayout.jsx
│   │   ├── Auth/
│   │   │   ├── LoginForm.jsx
│   │   │   └── AuthCheck.jsx
│   │   ├── Attendance/
│   │   │   ├── AttendanceForm.jsx
│   │   │   ├── QRScanner.jsx
│   │   │   ├── SelfieCapture.jsx
│   │   │   ├── AttendanceHistory.jsx
│   │   │   └── AttendanceStatus.jsx
│   │   ├── LeaveRequest/
│   │   │   ├── LeaveRequestForm.jsx
│   │   │   ├── LeaveRequestList.jsx
│   │   │   └── LeaveReasonCategory.jsx
│   │   ├── Profile/
│   │   │   ├── StudentProfile.jsx
│   │   │   ├── ClassSchedule.jsx
│   │   │   └── PersonalInfo.jsx
│   │   └── Common/
│   │       ├── LoadingSpinner.jsx
│   │       ├── ErrorAlert.jsx
│   │       ├── SuccessNotification.jsx
│   │       └── ConfirmDialog.jsx
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── AttendancePage.jsx
│   │   ├── LeaveRequestPage.jsx
│   │   ├── HistoryPage.jsx
│   │   ├── ProfilePage.jsx
│   │   ├── SchedulePage.jsx
│   │   └── NotFoundPage.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useAttendance.js
│   │   ├── useLeaveRequest.js
│   │   ├── useStudentProfile.js
│   │   └── useAsync.js
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── StudentContext.jsx
│   ├── services/
│   │   ├── supabase.js
│   │   ├── attendanceService.js
│   │   ├── leaveRequestService.js
│   │   ├── profileService.js
│   │   └── classService.js
│   ├── lib/
│   │   ├── qrScanner.js
│   │   ├── fileUpload.js
│   │   ├── dateUtils.js
│   │   └── validator.js
│   ├── utils/
│   │   ├── formatters.js
│   │   ├── constants.js
│   │   └── errorHandler.js
│   ├── styles/
│   │   ├── globals.css
│   │   └── theme.css
│   ├── App.jsx
│   └── main.jsx
├── public/
│   ├── icon-check.svg
│   ├── icon-camera.svg
│   ├── icon-qr.svg
│   └── logo.svg
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.example
├── .env.local
├── index.html
└── package.json
```

---

## 2. Database Schema

### Supabase PostgreSQL Tables

#### **users** (Supabase Auth)
- `id` (UUID, primary key) - from auth.users
- `email` (text, unique)
- `role` (text) - 'siswa', 'guru', 'admin'
- `created_at` (timestamp)

#### **profiles_siswa**
```sql
CREATE TABLE profiles_siswa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  nisn TEXT UNIQUE NOT NULL,
  nis TEXT UNIQUE NOT NULL,
  jenis_kelamin TEXT NOT NULL CHECK (jenis_kelamin IN ('L', 'P')),
  id_kelas UUID NOT NULL REFERENCES kelas(id),
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_profiles_siswa_user_id ON profiles_siswa(user_id);
CREATE INDEX idx_profiles_siswa_id_kelas ON profiles_siswa(id_kelas);
```

#### **kelas**
```sql
CREATE TABLE kelas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_kelas TEXT NOT NULL UNIQUE,
  tahun_ajaran TEXT NOT NULL,
  wali_kelas_id UUID NOT NULL REFERENCES guru(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_kelas_wali_kelas_id ON kelas(wali_kelas_id);
```

#### **guru**
```sql
CREATE TABLE guru (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  nip TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('guru_mapel', 'wali_kelas', 'keduanya')),
  id_kelas UUID REFERENCES kelas(id),
  speciality TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_guru_user_id ON guru(user_id);
CREATE INDEX idx_guru_id_kelas ON guru(id_kelas);
```

#### **absen**
```sql
CREATE TABLE absen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id UUID NOT NULL REFERENCES profiles_siswa(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')),
  qr_scan_time TIMESTAMP,
  selfie_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(siswa_id, tanggal)
);

CREATE INDEX idx_absen_siswa_id ON absen(siswa_id);
CREATE INDEX idx_absen_tanggal ON absen(tanggal);
CREATE INDEX idx_absen_status ON absen(status);
```

#### **pengajuan_ijin**
```sql
CREATE TABLE pengajuan_ijin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id UUID NOT NULL REFERENCES profiles_siswa(id) ON DELETE CASCADE,
  tanggal_tidak_hadir DATE NOT NULL,
  kategori TEXT NOT NULL CHECK (kategori IN ('Izin', 'Sakit', 'Lainnya')),
  deskripsi TEXT NOT NULL,
  bukti_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES guru(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pengajuan_ijin_siswa_id ON pengajuan_ijin(siswa_id);
CREATE INDEX idx_pengajuan_ijin_status ON pengajuan_ijin(status);
CREATE INDEX idx_pengajuan_ijin_tanggal ON pengajuan_ijin(tanggal_tidak_hadir);
```

#### **jadwal_pelajaran**
```sql
CREATE TABLE jadwal_pelajaran (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_kelas UUID NOT NULL REFERENCES kelas(id),
  guru_id UUID NOT NULL REFERENCES guru(id),
  hari_dalam_minggu TEXT NOT NULL,
  jam_mulai TIME NOT NULL,
  jam_selesai TIME NOT NULL,
  mapel TEXT NOT NULL,
  ruangan TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jadwal_pelajaran_kelas ON jadwal_pelajaran(id_kelas);
CREATE INDEX idx_jadwal_pelajaran_guru ON jadwal_pelajaran(guru_id);
```

### Row Level Security (RLS) Policies

#### **profiles_siswa**
```sql
-- Students can read their own profile
ALTER TABLE profiles_siswa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students read own profile" ON profiles_siswa
  FOR SELECT USING (auth.uid() = user_id);

-- Students cannot modify their profile (admin only)
CREATE POLICY "Prevent direct profile modification" ON profiles_siswa
  FOR UPDATE USING (false);

CREATE POLICY "Prevent direct profile deletion" ON profiles_siswa
  FOR DELETE USING (false);
```

#### **absen**
```sql
-- Students can read their own attendance records
ALTER TABLE absen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students read own attendance" ON absen
  FOR SELECT USING (
    siswa_id IN (
      SELECT id FROM profiles_siswa WHERE user_id = auth.uid()
    )
  );

-- Students can insert their own attendance
CREATE POLICY "Students create attendance" ON absen
  FOR INSERT WITH CHECK (
    siswa_id IN (
      SELECT id FROM profiles_siswa WHERE user_id = auth.uid()
    )
    AND created_at = CURRENT_TIMESTAMP
  );

-- Attendance records cannot be modified after creation
CREATE POLICY "Prevent attendance modification" ON absen
  FOR UPDATE USING (false);
```

#### **pengajuan_ijin**
```sql
-- Students can read and create their own leave requests
ALTER TABLE pengajuan_ijin ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students read own leave requests" ON pengajuan_ijin
  FOR SELECT USING (
    siswa_id IN (
      SELECT id FROM profiles_siswa WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Students create leave requests" ON pengajuan_ijin
  FOR INSERT WITH CHECK (
    siswa_id IN (
      SELECT id FROM profiles_siswa WHERE user_id = auth.uid()
    )
  );

-- Students cannot modify their requests
CREATE POLICY "Students cannot modify requests" ON pengajuan_ijin
  FOR UPDATE USING (false);
```

#### **jadwal_pelajaran**
```sql
-- Students can read schedules for their class
ALTER TABLE jadwal_pelajaran ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students read class schedule" ON jadwal_pelajaran
  FOR SELECT USING (
    id_kelas IN (
      SELECT id_kelas FROM profiles_siswa WHERE user_id = auth.uid()
    )
  );
```

---

## 3. Component Architecture

### 3.1 Layout Components

#### **ProtectedLayout.jsx**
- Wrapper untuk halaman yang memerlukan autentikasi
- Checks auth status dan redirect ke login jika diperlukan
- Props: `children`
- Features: Loading state handling, 404 redirects

#### **Navbar.jsx**
- Header dengan student name dan logout button
- Mobile responsive dengan hamburger menu
- Features: Dark mode toggle, real-time clock
- Uses: DaisyUI navbar, badge untuk status

#### **Sidebar.jsx**
- Navigation menu dengan 5 sections:
  - Dashboard
  - Attendance (Form + History)
  - Leave Request
  - Schedule
  - Profile
- Active route indication
- Collapse/expand on mobile

### 3.2 Authentication Components

#### **LoginForm.jsx**
- Email + password fields
- Form validation before submit
- Loading state during authentication
- Error messages (invalid credentials, network)
- Remember me checkbox (optional)
- Link ke support/forgot password (future)

#### **AuthCheck.jsx**
- Context consumer untuk check auth status
- Redirect logic
- Loading spinner selama auth session check

### 3.3 Attendance Components

#### **AttendanceForm.jsx**
- Container component yang mengelola form flow
- Step 1: QR Scanner
- Step 2: Selfie Capture
- Step 3: Confirmation
- Auto-filled fields: nama, kelas, tanggal, waktu
- Submit handler yang calls `attendanceService.submitAttendance()`

#### **QRScanner.jsx**
- Uses `jsQR` library untuk scanning
- Camera access request handling
- Scanned data validation (QR format expected)
- Fallback untuk manual input
- Stop/retry buttons

#### **SelfieCapture.jsx**
- Access device camera
- Preview selfie sebelum confirm
- Retake option
- Compress image sebelum upload
- File size validation (max 5MB)

#### **AttendanceHistory.jsx**
- Table/list view dari attendance records
- Filter: Date range, status (Hadir/Sakit/Izin/Alpha)
- Sort: Tanggal terbaru first
- Pagination: 10 items per page
- Show: Tanggal, Status, Jam masuk, Foto thumbnail

#### **AttendanceStatus.jsx**
- Dashboard card menampilkan:
  - Absen hari ini (status badge)
  - Week summary (Hadir: X, Izin: Y, Sakit: Z, Alpha: W)
  - Month summary (pie chart atau stats)

### 3.4 Leave Request Components

#### **LeaveRequestForm.jsx**
- Form fields:
  - Tanggal tidak hadir (date picker, H-1 atau later)
  - Kategori alasan (Izin / Sakit / Lainnya) - radio/select
  - Deskripsi alasan (textarea, required)
  - Upload bukti (file input, optional, max 10MB)
- Validation: Date must be >= tomorrow for Izin, >= today for Sakit
- Submit calls `leaveRequestService.submitLeaveRequest()`

#### **LeaveReasonCategory.jsx**
- Category selector component
- 3 options: Izin, Sakit, Lainnya
- Shows/hides file upload based on category
- Conditional date validation

#### **LeaveRequestList.jsx**
- List view dari all leave requests
- Filter: Status (Pending/Approved/Rejected)
- Sort: Created date descending
- Show: Tanggal, Kategori, Status, Approval date (if approved)
- Color coded: yellow for pending, green for approved, red for rejected

### 3.5 Profile Components

#### **StudentProfile.jsx**
- Display student info read-only:
  - Nama, NISN, NIS, Jenis Kelamin
  - Kelas, Wali Kelas name
  - Profile photo
- Edit button (future feature)

#### **ClassSchedule.jsx**
- Table/list dari jadwal pelajaran
- Columns: Hari, Jam, Mapel, Guru, Ruangan
- Grouped by day of week
- Current/upcoming classes highlighted

#### **PersonalInfo.jsx**
- Shows profile data
- Edit profile form (future)
- Change password button (future)

### 3.6 Common/UI Components

#### **LoadingSpinner.jsx**
- DaisyUI loading animation
- Centered, with optional text

#### **ErrorAlert.jsx**
- Alert box dengan error message
- Dismiss button
- Icons untuk different error types

#### **SuccessNotification.jsx**
- Toast notification
- Auto-dismiss after 3-4 seconds
- Success icon

#### **ConfirmDialog.jsx**
- Modal untuk confirmation
- Props: title, message, onConfirm, onCancel

---

## 4. Pages & Routing

```
/                     → Dashboard (jika authenticated) / Login (jika tidak)
/login                → LoginPage
/dashboard            → DashboardPage (overview + status)
/attendance           → AttendancePage (form + history tabs)
/attendance/form      → AttendanceForm
/attendance/history   → AttendanceHistory
/leave-request        → LeaveRequestPage (form + list tabs)
/leave-request/new    → LeaveRequestForm
/leave-request/list   → LeaveRequestList
/schedule             → SchedulePage
/profile              → ProfilePage
/404                  → NotFoundPage
```

**Routing Library:** React Router v6

---

## 5. State Management

### 5.1 Context API Architecture

#### **AuthContext.jsx**
```javascript
// Provides:
- user (object | null)
- isAuthenticated (boolean)
- isLoading (boolean)
- error (string | null)
- login(email, password)
- logout()
- checkSession()

// Manages Supabase auth session
// Persists to localStorage
```

#### **StudentContext.jsx**
```javascript
// Provides:
- studentProfile (object)
- attendanceRecords (array)
- leaveRequests (array)
- classSchedule (array)
- refreshStudentData()

// Synced with Supabase real-time (optional)
// Used across dashboard pages
```

### 5.2 Custom Hooks

#### **useAuth.js**
```javascript
// Returns: user, isLoading, error, login(), logout()
// Consumers: All protected pages
```

#### **useAttendance.js**
```javascript
// Returns: attendance[], loading, error, submitAttendance(), getHistory()
// Consumers: AttendancePage, AttendanceStatus
```

#### **useLeaveRequest.js**
```javascript
// Returns: leaveRequests[], loading, error, submitLeaveRequest(), getList()
// Consumers: LeaveRequestPage
```

#### **useStudentProfile.js**
```javascript
// Returns: profile, loading, error, refreshProfile()
// Consumers: ProfilePage, Navbar
```

#### **useAsync.js**
```javascript
// Generic hook untuk async operations
// Returns: data, loading, error
// Used by other hooks
```

---

## 6. Services Layer

### **supabase.js**
```javascript
// Initialize Supabase client
// Export: supabase instance

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default supabase;
```

### **attendanceService.js**
```javascript
// Functions:
- submitAttendance(siswaId, qrData, selfieFile)
  - Upload selfie ke Supabase storage
  - Insert record ke absen table
  - Return: { success, attendanceId, message }

- getAttendanceHistory(siswaId, filters = {})
  - Query absen table with filters
  - Return: { data: [], total }

- getTodayAttendance(siswaId)
  - Check jika siswa sudah absen hari ini
  - Return: { hasAttended, record }
```

### **leaveRequestService.js**
```javascript
// Functions:
- submitLeaveRequest(siswaId, formData)
  - Upload bukti file jika ada (storage)
  - Insert ke pengajuan_ijin table
  - Return: { success, requestId, message }

- getLeaveRequests(siswaId, filters = {})
  - Query pengajuan_ijin table
  - Return: { data: [], total, stats }

- getLeaveRequestDetail(requestId)
  - Get single leave request
```

### **profileService.js**
```javascript
// Functions:
- getStudentProfile(userId)
  - Query profiles_siswa
  - Return: student data

- getProfileWithRelations(userId)
  - Join dengan kelas, guru (wali kelas)
  - Return: enriched profile

- updateProfile(profileId, updateData)
  - Update student profile (future)
```

### **classService.js**
```javascript
// Functions:
- getClassSchedule(classId)
  - Query jadwal_pelajaran
  - Return: schedule[] sorted by day & time

- getStudentClassSchedule(studentId)
  - Get schedule untuk class dari student
```

---

## 7. Styling Strategy

### **Tailwind + DaisyUI Setup**

#### **tailwind.config.js**
```javascript
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'hsl(217, 100%, 50%)', // Blue
        secondary: 'hsl(262, 80%, 50%)', // Purple
        success: 'hsl(142, 70%, 45%)',   // Green
        warning: 'hsl(38, 92%, 50%)',    // Amber
        error: 'hsl(0, 84%, 60%)',       // Red
        info: 'hsl(188, 78%, 41%)',      // Cyan
      }
    }
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: ['light', 'dark'],
    darkMode: 'class',
  }
}
```

#### **Color Usage**
- **Primary (Blue):** Main buttons, links, active states
- **Success (Green):** Hadir status, approve buttons
- **Warning (Amber):** Pending status, caution messages
- **Error (Red):** Alpha status, reject buttons
- **Info (Cyan):** General information, headers

#### **Responsive Breakpoints**
- Mobile-first approach
- sm: 640px, md: 768px, lg: 1024px, xl: 1280px
- Stack cards on mobile, grid on desktop

#### **Component Styling**
- Use DaisyUI components as base
- Override dengan Tailwind utilities
- Create reusable component classes di `styles/theme.css`

### **Dark Mode Support**
- Toggle dalam Navbar
- Persist preference ke localStorage
- Use `dark:` Tailwind prefix

---

## 8. Error Handling & Validation

### **Validation Rules**

#### **Login Form**
- Email: valid format (RFC 5322)
- Password: min 6 characters

#### **Attendance Form**
- QR Scanner: Valid QR code format
- Selfie: JPEG/PNG, max 5MB
- Both required before submit

#### **Leave Request Form**
- Tanggal: >= tomorrow (for Izin), >= today (for Sakit)
- Kategori: required
- Deskripsi: min 10 characters, max 500
- Bukti file (optional): max 10MB, PDF/Image only

### **Error Handling Flow**
```
1. Form validation (client-side)
   ↓
2. Network request (Supabase)
   ↓
3. Server-side validation (RLS policies)
   ↓
4. Display error message atau success notification
   ↓
5. Log errors ke console (dev) dan analytics (prod)
```

### **Error Messages**
- User-friendly, non-technical language
- Bahasa Indonesia untuk target audience
- Actionable suggestions (e.g., "Check your internet connection")

---

## 9. Integration Points

### **Supabase Authentication**
- Email/password auth via `supabase.auth.signInWithPassword()`
- Session management via `supabase.auth.onAuthStateChange()`
- Logout via `supabase.auth.signOut()`
- Store token dalam memory (Auth context) + localStorage

### **File Upload (Supabase Storage)**
- Selfie uploads to `/attendance-selfies/{studentId}/{timestamp}.jpg`
- Leave request proof to `/leave-request-proof/{studentId}/{timestamp}.{ext}`
- Use signed URLs untuk download/display
- Delete policy: Auto-delete after 30 days (lifecycle rules)

### **Real-time Updates (Optional, Phase 2)**
- Subscribe to attendance changes untuk live dashboard
- Use `supabase.from('absen').on('*', ...)` listener

### **QR Code Library**
- **jsQR** untuk scanning
- **qrcode.react** untuk generating (if needed)

### **Camera Access**
- Use native `navigator.mediaDevices.getUserMedia()`
- Permission handling untuk iOS/Android

---

## 10. Security Considerations

### **Authentication & Authorization**
- JWT tokens from Supabase Auth
- RLS policies enforce data isolation
- Students can only access own records

### **Data Protection**
- HTTPS only (enforced by Supabase)
- Sensitive fields encrypted at rest (DB level)
- No sensitive data in localStorage except JWT

### **File Uploads**
- Validate file type & size on client & server
- Scan files untuk malware (future, via external service)
- Restrict access via RLS policies

### **API Rate Limiting**
- Implement client-side debouncing untuk repeated requests
- Supabase rate limiting on backend

---

## 11. Performance Optimizations

### **Code Splitting**
- Lazy load pages dengan `React.lazy()` + `Suspense`
- Bundle size monitoring dengan Vite

### **Image Optimization**
- Compress selfies before upload
- Use WebP format (with fallback)
- CDN caching untuk profile photos

### **Query Optimization**
- Use indexes on foreign keys & frequently filtered columns
- Pagination untuk large result sets
- Cache student profile di context (TTL: 5 min)

### **UI Performance**
- Memoize components dengan `React.memo()` jika diperlukan
- Use `useCallback()` untuk event handlers
- Virtualization untuk long lists (future)

---

## 12. Architecture

### System Overview

The Nexus-Connect Absence App follows a three-tier client-server architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (React.js)                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Pages → Components → Hooks → Context → Services       │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↕ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND LAYER (Supabase)                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Auth (JWT) → Row Level Security → PostgreSQL DB       │  │
│  │ Storage (Selfies, Proof Files) → Signed URLs          │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

**Client Layer (Frontend)**
- Manages UI rendering and user interactions
- Handles form validation and client-side business logic
- Manages application state (Auth + Student context)
- Performs camera/QR scanner operations locally
- Uploads files to Supabase storage
- Implements error recovery and offline handling

**Backend Layer (Supabase)**
- Provides authentication and session management
- Enforces data access control via RLS policies
- Stores and retrieves student, attendance, and leave data
- Manages file storage for selfies and proof documents
- Logs user actions for audit trails

### Data Flow

1. **Authentication Flow:**
   - User enters email/password → Client validates → Supabase auth API → JWT token → Store in context
   - Session persists via `onAuthStateChange` listener
   - Logout clears context and revokes session

2. **Attendance Submission Flow:**
   - QR scan → Selfie capture → Compress image → Upload to storage → Submit record to DB
   - RLS policy checks ownership before insert
   - Response returns signed URL for file access

3. **Leave Request Flow:**
   - Form submission with date + category + description + optional proof file
   - File upload (if provided) → Record creation with references
   - Status field defaults to 'pending' → Teacher approval updates status

4. **Data Retrieval Flow:**
   - Client calls service function → Supabase query with RLS enforcement
   - Results filtered by authenticated user ID
   - Data passed to context → Components subscribe and re-render

### Communication Protocol

- REST API (via Supabase JS client) for CRUD operations
- WebSocket (optional Phase 2) for real-time attendance updates
- All requests include JWT token in Authorization header
- Timeout: 30 seconds (configurable via `VITE_API_TIMEOUT`)

---

## 13. Components and Interfaces

### Component Hierarchy

```
App.jsx
├── AuthContext.Provider
│   └── StudentContext.Provider
│       ├── ProtectedLayout
│       │   ├── Navbar
│       │   ├── Sidebar
│       │   └── <Page Component>
│       │       └── <Feature Component>
│       └── LoginPage
│           └── LoginForm
```

### Component Specifications

#### **Layout Tier**
- **Navbar:** Renders username, dark mode toggle, logout button. Mobile-responsive hamburger menu.
- **Sidebar:** Fixed or collapsible navigation. Highlights active route. Responsive collapse on mobile.
- **ProtectedLayout:** Wraps authenticated pages. Checks auth status and redirects if needed.

#### **Feature Tier**
- **AttendanceForm:** Multi-step form (QR → Selfie → Confirm). Manages step state and file handles.
- **LeaveRequestForm:** Single-page form with conditional file upload. Date validation based on category.
- **StudentProfile:** Read-only display of profile data with optional edit button placeholder.

#### **Common/UI Tier**
- **LoadingSpinner:** Centered spinner with optional text label.
- **ErrorAlert:** Dismissible alert with error icon and message.
- **SuccessNotification:** Toast-style notification with auto-dismiss.
- **ConfirmDialog:** Modal with title, message, and confirm/cancel buttons.

#### **QR Scanner Interface**
```javascript
QRScanner: {
  props: {
    onScanSuccess(data),
    onScanError(error),
    constraints: { audio: false, video: { facingMode: 'environment' } }
  },
  methods: {
    startScanning(),
    stopScanning(),
    retryScanning()
  }
}
```

#### **Selfie Capture Interface**
```javascript
SelfieCapture: {
  props: {
    onCapture(blob),
    maxFileSize: 5 * 1024 * 1024 // 5MB
  },
  methods: {
    capturePhoto(),
    retakePhoto(),
    confirmPhoto()
  }
}
```

### Prop Drilling Prevention

- Use Context API for global state (Auth, Student data)
- Pass callbacks as prop instead of deeply nesting
- Memoize expensive computations with `useMemo`

---

## 14. Data Models

### Core Data Structures

#### **Student Profile**
```javascript
StudentProfile: {
  id: UUID,
  user_id: UUID,
  nama: string,
  nisn: string (unique),
  nis: string (unique),
  jenis_kelamin: 'L' | 'P',
  id_kelas: UUID,
  photo_url: string | null,
  created_at: ISO8601,
  updated_at: ISO8601
}
```

#### **Attendance Record**
```javascript
AttendanceRecord: {
  id: UUID,
  siswa_id: UUID,
  tanggal: DATE,
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha',
  qr_scan_time: ISO8601 | null,
  selfie_url: string (Supabase signed URL),
  created_at: ISO8601,
  updated_at: ISO8601
}
```

#### **Leave Request**
```javascript
LeaveRequest: {
  id: UUID,
  siswa_id: UUID,
  tanggal_tidak_hadir: DATE,
  kategori: 'Izin' | 'Sakit' | 'Lainnya',
  deskripsi: string (10-500 chars),
  bukti_url: string | null (Supabase signed URL),
  status: 'pending' | 'approved' | 'rejected',
  approved_by: UUID | null,
  approved_at: ISO8601 | null,
  created_at: ISO8601,
  updated_at: ISO8601
}
```

#### **Class Schedule**
```javascript
ClassSchedule: {
  id: UUID,
  id_kelas: UUID,
  guru_id: UUID,
  hari_dalam_minggu: string (Senin|Selasa|Rabu|Kamis|Jumat|Sabtu),
  jam_mulai: TIME,
  jam_selesai: TIME,
  mapel: string,
  ruangan: string | null,
  created_at: ISO8601,
  updated_at: ISO8601
}
```

### Context Data Structures

#### **AuthContext State**
```javascript
{
  user: {
    id: UUID,
    email: string,
    role: 'siswa'
  } | null,
  isAuthenticated: boolean,
  isLoading: boolean,
  error: string | null
}
```

#### **StudentContext State**
```javascript
{
  studentProfile: StudentProfile | null,
  attendanceRecords: AttendanceRecord[],
  leaveRequests: LeaveRequest[],
  classSchedule: ClassSchedule[],
  loading: boolean,
  error: string | null
}
```

### API Response Models

#### **Attendance Submission Response**
```javascript
{
  success: boolean,
  attendanceId: UUID,
  selfieUrl: string,
  message: string
}
```

#### **Leave Request Submission Response**
```javascript
{
  success: boolean,
  requestId: UUID,
  proofFileUrl: string | null,
  message: string
}
```

#### **Error Response**
```javascript
{
  success: false,
  error: {
    code: string,
    message: string,
    details: object
  }
}
```

---

## 16. Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do.*

### Property 1: Attendance Immutability

For any student attendance record created, the record shall remain unchanged after initial creation. Once submitted with QR scan and selfie, the attendance status cannot be modified or deleted by any user action.

**Validates: Student Feature 2, 3**

### Property 2: Unique Daily Attendance

For any student and any calendar day, there shall be at most one attendance record per day. A student cannot submit multiple attendance entries for the same date.

**Validates: Student Feature 2**

### Property 3: Leave Request Temporal Constraint

For any leave request with category "Izin", the requested absence date must be at least one day in the future (H-1 or later). For category "Sakit", requests can be submitted same day or future date.

**Validates: Student Feature 7, Leave Request Acceptance Criteria**

### Property 4: Self-Owned Data Access

For any student accessing the system, all visible attendance records, leave requests, and profile information must belong to that authenticated student. Cross-student data access must be prevented by system policies.

**Validates: Student Feature 3, 4, 5, Authentication & Authorization**

### Property 5: Leave Request Status Progression

For any leave request in the system, the status shall only transition through valid states: pending → approved OR pending → rejected. A request cannot be moved back to pending or skip states.

**Validates: Student Feature 7, Leave Request Management**

### Property 6: File Upload Persistence

For any attendance record with selfie or leave request with proof file, the uploaded file shall be accessible from Supabase Storage via a signed URL immediately after successful record creation. File references must persist for at least 30 days.

**Validates: Student Feature 2, Leave Request File Handling**

### Property 7: Class Schedule Consistency

For any student viewing their class schedule, all displayed classes must belong to the student's assigned class. Schedule data must reflect the current academic year and match the class's assigned courses and teachers.

**Validates: Student Feature 6, Schedule Display**

### Property 8: Student Profile Completeness

For any student after initial account creation, the profile must contain all required fields: nama, NISN, NIS, jenis_kelamin, and id_kelas. Missing fields indicate incomplete profile setup and should prevent attendance operations.

**Validates: Student Feature 1, Account Setup**

---

## 18. Error Handling

### Error Categories

#### **Authentication Errors**
- **401 Unauthorized:** Invalid credentials, expired session
  - Recovery: Redirect to login page
  - Message: "Invalid email or password. Please try again."
  
- **403 Forbidden:** JWT missing or invalid
  - Recovery: Force logout and redirect to login
  - Message: "Session expired. Please log in again."

#### **Validation Errors**
- **400 Bad Request:** Form validation failed
  - Recovery: Display field-level error messages
  - Message: "Please check the following fields: [field names]"
  
- **422 Unprocessable Entity:** Business rule violation (e.g., duplicate attendance)
  - Recovery: Show user-friendly message with guidance
  - Message: "You have already marked attendance today."

#### **Network Errors**
- **0 (No Response):** Network unreachable, timeout
  - Recovery: Retry with exponential backoff
  - Message: "Network error. Please check your internet connection."
  
- **5xx Server Error:** Supabase backend failure
  - Recovery: Retry or suggest user refresh later
  - Message: "Server is temporarily unavailable. Please try again later."

#### **File Upload Errors**
- **Payload Too Large:** File exceeds size limit
  - Recovery: Show file size requirement
  - Message: "File size must not exceed 5MB. Current: XXmb."
  
- **Unsupported Media Type:** Invalid file format
  - Recovery: Show supported formats
  - Message: "Supported formats: JPEG, PNG. You selected: [type]."

### Error Handling Strategy

```
1. CLIENT-SIDE VALIDATION
   ├─ Check format, required fields, constraints
   └─ Display inline field errors immediately

2. REQUEST EXECUTION
   ├─ Wrap in try-catch
   └─ Add timeout protection (30s)

3. RESPONSE VALIDATION
   ├─ Check status code
   └─ Parse error object

4. USER NOTIFICATION
   ├─ Display ErrorAlert for 4xx/5xx
   ├─ Show SuccessNotification for 2xx
   └─ Log error for debugging

5. RECOVERY ACTION
   ├─ Retry logic (exponential backoff for transient errors)
   ├─ Navigation (redirect on auth failure)
   └─ State rollback (revert form on failure)
```

### Retry Logic

- **Transient Errors (Network, Timeout):** Retry up to 3 times with delays: 500ms, 1s, 2s
- **Non-Transient Errors (Validation, Auth):** Show error, no auto-retry
- **Rate Limit (429):** Respect `Retry-After` header, max 5 retries

### Error Logging

- **Client Errors:** Log to console in dev, Sentry in prod
- **Server Errors:** Attach user ID, route, request method, timestamp
- **Sensitive Data:** Never log passwords, tokens, file content

### User-Facing Error Messages

- Keep messages short and actionable
- Use Bahasa Indonesia for target audience
- Avoid technical jargon (e.g., "RLS policy" → "permission denied")
- Suggest next steps (e.g., "Try again later" or "Contact support")

---

## 17. Testing Strategy

### **Unit Tests**
- Component rendering tests (React Testing Library)
- Hook logic tests (renderHook)
- Service function tests (mocked Supabase)
- Validation function tests
- Examples:
  - Login form with valid/invalid credentials
  - Attendance form QR scan validation
  - Leave request date validation

### **Property-Based Tests**
- Generate random attendance records → verify immutability
- Generate random student data → verify self-owned access
- Generate random leave request dates → verify temporal constraints
- Generate random leave request state transitions → verify valid progression

### **Integration Tests**
- End-to-end auth flow
- Full attendance submission (QR + selfie)
- Leave request submission + approval flow
- File upload + retrieval
- Real-time data updates (if Phase 2 includes realtime)

### **E2E Tests** (Cypress/Playwright, future)
- Complete user journeys
- Cross-browser compatibility
- Mobile responsiveness

---

## 18. Dependencies & Libraries

### **Core**
- `react@18+` - UI framework
- `react-dom@18+` - DOM rendering
- `react-router-dom@6+` - Routing
- `@supabase/supabase-js@2+` - Supabase client

### **UI & Styling**
- `tailwindcss@3+` - Utility CSS
- `daisyui@latest` - Component library
- `postcss@latest` - CSS processor
- `autoprefixer@latest` - Vendor prefixing

### **Forms & Validation**
- `react-hook-form@7+` - Form state management
- `zod@3+` - Schema validation
- `@hookform/resolvers` - Zod integration

### **File & Image Handling**
- `sharp` (server-side) or `browser-image-compression` - Image optimization
- `file-saver` - Download utilities

### **QR & Camera**
- `jsqr@1.4+` - QR code scanning
- `qrcode.react@1+` - QR generation (optional)

### **Utilities**
- `date-fns@2+` - Date manipulation
- `uuid@9+` - ID generation
- `axios@1+` - HTTP client (optional, if not using Supabase directly)

### **Development**
- `vite@4+` - Build tool
- `@vitejs/plugin-react` - React support in Vite
- `eslint@8+` - Code linting
- `prettier@3+` - Code formatting
- `vitest@0.34+` - Unit testing
- `@testing-library/react@14+` - React testing

---

## 19. Environment Variables

**.env.local** (Example)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_ENV=development
VITE_API_TIMEOUT=30000
VITE_MAX_FILE_SIZE=10485760
```

---

## 20. Implementation Phases

### **Phase 1 (MVP - This Spec)**
- ✅ Authentication (Login/Logout)
- ✅ Dashboard with attendance status
- ✅ Attendance form (QR + Selfie)
- ✅ Attendance history
- ✅ Leave request form & list
- ✅ Student profile view
- ✅ Class schedule view
- ✅ Basic error handling & validation

### **Phase 2 (Enhancement)**
- Real-time attendance updates
- Edit profile functionality
- Advanced attendance analytics & charts
- Offline mode support
- Push notifications
- Payment integration (if applicable)

### **Phase 3 (Scale)**
- Guru role implementation
- Admin dashboard
- Advanced reporting & analytics
- Multi-language support
- API documentation for mobile apps

---

## 21. Deployment & DevOps

### **Frontend Hosting**
- Vercel, Netlify, or Firebase Hosting
- Auto-deploy from Git on push to main branch
- Environment-based builds (staging/production)

### **Database Backups**
- Daily automated Supabase backups
- 30-day retention policy

### **Monitoring & Logging**
- Sentry for error tracking
- Google Analytics atau Mixpanel untuk user behavior
- Supabase built-in logs untuk database & auth

---

## 22. Future Enhancements (Not in MVP)

- QR code generation & display on teacher dashboard
- Real-time attendance notifications
- Biometric auth (fingerprint/face)
- Advanced analytics dashboard
- Mobile app (React Native)
- Multi-language support (i18n)
- Accessibility improvements (WCAG AA compliance)
- Payment gateway integration
- Single Sign-On (SSO) integration
- Two-factor authentication (2FA)

