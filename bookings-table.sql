-- ============================================================
-- Kamp Lambingan - Bookings table + Storage setup
-- Run this in the Supabase SQL editor
-- ============================================================

-- Enable btree_gist extension for date overlap exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Create admins table for Role-Based Access Control
CREATE TABLE IF NOT EXISTS public.admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read admins" ON public.admins
  FOR SELECT TO authenticated USING (true);

-- 1. Create the bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_name    text NOT NULL,
  guest_email   text NOT NULL,
  guest_phone   text NOT NULL,
  package_name  text NOT NULL,
  check_in      date NOT NULL,
  check_out     date NOT NULL,
  pax           integer NOT NULL DEFAULT 1,
  notes         text,
  receipt_url   text,
  status        text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  reference     text UNIQUE,
  is_archived   boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Add payment type and amount columns (run if table already exists):
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'full' CHECK (payment_type IN ('full', 'downpayment'));
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS amount_due text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- Add database-level double-booking prevention constraint
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_date_overlap_exclude;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_date_overlap_exclude
EXCLUDE USING gist (
  daterange(check_in, check_out, '[]') WITH &&
) WHERE (status <> 'cancelled' AND is_archived = false);

-- App settings table (key/value store for admin-configurable settings)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key   text PRIMARY KEY,
  value text NOT NULL
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow admin all on app_settings" ON public.app_settings;
CREATE POLICY "Allow admin all on app_settings" ON public.app_settings
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM public.admins))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins));

-- Default: archive retention = 7 days
INSERT INTO public.app_settings (key, value)
  VALUES ('archive_retention_days', '7')
  ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- Site content table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.site_content (
  id         integer PRIMARY KEY,
  data       jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon / guests) to READ site content (needed to display QR on booking form)
DROP POLICY IF EXISTS "Allow public read site_content" ON public.site_content;
CREATE POLICY "Allow public read site_content" ON public.site_content
  FOR SELECT
  TO anon
  USING (true);

-- Allow authenticated users to read site content
DROP POLICY IF EXISTS "Allow admin read site_content" ON public.site_content;
CREATE POLICY "Allow admin read site_content" ON public.site_content
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to INSERT / UPDATE site content
DROP POLICY IF EXISTS "Allow admin upsert site_content" ON public.site_content;
CREATE POLICY "Allow admin upsert site_content" ON public.site_content
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM public.admins))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins));

-- Seed the default row so getContent() always finds id = 1
INSERT INTO public.site_content (id, data)
  VALUES (1, '{}'::jsonb)
  ON CONFLICT (id) DO NOTHING;

-- 2. Enable Row Level Security on bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for bookings

-- Allow anyone (anon / guests) to INSERT a new booking
DROP POLICY IF EXISTS "Allow anon insert" ON public.bookings;
CREATE POLICY "Allow anon insert" ON public.bookings
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow admins to SELECT bookings
DROP POLICY IF EXISTS "Allow admin select" ON public.bookings;
CREATE POLICY "Allow admin select" ON public.bookings
  FOR SELECT
  TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM public.admins));

-- Remove public anon select policy
DROP POLICY IF EXISTS "Allow anon select own bookings" ON public.bookings;

-- Allow admins to UPDATE bookings
DROP POLICY IF EXISTS "Allow admin update" ON public.bookings;
CREATE POLICY "Allow admin update" ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM public.admins))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins));

-- Allow admins to DELETE bookings
DROP POLICY IF EXISTS "Allow admin delete" ON public.bookings;
CREATE POLICY "Allow admin delete" ON public.bookings
  FOR DELETE
  TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM public.admins));

-- 4. Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_updated_at ON public.bookings;
CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Storage: Create the "receipts" bucket (PRIVATE)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Clean up public select policy for receipts
DROP POLICY IF EXISTS "Allow public read receipts" ON storage.objects;

-- Storage RLS: Allow anyone to upload (INSERT) into the receipts bucket
DROP POLICY IF EXISTS "Allow anon upload to receipts" ON storage.objects;
CREATE POLICY "Allow anon upload to receipts" ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'receipts');

-- Allow admins to read receipt objects
DROP POLICY IF EXISTS "Allow admin read receipts" ON storage.objects;
CREATE POLICY "Allow admin read receipts" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'receipts' AND auth.uid() IN (SELECT user_id FROM public.admins));

-- ============================================================
-- Storage: Create the "site-images" bucket (PRIVATE)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-images', 'site-images', false)
ON CONFLICT (id) DO NOTHING;

-- Allow admins to upload site images
DROP POLICY IF EXISTS "Allow admin upload to site-images" ON storage.objects;
CREATE POLICY "Allow admin upload to site-images" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'site-images' AND auth.uid() IN (SELECT user_id FROM public.admins));

-- Allow admins to update / replace site images
DROP POLICY IF EXISTS "Allow admin update site-images" ON storage.objects;
CREATE POLICY "Allow admin update site-images" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'site-images' AND auth.uid() IN (SELECT user_id FROM public.admins))
  WITH CHECK (bucket_id = 'site-images' AND auth.uid() IN (SELECT user_id FROM public.admins));

-- Allow admins to delete site images
DROP POLICY IF EXISTS "Allow admin delete site-images" ON storage.objects;
CREATE POLICY "Allow admin delete site-images" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'site-images' AND auth.uid() IN (SELECT user_id FROM public.admins));

-- Allow admins to read site images
DROP POLICY IF EXISTS "Allow admin read site-images" ON storage.objects;
CREATE POLICY "Allow admin read site-images" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'site-images' AND auth.uid() IN (SELECT user_id FROM public.admins));

-- Verify
SELECT 'bookings schema version 2 setup completed' AS status;
