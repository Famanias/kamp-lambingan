-- ============================================================
-- Booking Capacity System Schema Update
-- Run this in the Supabase SQL editor
-- ============================================================

-- Create the date_capacities table
CREATE TABLE IF NOT EXISTS public.date_capacities (
  date          date PRIMARY KEY,
  max_capacity  integer NOT NULL CHECK (max_capacity >= 0)
);

-- Enable RLS
ALTER TABLE public.date_capacities ENABLE ROW LEVEL SECURITY;

-- Allow public read (anon and authenticated)
DROP POLICY IF EXISTS "Allow public read date_capacities" ON public.date_capacities;
CREATE POLICY "Allow public read date_capacities"
ON public.date_capacities
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow admins all operations
DROP POLICY IF EXISTS "Allow admin all date_capacities" ON public.date_capacities;
CREATE POLICY "Allow admin all date_capacities"
ON public.date_capacities
FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM public.admins
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.admins
  )
);

-- Drop the legacy single-booking exclusion constraint if it exists,
-- as capacity limits are now managed dynamically via public.create_booking_safe()
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_date_overlap_exclude;

-- Add status_reason column if not exists
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS status_reason text;

-- Add 'expired' status constraint to bookings table status column if needed.
-- The existing CHECK constraint is: CHECK (status IN ('pending', 'confirmed', 'cancelled'))

-- To support 'expired' status, we need to update this constraint.
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'expired'));

-- Concurrency-safe atomic insert function
CREATE OR REPLACE FUNCTION public.create_booking_safe(
  p_guest_name text,
  p_guest_email text,
  p_guest_phone text,
  p_package_name text,
  p_check_in date,
  p_check_out date,
  p_pax integer,
  p_notes text,
  p_reference text,
  p_payment_type text,
  p_amount_due text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_date date;
  v_max_capacity integer;
  v_booked_guests integer;
  v_booking_id uuid;
BEGIN
  -- 1. Exclusively lock the bookings table to prevent any concurrent insertions
  LOCK TABLE public.bookings IN EXCLUSIVE MODE;

  -- 2. Validate capacity date-by-date
  FOR v_date IN 
    SELECT generate_series(p_check_in, p_check_out - interval '1 day', interval '1 day')::date
  LOOP
    -- Get max capacity for this date (defaults to 50)
    SELECT COALESCE(
      (SELECT max_capacity FROM public.date_capacities WHERE date = v_date),
      50
    ) INTO v_max_capacity;

    -- Calculate booked guests for this date
    SELECT COALESCE(
      SUM(pax),
      0
    ) INTO v_booked_guests
    FROM public.bookings
    WHERE status <> 'cancelled'
      AND status <> 'expired'
      AND is_archived = false
      AND check_in <= v_date
      AND check_out > v_date;

    -- Check if remaining capacity is enough
    IF (v_max_capacity - v_booked_guests) < p_pax THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Not enough capacity on ' || v_date::text || '. Only ' || (v_max_capacity - v_booked_guests)::text || ' spots left.'
      );
    END IF;
  END LOOP;

  -- 3. Perform the insert
  INSERT INTO public.bookings (
    guest_name,
    guest_email,
    guest_phone,
    package_name,
    check_in,
    check_out,
    pax,
    notes,
    status,
    reference,
    payment_type,
    amount_due
  ) VALUES (
    p_guest_name,
    p_guest_email,
    p_guest_phone,
    p_package_name,
    p_check_in,
    p_check_out,
    p_pax,
    p_notes,
    'pending',
    p_reference,
    p_payment_type,
    p_amount_due
  )
  RETURNING id INTO v_booking_id;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_booking_id
  );
END;
$$;