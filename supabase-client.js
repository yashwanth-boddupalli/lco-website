/**
 * Tiranga Cable TV & Internet - Supabase Client
 * ===============================================
 * Initializes and exports the Supabase client instance.
 * 
 * Dependencies: config.js must be loaded before this file.
 * Uses Supabase JS v2 from CDN.
 */

// Validate configuration
(function validateConfig() {
  if (typeof TIRANGA_CONFIG === 'undefined') {
    console.error('[Tiranga Auth] config.js must be loaded before supabase-client.js');
    return;
  }
  if (TIRANGA_CONFIG.SUPABASE_URL === 'https://your-project-id.supabase.co' ||
    TIRANGA_CONFIG.SUPABASE_ANON_KEY === 'your-anon-key-here') {
    console.warn('[Tiranga Auth] ⚠️ Supabase credentials not configured. Please update js/config.js with your project URL and anon key.');
  }
})();

/**
 * Initialize the Supabase client
 * Uses the global supabase object from the CDN script
 */
const tirangaSupabase = (function () {
  if (typeof supabase === 'undefined' || !supabase.createClient) {
    console.error('[Tiranga Auth] Supabase JS library not loaded. Ensure the CDN script is included.');
    return null;
  }

  const client = supabase.createClient(
    TIRANGA_CONFIG.SUPABASE_URL,
    TIRANGA_CONFIG.SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
      }
    }
  );

  console.log('[Tiranga Auth] Supabase client initialized');
  return client;
})();
