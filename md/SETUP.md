# Tiranga Cable TV & Internet — Authentication Setup Guide

## Overview

This guide walks you through setting up the authentication system for the Tiranga Cable TV & Internet website using Supabase.

---

## Files Created

| File | Purpose |
|------|---------|
| `js/config.js` | Supabase URL and Anon Key (edit this file) |
| `js/supabase-client.js` | Initializes the Supabase client |
| `js/auth.js` | Login, logout, session management |
| `js/roles.js` | Reads user role from `profiles` table |
| `js/guard.js` | Route protection for secured pages |
| `login.html` | User login page |
| `admin.html` | Protected admin dashboard placeholder |
| `profiles_setup.sql` | SQL script for Supabase database setup |

---

## Step-by-Step Setup

### Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click **"New Project"**
4. Choose your organization, enter a project name (e.g., "Tiranga"), a strong database password, and select a region close to your users
5. Wait for the project to be provisioned

### Step 2: Get Your API Credentials

1. In your Supabase dashboard, go to **Settings → API**
2. Copy your **Project URL** (looks like `https://xxxxxxxx.supabase.co`)
3. Copy your **anon public** key (a long string starting with `eyJ...`)

### Step 3: Configure the Application

1. Open `js/config.js` in your code editor
2. Replace the placeholder values:

```javascript
const TIRANGA_CONFIG = {
  SUPABASE_URL: 'https://your-actual-project-id.supabase.co',
  SUPABASE_ANON_KEY: 'your-actual-anon-key-here',
  // ... keep everything else as is
};
```

> ⚠️ This is the **only file** you need to edit manually.

### Step 4: Set Up the Database

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Open `profiles_setup.sql` and copy-paste the **entire** contents
4. Click **Run** to execute the script
5. Verify: Go to **Table Editor** — you should see a `profiles` table

### Step 5: Create Your Admin User

1. In Supabase, go to **Authentication → Users**
2. Click **"Add user"** → **"Create new user"**
3. Enter:
   - **Email**: Your admin email
   - **Password**: A strong password
   - **Auto Confirm User**: ✅ Toggle ON
4. Click **Create user**
5. Copy the **User UID** (the UUID shown in the user list)

### Step 6: Set the Admin Role

Because the auto-trigger creates a profile with `role = 'customer'`, you need to update it to `admin`:

1. Go to **SQL Editor** in Supabase
2. Run:

```sql
UPDATE public.profiles
SET role = 'admin', full_name = 'Your Name', phone = '+91-XXXXXXXXXX'
WHERE id = 'PASTE-YOUR-ADMIN-USER-UUID-HERE';
```

Replace:
- `'PASTE-YOUR-ADMIN-USER-UUID-HERE'` with the UUID from Step 5
- `'Your Name'` with your actual name
- `'+91-XXXXXXXXXX'` with your phone number

### Step 7: Configure Site URL (Important)

1. Go to **Authentication → URL Configuration** in Supabase
2. Set **Site URL** to your website's URL (e.g., `https://www.skylinkca.com`)
3. Add **Redirect URLs**:
   - `https://www.skylinkca.com/login.html`
   - `http://localhost` (for local testing)

### Step 8: Test!

1. Open your website and click the **Login** button in the navbar
2. Enter the admin email and password you created
3. You should be redirected to `admin.html` (the "Coming Soon" page)
4. Click **Logout** — you should be sent back to the login page
5. Try accessing `admin.html` directly without logging in — you should be redirected to the login page

---

## Authentication Flow

```
User clicks Login
       ↓
  login.html loads
       ↓
  Supabase Authentication
       ↓
  Authentication Success
       ↓
  Read role from profiles table
       ↓
  ┌─── role = admin ───→ Redirect to /admin.html
  │
  ├─── role = customer ───→ Redirect to /index.html (future: /customer.html)
  │
  └─── role = technician ───→ Redirect to /index.html (future: /technician.html)
```

---

## File Architecture

```
project/
├── index.html              ← Main website (Login button added to navbar)
├── login.html              ← Login page
├── admin.html              ← Protected admin placeholder
├── profiles_setup.sql      ← Database setup script
├── SETUP.md                ← This file
└── js/
    ├── config.js           ← ⚙️ EDIT THIS (Supabase credentials)
    ├── supabase-client.js  ← Supabase client initialization
    ├── auth.js             ← Authentication (login/logout/session)
    ├── roles.js            ← Profile & role management
    └── guard.js            ← Route protection
```

---

## Profiles Table Schema

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID (PK) | — | References `auth.users.id` |
| `full_name` | TEXT | — | User's display name |
| `phone` | TEXT | — | Phone number |
| `role` | TEXT | `'customer'` | `admin`, `technician`, or `customer` |
| `status` | TEXT | `'active'` | `active`, `inactive`, or `suspended` |
| `created_at` | TIMESTAMPTZ | `now()` | Profile creation time |
| `updated_at` | TIMESTAMPTZ | `now()` | Last update time |

---

## Security Features

- ✅ Row Level Security (RLS) enabled on `profiles` table
- ✅ Users can only view their own profile
- ✅ Admins can view and manage all profiles
- ✅ Route guard blocks unauthenticated access to protected pages
- ✅ Role-based access control (admin pages require admin role)
- ✅ Automatic session management with token refresh
- ✅ Auto-profile creation on user signup

---

## Troubleshooting

### "Supabase credentials not configured" warning in console
→ You haven't updated `js/config.js` with your real Supabase URL and Anon Key.

### Login fails with "Invalid login credentials"
→ Make sure the user exists in Supabase Auth and the email is confirmed.

### Admin page shows "Verifying access..." forever
→ Check browser console for errors. Likely a misconfigured Supabase URL or missing profiles entry.

### User gets redirected to home instead of admin
→ The user's profile has `role = 'customer'`. Run the UPDATE SQL from Step 6.

### Changes not reflecting
→ Clear browser localStorage and try again. Hard refresh with `Ctrl+Shift+R`.

---

## What's Next (Future Development)

When you're ready to add more features, the auth system is designed to support:

- **Customer Dashboard** (`customer.html`) — `role = 'customer'`
- **Technician Dashboard** (`technician.html`) — `role = 'technician'`
- **Complaint System** — Submit and track complaints
- **Billing Module** — View and manage bills
- **Analytics** — Admin analytics dashboard

Each new protected page just needs the standard script tags and a `TirangaGuard.protect()` call.
