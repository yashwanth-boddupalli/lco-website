# Customer Management — Supabase Integration Walkthrough

## Files Modified

| File | Change Type | Description |
|------|------------|-------------|
| [customers.js](file:///c:/Users/boddu/Downloads/js/customers.js) | **Rewritten** | Full rewrite with robust error handling, new `getById()` method, fallback ID generation, and `inactive` count in stats |
| [admin.html](file:///c:/Users/boddu/Downloads/js/admin.html) | **Updated** | Added Inactive stat card, improved error handling in all async functions, optimized edit modal |

## Files Unchanged (Preserved)

| File | Purpose |
|------|---------|
| `config.js` | Supabase URL + anon key — **not modified** |
| `supabase-client.js` | Client initialization — **not modified** |
| `auth.js` | Login/logout/session management — **not modified** |
| `roles.js` | Profile/role fetching with cache — **not modified** |
| `guard.js` | Route protection + auth listener — **not modified** |

---

## Supabase Queries & Functions

### `TirangaCustomers` API (customers.js)

| Method | Supabase Query | Purpose |
|--------|---------------|---------|
| `getAll(filters)` | `SELECT * FROM customers` with `.eq()` and `.or()` + `.ilike()` | Fetch all customers with optional search/status/type filters |
| `getById(id)` | `SELECT * FROM customers WHERE id = ? LIMIT 1` | Fetch a single customer (used by edit modal) |
| `generateId()` | `RPC generate_customer_id()` | Auto-generate customer IDs; falls back to `TC-{timestamp}` if RPC unavailable |
| `create(customer)` | `INSERT INTO customers` | Insert new customer with auto-generated ID |
| `update(id, updates)` | `UPDATE customers SET ... WHERE id = ?` | Update customer, auto-sets `updated_at` |
| `remove(id)` | `DELETE FROM customers WHERE id = ?` | Delete customer by UUID |
| `getStats()` | Calls `getAll()` then computes counts client-side | Dashboard statistics (total, active, inactive, internet, cable_tv, combo, revenue) |

---

## Features Completed

### ✅ Dashboard Statistics (7 cards)
- **Total Customers** — count of all records
- **Active Customers** — status = 'active'
- **Inactive Customers** — status ≠ 'active' (includes inactive, suspended, disconnected)
- **Internet Customers** — connection_type = 'internet'
- **Cable TV Customers** — connection_type = 'cable_tv'
- **Combo Customers** — connection_type = 'combo'
- **Monthly Revenue** — sum of monthly_fee for active customers

### ✅ Customer Table
- Displays real records from `public.customers`
- Skeleton loading animation during initial fetch
- Animated row entry with staggered delays
- Shows customer ID, name, phone, area, type chip, plan, fee, status badge, technician

### ✅ Search & Filtering
- **Search** — by customer_id, full_name, phone, and area (case-insensitive `ILIKE`)
- **Status filter** — Active, Inactive, Suspended, Disconnected
- **Connection type filter** — Internet, Cable TV, Combo
- 300ms debounce on search input

### ✅ Add Customer
- Modal form with validation (name, phone, area, address, type, plan, fee required)
- Auto-generates customer_id via `generate_customer_id()` RPC (with fallback)
- Auto-sets today's date for installation_date
- Loading spinner on save button
- Success/error toast notifications

### ✅ Edit Customer
- Fetches single customer by UUID via `getById()` (optimized, no full table re-fetch)
- Pre-populates all form fields
- Shows customer ID in modal title
- Updates `updated_at` timestamp

### ✅ Delete Customer
- Confirmation modal with customer name
- Disables delete button during operation
- Success/error feedback via toast

### ✅ Error Handling
- **Loading state** — Skeleton rows/cards shown during initial load
- **Empty state** — "No customers found" message with Add Customer CTA
- **Database errors** — Error message displayed in table with Retry button
- **Stats errors** — Toast notification on failure
- **All CRUD operations** — try/catch with user-facing error messages
- **Supabase client check** — null-guards on all API methods

---

## Remaining Issues / Notes

> [!NOTE]
> - The `generate_customer_id()` RPC function must exist in your Supabase database. If it doesn't, the system gracefully falls back to generating timestamp-based IDs (format: `TC-{base36-timestamp}`).
> - Script paths in `admin.html` use relative `js/` prefix — the HTML file must be served from the parent directory of `js/`.
> - No dummy/hardcoded data is used anywhere — all data comes from Supabase.
> - Authentication, roles, and guard modules were **not modified** per requirements.
