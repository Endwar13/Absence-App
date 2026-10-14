import { createClient } from '@supabase/supabase-js';
import { STUDENT_PROFILE, INITIAL_ATTENDANCE_LOGS, INITIAL_LEAVE_REQUESTS, SCHEDULE_DATA } from '../utils/constants.js';

/**
 * Storage bucket configuration
 */
export const STORAGE_BUCKETS = {
  ATTENDANCE_SELFIES: 'attendance-selfies',
  LEAVE_PROOF: 'leave-request-proof',
  PROFILE_PHOTOS: 'profile-photos'
};

// Check for Supabase configuration
const envSupabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
const envSupabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;
const isSupabaseConfigured = Boolean(
  envSupabaseUrl &&
  envSupabaseAnonKey &&
  envSupabaseUrl.startsWith('http') &&
  !envSupabaseUrl.includes('placeholder')
);

// In-memory / localStorage-backed mock client for local dev and AI Studio preview
function createMockSupabaseClient() {
  const STORAGE_PREFIX = 'nexus_mock_';
  const getStored = (key, fallback) => {
    try {
      const item = localStorage.getItem(STORAGE_PREFIX + key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  };
  const setStored = (key, val) => {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val));
    } catch (e) {
      console.warn('Storage set error', e);
    }
  };

  const defaultUser = {
    id: 'auth-user-student-001',
    email: 'bayu.setiawan@siswa.nexus.sch.id',
    user_metadata: {
      name: 'Bayu Setiawan'
    }
  };

  const defaultProfiles = [
    {
      id: 'student-001',
      user_id: 'auth-user-student-001',
      nama: 'Bayu Setiawan',
      nisn: '0054819231',
      nis: '21221045',
      jenis_kelamin: 'L',
      id_kelas: 'class-001',
      photo_url: STUDENT_PROFILE.avatarUrl,
      created_at: new Date('2024-07-15').toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const defaultKelas = [
    {
      id: 'class-001',
      nama_kelas: 'XII Rekayasa Perangkat Lunak 1',
      tahun_ajaran: 'TA 2024/2025',
      wali_kelas_id: 'teacher-001',
      created_at: new Date('2024-07-01').toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const defaultGuru = [
    {
      id: 'teacher-001',
      user_id: 'auth-user-teacher-001',
      nama: 'Budi Santoso, S.Pd., M.Kom',
      nip: '19800315200501100008',
      status: 'keduanya',
      id_kelas: 'class-001',
      speciality: 'Rekayasa Perangkat Lunak',
      created_at: new Date('2024-07-01').toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  // Convert SCHEDULE_DATA to flat table records
  const defaultJadwal = [];
  const dayKeyMap = {
    senin: 'Senin',
    selasa: 'Selasa',
    rabu: 'Rabu',
    kamis: 'Kamis',
    jumat: 'Jumat',
    sabtu: 'Sabtu'
  };
  Object.entries(SCHEDULE_DATA).forEach(([dayKey, dayData]) => {
    const hari = dayKeyMap[dayKey] || dayData.label;
    (dayData.items || []).forEach((item, idx) => {
      if (item.type === 'mapel') {
        const times = item.jam ? item.jam.replace(' WIB', '').split(' - ') : ['07:30', '09:00'];
        defaultJadwal.push({
          id: `sched-${dayKey}-${idx}`,
          id_kelas: 'class-001',
          guru_id: 'teacher-001',
          hari_dalam_minggu: hari,
          jam_mulai: times[0]?.trim() ? `${times[0].trim()}:00` : '07:30:00',
          jam_selesai: times[1]?.trim() ? `${times[1].trim()}:00` : '09:00:00',
          mapel: item.mapel,
          ruangan: item.lokasi,
          guru: {
            id: 'teacher-001',
            nama: item.pengajar || 'Budi Santoso, S.Pd., M.Kom',
            nip: item.nip || '19800315200501100008'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    });
  });

  const defaultAbsen = INITIAL_ATTENDANCE_LOGS.map((log) => ({
    id: log.id,
    siswa_id: 'student-001',
    tanggal: log.rawDate || new Date().toISOString().split('T')[0],
    status: log.statusLabel || (log.status === 'hadir' ? 'Hadir' : log.status === 'izin' ? 'Izin' : 'Sakit'),
    qr_scan_time: log.waktu ? `2024-10-21T${log.waktu.replace(' WIB', '')}:00` : new Date().toISOString(),
    selfie_url: log.foto || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  const defaultLeave = INITIAL_LEAVE_REQUESTS.map((req) => ({
    id: req.id,
    siswa_id: 'student-001',
    tanggal_tidak_hadir: req.rawDate || new Date().toISOString().split('T')[0],
    kategori: req.kategori === 'sakit' ? 'Sakit' : 'Izin',
    deskripsi: req.deskripsi,
    bukti_url: null,
    status: req.status || 'pending',
    approved_by: req.approver || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  const tables = {
    profiles_siswa: getStored('profiles_siswa', defaultProfiles),
    kelas: getStored('kelas', defaultKelas),
    guru: getStored('guru', defaultGuru),
    jadwal_pelajaran: getStored('jadwal_pelajaran', defaultJadwal),
    absen: getStored('absen', defaultAbsen),
    pengajuan_ijin: getStored('pengajuan_ijin', defaultLeave)
  };

  const saveTable = (tableName) => {
    setStored(tableName, tables[tableName]);
  };

  const authSubscribers = new Set();
  let currentSession = getStored('session', {
    user: defaultUser,
    access_token: 'mock-token-xyz',
    expires_at: Math.floor(Date.now() / 1000) + 86400
  });

  const notifyAuth = (event, session) => {
    currentSession = session;
    if (session) {
      setStored('session', session);
    } else {
      try {
        localStorage.removeItem(STORAGE_PREFIX + 'session');
      } catch {}
    }
    authSubscribers.forEach((cb) => {
      try {
        cb(event, session);
      } catch (e) {
        console.error(e);
      }
    });
  };

  return {
    auth: {
      async getSession() {
        return { data: { session: currentSession }, error: null };
      },
      async getUser() {
        return { data: { user: currentSession?.user || null }, error: null };
      },
      onAuthStateChange(callback) {
        authSubscribers.add(callback);
        // Call callback asynchronously with current session on init
        setTimeout(() => {
          callback(currentSession ? 'SIGNED_IN' : 'SIGNED_OUT', currentSession);
        }, 0);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                authSubscribers.delete(callback);
              }
            }
          }
        };
      },
      async signInWithPassword({ email, password }) {
        if (!email || !password) {
          return { data: null, error: { message: 'Email dan kata sandi wajib diisi' } };
        }
        const user = {
          id: 'auth-user-student-001',
          email: email.trim(),
          user_metadata: { name: email.split('@')[0] }
        };
        const session = {
          user,
          access_token: 'mock-token-' + Date.now(),
          expires_at: Math.floor(Date.now() / 1000) + 86400
        };
        notifyAuth('SIGNED_IN', session);
        return { data: { user, session }, error: null };
      },
      async signUp({ email, password }) {
        const user = {
          id: 'auth-user-' + Date.now(),
          email: email.trim(),
          user_metadata: { name: email.split('@')[0] }
        };
        return { data: { user }, error: null };
      },
      async signOut() {
        notifyAuth('SIGNED_OUT', null);
        return { error: null };
      },
      async resetPasswordForEmail(email) {
        return { data: {}, error: null };
      }
    },
    rpc(fnName, params = {}) {
      if (fnName === 'verify_email_student_mapping') {
        const email = (params.p_email || '').toLowerCase().trim();
        const profile = tables.profiles_siswa[0];
        return Promise.resolve({
          data: {
            valid: true,
            user_id: profile.user_id,
            student_id: profile.id,
            student_name: profile.nama,
            nisn: profile.nisn,
            nis: profile.nis,
            class_name: 'XII Rekayasa Perangkat Lunak 1',
            email
          },
          error: null
        });
      }
      return Promise.resolve({ data: null, error: null });
    },
    from(tableName) {
      const records = tables[tableName] || [];

      class MockQueryBuilder {
        constructor(rows) {
          this.rows = [...rows];
          this.filters = [];
          this.isSingle = false;
          this.pagination = null;
          this.sorting = [];
        }

        select(fields, options = {}) {
          this.countOption = options?.count;
          return this;
        }

        insert(newRows) {
          const inserted = (Array.isArray(newRows) ? newRows : [newRows]).map((row) => ({
            id: row.id || `rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...row
          }));
          records.unshift(...inserted);
          saveTable(tableName);
          this.rows = inserted;
          return this;
        }

        update(updates) {
          this.updates = updates;
          return this;
        }

        eq(col, val) {
          this.filters.push((r) => r[col] === val);
          return this;
        }

        neq(col, val) {
          this.filters.push((r) => r[col] !== val);
          return this;
        }

        gte(col, val) {
          this.filters.push((r) => r[col] >= val);
          return this;
        }

        lte(col, val) {
          this.filters.push((r) => r[col] <= val);
          return this;
        }

        order(col, options = { ascending: true }) {
          this.sorting.push({ col, asc: options.ascending !== false });
          return this;
        }

        range(from, to) {
          this.pagination = { from, to };
          return this;
        }

        single() {
          this.isSingle = true;
          return this.then((res) => {
            if (res.error) return res;
            if (!res.data || res.data.length === 0) {
              return { data: null, error: { code: 'PGRST116', message: 'No rows found' } };
            }
            return { data: res.data[0], error: null };
          });
        }

        then(resolve, reject) {
          try {
            let res = [...this.rows];

            // Apply updates if any
            if (this.updates) {
              this.filters.forEach((filter) => {
                res = res.filter(filter);
              });
              res.forEach((item) => {
                Object.assign(item, this.updates, { updated_at: new Date().toISOString() });
              });
              saveTable(tableName);
              const result = { data: res, error: null };
              return Promise.resolve(resolve(result));
            }

            // Apply filters
            this.filters.forEach((filter) => {
              res = res.filter(filter);
            });

            // Count
            const totalCount = res.length;

            // Apply sorting
            if (this.sorting.length > 0) {
              res.sort((a, b) => {
                for (const { col, asc } of this.sorting) {
                  const valA = a[col];
                  const valB = b[col];
                  if (valA < valB) return asc ? -1 : 1;
                  if (valA > valB) return asc ? 1 : -1;
                }
                return 0;
              });
            }

            // Apply pagination
            if (this.pagination) {
              res = res.slice(this.pagination.from, this.pagination.to + 1);
            }

            const result = {
              data: res,
              count: totalCount,
              error: null
            };

            return Promise.resolve(resolve(result));
          } catch (err) {
            if (reject) return Promise.resolve(reject(err));
            return Promise.resolve(resolve({ data: null, error: err }));
          }
        }
      }

      return new MockQueryBuilder(records);
    },
    storage: {
      from(bucket) {
        return {
          async upload(filePath, file, options = {}) {
            let fileDataUrl = '';
            if (typeof file === 'string') {
              fileDataUrl = file;
            } else if (file instanceof Blob || (typeof File !== 'undefined' && file instanceof File)) {
              try {
                fileDataUrl = await new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result);
                  reader.onerror = () => resolve('');
                  reader.readAsDataURL(file);
                });
              } catch {
                fileDataUrl = '';
              }
            }
            try {
              localStorage.setItem(`${STORAGE_PREFIX}file_${bucket}_${filePath}`, fileDataUrl);
            } catch (e) {
              console.warn('Storage save file error', e);
            }
            return { data: { path: filePath }, error: null };
          },
          async createSignedUrl(filePath, expiresIn = 3600) {
            try {
              const savedUrl = localStorage.getItem(`${STORAGE_PREFIX}file_${bucket}_${filePath}`);
              if (savedUrl) {
                return { data: { signedUrl: savedUrl }, error: null };
              }
            } catch {}
            return {
              data: {
                signedUrl: STUDENT_PROFILE.avatarUrl
              },
              error: null
            };
          },
          async remove(paths) {
            try {
              paths.forEach((p) => {
                localStorage.removeItem(`${STORAGE_PREFIX}file_${bucket}_${p}`);
              });
            } catch {}
            return { data: paths, error: null };
          },
          getPublicUrl(filePath) {
            return {
              data: {
                publicUrl: STUDENT_PROFILE.avatarUrl
              }
            };
          }
        };
      }
    }
  };
}

// Export Supabase instance
export const supabase = isSupabaseConfigured
  ? createClient(envSupabaseUrl, envSupabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : createMockSupabaseClient();

/**
 * Helper function to get signed URL for file access
 * @param {string} bucket - Bucket name
 * @param {string} filePath - File path in bucket
 * @param {number} expiresIn - Expiration time in seconds (default: 3600)
 */
export async function getSignedUrl(bucket, filePath, expiresIn = 3600) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) throw error;
    return data?.signedUrl || null;
  } catch (error) {
    console.error('Error creating signed URL:', error);
    return null;
  }
}

/**
 * Helper function to upload file to storage
 * @param {string} bucket - Bucket name
 * @param {string} filePath - Target file path
 * @param {Blob} file - File to upload
 */
export async function uploadFile(bucket, filePath, file) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

/**
 * Helper function to delete file from storage
 * @param {string} bucket - Bucket name
 * @param {string} filePath - File path to delete
 */
export async function deleteFile(bucket, filePath) {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

/**
 * Retry logic for transient network errors
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @param {number} delay - Initial delay in ms (default: 500)
 */
export async function withRetry(fn, maxRetries = 3, delay = 500) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status >= 400 && error.status < 500) {
        throw error;
      }
      if (attempt === maxRetries - 1) {
        throw error;
      }
      const waitTime = delay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data?.user || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Get current session
 */
export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data?.session || null;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

export default supabase;
