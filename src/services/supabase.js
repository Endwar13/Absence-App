import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client Configuration
 * 
 * Initializes real Supabase client with PostgreSQL database backend.
 * Requires environment variables:
 * - VITE_SUPABASE_URL: Supabase project URL
 * - VITE_SUPABASE_ANON_KEY: Supabase anonymous key for client-side auth
 * 
 * Features:
 * - Real-time database operations via REST API
 * - JWT-based authentication with Supabase Auth
 * - Row-Level Security (RLS) policies enforcement
 * - File storage for selfies and proof documents
 * - Error handling with retry logic
 */

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
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
});

/**
 * Storage bucket configuration
 */
export const STORAGE_BUCKETS = {
  ATTENDANCE_SELFIES: 'attendance-selfies',
  LEAVE_PROOF: 'leave-request-proof',
  PROFILE_PHOTOS: 'profile-photos'
};

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
      // Don't retry on client errors or auth errors
      if (error.status >= 400 && error.status < 500) {
        throw error;
      }

      if (attempt === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff
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
