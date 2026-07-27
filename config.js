/**
 * Tiranga Cable TV & Internet - Supabase Configuration
 * =====================================================
 * 
 * INSTRUCTIONS:
 * Replace the placeholder values below with your actual Supabase project credentials.
 * 
 * 1. Go to https://supabase.com and sign in to your project
 * 2. Navigate to Settings → API
 * 3. Copy your "Project URL" and replace SUPABASE_URL
 * 4. Copy your "anon public" key and replace SUPABASE_ANON_KEY
 * 
 * ⚠️ This is the ONLY file you need to edit manually.
 * The anon key is safe to expose in client-side code (it's a publishable key).
 */

const TIRANGA_CONFIG = {
  // Replace with your Supabase Project URL
  SUPABASE_URL: 'https://your-project-id.supabase.co',

  // Replace with your Supabase Publishable Anon Key
  SUPABASE_ANON_KEY: 'your-anon-key-here',

  // Application settings (do not modify unless necessary)
  APP_NAME: 'Tiranga Cable TV & Internet',
  LOGIN_PAGE: '/login.html',
  HOME_PAGE: '/index.html',
  ADMIN_PAGE: '/admin.html',
  SESSION_KEY: 'tiranga_session',
  REMEMBER_ME_KEY: 'tiranga_remember',
};
