# Implementation Plan: Nexus-Connect Absence App - Siswa Role MVP

## Overview

Convert the Nexus-Connect Absence App design into an actionable implementation plan for the Student (Siswa) role MVP. This plan breaks down the feature into discrete coding steps that build incrementally, starting with project setup and configuration, moving through database & authentication infrastructure, implementing core features (attendance & leave request), and finalizing with common components and styling.

The implementation uses React.js + Vite, Tailwind CSS + DaisyUI, Supabase, and Pure JavaScript. Each task includes specific references to design components and correctness properties to ensure alignment with requirements.

---

## Tasks

### 1. Project Setup & Configuration

- [ ] 1.1 Initialize Vite React project with proper structure
  - Create new Vite React app using `npm create vite@latest`
  - Setup project directory structure matching design (src/components, src/pages, src/services, etc.)
  - Configure package.json with all required dependencies
  - Setup .gitignore and basic project files
  - _Design: Section 1 - Project Structure_

- [ ] 1.2 Configure Tailwind CSS + DaisyUI + PostCSS
  - Install tailwindcss, daisyui, postcss, autoprefixer
  - Create tailwind.config.js with custom color themes (primary, success, warning, error, info)
  - Create postcss.config.js with tailwind and autoprefixer
  - Create src/styles/globals.css and src/styles/theme.css
  - Test Tailwind utilities work in a sample component
  - _Design: Section 7 - Styling Strategy_

- [ ] 1.3 Setup Supabase project and environment variables
  - Create Supabase account and new project
  - Get VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
  - Create .env.local with Supabase credentials and other config
  - Create .env.example template for documentation
  - Create src/services/supabase.js with Supabase client initialization
  - _Design: Section 9 - Integration Points, Section 15 - Environment Variables_

- [ ] 1.4 Configure React Router v6
  - Install react-router-dom@6+
  - Create src/App.jsx with routing structure
  - Setup route paths matching design (/login, /dashboard, /attendance, /leave-request, /schedule, /profile, /404)
  - Create NotFoundPage.jsx for 404 handling
  - Setup nested route structure for tabs (attendance/form, attendance/history, etc.)
  - _Design: Section 4 - Pages & Routing_

- [ ] 1.5 Setup ESLint + Prettier + development tooling
  - Install eslint, prettier, eslint-config-prettier
  - Create .eslintrc.json configuration
  - Create .prettierrc configuration
  - Setup scripts in package.json for lint and format
  - Install development dependencies (vitest, @testing-library/react, etc.)
  - _Design: Section 14 - Dependencies & Libraries_

---

### 2. Database & Backend Infrastructure

- [ ] 2.1 Create Supabase tables for core entities
  - Execute SQL to create: users (via auth), profiles_siswa, kelas, guru tables
  - Create proper indexes on foreign keys and frequently filtered columns
  - Add constraints (CHECK, UNIQUE) as defined in design
  - Add timestamps (created_at, updated_at) with defaults
  - Seed test data: 1 test student, 1 guru, 1 kelas, 1 teacher assignment
  - _Design: Section 2 - Database Schema, Tables_

- [ ] 2.2 Create attendance-related tables (absen, pengajuan_ijin)
  - Execute SQL to create: absen table with unique(siswa_id, tanggal) constraint
  - Execute SQL to create: pengajuan_ijin table with status enum
  - Create proper indexes on siswa_id, tanggal, status
  - Seed test data: Sample attendance & leave request records
  - _Design: Section 2 - Database Schema, Attendance Tables_

- [ ] 2.3 Create schedule table (jadwal_pelajaran)
  - Execute SQL to create: jadwal_pelajaran table
  - Create indexes on id_kelas and guru_id
  - Seed test data: 5-10 sample schedules for test class (different days & times)
  - _Design: Section 2 - Database Schema, Schedule Table_

- [ ] 2.4 Setup Row Level Security (RLS) policies for data isolation
  - Enable RLS on all tables: profiles_siswa, absen, pengajuan_ijin, jadwal_pelajaran
  - Create policies for students to read own profile (profiles_siswa)
  - Create policies for students to read/insert own attendance (absen)
  - Create policy to prevent attendance modification after creation
  - Create policies for students to read/create own leave requests (pengajuan_ijin)
  - Create policies for students to read schedule for their class (jadwal_pelajaran)
  - Test policies with Supabase UI to verify data isolation works
  - _Design: Section 2 - Row Level Security (RLS) Policies_

- [ ] 2.5 Create database functions & triggers for automation
  - Create trigger to auto-update updated_at timestamp on all tables
  - Create function to validate unique attendance per student per day (constraint enforcement)
  - Create function for leave request state transition validation
  - Test triggers and functions in Supabase to ensure they execute correctly
  - _Design: Section 2 - Database Schema_

- [ ]* 2.6 Write property tests for database constraints
  - **Property 1: Attendance Immutability** - Generate random attendance records, verify attempts to modify fail
  - **Property 2: Unique Daily Attendance** - Generate duplicate student/date combinations, verify constraint rejection
  - **Property 3: Leave Request Temporal Constraint** - Generate various dates, verify only valid date ranges accepted
  - **Property 4: Self-Owned Data Access** - Test RLS policies block cross-student access
  - **Validates: Design Section 12 - Correctness Properties**

---

### 3. Authentication Infrastructure

- [ ] 3.1 Create AuthContext for state management
  - Create src/context/AuthContext.jsx with Context and Provider
  - Implement state: user (null | object), isAuthenticated (boolean), isLoading, error
  - Implement methods: login(email, password), logout(), checkSession()
  - Setup localStorage persistence for JWT token
  - Setup Supabase auth listener to sync session on mount
  - _Design: Section 5.1 - AuthContext_

- [ ] 3.2 Create useAuth custom hook
  - Create src/hooks/useAuth.js
  - Implement hook to consume AuthContext
  - Return: user, isLoading, error, login(), logout()
  - Add error handling for auth failures
  - Export useAuth hook for use across components
  - _Design: Section 5.2 - useAuth Hook_

- [ ] 3.3 Build LoginForm component
  - Create src/components/Auth/LoginForm.jsx
  - Implement email + password input fields with validation
  - Add "Remember me" checkbox (optional, store preference)
  - Implement form submission using useAuth hook
  - Show loading state during authentication
  - Display error messages for invalid credentials or network issues
  - Add redirect to dashboard on successful login
  - _Design: Section 3.2 - LoginForm Component_

- [ ] 3.4 Create ProtectedLayout component and AuthCheck component
  - Create src/components/Layout/ProtectedLayout.jsx
  - Wrap children and check auth status via useAuth hook
  - Redirect to /login if not authenticated
  - Show loading spinner while checking auth
  - Create src/components/Auth/AuthCheck.jsx as reusable auth checker
  - Test auth flow: unauthenticated → login → authenticated → dashboard
  - _Design: Section 3.1 & 3.2 - Layout & Auth Components_

- [ ] 3.5 Implement logout functionality
  - Add logout button to Navbar component
  - Call useAuth logout() method
  - Clear localStorage and auth state
  - Redirect to /login after logout
  - Show success message
  - _Design: Section 3.1 - Navbar_

---

### 4. Core Layout Components

- [ ] 4.1 Create Navbar component with responsive design
  - Create src/components/Layout/Navbar.jsx using DaisyUI navbar
  - Display student name (from auth context)
  - Add logout button with confirmation dialog
  - Implement dark mode toggle with localStorage persistence
  - Add responsive hamburger menu (hide on desktop, show on mobile)
  - Display real-time clock (optional enhancement)
  - Mobile responsive with collapse/expand behavior
  - _Design: Section 3.1 - Navbar Component_

- [ ] 4.2 Create Sidebar navigation component
  - Create src/components/Layout/Sidebar.jsx
  - Implement navigation links: Dashboard, Attendance, Leave Request, Schedule, Profile
  - Show active route indication (highlight current page)
  - Implement collapse/expand on mobile with menu toggle
  - Use React Router Link components for navigation
  - Style with Tailwind and DaisyUI menu component
  - _Design: Section 3.1 - Sidebar Component_

- [ ] 4.3 Create responsive layout wrapper
  - Create src/components/Layout/MainLayout.jsx
  - Combine Navbar + Sidebar + content area
  - Implement responsive grid/flex layout (sidebar hidden on mobile, hamburger menu instead)
  - Ensure proper spacing and padding
  - Test on mobile, tablet, and desktop viewports
  - _Design: Section 3.1 - Layout Components_

---

### 5. Attendance Feature - Infrastructure & Services

- [ ] 5.1 Create attendanceService functions
  - Create src/services/attendanceService.js
  - Implement submitAttendance(siswaId, qrData, selfieFile):
    - Upload selfie image to Supabase storage at `/attendance-selfies/{studentId}/{timestamp}.jpg`
    - Insert attendance record into absen table with status 'Hadir', qr_scan_time, selfie_url
    - Return { success: boolean, attendanceId, message }
  - Implement getAttendanceHistory(siswaId, filters = { startDate, endDate, status }):
    - Query absen table with filters
    - Return { data: [], total }
  - Implement getTodayAttendance(siswaId):
    - Check if student already has attendance record for today
    - Return { hasAttended: boolean, record: {} | null }
  - _Design: Section 6 - Services Layer, attendanceService_

- [ ] 5.2 Create useAttendance custom hook
  - Create src/hooks/useAttendance.js
  - Implement hook with state: attendance[], loading, error
  - Implement methods: submitAttendance(), getHistory(), getTodayStatus()
  - Use attendanceService functions internally
  - Handle loading and error states
  - _Design: Section 5.2 - useAttendance Hook_

- [ ] 5.3 Create file upload utility
  - Create src/lib/fileUpload.js
  - Implement uploadFile(file, bucketPath) function using Supabase storage
  - Implement compressImage(file, maxWidth, maxHeight) for image optimization
  - Implement validateFile(file, { maxSize, allowedTypes })
  - Add error handling for network failures
  - _Design: Section 6 - Services Layer, Integration Points_

- [ ]* 5.4 Write property tests for attendance service
  - **Property 1: Attendance Immutability** - Create record, verify RLS prevents modification
  - **Property 2: Unique Daily Attendance** - Try submit twice same day, verify second fails
  - **Property 6: File Upload Persistence** - Upload selfie, verify accessible from storage
  - **Validates: Design Section 12 - Correctness Properties 1, 2, 6**

---

### 6. Attendance Feature - Components (QR & Selfie)

- [ ] 6.1 Create QRScanner component
  - Create src/components/Attendance/QRScanner.jsx
  - Setup camera access using navigator.mediaDevices.getUserMedia()
  - Use jsQR library to scan QR codes from camera stream
  - Display live camera preview in canvas element
  - Implement validation of scanned QR data (check format)
  - Add stop/retry buttons for user control
  - Handle permission errors (camera access denied)
  - Return scanned data to parent component via callback
  - _Design: Section 3.3 - QRScanner Component_

- [ ] 6.2 Create SelfieCapture component
  - Create src/components/Attendance/SelfieCapture.jsx
  - Setup camera access using navigator.mediaDevices.getUserMedia()
  - Display live camera preview
  - Implement capture button to take photo
  - Show preview of captured selfie before confirm
  - Implement retake option to discard and recapture
  - Compress image before returning to parent
  - Validate file size (max 5MB)
  - Return captured blob/file to parent component
  - _Design: Section 3.3 - SelfieCapture Component_

- [ ] 6.3 Build AttendanceForm container component
  - Create src/components/Attendance/AttendanceForm.jsx
  - Implement multi-step flow: Step 1 (QR) → Step 2 (Selfie) → Step 3 (Confirm)
  - Auto-fill fields from student profile: nama, kelas, tanggal (today), waktu (current time)
  - Show step progress indicator
  - Integrate QRScanner and SelfieCapture components
  - Implement next/prev/submit button logic
  - On submit: call attendanceService.submitAttendance()
  - Show loading state during submission
  - Handle errors and show error messages
  - Redirect to success page or show success notification
  - _Design: Section 3.3 - AttendanceForm Component_

---

### 7. Attendance Feature - Components (History & Status)

- [ ] 7.1 Build AttendanceHistory component
  - Create src/components/Attendance/AttendanceHistory.jsx
  - Query attendance records using attendanceService.getAttendanceHistory()
  - Implement filters: date range picker, status dropdown (Hadir/Sakit/Izin/Alpha)
  - Implement sorting: most recent first (tanggal descending)
  - Implement pagination: 10 items per page with prev/next buttons
  - Display table columns: Tanggal, Status (with color badge), Jam masuk, Foto (thumbnail)
  - Make foto clickable to view full image in modal
  - Show loading spinner while fetching data
  - Show empty state message when no records
  - _Design: Section 3.3 - AttendanceHistory Component_

- [ ] 7.2 Build AttendanceStatus dashboard card
  - Create src/components/Attendance/AttendanceStatus.jsx
  - Display today's attendance status with badge color (Hadir=green, Izin=yellow, Sakit=yellow, Alpha=red)
  - Calculate and display weekly summary: Hadir count, Izin count, Sakit count, Alpha count
  - Display monthly summary using stat cards or simple chart
  - Show attendance percentage (Hadir / total days * 100)
  - Make interactive: click to view details or history
  - Use data from useAttendance hook
  - _Design: Section 3.3 - AttendanceStatus Component_

- [ ] 7.3 Create AttendancePage with tabs/navigation
  - Create src/pages/AttendancePage.jsx
  - Implement tab navigation or button group: "Form" and "History"
  - Show AttendanceForm in one tab
  - Show AttendanceHistory + AttendanceStatus in other tab
  - Handle routing to /attendance/form and /attendance/history (optional)
  - Test navigation between tabs
  - _Design: Section 4 - Pages & Routing_

---

### 8. Leave Request Feature - Services & Components

- [ ] 8.1 Create leaveRequestService functions
  - Create src/services/leaveRequestService.js
  - Implement submitLeaveRequest(siswaId, formData):
    - Extract: tanggal_tidak_hadir, kategori, deskripsi, bukti (optional file)
    - Upload bukti file to storage if provided: `/leave-request-proof/{studentId}/{timestamp}.{ext}`
    - Insert record into pengajuan_ijin table
    - Return { success, requestId, message }
  - Implement getLeaveRequests(siswaId, filters = { status, startDate, endDate }):
    - Query pengajuan_ijin table with filters
    - Return { data: [], total, stats: { pending, approved, rejected } }
  - Implement getLeaveRequestDetail(requestId):
    - Get single leave request by ID
    - Return enriched data with file URL
  - _Design: Section 6 - Services Layer, leaveRequestService_

- [ ] 8.2 Create useLeaveRequest custom hook
  - Create src/hooks/useLeaveRequest.js
  - Implement hook with state: leaveRequests[], loading, error, stats
  - Implement methods: submitLeaveRequest(), getList(), getDetail()
  - Use leaveRequestService functions internally
  - Handle loading and error states
  - _Design: Section 5.2 - useLeaveRequest Hook_

- [ ] 8.3 Build LeaveReasonCategory selector component
  - Create src/components/LeaveRequest/LeaveReasonCategory.jsx
  - Implement 3 options: Izin, Sakit, Lainnya
  - Show radio buttons or button group for selection
  - Conditional display: show file upload for Sakit category
  - Return selected category to parent
  - Style with DaisyUI components
  - _Design: Section 3.4 - LeaveReasonCategory Component_

- [ ] 8.4 Build LeaveRequestForm component
  - Create src/components/LeaveRequest/LeaveRequestForm.jsx
  - Implement form fields:
    - Tanggal tidak hadir: date picker (H-1 or later for Izin, today+ for Sakit)
    - Kategori alasan: LeaveReasonCategory component
    - Deskripsi: textarea (min 10, max 500 characters)
    - Upload bukti: file input (optional, max 10MB, PDF/Image only)
  - Implement validation:
    - Date constraints based on category
    - Kategori required
    - Deskripsi length validation
    - File size and type validation
  - On submit: call leaveRequestService.submitLeaveRequest()
  - Show loading state and success/error messages
  - _Design: Section 3.4 - LeaveRequestForm Component_

- [ ] 8.5 Build LeaveRequestList component
  - Create src/components/LeaveRequest/LeaveRequestList.jsx
  - Query leave requests using useLeaveRequest hook
  - Implement filter: status dropdown (Pending/Approved/Rejected)
  - Implement sorting: most recent first (created_at descending)
  - Display list items with: Tanggal, Kategori, Status (color-coded: yellow/green/red), Approval date (if approved)
  - Make clickable to view details in modal
  - Show loading spinner and empty state
  - Show stats summary at top (X pending, Y approved, Z rejected)
  - _Design: Section 3.4 - LeaveRequestList Component_

- [ ] 8.6 Create LeaveRequestPage with tabs
  - Create src/pages/LeaveRequestPage.jsx
  - Implement tab navigation: "New Request" and "My Requests"
  - Show LeaveRequestForm in one tab
  - Show LeaveRequestList in other tab
  - Handle routing to /leave-request/new and /leave-request/list (optional)
  - _Design: Section 4 - Pages & Routing_

- [ ]* 8.7 Write property tests for leave request
  - **Property 3: Leave Request Temporal Constraint** - Test date validation for Izin vs Sakit
  - **Property 5: Leave Request Status Progression** - Verify status transitions (pending → approved/rejected only)
  - **Property 6: File Upload Persistence** - Upload proof file, verify accessible from storage
  - **Validates: Design Section 12 - Correctness Properties 3, 5, 6**

---

### 9. Profile & Schedule Features

- [ ] 9.1 Create profileService functions
  - Create src/services/profileService.js
  - Implement getStudentProfile(userId):
    - Query profiles_siswa table by user_id
    - Return { id, nama, nisn, nis, jenis_kelamin, id_kelas, photo_url, ... }
  - Implement getProfileWithRelations(userId):
    - Join profiles_siswa with kelas and guru (for wali_kelas)
    - Return enriched profile with class name and teacher info
  - Implement updateProfile(profileId, updateData) (future feature, allow empty for now)
  - _Design: Section 6 - Services Layer, profileService_

- [ ] 9.2 Create classService functions
  - Create src/services/classService.js
  - Implement getClassSchedule(classId):
    - Query jadwal_pelajaran table by id_kelas
    - Sort by hari_dalam_minggu, jam_mulai
    - Return { id, hari_dalam_minggu, jam_mulai, jam_selesai, mapel, guru_nama, ruangan, ... }[]
  - Implement getStudentClassSchedule(studentId):
    - Get student's class ID from profiles_siswa
    - Call getClassSchedule with that class ID
    - Return sorted schedule
  - _Design: Section 6 - Services Layer, classService_

- [ ] 9.3 Build StudentProfile component
  - Create src/components/Profile/StudentProfile.jsx
  - Display read-only student info:
    - Nama, NISN, NIS, Jenis Kelamin
    - Kelas, Wali Kelas name (from profile relations)
    - Profile photo (if exists)
  - Show edit button (disable for MVP, show for future)
  - Use profileService to fetch and display data
  - _Design: Section 3.5 - StudentProfile Component_

- [ ] 9.4 Build ClassSchedule component
  - Create src/components/Profile/ClassSchedule.jsx
  - Display schedule table with columns: Hari, Jam (jam_mulai - jam_selesai), Mapel, Guru, Ruangan
  - Group by day of week for better UX
  - Highlight current/upcoming classes based on current time
  - Use classService to fetch schedule
  - Show loading spinner and empty state
  - _Design: Section 3.5 - ClassSchedule Component_

- [ ] 9.5 Build PersonalInfo component
  - Create src/components/Profile/PersonalInfo.jsx
  - Combine StudentProfile display
  - Show profile photo prominently
  - Add edit button (disabled for MVP)
  - Add change password button (disabled for MVP)
  - Style with Tailwind cards and sections
  - _Design: Section 3.5 - PersonalInfo Component_

- [ ] 9.6 Create ProfilePage and SchedulePage
  - Create src/pages/ProfilePage.jsx:
    - Show StudentProfile component
    - Show PersonalInfo component
    - Layout with card/sections
  - Create src/pages/SchedulePage.jsx:
    - Show ClassSchedule component
    - Add filter by day of week (optional)
    - Show current/upcoming highlights
  - Implement useStudentProfile hook if needed for data fetching
  - _Design: Section 4 - Pages & Routing_

- [ ]* 9.7 Write property tests for profile data
  - **Property 8: Student Profile Completeness** - Verify all required fields present in profile
  - **Property 7: Class Schedule Consistency** - Verify schedule matches student's class, current year
  - **Property 4: Self-Owned Data Access** - Verify students can only access own profile/schedule
  - **Validates: Design Section 12 - Correctness Properties 7, 8, 4**

---

### 10. Common Components & Utilities

- [ ] 10.1 Create common UI components
  - Create src/components/Common/LoadingSpinner.jsx:
    - DaisyUI loading animation
    - Accept optional text prop
  - Create src/components/Common/ErrorAlert.jsx:
    - Display error message with dismiss button
    - Accept error message and onDismiss callback
    - Color styling for errors
  - Create src/components/Common/SuccessNotification.jsx:
    - Toast-style notification
    - Auto-dismiss after 3-4 seconds
    - Show success icon
  - Create src/components/Common/ConfirmDialog.jsx:
    - Modal dialog for confirmations
    - Accept title, message, onConfirm, onCancel props
    - DaisyUI modal styling
  - _Design: Section 3.6 - Common Components_

- [ ] 10.2 Create validation utilities
  - Create src/lib/validator.js:
    - validateEmail(email) - RFC 5322 validation
    - validatePassword(password) - min 6 characters
    - validateQRCode(data) - check QR format
    - validateFile(file, { maxSize, allowedTypes }) - validate uploads
    - validateLeaveDate(date, category) - temporal constraints
    - validateLeaveDescription(text) - length 10-500 chars
    - All validators return { valid: boolean, error?: string }
  - _Design: Section 8 - Error Handling & Validation_

- [ ] 10.3 Create date & time utilities
  - Create src/lib/dateUtils.js:
    - formatDate(date, format) - format date strings
    - formatTime(time) - format time strings
    - getDayOfWeek(date) - get day name from date
    - getWeekRange(date) - get Monday-Sunday for a date
    - getMonthRange(date) - get 1st-last day for a date
    - isTodayOrFuture(date) - date >= today
    - isTomorrowOrFuture(date) - date >= tomorrow
    - getDaysBetween(date1, date2) - count days
  - _Design: Integration_

- [ ] 10.4 Create formatter utilities
  - Create src/utils/formatters.js:
    - formatCurrency(amount) - format to IDR
    - formatAttendanceStatus(status) - format status text
    - formatLeaveCategory(category) - format category text
    - formatFileSize(bytes) - format file size for display
    - truncateText(text, length) - truncate long text
  - _Design: Integration_

- [ ] 10.5 Create error handling utilities
  - Create src/utils/errorHandler.js:
    - handleSupabaseError(error) - parse Supabase errors to user-friendly messages
    - handleNetworkError(error) - handle offline scenarios
    - handleAuthError(error) - handle auth-specific errors
    - handleFileUploadError(error) - handle file upload failures
    - logError(error, context) - log errors for debugging
  - _Design: Section 8 - Error Handling & Validation_

- [ ] 10.6 Create constants file
  - Create src/utils/constants.js:
    - API_TIMEOUT: 30000
    - MAX_FILE_SIZE: 10485760
    - ATTENDANCE_STATUSES: ['Hadir', 'Sakit', 'Izin', 'Alpha']
    - LEAVE_CATEGORIES: ['Izin', 'Sakit', 'Lainnya']
    - LEAVE_STATUSES: ['pending', 'approved', 'rejected']
    - FILE_TYPES: ['image/jpeg', 'image/png', 'application/pdf']
    - DAYS_OF_WEEK: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']
    - PAGINATION: { ITEMS_PER_PAGE: 10 }
  - _Design: Integration_

- [ ]* 10.7 Write unit tests for utilities
  - Test validator functions with valid/invalid inputs
  - Test dateUtils functions with various dates
  - Test formatter functions with various values
  - Test error handler functions with different error types
  - Ensure all utilities handle edge cases
  - _Design: Section 13 - Testing Strategy_

---

### 11. Styling & Theme Configuration

- [ ] 11.1 Configure tailwind.config.js with custom colors
  - Create tailwind.config.js with DaisyUI plugin
  - Define custom color palette:
    - primary: hsl(217, 100%, 50%) - Blue
    - secondary: hsl(262, 80%, 50%) - Purple
    - success: hsl(142, 70%, 45%) - Green
    - warning: hsl(38, 92%, 50%) - Amber
    - error: hsl(0, 84%, 60%) - Red
    - info: hsl(188, 78%, 41%) - Cyan
  - Configure DaisyUI themes: light & dark
  - Setup responsive breakpoints
  - _Design: Section 7 - Styling Strategy_

- [ ] 11.2 Create global styles and theme files
  - Create src/styles/globals.css with base styles:
    - Reset default styles
    - Configure body, html base styles
    - Setup font family (use system font or import)
  - Create src/styles/theme.css with component-specific classes:
    - .btn-primary, .btn-secondary variations
    - .card-* component classes
    - .status-* color classes (Hadir/Sakit/Izin/Alpha)
    - .badge-* color classes
    - Custom utility classes
  - Import both into main.jsx or App.jsx
  - Test dark mode toggle works globally
  - _Design: Section 7 - Styling Strategy_

---

### 12. Form & Validation Setup

- [ ] 12.1 Setup react-hook-form + Zod validation
  - Install react-hook-form, zod, @hookform/resolvers
  - Create src/lib/schemas.js with Zod schemas:
    - loginSchema: { email, password }
    - attendanceSchema: { qrData, selfie }
    - leaveRequestSchema: { tanggal, kategori, deskripsi, bukti }
    - profileSchema: { nama, nisn, nis, jenis_kelamin }
  - Test schemas with valid/invalid data
  - Export all schemas for component use
  - _Design: Section 8 - Error Handling & Validation_

- [ ] 12.2 Create form error and field helper components
  - Create src/components/Common/FormError.jsx:
    - Display error message for form field
    - Styled with error color
  - Create src/components/Common/FormField.jsx:
    - Wrapper for input + label + error
    - Accept register, errors, label props
    - Integrate with react-hook-form
  - Create src/components/Common/FormTextarea.jsx:
    - Similar to FormField but for textarea
  - Create src/components/Common/FormFileInput.jsx:
    - File input with validation
    - Show file size and type errors
  - _Design: Section 8 - Error Handling & Validation_

---

### 13. Dashboard & Main Pages

- [ ] 13.1 Build DashboardPage
  - Create src/pages/DashboardPage.jsx
  - Display welcome message with student name
  - Show AttendanceStatus component (today's status + weekly/monthly summary)
  - Show quick links to main features (Attendance, Leave, Schedule)
  - Show recent attendance records (last 3-5 entries)
  - Show pending leave requests count
  - Fetch data from useAttendance and useLeaveRequest hooks
  - Show loading states
  - _Design: Section 4 - Pages & Routing_

- [ ] 13.2 Create LoginPage
  - Create src/pages/LoginPage.jsx
  - Show Nexus-Connect logo/branding
  - Display LoginForm component
  - Handle redirect to dashboard on successful login
  - Show error messages if login fails
  - Add link to support (future feature)
  - Style with centered layout, card design
  - _Design: Section 4 - Pages & Routing_

- [ ] 13.3 Update App.jsx with complete routing
  - Define all routes:
    - "/" → redirect to /dashboard if authenticated, else /login
    - "/login" → LoginPage
    - "/dashboard" → ProtectedLayout + DashboardPage
    - "/attendance" → ProtectedLayout + AttendancePage
    - "/leave-request" → ProtectedLayout + LeaveRequestPage
    - "/schedule" → ProtectedLayout + SchedulePage
    - "/profile" → ProtectedLayout + ProfilePage
    - "*" → NotFoundPage
  - Wrap protected routes with ProtectedLayout
  - Add route guards and redirects
  - Test all routes work correctly
  - _Design: Section 4 - Pages & Routing_

---

### 14. Integration & Testing Setup

- [ ] 14.1 Setup Vitest + React Testing Library
  - Install vitest, @testing-library/react, @testing-library/user-event
  - Create vitest.config.js with React setup
  - Configure test file patterns (*.test.js, *.spec.js)
  - Create test utilities: src/test/setup.js
  - Create Supabase mock: src/test/mocks/supabase.js
  - Setup test database fixture for consistent test data
  - _Design: Section 13 - Testing Strategy_

- [ ] 14.2 Write unit tests for validators
  - Create src/lib/validator.test.js
  - Test validateEmail with valid/invalid emails
  - Test validatePassword with various lengths
  - Test validateFile with different file sizes/types
  - Test validateLeaveDate with various date scenarios
  - All tests should pass
  - _Design: Section 13 - Testing Strategy_

- [ ] 14.3 Write unit tests for hooks
  - Create src/hooks/useAuth.test.js with mocked auth service
  - Create src/hooks/useAttendance.test.js with mocked attendance service
  - Create src/hooks/useLeaveRequest.test.js with mocked leave service
  - Test hook initialization, state updates, error handling
  - Test async operations and data fetching
  - All tests should pass
  - _Design: Section 13 - Testing Strategy_

- [ ] 14.4 Write component tests for forms and major components
  - Create src/components/Auth/LoginForm.test.js
  - Create src/components/Attendance/AttendanceForm.test.js
  - Create src/components/LeaveRequest/LeaveRequestForm.test.js
  - Test form rendering, user input, submission, error display
  - Mock services and verify calls
  - All tests should pass
  - _Design: Section 13 - Testing Strategy_

- [ ]* 14.5 Write integration tests for complete flows
  - Create src/test/integration/auth.integration.test.js
  - Create src/test/integration/attendance.integration.test.js
  - Create src/test/integration/leaveRequest.integration.test.js
  - Test complete user journeys: login → attendance → logout
  - Test error scenarios and edge cases
  - All tests should pass
  - _Design: Section 13 - Testing Strategy_

---

### 15. Camera & Media Handling Setup

- [ ] 15.1 Implement camera permission handling
  - Create src/lib/camera.js with utility functions
  - Implement requestCameraPermission() - ask for camera access
  - Implement releaseCameraStream() - stop camera and cleanup
  - Implement handlePermissionError(error) - handle denied permissions
  - Add error messages for different permission scenarios
  - Test on multiple browsers (Chrome, Firefox, Safari)
  - _Design: Section 9 - Integration Points_

- [ ] 15.2 Implement image compression for uploads
  - Create src/lib/imageCompression.js
  - Implement compressImage(file, { maxWidth, maxHeight, quality })
  - Use browser Canvas API for compression
  - Validate output file size (max 5MB)
  - Support JPEG and PNG formats
  - Test compression with various image sizes
  - Verify output quality is acceptable
  - _Design: Section 11 - Performance Optimizations_

---

### 16. Context Providers & App Initialization

- [ ] 16.1 Create StudentContext for application-wide data
  - Create src/context/StudentContext.jsx
  - Provide state: studentProfile, attendanceRecords, leaveRequests, classSchedule
  - Implement refreshStudentData() to refetch all data
  - Initialize data on app mount
  - Setup optional real-time listeners (for Phase 2)
  - Export useStudent hook for easy access
  - _Design: Section 5.1 - StudentContext_

- [ ] 16.2 Wrap App with Context Providers
  - Update src/main.jsx to wrap App with AuthContext Provider
  - Update src/App.jsx to wrap with StudentContext Provider
  - Ensure provider hierarchy: AuthContext → StudentContext → Routes
  - Test context values accessible throughout app
  - Verify data flows correctly from providers
  - _Design: Section 5 - State Management_

---

### 17. Error Boundaries & Error Handling

- [ ] 17.1 Create ErrorBoundary component
  - Create src/components/Common/ErrorBoundary.jsx
  - Implement componentDidCatch lifecycle method
  - Display error UI when component tree fails
  - Log errors to console (dev) and analytics (prod)
  - Provide reload/retry button
  - _Design: Section 8 - Error Handling_

- [ ] 17.2 Implement global error handling
  - Update App.jsx to wrap routes with ErrorBoundary
  - Add window.onerror handler for uncaught errors
  - Add window.onunhandledrejection handler for promise rejections
  - Log all errors to Sentry or error tracking service (optional)
  - Test error scenarios and verify error display
  - _Design: Section 8 - Error Handling & Validation_

---

### 18. Code Optimization & Splitting

- [ ] 18.1 Setup React.lazy and Suspense for code splitting
  - Update src/App.jsx routes to use lazy loading:
    - Lazy load AttendancePage, LeaveRequestPage, SchedulePage, ProfilePage
    - Wrap routes with Suspense and LoadingSpinner fallback
  - Setup route-level code splitting
  - Reduce initial bundle size
  - Test lazy loading works in dev and build
  - _Design: Section 11 - Performance Optimizations_

- [ ] 18.2 Optimize component rendering
  - Use React.memo() for expensive components:
    - AttendanceHistory list items
    - LeaveRequestList list items
    - StudentProfile card
  - Use useCallback() for event handlers passed as props
  - Use useMemo() for expensive computations
  - Profile with React DevTools to identify bottlenecks
  - Verify performance improvements
  - _Design: Section 11 - Performance Optimizations_

---

### 19. Build & Bundle Optimization

- [ ] 19.1 Configure Vite for optimal production build
  - Update vite.config.js for production optimization
  - Enable CSS code splitting
  - Configure minification and compression
  - Setup source maps for error tracking
  - Test production build output
  - Verify bundle size is reasonable
  - _Design: Section 11 - Performance Optimizations_

- [ ] 19.2 Setup environment-specific configurations
  - Create separate configs for development and production
  - Use .env.local for development variables
  - Use .env.production for production variables
  - Verify environment variables load correctly
  - Test builds in both environments
  - _Design: Section 15 - Environment Variables_

---

### 20. Checkpoint - Core Features Complete

- [ ] 20.1 Ensure all core features implemented and tested
  - Verify authentication flow (login/logout)
  - Verify attendance submission (QR + Selfie)
  - Verify attendance history & status display
  - Verify leave request submission & list
  - Verify profile & schedule display
  - Run full test suite - all tests pass
  - No console errors or warnings
  - Ask user if questions or issues arise

---

### 21. Documentation & Environment Setup

- [ ] 21.1 Create .env.example template
  - Create .env.example with all required variables:
    - VITE_SUPABASE_URL
    - VITE_SUPABASE_ANON_KEY
    - VITE_APP_ENV
    - VITE_API_TIMEOUT
    - VITE_MAX_FILE_SIZE
  - Add explanatory comments
  - This file goes into git (no secrets)
  - _Design: Section 15 - Environment Variables_

- [ ] 21.2 Create comprehensive README.md
  - Project overview and purpose
  - Tech stack summary
  - Installation instructions (clone, npm install, setup .env.local)
  - Setup Supabase project section
  - Running development server instructions
  - Running tests instructions
  - Building for production
  - Deployment instructions (Vercel/Netlify)
  - Project structure overview (reference Section 1 of design)
  - Feature overview
  - Known limitations and Phase 2 roadmap
  - Contributing guidelines
  - License and attribution
  - _Design: Section 16 - Implementation Phases_

---

### 22. Deployment Configuration

- [ ] 22.1 Setup deployment configuration
  - Create vercel.json OR netlify.toml for hosting choice
  - Configure build command: `npm run build`
  - Configure output directory: `dist`
  - Setup environment variables in hosting platform
  - Test deployment configuration locally
  - Create deployment checklist (verify secrets, etc.)
  - _Design: Section 17 - Deployment & DevOps_

- [ ] 22.2 Setup monitoring and error tracking (optional)
  - Install Sentry SDK (optional): `npm install @sentry/react`
  - Initialize Sentry in main.jsx with VITE_SENTRY_DSN
  - Verify errors are captured in Sentry dashboard
  - (Optional for MVP, mark as nice-to-have)
  - _Design: Section 17 - Deployment & DevOps_

---

### 23. Final Integration & QA

- [ ] 23.1 Complete end-to-end testing
  - Test complete user flow: Login → Dashboard → Attendance → Leave Request → Profile → Logout
  - Test all validations work (forms reject invalid input)
  - Test error scenarios (network errors, permission errors)
  - Test responsive design on mobile, tablet, desktop
  - Test dark mode toggle
  - Test accessibility (keyboard navigation, screen readers)
  - Test cross-browser compatibility
  - Verify no console errors or warnings
  - Create QA checklist and document results

- [ ] 23.2 Performance testing and optimization
  - Measure page load time (target: < 3s)
  - Measure time to interactive (TTI)
  - Check lighthouse score (target: > 80 for performance)
  - Test with network throttling (slow 3G)
  - Verify lazy loading works
  - Optimize any bottlenecks found
  - Document performance metrics

- [ ] 23.3 Final checkpoint - MVP complete
  - All tasks completed
  - All tests passing
  - Documentation complete
  - No critical bugs or issues
  - Ready for user acceptance testing and deployment
  - Ask user for final approval before deployment

---

## Notes

- Tasks marked with `*` are optional sub-tasks (testing, property tests, monitoring) and can be skipped for faster MVP delivery. Core implementation tasks without `*` must be completed.
- Database setup (Section 2) includes test data seeding for development. For production, adjust seeding to use realistic data.
- Each feature has corresponding correctness properties defined in the design document (Section 12) that should be validated during testing.
- Camera and file upload features require HTTPS in production. Test thoroughly on Android/iOS devices.
- Supabase free tier has storage and database limits - monitor usage during development.
- Components use DaisyUI for consistent, accessible styling. Custom CSS should be minimized.
- All external API calls should have error handling and user-friendly error messages in Bahasa Indonesia.
- Keep localStorage usage minimal (only JWT token and dark mode preference) to reduce bundle size.
- Real-time updates (Phase 2) can be added later using Supabase real-time subscriptions without major refactoring.

## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "tasks": [
        "1.1",
        "1.2",
        "1.3",
        "1.4",
        "1.5"
      ]
    },
    {
      "id": 1,
      "tasks": [
        "2.1",
        "2.2",
        "2.3"
      ]
    },
    {
      "id": 2,
      "tasks": [
        "2.4",
        "2.5"
      ]
    },
    {
      "id": 3,
      "tasks": [
        "3.1",
        "3.2",
        "10.1",
        "10.2",
        "10.3",
        "10.4",
        "10.5",
        "10.6"
      ]
    },
    {
      "id": 4,
      "tasks": [
        "3.3",
        "3.4",
        "3.5",
        "12.1",
        "12.2"
      ]
    },
    {
      "id": 5,
      "tasks": [
        "4.1",
        "4.2",
        "4.3"
      ]
    },
    {
      "id": 6,
      "tasks": [
        "5.1",
        "5.2",
        "5.3",
        "15.1",
        "15.2"
      ]
    },
    {
      "id": 7,
      "tasks": [
        "6.1",
        "6.2",
        "6.3"
      ]
    },
    {
      "id": 8,
      "tasks": [
        "7.1",
        "7.2",
        "7.3"
      ]
    },
    {
      "id": 9,
      "tasks": [
        "8.1",
        "8.2",
        "8.3",
        "8.4"
      ]
    },
    {
      "id": 10,
      "tasks": [
        "8.5",
        "8.6"
      ]
    },
    {
      "id": 11,
      "tasks": [
        "9.1",
        "9.2"
      ]
    },
    {
      "id": 12,
      "tasks": [
        "9.3",
        "9.4",
        "9.5",
        "9.6"
      ]
    },
    {
      "id": 13,
      "tasks": [
        "11.1",
        "11.2"
      ]
    },
    {
      "id": 14,
      "tasks": [
        "13.1",
        "13.2",
        "13.3"
      ]
    },
    {
      "id": 15,
      "tasks": [
        "14.1",
        "14.2",
        "14.3",
        "14.4"
      ]
    },
    {
      "id": 16,
      "tasks": [
        "16.1",
        "16.2"
      ]
    },
    {
      "id": 17,
      "tasks": [
        "17.1",
        "17.2"
      ]
    },
    {
      "id": 18,
      "tasks": [
        "18.1",
        "18.2"
      ]
    },
    {
      "id": 19,
      "tasks": [
        "19.1",
        "19.2"
      ]
    },
    {
      "id": 20,
      "tasks": [
        "21.1",
        "21.2"
      ]
    },
    {
      "id": 21,
      "tasks": [
        "22.1",
        "22.2"
      ]
    },
    {
      "id": 22,
      "tasks": [
        "2.6",
        "5.4",
        "8.7",
        "9.7",
        "10.7",
        "14.5"
      ]
    }
  ]
}
```

