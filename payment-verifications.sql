-- ============================================================
-- Kamp Lambingan - AI Payment Verification Schema Migration
-- Run this in the Supabase SQL editor
-- ============================================================

-- 1. Create the payment_verifications table
CREATE TABLE IF NOT EXISTS public.payment_verifications (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id             UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    provider               TEXT NOT NULL,
    receipt_type           TEXT,
    amount                 NUMERIC(10,2),
    currency               TEXT,
    sender_number          TEXT,
    receiver_number        TEXT,
    sender_name            TEXT,
    receiver_name          TEXT,
    transaction_datetime   TIMESTAMPTZ,
    transaction_reference  TEXT UNIQUE,
    ocr_confidence         NUMERIC,
    parser_confidence      NUMERIC,
    verification_status    TEXT NOT NULL 
                           CHECK (verification_status IN ('pending', 'processing', 'verified', 'failed', 'manual_review')),
    verification_reason    TEXT,
    raw_ocr                JSONB,
    parsed_payment         JSONB,
    ocr_service_version    TEXT,
    parser_version         TEXT,
    retry_count            INTEGER NOT NULL DEFAULT 0,
    verified_at            TIMESTAMPTZ,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.payment_verifications ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policy: Allow admins full access (SELECT, INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Allow admin all on payment_verifications" ON public.payment_verifications;
CREATE POLICY "Allow admin all on payment_verifications" ON public.payment_verifications
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

-- 4. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_payment_verifications_booking_id ON public.payment_verifications(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_verifications_transaction_reference ON public.payment_verifications(transaction_reference);

-- 5. Seed default confidence thresholds inside app_settings
INSERT INTO public.app_settings (key, value)
  VALUES ('ocr_confidence_threshold', '0.75')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO public.app_settings (key, value)
  VALUES ('parser_confidence_threshold', '0.80')
  ON CONFLICT (key) DO NOTHING;

-- 6. Migrate bookings.amount_due from TEXT to NUMERIC(10,2)
-- Strip currency symbol (₱) and commas before casting to numeric
ALTER TABLE public.bookings ALTER COLUMN amount_due TYPE numeric(10,2) USING (
  NULLIF(regexp_replace(amount_due, '[^\d.]', '', 'g'), '')::numeric
);

-- 7. Update create_booking_safe RPC to accept numeric amount_due
-- First drop the legacy function signature
DROP FUNCTION IF EXISTS public.create_booking_safe(text, text, text, text, date, date, integer, text, text, text, text);

-- Re-create the function with p_amount_due numeric
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
  p_amount_due numeric
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

SELECT 'payment verifications schema setup completed' AS status;
