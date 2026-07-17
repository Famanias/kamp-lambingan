import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session ID.' }, { status: 400 });
    }

    const supabase = getServiceClient();

    // 1. Fetch validated payload from OTP session
    const { data: sessionData, error: sessionError } = await supabase
      .from('booking_verifications')
      .select('booking_session, verified')
      .eq('id', sessionId)
      .single();

    if (sessionError || !sessionData) {
      return NextResponse.json({ error: 'Invalid or expired session.' }, { status: 400 });
    }

    if (!sessionData.verified) {
      return NextResponse.json({ error: 'Email has not been verified.' }, { status: 403 });
    }

    const payload = sessionData.booking_session;

    // 2. Reserve Slot via Supabase RPC
    const { data: bookingData, error: rpcError } = await supabase.rpc('create_pending_booking', {
      p_guest_name: payload.guest_name,
      p_guest_email: payload.guest_email,
      p_guest_phone: payload.guest_phone,
      p_package_name: payload.package_name,
      p_check_in: payload.check_in,
      p_check_out: payload.check_out,
      p_pax: payload.pax,
      p_payment_type: payload.payment_type,
      p_notes: payload.notes || null
    });

    if (rpcError || !bookingData) {
      console.error('[API booking/checkout] Failed to reserve booking slot:', rpcError);
      return NextResponse.json({ error: 'Failed to reserve booking slot. The dates might no longer be available.' }, { status: 400 });
    }

    // The RPC should return the booking ID, reference, and expiresAt.
    const { id: bookingId, reference: bookingReference, expires_at: expiresAt } = bookingData;

    // 3. Forward to n8n to generate Stripe Checkout URL
    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (!n8nUrl) {
      return NextResponse.json({ error: 'Booking system is currently offline (Webhook missing).' }, { status: 503 });
    }

    // Pass the payload AND the new booking identifiers to n8n
    const n8nPayload = { ...payload, bookingId, bookingReference, expiresAt };
    const res = await fetch(n8nUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(n8nPayload)
    });

    if (!res.ok) {
      // Optionally clean up the pending booking if n8n totally fails to respond
      console.error('[API booking/checkout] n8n failed. Webhook returned:', res.statusText);
      return NextResponse.json({ error: 'Failed to generate checkout link.' }, { status: 500 });
    }

    const n8nData = await res.json();
    
    // 4. Return full payload to frontend
    return NextResponse.json({ 
      success: true,
      bookingId,
      bookingReference,
      checkoutUrl: n8nData.checkoutUrl,
      expiresAt,
      status: 'awaiting_payment'
    });

  } catch (err: any) {
    console.error('[API booking/checkout] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
