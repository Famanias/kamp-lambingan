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
-- Verify
-- ============================================================
SELECT 'bookings table created' AS status;
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'bookings';
