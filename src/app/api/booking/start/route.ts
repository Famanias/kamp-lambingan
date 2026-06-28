import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServiceClient } from '@/lib/supabase/server';
import { getCapacityForDates } from '@/actions/bookings';
import { getContent } from '@/actions/content';
import { getSelectedPackage } from '@/lib/package-helper';
import { sendVerificationCodeEmail } from '@/lib/email/booking-notifications';

// In-memory rate limiting map for IP rate limit
const ipLimits = new Map<string, { count: number; resetAt: number }>();
const IP_LIMIT_MAX = 10;
const IP_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isIpRateLimited(ip: string): boolean {
  const now = Date.now();
  const limit = ipLimits.get(ip);

  if (!limit || now > limit.resetAt) {
    ipLimits.set(ip, { count: 1, resetAt: now + IP_LIMIT_WINDOW_MS });
    return false;
  }

  limit.count++;
  if (limit.count > IP_LIMIT_MAX) {
    return true;
  }
  return false;
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
    if (isIpRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many booking attempts from this IP. Please try again in an hour.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const {
      guest_name,
      guest_email,
      guest_phone,
      package_name,
      check_in,
      check_out,
      pax,
      payment_type,
      notes,
    } = body;

    // Validate inputs
    if (!guest_name || !guest_email || !guest_phone || !package_name || !check_in || !check_out || !pax || !payment_type) {
      return NextResponse.json(
        { error: 'Missing required booking details.' },
        { status: 400 }
      );
    }

    const emailStr = guest_email.toLowerCase().trim();

    const supabase = getServiceClient();

    // 1. Clean up expired verification sessions
    await supabase
      .from('booking_verifications')
      .delete()
      .lt('expires_at', new Date().toISOString());

    // 2. Throttle verification emails: 1 email per 60 seconds per email address
    const { data: recentSessions } = await supabase
      .from('booking_verifications')
      .select('created_at')
      .eq('email', emailStr)
      .gt('created_at', new Date(Date.now() - 60 * 1000).toISOString())
      .limit(1);

    if (recentSessions && recentSessions.length > 0) {
      return NextResponse.json(
        { error: 'Please wait 60 seconds before requesting another verification code.' },
        { status: 429 }
      );
    }

    // Validate package constraints on the server
    const siteContent = await getContent();
    const selectedPkg = getSelectedPackage(package_name, siteContent.packages);
    if (!selectedPkg) {
      return NextResponse.json({ error: 'Selected package is invalid.' }, { status: 400 });
    }
    
    // Validate guest capacity
    if (pax > selectedPkg.capacity) {
      return NextResponse.json(
        { error: `Guest count (${pax}) exceeds the selected package capacity of ${selectedPkg.capacity}.` },
        { status: 400 }
      );
    }
    if (pax < 1) {
      return NextResponse.json({ error: 'Guest count must be at least 1.' }, { status: 400 });
    }

    // Validate stay duration
    const checkInDate = new Date(check_in + 'T00:00:00');
    const checkOutDate = new Date(check_out + 'T00:00:00');
    const diffTime = checkOutDate.getTime() - checkInDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      return NextResponse.json({ error: 'Check-out must be after check-in.' }, { status: 400 });
    }
    if (diffDays > selectedPkg.maxStayDays) {
      return NextResponse.json(
        { error: `Stay duration exceeds the maximum stay limit of ${selectedPkg.maxStayDays} days for this package.` },
        { status: 400 }
      );
    }
    if (selectedPkg.maxStayDays === 1 && diffDays !== 1) {
      return NextResponse.json({ error: 'Single-night package requires exactly a 1-night stay.' }, { status: 400 });
    }

    // 3. Check capacity
    const capacityDetails = await getCapacityForDates(check_in, check_out);
    if (capacityDetails.length === 0) {
      return NextResponse.json({ error: 'Invalid date range.' }, { status: 400 });
    }

    const maxGuestsAllowed = capacityDetails.reduce((min, d) => Math.min(min, d.remainingCapacity), Infinity);
    if (maxGuestsAllowed < pax) {
      return NextResponse.json(
        { error: `Not enough capacity. Only ${maxGuestsAllowed} spots left.` },
        { status: 400 }
      );
    }

    // 4. Generate 6-digit code
    const verificationCode = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // 5. Store session in Supabase
    const bookingSession = {
      guest_name,
      guest_email: emailStr,
      guest_phone,
      package_name,
      check_in,
      check_out,
      pax,
      payment_type,
      notes: notes || null,
    };

    const { data: newSession, error: dbError } = await supabase
      .from('booking_verifications')
      .insert({
        email: emailStr,
        verification_code: verificationCode,
        booking_session: bookingSession,
        expires_at: expiresAt,
        verified: false,
      })
      .select('id')
      .single();

    if (dbError || !newSession) {
      console.error('[API booking/start] DB insert error:', dbError?.message);
      return NextResponse.json(
        { error: 'Failed to create booking verification session.' },
        { status: 500 }
      );
    }

    // 6. Send verification email using centralized notification service
    await sendVerificationCodeEmail(emailStr, verificationCode);

    return NextResponse.json({ sessionId: newSession.id });
  } catch (err: any) {
    console.error('[API booking/start] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
