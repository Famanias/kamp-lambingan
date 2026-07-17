import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServiceClient } from '@/lib/supabase/server';
import { sendVerificationCodeEmail } from '@/lib/email/booking-notifications';

const ipLimits = new Map<string, { count: number; resetAt: number }>();
const IP_LIMIT_MAX = 10;
const IP_LIMIT_WINDOW_MS = 60 * 60 * 1000;

function isIpRateLimited(ip: string): boolean {
  const now = Date.now();
  const limit = ipLimits.get(ip);
  if (!limit || now > limit.resetAt) {
    ipLimits.set(ip, { count: 1, resetAt: now + IP_LIMIT_WINDOW_MS });
    return false;
  }
  limit.count++;
  return limit.count > IP_LIMIT_MAX;
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
    if (isIpRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
    }

    const body = await req.json();
    const {
      guest_name, guest_email, guest_phone, package_name,
      check_in, check_out, pax, payment_type, notes
    } = body;

    if (!guest_name || !guest_email || !guest_phone || !package_name || !check_in || !check_out || !pax || !payment_type) {
      return NextResponse.json({ error: 'Missing required booking details.' }, { status: 400 });
    }

    const emailStr = guest_email.toLowerCase().trim();
    const supabase = getServiceClient();

    await supabase.from('booking_verifications').delete().lt('expires_at', new Date().toISOString());

    const { data: recentSessions } = await supabase
      .from('booking_verifications')
      .select('created_at')
      .eq('email', emailStr)
      .gt('created_at', new Date(Date.now() - 60 * 1000).toISOString())
      .limit(1);

    if (recentSessions && recentSessions.length > 0) {
      return NextResponse.json({ error: 'Please wait 60 seconds.' }, { status: 429 });
    }

    // Capacity check via RPC
    const { data: isAvailable } = await supabase.rpc('check_booking_availability', {
      p_check_in: check_in, p_check_out: check_out, p_pax: Number(pax)
    });
    if (!isAvailable) {
      return NextResponse.json({ error: 'Selected dates are no longer available for this capacity.' }, { status: 400 });
    }

    const verificationCode = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const bookingSession = {
      guest_name, guest_email: emailStr, guest_phone, package_name,
      check_in, check_out, pax, payment_type, notes: notes || null,
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
      return NextResponse.json({ error: 'Failed to create verification session.' }, { status: 500 });
    }

    await sendVerificationCodeEmail(emailStr, verificationCode);
    return NextResponse.json({ sessionId: newSession.id });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
