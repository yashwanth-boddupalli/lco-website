/**
 * Tiranga Cable TV & Internet - Route Guard Module
 * ==================================================
 * Protects pages by checking authentication and role-based access.
 * 
 * Usage:
 *   Add to any protected page (e.g., admin.html):
 *   <script src="js/config.js"></script>
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *   <script src="js/supabase-client.js"></script>
 *   <script src="js/auth.js"></script>
 *   <script src="js/roles.js"></script>
 *   <script src="js/guard.js"></script>
 *   <script>
 *     TirangaGuard.protect({ requiredRole: 'admin' });
 *   </script>
 * 
 * Dependencies: config.js, supabase-client.js, auth.js, roles.js
 */

const TirangaGuard = (function () {
  'use strict';

  /**
   * Protect the current page
   * @param {object} options
   * @param {string} options.requiredRole - Required role to access this page (e.g., 'admin')
   * @param {string} options.redirectTo - Where to redirect if access denied (default: login page)
   * @param {function} options.onAuthorized - Callback when access is granted, receives profile
   * @param {function} options.onUnauthorized - Callback when access is denied (before redirect)
   */
  async function protect(options = {}) {
    const {
      requiredRole = null,
      redirectTo = TIRANGA_CONFIG.LOGIN_PAGE,
      onAuthorized = null,
      onUnauthorized = null,
    } = options;

    try {
      // Step 1: Check if user is authenticated
      const user = await TirangaAuth.getCurrentUser();

      if (!user) {
        console.log('[Tiranga Guard] No authenticated user — redirecting to login');
        if (onUnauthorized) onUnauthorized('not_authenticated');
        redirectToLogin(redirectTo);
        return;
      }

      // Step 2: Fetch profile and role
      const profile = await TirangaRoles.getProfile(user.id);

      if (!profile) {
        console.warn('[Tiranga Guard] No profile found for user:', user.id);
        if (onUnauthorized) onUnauthorized('no_profile');
        redirectToLogin(redirectTo);
        return;
      }

      // Step 3: Check if account is active
      if (profile.status !== 'active') {
        console.warn('[Tiranga Guard] Account is not active:', profile.status);
        if (onUnauthorized) onUnauthorized('inactive');
        redirectToLogin(redirectTo);
        return;
      }

      // Step 4: Check role if specified
      if (requiredRole && profile.role !== requiredRole) {
        console.warn('[Tiranga Guard] Role mismatch. Required:', requiredRole, 'Has:', profile.role);
        if (onUnauthorized) onUnauthorized('role_mismatch');
        // Redirect to the appropriate page for their role instead of login
        window.location.href = TirangaRoles.getRedirectForRole(profile.role);
        return;
      }

      // Step 5: Access granted
      console.log('[Tiranga Guard] Access granted for:', user.email, '| Role:', profile.role);

      // Show the page content (remove loading state)
      const protectedContent = document.getElementById('protected-content');
      const loadingState = document.getElementById('guard-loading');

      if (protectedContent) {
        protectedContent.style.display = 'block';
      }
      if (loadingState) {
        loadingState.style.display = 'none';
      }

      if (onAuthorized) onAuthorized(profile);

    } catch (err) {
      console.error('[Tiranga Guard] Error during protection check:', err);
      redirectToLogin(redirectTo);
    }
  }

  /**
   * Redirect to login page with return URL
   */
  function redirectToLogin(loginUrl) {
    const currentPage = window.location.pathname + window.location.search;
    const separator = loginUrl.includes('?') ? '&' : '?';
    window.location.href = loginUrl + separator + 'redirect=' + encodeURIComponent(currentPage);
  }

  /**
   * Check if we're on the login page and user is already authenticated
   * If so, redirect to their role-based dashboard
   */
  async function redirectIfAuthenticated() {
    try {
      const user = await TirangaAuth.getCurrentUser();
      if (!user) return false;

      const profile = await TirangaRoles.getProfile(user.id);
      if (!profile) return false;

      const redirectUrl = TirangaRoles.getRedirectForRole(profile.role);

      // Check for a redirect parameter in the URL
      const urlParams = new URLSearchParams(window.location.search);
      const redirectParam = urlParams.get('redirect');

      if (redirectParam) {
        window.location.href = redirectParam;
      } else {
        window.location.href = redirectUrl;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Setup auth state listener for handling logout on token expiry
   */
  function setupAuthListener() {
    TirangaAuth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // Clear role cache
        TirangaRoles.clearCache();
        // Redirect to login if on a protected page
        const isProtected = document.querySelector('[data-protected]');
        if (isProtected) {
          window.location.href = TIRANGA_CONFIG.LOGIN_PAGE;
        }
      }

      if (event === 'TOKEN_REFRESHED') {
        console.log('[Tiranga Guard] Token refreshed');
      }
    });
  }

  // Public API
  return {
    protect,
    redirectIfAuthenticated,
    setupAuthListener,
  };

})();
