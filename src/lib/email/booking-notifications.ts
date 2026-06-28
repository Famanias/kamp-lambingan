'use server';

import type { CreateEmailOptions } from 'resend';

interface BookingNotificationPayload {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  packageName: string;
  checkIn: string;
  checkOut: string;
  pax: number;
  paymentType: 'full' | 'downpayment';
  amountDue?: string;
  reference?: string;
  bookingId?: string;
  notes?: string | null;
}

const DEFAULT_FROM_EMAIL = process.env.BOOKING_EMAIL
  ? `Kamp Lambingan <${process.env.BOOKING_EMAIL}>`
  : (process.env.RESEND_FROM_EMAIL || 'Kamp Lambingan <onboarding@resend.dev>');
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }

  try {
    const { Resend } = await import('resend');
    return new Resend(process.env.RESEND_API_KEY);
  } catch (err) {
    console.error('[booking-notifications] Failed to load Resend client:', err);
    return null;
  }
}

async function sendEmail(options: CreateEmailOptions) {
  const resend = await getResendClient();
  if (!resend) {
    console.warn('[booking-notifications] RESEND_API_KEY not configured. Skipping email:', options.subject);
    return;
  }

  try {
    const { data, error } = await resend.emails.send(options);
    if (error) {
      console.error('[booking-notifications] Resend API error sending email:', error, options.subject);
    } else {
      console.log('[booking-notifications] Email sent successfully:', data?.id, options.subject);
    }
  } catch (err) {
    console.error('[booking-notifications] Email send failed (exception):', err, options.subject);
  }
}

export async function sendVerificationCodeEmail(email: string, code: string) {
  const safeEmail = escapeHtml(email);
  await sendEmail({
    from: DEFAULT_FROM_EMAIL,
    to: email,
    subject: 'Verify Your Booking Request',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #047857; margin-top: 0;">Hello! 🌿</h2>
        <p>Thank you for choosing Kamp Lambingan.</p>
        <p>Your booking verification code is:</p>
        <div style="background-color: #f3f4f6; border: 1px dashed #d1d5db; padding: 16px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 4px; text-align: center; color: #111827; margin: 20px 0;">
          ${escapeHtml(code)}
        </div>
        <p style="color: #ef4444; font-weight: 500;">This code will expire in 10 minutes.</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">If you did not request this booking, you may safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="margin-bottom: 0;">Thank you,<br /><strong>Kamp Lambingan</strong></p>
      </div>
    `,
  });
}

export async function sendBookingReceivedEmail(payload: BookingNotificationPayload) {
  const safeName = escapeHtml(payload.guestName);
  const safePackage = escapeHtml(payload.packageName);
  const safePhone = escapeHtml(payload.guestPhone);
  const safeNotes = payload.notes ? escapeHtml(payload.notes) : '';
  const safeAmountDue = payload.amountDue ? escapeHtml(payload.amountDue) : '';
  const safeReference = payload.reference ? escapeHtml(payload.reference) : '';
  const siteLink = `${SITE_URL}/my-bookings`;
  const bookingLink = payload.bookingId ? `${SITE_URL}/admin/bookings/${payload.bookingId}` : siteLink;

  await sendEmail({
    from: DEFAULT_FROM_EMAIL,
    to: payload.guestEmail,
    subject: 'We received your booking request!',
    html: `
      <h2>Hi ${safeName}! 🌿</h2>
      <p>We received your booking request for <strong>${safePackage}</strong>.</p>
      ${safeReference ? `
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:8px;margin:16px 0;">
          <p style="margin:0 0 4px 0;font-size:12px;color:#6b7280;">Your Booking Reference</p>
          <p style="margin:0;font-size:24px;font-weight:bold;letter-spacing:2px;color:#166534;">${safeReference}</p>
        </div>
      ` : ''}
      <p>Keep this reference handy — you can use it to check your booking status anytime at <a href="${siteLink}">${siteLink}</a>.</p>
      <p><strong>Check-in:</strong> ${escapeHtml(payload.checkIn)}</p>
      <p><strong>Check-out:</strong> ${escapeHtml(payload.checkOut)}</p>
      <p><strong>Guests:</strong> ${payload.pax}</p>
      <p><strong>Payment:</strong> ${payload.paymentType === 'downpayment' ? 'Downpayment (50%)' : 'Full Payment'}${safeAmountDue ? ` — <strong>${safeAmountDue}</strong>` : ''}</p>
      <p>Our team will <strong>text or call you</strong> on <strong>${safePhone}</strong> within 24 hours to confirm your booking. Please keep your phone on!</p>
      <p>Questions? Message us on <a href="https://www.facebook.com/kamplambingan">Facebook</a>.</p>
      <p>— Kamp Lambingan Team</p>
    `,
  });

  if (ADMIN_EMAIL) {
    await sendEmail({
      from: DEFAULT_FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `New booking from ${safeName}`,
      html: `
        <h2>New Booking Request</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${escapeHtml(payload.guestEmail)}</p>
        <p><strong>Phone:</strong> ${safePhone}</p>
        <p><strong>Package:</strong> ${safePackage}</p>
        <p><strong>Check-in:</strong> ${escapeHtml(payload.checkIn)}</p>
        <p><strong>Check-out:</strong> ${escapeHtml(payload.checkOut)}</p>
        <p><strong>Guests:</strong> ${payload.pax}</p>
        <p><strong>Payment:</strong> ${payload.paymentType === 'downpayment' ? 'Downpayment (50%)' : 'Full Payment'}${safeAmountDue ? ` — ${safeAmountDue}` : ''}</p>
        ${safeNotes ? `<p><strong>Notes:</strong> ${safeNotes}</p>` : ''}
        <p><a href="${bookingLink}">View booking →</a></p>
      `,
    });
  }
}

export async function sendBookingConfirmedEmail(payload: BookingNotificationPayload) {
  await sendEmail({
    from: DEFAULT_FROM_EMAIL,
    to: payload.guestEmail,
    subject: 'Your booking has been confirmed',
    html: `
      <h2>Hi ${escapeHtml(payload.guestName)}!</h2>
      <p>Your booking for <strong>${escapeHtml(payload.packageName)}</strong> is now confirmed.</p>
      <p><strong>Check-in:</strong> ${escapeHtml(payload.checkIn)}</p>
      <p><strong>Check-out:</strong> ${escapeHtml(payload.checkOut)}</p>
      <p><strong>Booking Reference:</strong> ${escapeHtml(payload.reference ?? '')}</p>
      <p>See your booking details anytime at <a href="${SITE_URL}/my-bookings">${SITE_URL}/my-bookings</a>.</p>
      <p>— Kamp Lambingan Team</p>
    `,
  });
}

export async function sendPaymentReceivedEmail(payload: BookingNotificationPayload) {
  await sendEmail({
    from: DEFAULT_FROM_EMAIL,
    to: payload.guestEmail,
    subject: 'Payment received for your booking',
    html: `
      <h2>Hi ${escapeHtml(payload.guestName)}!</h2>
      <p>We have received your payment for <strong>${escapeHtml(payload.packageName)}</strong>.</p>
      <p><strong>Amount:</strong> ${escapeHtml(payload.amountDue ?? '')}</p>
      <p>We will confirm your stay shortly.</p>
      <p>— Kamp Lambingan Team</p>
    `,
  });
}

export async function sendBookingRejectedEmail(payload: BookingNotificationPayload) {
  await sendEmail({
    from: DEFAULT_FROM_EMAIL,
    to: payload.guestEmail,
    subject: 'Booking payment could not be verified',
    html: `
      <h2>Hi ${escapeHtml(payload.guestName)}.</h2>
      <p>We could not verify your payment for <strong>${escapeHtml(payload.packageName)}</strong>.</p>
      <p>Please upload a clearer payment receipt or contact us for assistance.</p>
      <p>— Kamp Lambingan Team</p>
    `,
  });
}

export async function sendBookingCancelledEmail(payload: BookingNotificationPayload) {
  await sendEmail({
    from: DEFAULT_FROM_EMAIL,
    to: payload.guestEmail,
    subject: 'Your booking has been cancelled',
    html: `
      <h2>Hi ${escapeHtml(payload.guestName)}.</h2>
      <p>Your booking request for <strong>${escapeHtml(payload.packageName)}</strong> has been cancelled.</p>
      <p>If this was a mistake, please contact us and we can help you rebook.</p>
      <p>— Kamp Lambingan Team</p>
    `,
  });
}
