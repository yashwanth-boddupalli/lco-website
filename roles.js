/**
 * Tiranga Cable TV & Internet - Roles Module
 * ============================================
 * Fetches user profile and role from the 'profiles' table.
 * 
 * Table schema:
 *   profiles (
 *     id          UUID PRIMARY KEY REFERENCES auth.users(id),
 *     full_name   TEXT,
 *     phone       TEXT,
 *     role        TEXT DEFAULT 'customer',
 *     status      TEXT DEFAULT 'active',
 *     created_at  TIMESTAMPTZ DEFAULT now(),
 *     updated_at  TIMESTAMPTZ DEFAULT now()
 *   )
 * 
 * Dependencies: config.js, supabase-client.js, auth.js must be loaded first.
 */

const TirangaRoles = (function () {
  'use strict';

  // Valid roles in the system
  const ROLES = {
    ADMIN: 'admin',
    TECHNICIAN: 'technician',
    CUSTOMER: 'customer',
  };

  // Cache the profile to avoid repeated DB calls
  let _cachedProfile = null;
  let _cachedUserId = null;

  /**
   * Fetch user profile from the profiles table
   * @param {string} userId - The auth.users.id
   * @param {boolean} useCache - Whether to use cached result
   * @returns {Promise<object|null>}
   */
  async function getProfile(userId, useCache = true) {
    if (!tirangaSupabase) {
      console.error('[Tiranga Roles] Supabase client not initialized');
      return null;
    }

    // Return cached profile if available and for the same user
    if (useCache && _cachedProfile && _cachedUserId === userId) {
      return _cachedProfile;
    }

    try {
      const { data, error } = await tirangaSupabase
        .from('profiles')
        .select('id, full_name, phone, role, status, created_at, updated_at')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[Tiranga Roles] Error fetching profile:', error.message);
        return null;
      }

      // Cache the result
      _cachedProfile = data;
      _cachedUserId = userId;

      return data;

    } catch (err) {
      console.error('[Tiranga Roles] Unexpected error:', err);
      return null;
    }
  }

  /**
   * Get the role of the currently authenticated user
   * @returns {Promise<string|null>}
   */
  async function getCurrentUserRole() {
    const user = await TirangaAuth.getCurrentUser();
    if (!user) return null;

    const profile = await getProfile(user.id);
    if (!profile) return null;

    return profile.role || ROLES.CUSTOMER;
  }

  /**
   * Get the full profile of the currently authenticated user
   * @returns {Promise<object|null>}
   */
  async function getCurrentUserProfile() {
    const user = await TirangaAuth.getCurrentUser();
    if (!user) return null;

    return await getProfile(user.id);
  }

  /**
   * Check if current user has a specific role
   * @param {string} role 
   * @returns {Promise<boolean>}
   */
  async function hasRole(role) {
    const userRole = await getCurrentUserRole();
    return userRole === role;
  }

  /**
   * Check if current user is an admin
   * @returns {Promise<boolean>}
   */
  async function isAdmin() {
    return await hasRole(ROLES.ADMIN);
  }

  /**
   * Check if the user's account is active
   * @returns {Promise<boolean>}
   */
  async function isActive() {
    const profile = await getCurrentUserProfile();
    if (!profile) return false;
    return profile.status === 'active';
  }

  /**
   * Clear the cached profile (call on logout)
   */
  function clearCache() {
    _cachedProfile = null;
    _cachedUserId = null;
  }

  /**
   * Get redirect URL based on user role
   * @param {string} role 
   * @returns {string}
   */
  function getRedirectForRole(role) {
    switch (role) {
      case ROLES.ADMIN:
        return TIRANGA_CONFIG.ADMIN_PAGE;
      case ROLES.TECHNICIAN:
        // Future: return '/technician.html';
        return TIRANGA_CONFIG.HOME_PAGE;
      case ROLES.CUSTOMER:
        // Future: return '/customer.html';
        return TIRANGA_CONFIG.HOME_PAGE;
      default:
        return TIRANGA_CONFIG.HOME_PAGE;
    }
  }

  // Public API
  return {
    ROLES,
    getProfile,
    getCurrentUserRole,
    getCurrentUserProfile,
    hasRole,
    isAdmin,
    isActive,
    clearCache,
    getRedirectForRole,
  };

})();
