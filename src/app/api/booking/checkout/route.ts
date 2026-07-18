import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { getContent } from '@/actions/content';

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

    // 2. Fetch site content early to calculate price
    const siteContent = await getContent();
    const packageConfig = siteContent.packages.find(
      (p) => p.name === payload.package_name
    );

    const baseUrl = packageConfig?.stripePaymentLink;
    if (!baseUrl) {
      console.error('[API booking/checkout] Missing Stripe Payment Link for package:', payload.package_name);
      return NextResponse.json({ error: 'Checkout link is not configured for this package.' }, { status: 500 });
    }

    const rawPrice = packageConfig?.price as string | number | undefined;
    const priceNum = rawPrice
      ? (typeof rawPrice === 'number' ? rawPrice : parseInt(rawPrice.replace(/[^\d]/g, ''), 10) || 0)
      : 0;
    
    const amountDue = payload.payment_type === 'full' ? priceNum : Math.ceil(priceNum / 2);
    
    // Generate a unique 6-character reference (e.g. KL-X7B9TQ)
    const reference = 'KL-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // 3. Reserve Slot via Supabase RPC
    const { data: bookingData, error: rpcError } = await supabase.rpc('create_pending_booking', {
      p_guest_name: payload.guest_name,
      p_guest_email: payload.guest_email,
      p_guest_phone: payload.guest_phone,
      p_package_name: payload.package_name,
      p_check_in: payload.check_in,
      p_check_out: payload.check_out,
      p_pax: payload.pax,
      p_payment_type: payload.payment_type,
      p_notes: payload.notes || null,
      p_amount_due: amountDue.toString(),
      p_reference: reference
    });

    if (rpcError || !bookingData) {
      console.error('[API booking/checkout] Failed to reserve booking slot:', rpcError);
      return NextResponse.json({ error: 'Failed to reserve booking slot. The dates might no longer be available.' }, { status: 400 });
    }

    // The RPC should return the booking ID.
    // Since we generate the reference here, we can just use it directly!
    const bookingId = bookingData.id || bookingData;

    // 4. Generate Stripe Payment Link URL
    const checkoutUrl = `${baseUrl}?client_reference_id=${bookingId}&prefilled_email=${encodeURIComponent(payload.guest_email)}`;
    
    // 4. Return full payload to frontend
    return NextResponse.json({ 
      success: true,
      bookingId,
      bookingReference: reference,
      checkoutUrl,
      status: 'awaiting_payment'
    });

  } catch (err: any) {
    console.error('[API booking/checkout] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
