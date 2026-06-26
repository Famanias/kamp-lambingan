import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServiceClient } from '@/lib/supabase/server';
import { getCapacityForDates } from '@/actions/bookings';
import { getContent } from '@/actions/content';
import { getSelectedPackage } from '@/lib/package-helper';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, chatSessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId.' },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // 1. Retrieve the verification session
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

    // 2. Check if verified
    if (!session.verified) {
      return NextResponse.json(
        { error: 'Email address has not been verified yet.' },
        { status: 400 }
      );
    }

    const booking_session = session.booking_session as any;

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
    } = booking_session;

    // 3. Final Capacity Check
    const capacityDetails = await getCapacityForDates(check_in, check_out);
    if (capacityDetails.length === 0) {
      return NextResponse.json({ error: 'Invalid date range.' }, { status: 400 });
    }

    const maxGuestsAllowed = capacityDetails.reduce((min, d) => Math.min(min, d.remainingCapacity), Infinity);
    if (maxGuestsAllowed < pax) {
      return NextResponse.json(
        { error: `Not enough capacity on the requested dates. Only ${maxGuestsAllowed} spots left.` },
        { status: 400 }
      );
    }

    // 4. Validate package metadata & calculate amount due on the server
    let amountDue = '';
    try {
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

      const priceNum = typeof selectedPkg.price === 'number' 
        ? selectedPkg.price 
        : (parseInt((selectedPkg.price as any).replace(/[^\d]/g, ''), 10) || 0);
      const amountDueNum = payment_type === 'full' ? priceNum : Math.ceil(priceNum / 2);
      amountDue = amountDueNum > 0 ? '₱' + amountDueNum.toLocaleString('en-PH') : '';
    } catch (err) {
      console.error('[API booking/complete] validation/pricing calculation failed:', err);
      return NextResponse.json({ error: 'Pricing/capacity validation failed.' }, { status: 500 });
    }

    // 5. Generate Reference Code (CSPRNG)
    const reference = 'KL-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    // 6. Insert Booking via RPC
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('create_booking_safe', {
        p_guest_name: guest_name,
        p_guest_email: guest_email,
        p_guest_phone: guest_phone,
        p_package_name: package_name,
        p_check_in: check_in,
        p_check_out: check_out,
        p_pax: pax,
        p_notes: notes ?? null,
        p_reference: reference,
        p_payment_type: payment_type,
        p_amount_due: amountDue ?? null,
      });

    if (rpcError) {
      console.error('[API booking/complete] RPC error:', rpcError.message);
      return NextResponse.json(
        { error: 'Failed to complete booking. Please try again.' },
        { status: 500 }
      );
    }

    const resultObj = rpcResult as { success: boolean; id?: string; error?: string };
    if (!resultObj.success) {
      return NextResponse.json(
        { error: resultObj.error || 'Failed to complete booking.' },
        { status: 400 }
      );
    }

    const bookingId = resultObj.id!;

    // 7. Delete the verification session since booking is successfully created
    await supabase
      .from('booking_verifications')
      .delete()
      .eq('id', sessionId);

    // 8. Send confirmation emails via Resend
    if (process.env.RESEND_API_KEY) {
      try {
        const safeName = escapeHtml(guest_name);
        const safePackage = escapeHtml(package_name);
        const safePhone = escapeHtml(guest_phone);
        const safeNotes = notes ? escapeHtml(notes) : '';
        const safeAmountDue = amountDue ? escapeHtml(amountDue) : '';

        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const fromEmail = process.env.BOOKING_EMAIL || 'noreply@kamplambingan.site';

        // Guest Email
        await resend.emails.send({
          from: `Kamp Lambingan <${fromEmail}>`,
          to: guest_email,
          subject: 'We received your booking request!',
          html: `
            <h2>Hi ${safeName}! 🌿</h2>
            <p>We received your booking request for <strong>${safePackage}</strong>.</p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:8px;margin:16px 0;">
              <p style="margin:0 0 4px 0;font-size:12px;color:#6b7280;">Your Booking Reference</p>
              <p style="margin:0;font-size:24px;font-weight:bold;letter-spacing:2px;color:#166534;">${reference}</p>
            </div>
            <p>Keep this reference handy — you can use it to check your booking status anytime at <a href="${siteUrl}/my-bookings">${siteUrl}/my-bookings</a>.</p>
            <p><strong>Check-in:</strong> ${check_in}</p>
            <p><strong>Check-out:</strong> ${check_out}</p>
            <p><strong>Guests:</strong> ${pax}</p>
            <p><strong>Payment:</strong> ${payment_type === 'downpayment' ? `Downpayment (50%)` : 'Full Payment'}${safeAmountDue ? ` — <strong>${safeAmountDue}</strong>` : ''}</p>
            <p>Our team will <strong>text or call you</strong> on <strong>${safePhone}</strong> within 24 hours to confirm your booking. Please keep your phone on!</p>
            <p>Questions? Message us on <a href="https://www.facebook.com/kamplambingan">Facebook</a>.</p>
            <p>— Kamp Lambingan Team</p>
          `,
        });

        // Admin Notification
        if (process.env.ADMIN_EMAIL) {
          await resend.emails.send({
            from: `Kamp Lambingan <${fromEmail}>`,
            to: process.env.ADMIN_EMAIL,
            subject: `New booking from ${safeName}`,
            html: `
              <h2>New Booking Request</h2>
              <p><strong>Name:</strong> ${safeName}</p>
              <p><strong>Email:</strong> ${guest_email}</p>
              <p><strong>Phone:</strong> ${safePhone}</p>
              <p><strong>Package:</strong> ${safePackage}</p>
              <p><strong>Check-in:</strong> ${check_in}</p>
              <p><strong>Check-out:</strong> ${check_out}</p>
              <p><strong>Guests:</strong> ${pax}</p>
              <p><strong>Payment:</strong> ${payment_type === 'downpayment' ? 'Downpayment (50%)' : 'Full Payment'}${safeAmountDue ? ` — ${safeAmountDue}` : ''}</p>
              ${safeNotes ? `<p><strong>Notes:</strong> ${safeNotes}</p>` : ''}
              <p><a href="${siteUrl}/admin/bookings/${bookingId}">View booking →</a></p>
            `,
          });
        }
      } catch (emailErr) {
        console.error('[API booking/complete] email sending failed:', emailErr);
      }
    }

    // 9. Update chat session in Supabase if chatSessionId is provided
    if (chatSessionId) {
      try {
        const { data: currentSession } = await supabase
          .from('chat_sessions')
          .select('state')
          .eq('session_id', chatSessionId)
          .maybeSingle();

        const mergedState = {
          ...(currentSession?.state || {}),
          guest_name,
          guest_email,
          guest_phone,
          package_name,
          check_in,
          check_out,
          pax,
          payment_type,
          notes,
          reference,
          amount_due: amountDue,
          booking_completed: true,
        };

        const nowStr = new Date().toISOString();
        const expiresAtStr = new Date(Date.now() + 30 * 60 * 1000).toISOString();

        await supabase
          .from('chat_sessions')
          .update({
            state: mergedState,
            current_stage: 'completed',
            updated_at: nowStr,
            expires_at: expiresAtStr,
          })
          .eq('session_id', chatSessionId);
      } catch (err) {
        console.error('[API booking/complete] Failed to update chat session:', err);
      }
    }

    return NextResponse.json({
      success: true,
      reference,
      amount_due: amountDue,
      booking_id: bookingId,
    });
  } catch (err: any) {
    console.error('[API booking/complete] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
