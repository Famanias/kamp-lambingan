-- ============================================================
-- Kamp Lambingan - Bookings table + Storage setup
-- Run this in the Supabase SQL editor
-- ============================================================

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

-- If the table already exists, add the reference column:
-- ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS reference text UNIQUE;

-- Add payment type and amount columns (run if table already exists):
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'full' CHECK (payment_type IN ('full', 'downpayment'));
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS amount_due text;

-- Add archived_at to track when a booking was archived (for retention countdown):
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- App settings table (key/value store for admin-configurable settings)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key   text PRIMARY KEY,
  value text NOT NULL
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow admin all on app_settings" ON public.app_settings
  USING (true) WITH CHECK (true);
-- Default: archive retention = 7 days
INSERT INTO public.app_settings (key, value)
  VALUES ('archive_retention_days', '7')
  ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- Site content table (stores all editable site content as JSONB,
-- including gcashQrImage for the GCash QR code shown in the booking form)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.site_content (
  id         integer PRIMARY KEY,
  data       jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon / guests) to READ site content (needed to display QR on booking form)
CREATE POLICY "Allow public read site_content" ON public.site_content
  FOR SELECT
  TO anon
  USING (true);

-- Allow authenticated users (admin) to read site content
CREATE POLICY "Allow admin read site_content" ON public.site_content
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users (admin) to INSERT / UPDATE site content
CREATE POLICY "Allow admin upsert site_content" ON public.site_content
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Seed the default row so getContent() always finds id = 1
INSERT INTO public.site_content (id, data)
  VALUES (1, '{}'::jsonb)
  ON CONFLICT (id) DO NOTHING;

-- 2. Enable Row Level Security
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

-- Allow anyone (anon / guests) to INSERT a new booking
CREATE POLICY "Allow anon insert" ON public.bookings
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users (admin) to SELECT all bookings
CREATE POLICY "Allow admin select" ON public.bookings
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow anon users to SELECT their own bookings by email (for My Bookings page)
CREATE POLICY "Allow anon select own bookings" ON public.bookings
  FOR SELECT
  TO anon
  USING (true);

-- Allow authenticated users (admin) to UPDATE bookings (e.g. confirm/cancel)
CREATE POLICY "Allow admin update" ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to DELETE bookings (optional)
CREATE POLICY "Allow admin delete" ON public.bookings
  FOR DELETE
  TO authenticated
  USING (true);

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
-- Storage: Create the "receipts" bucket
-- ============================================================
-- Run this in the Supabase Dashboard → Storage → New Bucket:
--   Name: receipts
--   Public: YES (so receipt images can be displayed in admin)
--
-- Or via SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Allow anyone to upload (INSERT) into the receipts bucket
CREATE POLICY "Allow anon upload to receipts" ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'receipts');

-- Allow authenticated users to read all receipt objects
CREATE POLICY "Allow admin read receipts" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'receipts');

-- Allow public read of receipt objects (needed for public URL display)
CREATE POLICY "Allow public read receipts" ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id = 'receipts');

-- ============================================================
-- Storage: Create the "site-images" bucket
-- Used for: hero image, gallery images, villa photos,
--           and the GCash QR code uploaded via Admin → Payment
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-images', 'site-images', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users (admin) to upload site images
CREATE POLICY "Allow admin upload to site-images" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'site-images');

-- Allow authenticated users (admin) to update / replace site images
CREATE POLICY "Allow admin update site-images" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'site-images')
  WITH CHECK (bucket_id = 'site-images');

-- Allow authenticated users (admin) to delete site images
CREATE POLICY "Allow admin delete site-images" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'site-images');

-- Allow authenticated users to read site images (used by /api/image proxy)
CREATE POLICY "Allow admin read site-images" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'site-images');

-- Note: The /api/image route uses the service-role key to generate signed URLs,
-- so anon users do NOT need direct read access to this private bucket.

-- ============================================================
-- Verify
-- ============================================================
SELECT 'bookings table created' AS status;
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('bookings', 'site_content', 'app_settings');
SELECT id FROM storage.buckets WHERE id IN ('receipts', 'site-images');
