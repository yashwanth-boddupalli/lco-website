/**
 * Tiranga Cable TV & Internet - Authentication Module
 * =====================================================
 * Handles login, logout, session management, and auth state changes.
 * 
 * Dependencies: config.js, supabase-client.js must be loaded first.
 */

const TirangaAuth = (function () {
  'use strict';

  /**
   * Sign in with email and password
   * @param {string} email 
   * @param {string} password 
   * @param {boolean} rememberMe 
   * @returns {Promise<{success: boolean, user?: object, error?: string}>}
   */
  async function login(email, password, rememberMe = false) {
    if (!tirangaSupabase) {
      return { success: false, error: 'Supabase client not initialized. Check config.js.' };
    }

    try {
      const { data, error } = await tirangaSupabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        console.error('[Tiranga Auth] Login failed:', error.message);
        return { success: false, error: mapAuthError(error.message) };
      }

      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem(TIRANGA_CONFIG.REMEMBER_ME_KEY, 'true');
      } else {
        localStorage.removeItem(TIRANGA_CONFIG.REMEMBER_ME_KEY);
      }

      console.log('[Tiranga Auth] Login successful for:', data.user.email);
      return { success: true, user: data.user };

    } catch (err) {
      console.error('[Tiranga Auth] Unexpected login error:', err);
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
  }

  /**
   * Sign out the current user
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async function logout() {
    if (!tirangaSupabase) {
      return { success: false, error: 'Supabase client not initialized.' };
    }

    try {
      const { error } = await tirangaSupabase.auth.signOut();

      if (error) {
        console.error('[Tiranga Auth] Logout failed:', error.message);
        return { success: false, error: error.message };
      }

      // Clear remember me
      localStorage.removeItem(TIRANGA_CONFIG.REMEMBER_ME_KEY);

      console.log('[Tiranga Auth] User logged out');
      return { success: true };

    } catch (err) {
      console.error('[Tiranga Auth] Unexpected logout error:', err);
      return { success: false, error: 'Failed to sign out. Please try again.' };
    }
  }

  /**
   * Get the currently authenticated user
   * @returns {Promise<object|null>}
   */
  async function getCurrentUser() {
    if (!tirangaSupabase) return null;

    try {
      const { data: { user }, error } = await tirangaSupabase.auth.getUser();
      if (error || !user) return null;
      return user;
    } catch {
      return null;
    }
  }

  /**
   * Get the current session
   * @returns {Promise<object|null>}
   */
  async function getSession() {
    if (!tirangaSupabase) return null;

    try {
      const { data: { session }, error } = await tirangaSupabase.auth.getSession();
      if (error || !session) return null;
      return session;
    } catch {
      return null;
    }
  }

  /**
   * Check if a user is currently authenticated
   * @returns {Promise<boolean>}
   */
  async function isAuthenticated() {
    const session = await getSession();
    return session !== null;
  }

  /**
   * Listen for auth state changes (login/logout/token refresh)
   * @param {function} callback - Called with (event, session)
   * @returns {object} Subscription object with unsubscribe method
   */
  function onAuthStateChange(callback) {
    if (!tirangaSupabase) {
      console.warn('[Tiranga Auth] Cannot listen for auth changes - client not initialized');
      return { data: { subscription: { unsubscribe: () => { } } } };
    }

    return tirangaSupabase.auth.onAuthStateChange((event, session) => {
      console.log('[Tiranga Auth] Auth state changed:', event);
      callback(event, session);
    });
  }

  /**
   * Send password reset email
   * @param {string} email 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async function resetPassword(email) {
    if (!tirangaSupabase) {
      return { success: false, error: 'Supabase client not initialized.' };
    }

    try {
      const { error } = await tirangaSupabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin + TIRANGA_CONFIG.LOGIN_PAGE,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: 'Failed to send reset email. Please try again.' };
    }
  }

  /**
   * Map Supabase auth errors to user-friendly messages
   */
  function mapAuthError(message) {
    const errorMap = {
      'Invalid login credentials': 'Invalid email or password. Please try again.',
      'Email not confirmed': 'Please verify your email address before signing in.',
      'Too many requests': 'Too many login attempts. Please wait a moment and try again.',
      'User not found': 'No account found with this email address.',
      'Invalid email': 'Please enter a valid email address.',
      'Signup requires a valid password': 'Please enter a valid password.',
    };

    for (const [key, val] of Object.entries(errorMap)) {
      if (message.toLowerCase().includes(key.toLowerCase())) {
        return val;
      }
    }

    return message || 'Authentication failed. Please try again.';
  }

  // Public API
  return {
    login,
    logout,
    getCurrentUser,
    getSession,
    isAuthenticated,
    onAuthStateChange,
    resetPassword,
  };

})();
