import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, code } = body;

    if (!sessionId || !code) {
      return NextResponse.json(
        { error: 'Missing sessionId or verification code.' },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // Query session
    const { data: session, error: dbError } = await supabase
      .from('booking_verifications')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (dbError || !session) {
      return NextResponse.json(
        { error: 'Verification session not found.' },
        { status: 404 }
      );
    }

    const now = new Date();
    const expiresAt = new Date(session.expires_at);

    // Check expiration
    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'Verification session has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    // Check attempts limit
    if (session.verification_attempts >= 5) {
      return NextResponse.json(
        { error: 'Maximum attempts reached. This session is now invalid. Please request a new code.' },
        { status: 400 }
      );
    }

    // Check if already verified
    if (session.verified) {
      return NextResponse.json(
        { error: 'Email has already been verified for this session.' },
        { status: 400 }
      );
    }

    const inputCode = code.trim();
    const expectedCode = session.verification_code.trim();

    if (inputCode === expectedCode) {
      // Correct code: mark verified
      const { error: updateError } = await supabase
        .from('booking_verifications')
        .update({ verified: true })
        .eq('id', sessionId);

      if (updateError) {
        console.error('[API booking/verify] update verified error:', updateError.message);
        return NextResponse.json(
          { error: 'Failed to complete verification.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Email verified successfully.',
      });
    } else {
      // Incorrect code: increment attempts
      const newAttempts = session.verification_attempts + 1;
      const shouldExpire = newAttempts >= 5;

      const updateData: any = { verification_attempts: newAttempts };
      if (shouldExpire) {
        // Expire immediately
        updateData.expires_at = now.toISOString();
      }

      await supabase
        .from('booking_verifications')
        .update(updateData)
        .eq('id', sessionId);

      const attemptsRemaining = Math.max(0, 5 - newAttempts);
      const errMsg = shouldExpire
        ? 'Incorrect verification code. Maximum attempts reached. This session is now invalid.'
        : `Incorrect verification code. ${attemptsRemaining} attempt(s) remaining.`;

      return NextResponse.json(
        { success: false, error: errMsg, attemptsRemaining },
        { status: 400 }
      );
    }
  } catch (err: any) {
    console.error('[API booking/verify] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
