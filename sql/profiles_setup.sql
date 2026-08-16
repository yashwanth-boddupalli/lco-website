-- ============================================================
-- TIRANGA CABLE TV & INTERNET
-- Supabase Database Setup: Profiles Table
-- ============================================================
-- 
-- INSTRUCTIONS:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Paste and run this entire script
-- 4. After running, go to Authentication → Users to create your admin user
-- 5. Then run the INSERT statement at the bottom to set up the admin profile
--
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. CREATE PROFILES TABLE
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  phone       TEXT,
  role        TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'technician', 'customer')),
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add comment for documentation
COMMENT ON TABLE public.profiles IS 'User profiles for Tiranga Cable TV & Internet. Linked to Supabase auth.users.';
COMMENT ON COLUMN public.profiles.role IS 'User role: admin, technician, or customer';
COMMENT ON COLUMN public.profiles.status IS 'Account status: active, inactive, or suspended';

-- ────────────────────────────────────────────────────────────
-- 2. ENABLE ROW LEVEL SECURITY (RLS)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- 3. RLS POLICIES
-- ────────────────────────────────────────────────────────────

-- Policy: Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Admins can read all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can insert profiles
CREATE POLICY "Admins can insert profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ────────────────────────────────────────────────────────────
-- 4. AUTO-UPDATE updated_at ON CHANGES
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ────────────────────────────────────────────────────────────
-- 5. AUTO-CREATE PROFILE ON USER SIGNUP
-- ────────────────────────────────────────────────────────────
-- This trigger automatically creates a profile entry when
-- a new user signs up via Supabase Auth.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'customer',
    'active'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ────────────────────────────────────────────────────────────
-- 6. CREATE INDEX FOR FASTER ROLE LOOKUPS
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- ============================================================
-- 7. SET UP YOUR ADMIN USER
-- ============================================================
-- 
-- STEP 1: Create an admin user in Supabase
--   Go to Authentication → Users → "+ Add user"
--   Enter your admin email and password
--   Note the user's UUID from the list
--
-- STEP 2: Run this INSERT (replace the UUID and details)
--
-- INSERT INTO public.profiles (id, full_name, phone, role, status)
-- VALUES (
--   'PASTE-YOUR-ADMIN-USER-UUID-HERE',
--   'Your Name',
--   '+91-XXXXXXXXXX',
--   'admin',
--   'active'
-- );
--
-- STEP 3 (Alternative): If the auto-trigger already created the profile,
--   update the role instead:
--
-- UPDATE public.profiles
-- SET role = 'admin', full_name = 'Your Name', phone = '+91-XXXXXXXXXX'
-- WHERE id = 'PASTE-YOUR-ADMIN-USER-UUID-HERE';
--
-- ============================================================
