# Supabase Setup Guide - Nexus-Connect Absence App

Panduan lengkap untuk setup Supabase backend untuk aplikasi Absence App Siswa Role.

## Prerequisites

- Akun Supabase (gratis di https://supabase.com)
- Project Supabase sudah dibuat
- Node.js dan npm/bun terinstall di local machine

## Step 1: Create Supabase Project

1. Buka https://supabase.com dan login
2. Klik "New Project"
3. Isi informasi:
   - **Project Name**: `absence-app-siswa` (atau nama pilihan Anda)
   - **Database Password**: Buat password yang kuat dan simpan di tempat aman
   - **Region**: Pilih region terdekat dengan lokasi sekolah (e.g., `Southeast Asia - Singapore`)
4. Klik "Create new project" dan tunggu proses selesai (~2-3 menit)

## Step 2: Get API Keys

1. Di Supabase dashboard, buka menu **Settings** > **API**
2. Copy dan simpan:
   - **Project URL**: `VITE_SUPABASE_URL` (e.g., `https://xxx.supabase.co`)
   - **Anon/Public Key**: `VITE_SUPABASE_ANON_KEY`
3. Buat file `.env.local` di root project:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_ENV=development
VITE_API_TIMEOUT=30000
VITE_MAX_FILE_SIZE=10485760
```

## Step 3: Create Database Tables

1. Di Supabase dashboard, buka **SQL Editor**
2. Klik "New query"
3. Copy seluruh isi file `supabase/migrations/001_init_schema.sql`
4. Paste ke SQL Editor
5. Klik tombol "Run" (atau tekan Ctrl+Enter)
6. Tunggu sampai selesai (status hijau ✓)

### Verify Schema Creation

Untuk memastikan schema sudah dibuat dengan benar:

1. Buka **Table Editor** di sidebar
2. Verifikasi tabel-tabel berikut ada:
   - `guru`
   - `kelas`
   - `profiles_siswa`
   - `absen`
   - `pengajuan_ijin`
   - `jadwal_pelajaran`

3. Buka **Auth** > **Users** untuk lihat user management

## Step 4: Create Storage Buckets

1. Di Supabase dashboard, buka **Storage**
2. Klik "New bucket" dan buat 3 bucket dengan konfigurasi:

### Bucket 1: attendance-selfies
- **Name**: `attendance-selfies`
- **Privacy**: `Private` (students only access their own files)
- **File size limit**: 5 MB
- **Allowed MIME types**: `image/jpeg, image/png`

### Bucket 2: leave-request-proof
- **Name**: `leave-request-proof`
- **Privacy**: `Private`
- **File size limit**: 10 MB
- **Allowed MIME types**: `application/pdf, image/jpeg, image/png`

### Bucket 3: profile-photos
- **Name**: `profile-photos`
- **Privacy**: `Private`
- **File size limit**: 5 MB
- **Allowed MIME types**: `image/jpeg, image/png, image/webp`

### Configure Storage Policies

Untuk setiap bucket, set **Access control** to allow students only access their own files:

Buka Storage > pilih bucket > Policies > Create policy

**Policy untuk attendance-selfies:**
```sql
-- Name: Allow students to upload own selfies
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'attendance-selfies'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Name: Allow students to read own selfies
CREATE POLICY "Allow authenticated reads" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'attendance-selfies'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

## Step 5: Setup Authentication

### Email Authentication

Supabase Email/Password auth sudah enabled by default. Verifikasi di **Authentication** > **Providers**.

### User Email Confirmation (Optional)

Untuk production, enable email verification:

1. Buka **Authentication** > **Email Templates**
2. Customize template jika diperlukan
3. Buka **Settings** > **Auth** > **Policies**
4. Enable "Email confirmations required"

## Step 6: Create Sample Data (Optional)

Untuk testing, Anda bisa create sample users dan data:

### Create Sample Users via Auth UI

1. Buka **Authentication** > **Users**
2. Klik "Invite user" atau gunakan "Sign up" di aplikasi
3. Buat beberapa akun test:
   - Student: `bayu.setiawan@siswa.nexus.sch.id` / `password123`
   - Teacher: `budi.santoso@guru.nexus.sch.id` / `password123`

### Populate Sample Data

1. Buka **SQL Editor** dan buat query baru
2. Uncomment bagian "SAMPLE DATA" di `001_init_schema.sql`
3. Update UUIDs sesuai user ID yang dibuat di Auth
4. Run query

## Step 7: Test Connection

1. Terminal, jalankan:
```bash
cd Siswa-Role
npm install  # atau bun install
npm run dev  # atau bun run dev
```

2. Buka http://localhost:5173 di browser
3. Coba login dengan credentials test

### Debug Connection Issues

Jika ada error:

**Error: "Missing Supabase configuration"**
- Pastikan `.env.local` sudah dibuat dengan benar
- Restart dev server setelah update `.env.local`
- Check `.env.local` menggunakan `cat .env.local`

**Error: "auth/invalid-api-key"**
- Verify `VITE_SUPABASE_ANON_KEY` sudah di-copy dengan benar
- Check tidak ada spasi atau karakter ekstra

**Error: "postgrest/multiple-rows"**
- Pastikan tidak ada duplicate data di database
- Verifikasi unique constraints (nisn, nis, user_id)

## Step 8: Configure Production Environment

### Production Checklist

- [ ] Update `.env.local` dengan production Supabase URL dan keys
- [ ] Enable "Enforce SSL connection" di Database settings
- [ ] Configure email SMTP untuk production email verification
- [ ] Setup backup policies di Supabase
- [ ] Enable "Row Level Security" pada semua tables (sudah done via schema)
- [ ] Configure bucket retention policies (auto-delete files after 30 days)
- [ ] Setup monitoring dan logging

### Enable Auto-Delete for Storage Files

1. Buka **Storage** > pilih bucket
2. Di tab "Settings", set "Lifecycle rules"
3. Configure untuk auto-delete files older than 30 days

## Useful Supabase Tools

### Supabase CLI

Install untuk manage migrations locally:

```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-ref
supabase db pull  # Pull current schema
supabase migration new add_columns  # Create new migration
```

### Supabase Realtime (Optional - Phase 2)

Enable realtime untuk live attendance updates:

1. Buka **Realtime** di dashboard
2. Enable untuk tables: `absen`, `pengajuan_ijin`
3. Update code untuk subscribe ke changes:

```javascript
const subscription = supabase
  .from('absen')
  .on('*', payload => {
    console.log('Change received!', payload)
  })
  .subscribe()
```

## Common Tasks

### Reset Database

```sql
-- WARNING: This deletes ALL data!
DROP TABLE IF EXISTS jadwal_pelajaran CASCADE;
DROP TABLE IF EXISTS pengajuan_ijin CASCADE;
DROP TABLE IF EXISTS absen CASCADE;
DROP TABLE IF EXISTS profiles_siswa CASCADE;
DROP TABLE IF EXISTS guru CASCADE;
DROP TABLE IF EXISTS kelas CASCADE;
```

Then re-run `001_init_schema.sql`

### Export Data

1. Buka **SQL Editor**
2. Run query untuk export:
```sql
SELECT * FROM profiles_siswa;
SELECT * FROM absen;
SELECT * FROM pengajuan_ijin;
```
3. Klik "Download as CSV"

### Check Database Size

```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Troubleshooting

### Issue: RLS Policies Too Restrictive

**Symptom**: All queries return no results even for own data

**Solution**:
1. Verifikasi `auth.uid()` returns correct user ID
2. Check RLS policies are correct:
```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles_siswa';
```
3. Temporarily disable RLS for testing (NOT for production):
```sql
ALTER TABLE profiles_siswa DISABLE ROW LEVEL SECURITY;
```

### Issue: Foreign Key Constraints Preventing Delete

**Symptom**: "violates foreign key constraint" on delete

**Solution**:
- ON DELETE CASCADE akan otomatis delete dependent records
- Verify constraint konfigurasi di schema file

### Issue: Slow Queries

**Solution**:
- Verify indexes dibuat: check di SQL Editor dengan `\di`
- Use query explain plan: `EXPLAIN ANALYZE SELECT ...`
- Contact Supabase support untuk query optimization

## Security Best Practices

1. **Never expose secret keys** di frontend - gunakan anon key only
2. **Use environment variables** untuk sensitive data
3. **Enable RLS policies** pada semua tables (sudah done)
4. **Rotate API keys** regularly di production
5. **Use HTTPS only** (Supabase enforce by default)
6. **Validate file uploads** pada client dan server side
7. **Set appropriate file size limits** di storage buckets
8. **Implement rate limiting** untuk API calls (Supabase free tier includes some limits)

## Support & Documentation

- [Supabase Official Docs](https://supabase.com/docs)
- [Supabase Community](https://supabase.com/community)
- [Supabase GitHub](https://github.com/supabase/supabase)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

## Migration from Mock Data

Jika ada existing mock data di localStorage yang perlu dimigrasikan:

1. Export dari localStorage:
```javascript
// Di browser console
console.log(localStorage.getItem('nxc_db_absen'))
console.log(localStorage.getItem('nxc_db_pengajuan_ijin'))
```

2. Transform data ke format Supabase
3. Import via SQL atau Supabase UI

## Next Steps

Setelah setup selesai:

1. ✅ Test semua authentication flows
2. ✅ Test attendance submission dengan QR + selfie
3. ✅ Test leave request submission
4. ✅ Verify RLS policies bekerja dengan benar
5. ✅ Load test dengan multiple concurrent users
6. 📦 Deploy ke production environment

---

**Last Updated**: October 2026
**Schema Version**: 1.0
