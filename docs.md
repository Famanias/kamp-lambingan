# Kamp Lambingan — Project Documentation

## Overview

This project is a full migration of the original static HTML site (`KampLambingan/`) to a modern **Next.js 15** web application with a booking system, admin CMS, and manual payment confirmation flow.

| | Old Project | New Project |
|---|---|---|
| **Location** | `KampLambingan/` | `kamp-lambingan/` |
| **Stack** | Plain HTML + Vanilla JS + Tailwind CDN | Next.js 15 + TypeScript + Tailwind v4 |
| **CMS** | `admin.html` (static page) | `/admin` routes (authenticated, server-rendered) |
| **Bookings** | None | Full booking flow with receipt upload |
| **Auth** | None | Supabase Auth (admin only) |

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 15 (v16.1.6) | Framework (App Router) |
| **TypeScript** | 5.x | Type safety throughout |
| **Tailwind CSS** | v4 | Styling (CSS-first config) |
| **Supabase** | Latest | Database, Auth, Storage |
| **@supabase/ssr** | Latest | Server-side Supabase client |
| **Resend** | Latest | Transactional emails (optional) |

---

## Project Structure

```
kamp-lambingan/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── layout.tsx                # Root layout (fonts, metadata)
│   │   ├── page.tsx                  # Public homepage
│   │   ├── globals.css               # Global CSS + Tailwind v4 theme
│   │   ├── book/
│   │   │   └── page.tsx              # Booking form page
│   │   ├── booking/
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Booking confirmation page
│   │   └── admin/
│   │       ├── layout.tsx            # Admin shell (sidebar)
│   │       ├── page.tsx              # Admin dashboard
│   │       ├── login/
│   │       │   └── page.tsx          # Admin login
│   │       ├── content/
│   │       │   └── page.tsx          # Site content editor
│   │       └── bookings/
│   │           ├── page.tsx          # Bookings list
│   │           └── [id]/
│   │               └── page.tsx      # Booking detail + actions
│   ├── actions/                      # Next.js Server Actions
│   │   ├── auth.ts                   # login(), logout()
│   │   ├── bookings.ts               # createBooking(), getBookings(), etc.
│   │   └── content.ts                # getContent(), saveContent()
│   ├── components/
│   │   ├── site/                     # Public-facing components
│   │   │   ├── Navbar.tsx            # Fixed navigation bar
│   │   │   ├── NavbarClient.tsx      # Client: mobile menu toggle
│   │   │   ├── Hero.tsx              # Hero section
│   │   │   ├── Features.tsx          # Experiences grid
│   │   │   ├── Activities.tsx        # Activities dark section
│   │   │   ├── Gallery.tsx           # Photo gallery grid
│   │   │   ├── Packages.tsx          # Pricing cards
│   │   │   ├── Reviews.tsx           # Guest reviews
│   │   │   ├── Faq.tsx               # FAQ accordion
│   │   │   ├── BookSection.tsx       # Contact info + Google Maps
│   │   │   ├── BookForm.tsx          # 2-step booking form (client)
│   │   │   └── Footer.tsx            # Site footer
│   │   └── admin/                    # Admin-only components
│   │       ├── ContentEditor.tsx     # Full CMS editor (client)
│   │       └── BookingActions.tsx    # Confirm/Cancel buttons (client)
│   ├── lib/
│   │   ├── types.ts                  # TypeScript interfaces
│   │   ├── defaults.ts               # DEFAULT_CONTENT fallback data
│   │   └── supabase/
│   │       ├── client.ts             # Browser Supabase client
│   │       ├── server.ts             # Server Supabase client
│   │       └── middleware.ts         # Session refresh + auth guard
│   └── proxy.ts                      # Next.js proxy (auth middleware)
├── public/
│   └── assets/                       # Copied from old KampLambingan/assets/
│       ├── logo.png
│       └── logo.jpg
├── .env.local                        # Environment variables (git-ignored)
├── .env.local.example                # Template for env vars
├── bookings-table.sql                # SQL to run in Supabase
├── next.config.ts                    # Next.js config
├── tsconfig.json                     # TypeScript config
└── docs.md                           # This file
```

---

## Getting Started

### Prerequisites

- **Node.js** 18.17 or later
- **npm** 9+ (comes with Node.js)
- A **Supabase** project (free tier works)

### 1. Navigate to the project

```powershell
cd "c:\Users\neilc\OneDrive\Documents\GitHub\kamp-lambingan"
```

### 2. Install dependencies

```powershell
# If you haven't installed yet (first time setup)
npm install
```

All required packages are already listed in `package.json`. The key ones are:
- `next`, `react`, `react-dom`
- `@supabase/supabase-js`, `@supabase/ssr`
- `resend`

### 3. Configure environment variables

Copy the example file and fill in your values:

```powershell
Copy-Item .env.local.example .env.local
```

Then edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
RESEND_API_KEY=re_xxxxxxxxxxxx          # Optional — leave empty to skip emails
ADMIN_EMAIL=kamplambingan@gmail.com     # Email to notify on new bookings
```

> Your `.env.local` already has the correct Supabase credentials from the original project. You only need to add `RESEND_API_KEY` if you want email notifications.

### 4. Set up the Supabase database

See the [Supabase Setup](#supabase-setup) section below.

### 5. Start the development server

```powershell
# On Windows/PowerShell — allow npm scripts first
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Start dev server
npm run dev
```

The site will be available at **http://localhost:3000**

| URL | Description |
|---|---|
| `http://localhost:3000` | Public website |
| `http://localhost:3000/book` | Booking form |
| `http://localhost:3000/admin` | Admin dashboard (requires login) |
| `http://localhost:3000/admin/login` | Admin login page |

---

## Supabase Setup

### Step 1 — Get your credentials

1. Go to [supabase.com](https://supabase.com) and open your project
2. Navigate to **Settings → API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> These are already filled in `.env.local` from the original project credentials.

### Step 2 — Create the bookings table

1. In the Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Paste the entire contents of `bookings-table.sql`
4. Click **Run**

This creates:
- `bookings` table with all required columns
- Row Level Security (RLS) policies
- Auto-update trigger for `updated_at`
- `receipts` storage bucket (public)
- Storage RLS policies

The `bookings` table schema:

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Auto-generated primary key |
| `guest_name` | text | Guest's full name |
| `guest_email` | text | Guest's email address |
| `guest_phone` | text | Guest's phone number |
| `package_name` | text | Name of the selected package |
| `check_in` | date | Arrival date |
| `check_out` | date | Departure date |
| `pax` | integer | Number of guests |
| `notes` | text | Optional special requests |
| `receipt_url` | text | Public URL of uploaded payment proof |
| `status` | text | `pending` / `confirmed` / `cancelled` |
| `created_at` | timestamptz | Submission timestamp |
| `updated_at` | timestamptz | Last update timestamp |

### Step 3 — Verify the existing `site_content` table

Your existing project already has a `site_content` table. The `getContent()` action reads from it:

```sql
-- Should already exist from your original project
SELECT * FROM site_content WHERE id = 1;
```

If it doesn't exist, create it:

```sql
CREATE TABLE IF NOT EXISTS public.site_content (
  id    integer PRIMARY KEY DEFAULT 1,
  data  jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Allow authenticated users to read/write
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read" ON public.site_content
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated update" ON public.site_content
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### Step 4 — Set up the admin user

The admin login uses Supabase Auth (email + password).

1. In the Supabase Dashboard, go to **Authentication → Users**
2. Click **Add user → Create new user**
3. Enter your admin email and a strong password
4. Use those credentials at `http://localhost:3000/admin/login`

### Step 5 — Verify Storage bucket

The SQL script creates a `receipts` bucket, but verify it exists:

1. Go to **Storage** in the Supabase Dashboard
2. Confirm a bucket named `receipts` exists and is set to **Public**
3. If it doesn't exist: **New bucket → Name: `receipts` → Toggle Public ON → Save**

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Supabase anonymous/public key |
| `RESEND_API_KEY` | ❌ No | Resend API key for emails — omit to disable |
| `ADMIN_EMAIL` | ❌ No | Email address to receive new booking notifications |

---

## Booking Flow

### Guest-facing flow

1. Guest visits `/book` (or clicks "Book Your Stay" anywhere on the site)
2. **Step 1** — Fills in: Name, Email, Phone, Package, Check-in/out dates, Number of guests, Notes
3. **Step 2** — Uploads a screenshot/photo of their GCash or bank transfer receipt
4. Submits → booking is created in Supabase with `status: pending`
5. Guest is redirected to `/booking/[id]` — a confirmation page showing their booking summary
6. (Optional) Confirmation emails are sent to the guest and admin via Resend

### Admin flow

1. Admin logs in at `/admin/login`
2. Dashboard at `/admin` shows total, pending, confirmed, cancelled counts + recent bookings
3. Go to `/admin/bookings` to see all bookings, filterable by status
4. Click **View** on a pending booking to open the detail page
5. Detail page shows: guest info, booking details, and the uploaded receipt image
6. Admin clicks **Confirm** or **Cancel**
7. Booking status updates in Supabase
8. (Optional) Guest receives a confirmation/cancellation email via Resend

---

## Admin Panel Guide

### Login

URL: `/admin/login`  
Uses your Supabase Auth credentials (email + password).  
All `/admin/*` routes are protected — unauthenticated visitors are redirected to `/admin/login`.

### Dashboard (`/admin`)

- Summary stats: Total / Pending / Confirmed / Cancelled bookings
- Table of the 5 most recent bookings
- Quick links to Content Editor and Bookings

### Bookings (`/admin/bookings`)

- Full table of all bookings
- Filter tabs: All / Pending / Confirmed / Cancelled
- Click **View →** to open a booking detail

### Booking Detail (`/admin/bookings/[id]`)

- Guest info (name, email, phone)
- Booking details (package, dates, guests, notes)
- Receipt image (or PDF link)
- **Confirm** and **Cancel** action buttons (only shown for `pending` bookings)

### Content Editor (`/admin/content`)

Edit all site content organized by section:

| Section | Fields |
|---|---|
| **Hero** | Site title, Tagline, Hero title, Subtitle, Hero image URL |
| **Contact** | Phone, Email, Address |
| **Features** | Icon (Material Icons name), Title, Description — add/remove cards |
| **Activities** | Icon, Title, Description — add/remove cards |
| **Packages** | Name, Price, Description, Features list, Featured toggle — add/remove |
| **Reviews** | Name, Date, Review text, Tags — add/remove |
| **FAQ** | Question, Answer — add/remove |
| **Gallery** | Image URLs (up to 6 shown on homepage) |

Changes are saved to Supabase `site_content` table and the homepage is revalidated immediately.

---

## Site Content System

Content is loaded server-side on every request via `getContent()` in `src/actions/content.ts`:

1. Queries Supabase `site_content` table (row ID = 1)
2. Falls back to `DEFAULT_CONTENT` in `src/lib/defaults.ts` if the table is empty or unavailable
3. All site components receive `content: SiteContent` as a prop — no client-side fetching needed

To reset all content to defaults, run in Supabase SQL Editor:

```sql
DELETE FROM site_content WHERE id = 1;
```

---

## Email Notifications (Resend)

Email is **optional** — the booking system works fully without it. To enable:

1. Sign up at [resend.com](https://resend.com) (free tier: 100 emails/day)
2. Create an API key
3. Add to `.env.local`:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxx
   ```
4. (Optional) Verify your domain in Resend to send from `noreply@yourdomain.com`
   - Until then, change the `from:` address in `src/actions/bookings.ts` to use `@resend.dev`

Emails sent:
- **On new booking** → confirmation to guest, notification to `ADMIN_EMAIL`
- **On confirm** → "Your booking is confirmed!" to guest
- **On cancel** → cancellation notice to guest

---

## Tailwind CSS v4 Notes

This project uses **Tailwind CSS v4**, which uses a CSS-first configuration approach — there is **no `tailwind.config.ts`** file.

Custom colors and theme tokens are defined in `src/app/globals.css`:

```css
@import "tailwindcss";

@theme inline {
  --color-primary: #14b881;
  --color-background-light: #f6f8f7;
  --color-background-dark: #11211c;
}
```

These are used in components as `bg-primary`, `text-primary`, `bg-background-light`, etc.

---

## Key Files Reference

| File | What it does |
|---|---|
| `src/lib/types.ts` | All TypeScript interfaces (`SiteContent`, `Booking`, `Package`, etc.) |
| `src/lib/defaults.ts` | Full default site content (used as fallback) |
| `src/lib/supabase/client.ts` | `createClient()` for browser (client components) |
| `src/lib/supabase/server.ts` | `createClient()` for server (server components, actions) |
| `src/lib/supabase/middleware.ts` | Session refresh + `/admin/*` auth guard |
| `src/proxy.ts` | Next.js proxy (runs on every request) |
| `src/actions/content.ts` | `getContent()`, `saveContent()` |
| `src/actions/auth.ts` | `login()`, `logout()` |
| `src/actions/bookings.ts` | `createBooking()`, `getBookings()`, `getBooking()`, `updateBookingStatus()`, `uploadReceipt()` |
| `bookings-table.sql` | Run once in Supabase SQL Editor to set up DB |
| `.env.local` | Local environment variables (never commit this) |

---

## Build & Deployment

### Development

```powershell
npm run dev
```

### Production build (verify before deploying)

```powershell
npm run build
```

A successful build looks like:

```
✓ Compiled successfully
✓ Finished TypeScript
✓ Generating static pages

Route (app)
├ ƒ /
├ ○ /admin/login
├ ƒ /admin
├ ƒ /admin/bookings
├ ƒ /admin/bookings/[id]
├ ƒ /admin/content
├ ƒ /book
└ ƒ /booking/[id]
```

### Deploying to Vercel (recommended)

1. Push the `kamp-lambingan/` folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **New Project** → import the repo
3. Add environment variables in Vercel Project Settings → Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `RESEND_API_KEY` (optional)
   - `ADMIN_EMAIL`
4. Deploy — Vercel auto-detects Next.js

---

## Changes from Old Project

### What was migrated

| Old (`KampLambingan/`) | New (`kamp-lambingan/`) |
|---|---|
| `index.html` | `src/app/page.tsx` + all `src/components/site/` |
| `admin.html` | `src/app/admin/content/page.tsx` + `ContentEditor.tsx` |
| `data/content.json` | `src/lib/defaults.ts` + Supabase `site_content` |
| `assets/` | `public/assets/` |
| Vanilla JS mobile menu | `NavbarClient.tsx` (React, `useEffect`) |
| Vanilla JS FAQ accordion | `Faq.tsx` (`<details>`/`<summary>` HTML) |
| Vanilla JS content hydration | Server-rendered via `getContent()` |
| No booking system | Full `/book` flow with receipt upload |
| No admin auth | Supabase Auth protecting `/admin/*` |
| No email | Resend integration (optional) |

### What's new

- **`/book`** — 2-step booking form (details → receipt upload)
- **`/booking/[id]`** — Booking confirmation page
- **`/admin/bookings`** — Full bookings management (list + detail)
- **Receipt upload** — Files go to Supabase Storage `receipts` bucket
- **Admin confirm/cancel** — Updates booking status + sends email to guest
- **TypeScript throughout** — All components, actions, and lib files are fully typed
- **Server Actions** — No separate API routes needed; form submissions use Next.js Server Actions

---

## Troubleshooting

### PowerShell execution policy error

```
File cannot be loaded because running scripts is disabled on this system.
```

Fix:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### Supabase connection issues

- Check that `.env.local` has the correct URL and anon key
- Ensure RLS policies are in place (run `bookings-table.sql`)
- Verify the `site_content` table exists and has row `id = 1`

### Receipt upload fails

- Confirm the `receipts` bucket exists in Supabase Storage and is set to **Public**
- Check that the Storage RLS policy for anon INSERT is active (included in `bookings-table.sql`)

### Admin login redirects back to login

- The admin user must be created in Supabase **Authentication → Users**
- Use the exact email/password you created there
- Check Supabase Dashboard → Authentication → Logs for error details

### Images not loading

External images (from Google Photos URLs) are served via `<img>` tags, not `<Image>` from Next.js. If images from your own domain don't load, add the domain to `next.config.ts`:

```ts
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    { protocol: 'https', hostname: 'your-domain.com' }, // add here
  ],
},
```


## to seed data:

cd "c:\path-to-repository-folder\kamp-lambingan"
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npm run seed

To wipe all bookings and re-seed fresh:
npm run seed:reset