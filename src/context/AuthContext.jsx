import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase.js';

export const AuthContext = createContext(null);

/**
 * AuthProvider Component
 * 
 * Manages authentication state using Supabase Auth:
 * - Google OAuth 2.0 via Supabase Authentication
 * - Email-to-student profile mapping
 * - Session persistence
 * - JWT token management
 * 
 * Enforces security:
 * - Tokens stored in Supabase's secure session storage
 * - Auto-refresh on token expiration
 * - Redirect to login on auth failure
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state on mount
  useEffect(() => {
    // Check for existing session
    checkSession();

    // Listen for auth state changes (login, logout, token refresh, OAuth redirect)
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        setIsAuthenticated(true);
        setError(null);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.getSession();

      if (error) throw error;

      if (data?.session?.user) {
        setUser(data.session.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Session check error:', err);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login with Google OAuth via Supabase Authentication
   * @param {string} [emailHint] - Optional email hint for Google account selection
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const loginWithGoogle = async (emailHint = null) => {
    setIsLoading(true);
    setError(null);

    try {
      const options = {
        redirectTo: window.location.origin
      };

      if (emailHint) {
        options.queryParams = { login_hint: emailHint.trim() };
        options.email = emailHint.trim();
      }

      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options
      });

      if (authError) {
        throw new Error(authError.message || 'Login dengan Google gagal');
      }

      // Check current session
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        setUser(sessionData.session.user);
        setIsAuthenticated(true);
      }

      return { success: true, data };
    } catch (err) {
      const errorMessage = err.message || 'Gagal masuk dengan Google OAuth';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login with email and password (fallback)
   * @param {string} email - Student email
   * @param {string} password - Student password
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!email || !password) {
        throw new Error('Email dan kata sandi wajib diisi');
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (authError) {
        if (authError.status === 400) {
          throw new Error('Email atau kata sandi tidak valid');
        } else if (authError.status === 429) {
          throw new Error('Terlalu banyak percobaan login. Coba lagi nanti');
        } else {
          throw new Error(authError.message || 'Login gagal');
        }
      }

      if (data?.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        throw new Error('Login gagal: User data tidak diterima');
      }
    } catch (err) {
      const errorMessage = err.message || 'Login gagal';
      setError(errorMessage);
      setUser(null);
      setIsAuthenticated(false);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign up new student account
   * @param {string} email - Student email
   * @param {string} password - Student password
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const signup = async (email, password) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!email || !password) {
        throw new Error('Email dan kata sandi wajib diisi');
      }

      if (password.length < 6) {
        throw new Error('Kata sandi minimal 6 karakter');
      }

      const { data, error: signupError } = await supabase.auth.signUp({
        email: email.trim(),
        password
      });

      if (signupError) {
        throw new Error(signupError.message || 'Pendaftaran gagal');
      }

      return {
        success: true,
        message: 'Pendaftaran berhasil. Silakan periksa email untuk verifikasi.'
      };
    } catch (err) {
      const errorMessage = err.message || 'Pendaftaran gagal';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout current user
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const logout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: logoutError } = await supabase.auth.signOut();

      if (logoutError) {
        throw new Error(logoutError.message || 'Logout gagal');
      }

      setUser(null);
      setIsAuthenticated(false);
      return { success: true };
    } catch (err) {
      const errorMessage = err.message || 'Logout gagal';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Reset password
   * @param {string} email - Student email
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const resetPassword = async (email) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!email) {
        throw new Error('Email wajib diisi');
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`
        }
      );

      if (resetError) {
        throw new Error(resetError.message || 'Pengiriman link reset gagal');
      }

      return {
        success: true,
        message: 'Link reset password telah dikirim ke email Anda'
      };
    } catch (err) {
      const errorMessage = err.message || 'Pengiriman link reset gagal';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    loginWithGoogle,
    login,
    signup,
    logout,
    resetPassword,
    checkSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
