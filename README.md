# Kamp Lambingan — Resort Website & CMS

A full-stack resort landing page and content management system built for **Kamp Lambingan**, a riverside glamping resort in San Antonio, Zambales, Philippines.

Built with **Next.js 16 (App Router)**, **Supabase**, **Tailwind CSS v4**, and **Vercel AI SDK + Groq**.

---

## Features

### Public Site
- **Hero section** — full-screen banner with customizable headline, subtitle, and background image
- **Features & Activities** — icon-driven highlights showcasing what the resort offers
- **Packages & Pricing** — clear pricing cards with inclusions; supports featured package highlight
- **Villa Gallery** — image carousel per villa with capacity and activity details
- **Guest Reviews** — star-rated testimonials with tags
- **FAQ** — accordion-style frequently asked questions
- **Gallery** — responsive photo grid (6 images)
- **Booking Form** — two-step form: guest details → GCash payment + receipt upload
- **My Bookings** — guests look up their booking status by email
- **AI Chat Assistant** — floating chat widget powered by Groq (llama-3.3-70b), trained on all resort content and strictly scoped to Kamp Lambingan questions only

### Admin Panel (`/admin`)
- **Bookings** — view, confirm, cancel, and archive guest bookings with reference numbers
- **Content Editor** — live CMS with sections for:
  - Hero, Contact, Features, Activities, Packages, Villas, Reviews, FAQ, Gallery, Footer, Payment
- **Payment QR** — upload and update the GCash QR code shown on the booking form
- **Image Uploads** — upload images directly to Supabase Storage (private bucket, signed URLs)

### Booking Flow
1. Guest fills in details and selects a package
2. Chooses full payment or 50% downpayment
3. Scans the GCash QR code and sends the exact amount
4. Uploads a screenshot of the GCash receipt
5. Admin verifies and confirms via text/call within 24 hours

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions) |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL + RLS) |
| Storage | Supabase Storage (private `site-images`, public `receipts`) |
| Auth | Supabase Auth (admin login) |
| AI Chatbot | Vercel AI SDK v6 + Groq (`llama-3.3-70b-versatile`) |
| Deployment | Vercel |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Public homepage
│   ├── book/                     # Booking page
│   ├── booking/[id]/             # Booking confirmation page
│   ├── my-bookings/              # Guest booking lookup
│   ├── admin/                    # Admin panel (auth-protected)
│   │   ├── bookings/             # Manage bookings
│   │   └── content/              # CMS editor
│   └── api/
│       ├── chat/route.ts         # AI chatbot endpoint (Groq)
│       └── image/route.ts        # Signed URL proxy for private images
├── components/
│   ├── site/                     # Public-facing components
│   └── admin/                    # Admin UI components
├── actions/                      # Server Actions (auth, bookings, content)
└── lib/
    ├── types.ts                  # Shared TypeScript types
    ├── defaults.ts               # Default site content
    └── knowledge-base.ts         # AI chatbot system prompt builder
```

---

## Local Development

### Prerequisites
- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [Groq](https://console.groq.com) API key (free)

### 1. Clone and install

```bash
git clone https://github.com/Famanias/kamp-lambingan.git
cd kamp-lambingan
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GROQ_API_KEY=gsk_your-groq-api-key
```

### 3. Set up the database

Run the SQL in `bookings-table.sql` in the Supabase SQL Editor. This creates:
- `bookings` table with RLS policies
- `site_content` table (stores all CMS content as JSONB, including the GCash QR image URL)
- `app_settings` table (archive retention days)
- `receipts` storage bucket (public)
- `site-images` storage bucket (private, served via signed URL proxy)

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the public site.
Open [http://localhost:3000/admin](http://localhost:3000/admin) for the admin panel.

---

## Deployment

Deploy to [Vercel](https://vercel.com) and add the same environment variables under **Project Settings → Environment Variables**.

The site content (hero, packages, FAQs, GCash QR, etc.) is fully managed through the admin CMS — no redeployment needed when content changes.
