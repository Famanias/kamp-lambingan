import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServiceClient } from '@/lib/supabase/server';
import { getCapacityForDates } from '@/actions/bookings';

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

    // 6. Send verification email using Resend
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        const fromEmail = process.env.BOOKING_EMAIL || 'noreply@kamplambingan.site';

        await resend.emails.send({
          from: `Kamp Lambingan <${fromEmail}>`,
          to: emailStr,
          subject: 'Verify Your Booking Request',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
              <h2 style="color: #047857; margin-top: 0;">Hello! 🌿</h2>
              <p>Thank you for choosing Kamp Lambingan.</p>
              <p>Your booking verification code is:</p>
              <div style="background-color: #f3f4f6; border: 1px dashed #d1d5db; padding: 16px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 4px; text-align: center; color: #111827; margin: 20px 0;">
                ${verificationCode}
              </div>
              <p style="color: #ef4444; font-weight: 500;">This code will expire in 10 minutes.</p>
              <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">If you did not request this booking, you may safely ignore this email.</p>
              <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
              <p style="margin-bottom: 0;">Thank you,<br /><strong>Kamp Lambingan</strong></p>
            </div>
          `,
        });
      } catch (emailErr: any) {
        console.error('[API booking/start] Resend email failed:', emailErr);
        // We do not fail the request if email sending fails during local debugging/setup, but in prod we want to know
      }
    } else {
      console.warn('[API booking/start] RESEND_API_KEY not configured. Verification code is:', verificationCode);
    }

    return NextResponse.json({ sessionId: newSession.id });
  } catch (err: any) {
    console.error('[API booking/start] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
