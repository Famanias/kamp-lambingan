import { createGroq } from '@ai-sdk/groq';
import { streamText, convertToModelMessages, UIMessage, tool, stepCountIs } from 'ai';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import { getContent } from '@/actions/content';
import { buildKnowledgeBase } from '@/lib/knowledge-base';
import { getServiceClient, createClient } from '@/lib/supabase/server';
import type { SiteContent } from '@/lib/types';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 120;

// ─── Module-level knowledge base cache (5-minute TTL) ─────────────────────────────
let _cachedContent: SiteContent | null = null;
let _cachedSystemPrompt: string | null = null;
let _cacheExpiresAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getCachedContent(): Promise<SiteContent> {
  if (_cachedContent && Date.now() < _cacheExpiresAt) return _cachedContent;
  _cachedContent = await getContent();
  _cachedSystemPrompt = buildKnowledgeBase(_cachedContent);
  _cacheExpiresAt = Date.now() + CACHE_TTL_MS;
  return _cachedContent;
}

async function getCachedSystemPrompt(): Promise<string> {
  if (_cachedSystemPrompt && Date.now() < _cacheExpiresAt) return _cachedSystemPrompt;
  await getCachedContent(); // populates both caches
  return _cachedSystemPrompt!;
}

// ─── Simple in-memory rate limiter ───────────────────────────────────────────
const ipRateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_COUNT = 60;
const RATE_LIMIT_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipRateLimiter.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRateLimiter.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT_COUNT) return true;
  entry.count++;
  return false;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(req: Request) {
  // Rate limit by IP (20 messages per minute)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (isRateLimited(ip)) {
    return new Response(JSON.stringify({ error: 'Too many requests. Please wait a moment.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { messages } = (await req.json()) as { messages: UIMessage[] };

  const systemPrompt = await getCachedSystemPrompt();

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    maxOutputTokens: 2048,
    temperature: 0.7,
    stopWhen: stepCountIs(5),
    tools: {
      checkAvailability: tool({
        description:
          'Check guest capacity and availability for a date range. Availability is determined by remaining guest capacity, not by dates being completely booked. Call this when the user asks about availability for specific dates or before creating a booking.',
        inputSchema: z.object({
          check_in: z.string().describe('Check-in date in YYYY-MM-DD format'),
          check_out: z.string().describe('Check-out date in YYYY-MM-DD format'),
          pax: z.number().int().min(1).optional().describe('Number of guests requested'),
        }),
        execute: async ({ check_in, check_out, pax }) => {
          if (check_out <= check_in) {
            return { available: false, reason: 'Check-out must be after check-in.' };
          }
          const { getCapacityForDates } = await import('@/actions/bookings');
          const details = await getCapacityForDates(check_in, check_out);

          if (details.length === 0) {
            return { available: false, reason: 'Invalid date range.' };
          }

          // maxGuestsAllowed is the minimum remaining capacity across all dates in the requested range
          const maxGuestsAllowed = details.reduce((min, d) => Math.min(min, d.remainingCapacity), Infinity);
          
          // maximumCapacity is the minimum maximum capacity across the range
          const maximumCapacity = details.reduce((min, d) => Math.min(min, d.maximumCapacity), Infinity);
          
          // bookedGuests is the maximum booked guests on any date in the range
          const bookedGuests = details.reduce((max, d) => Math.max(max, d.bookedGuests), 0);
          
          // isFullyBooked if any date in the range is fully booked (remaining capacity is 0)
          const isFullyBooked = details.some((d) => d.isFullyBooked);

          const requestedPax = pax ?? 1;
          const available = maxGuestsAllowed >= requestedPax;

          return {
            available,
            maxGuestsAllowed,
            maximumCapacity,
            bookedGuests,
            remainingCapacity: maxGuestsAllowed,
            isFullyBooked,
            details,
          };
        },
      }),

      checkBookingStatus: tool({
        description:
          'Look up an existing booking by reference code to check its status. Use this when the user asks about their booking and provides a reference code (e.g. KL-A3F7B2).',
        inputSchema: z.object({
          reference: z.string().describe('The booking reference code, e.g. KL-A3F7B2'),
        }),
        execute: async ({ reference }) => {
          // Use service-role client since public select is disabled
          const supabase = getServiceClient();
          const { data, error } = await supabase
            .from('bookings')
            .select('reference, guest_name, package_name, check_in, check_out, pax, status, created_at')
            .eq('reference', reference.trim().toUpperCase())
            .single();
          if (error || !data) return { found: false, message: 'No booking found with that reference code.' };
          return { found: true, ...data };
        },
      }),

      createBooking: tool({
        description:
          'Create a booking reservation for the guest after collecting all required details and confirming availability. IMPORTANT: You MUST call checkAvailability first. Only call this once you have: guest_name, guest_email, guest_phone, package_name, check_in, check_out, pax, and payment_type. Confirm all details with the user before calling this.',
        inputSchema: z.object({
          guest_name: z.string().describe('Full name of the guest'),
          guest_email: z.string().describe('Email address of the guest'),
          guest_phone: z.string().describe('Phone number of the guest'),
          package_name: z.string().describe('Name of the package being booked'),
          check_in: z.string().describe('Check-in date in YYYY-MM-DD format'),
          check_out: z.string().describe('Check-out date in YYYY-MM-DD format'),
          pax: z.number().int().min(1).describe('Number of guests'),
          payment_type: z.enum(['full', 'downpayment']).describe('full or downpayment (50%)'),
          notes: z.string().optional().describe('Any special requests or notes'),
        }),
        execute: async ({ guest_name, guest_email, guest_phone, package_name, check_in, check_out, pax, payment_type, notes }) => {
          // Use service-role client for atomic execution and returning select values
          const supabase = getServiceClient();

          // Use cached content for package price lookup (no extra DB call)
          const siteContent = await getCachedContent();
          const pkg = siteContent.packages.find(
            (p) => p.name.toLowerCase() === package_name.toLowerCase()
          );
          const priceStr = pkg?.price ?? '';
          const priceNum = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
          const amountDue = !isNaN(priceNum)
            ? `₱${(payment_type === 'downpayment' ? priceNum * 0.5 : priceNum).toLocaleString()}`
            : undefined;

          // Cryptographically secure reference generation
          const reference = 'KL-' + randomBytes(4).toString('hex').toUpperCase();

          const { data, error } = await supabase
            .from('bookings')
            .insert({
              guest_name,
              guest_email: guest_email.toLowerCase().trim(),
              guest_phone,
              package_name,
              check_in,
              check_out,
              pax,
              notes: notes ?? null,
              status: 'pending',
              reference,
              payment_type,
              amount_due: amountDue ?? null,
            })
            .select('id')
            .single();

          if (error) {
            if (error.code === '23P11') {
              return { success: false, error: 'Those dates are no longer available. Please choose different dates.' };
            }
            console.error('[Chat API createBooking] DB insert error:', error.message);
            return { success: false, error: 'Failed to complete booking. Please try again.' };
          }

          // Send guest confirmation + admin notification emails with escaped user inputs
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

              // Guest confirmation email
              await resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL || 'Kamp Lambingan <onboarding@resend.dev>',
                to: guest_email,
                subject: 'We received your booking request!',
                html: `<h2>Hi ${safeName}! 🌿</h2><p>We received your booking via our chat assistant for <strong>${safePackage}</strong>.</p><div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:8px;margin:16px 0;"><p style="margin:0 0 4px 0;font-size:12px;color:#6b7280;">Your Booking Reference</p><p style="margin:0;font-size:24px;font-weight:bold;letter-spacing:2px;color:#166534;">${reference}</p></div><p><strong>Check-in:</strong> ${check_in}</p><p><strong>Check-out:</strong> ${check_out}</p><p><strong>Guests:</strong> ${pax}</p><p><strong>Payment:</strong> ${payment_type === 'downpayment' ? `Downpayment (50%)` : 'Full Payment'}${safeAmountDue ? ` — <strong>${safeAmountDue}</strong>` : ''}</p><p><strong>Note:</strong> Payment via GCash is required to confirm your reservation. Our team will contact you on <strong>${safePhone}</strong> within 24 hours with GCash payment details.</p><p>Check your booking status at <a href="${siteUrl}/my-bookings">/my-bookings</a>.</p><p>— Kamp Lambingan Team</p>`,
              });

              // Admin notification
              if (process.env.ADMIN_EMAIL) {
                await resend.emails.send({
                  from: process.env.RESEND_FROM_EMAIL || 'Kamp Lambingan <onboarding@resend.dev>',
                  to: process.env.ADMIN_EMAIL,
                  subject: `New booking (via chat) from ${safeName}`,
                  html: `
                    <h2>New Booking Request (via Chat)</h2>
                    <p><strong>Name:</strong> ${safeName}</p>
                    <p><strong>Email:</strong> ${guest_email}</p>
                    <p><strong>Phone:</strong> ${safePhone}</p>
                    <p><strong>Package:</strong> ${safePackage}</p>
                    <p><strong>Check-in:</strong> ${check_in}</p>
                    <p><strong>Check-out:</strong> ${check_out}</p>
                    <p><strong>Guests:</strong> ${pax}</p>
                    <p><strong>Payment:</strong> ${payment_type === 'downpayment' ? 'Downpayment (50%)' : 'Full Payment'}${safeAmountDue ? ` — ${safeAmountDue}` : ''}</p>
                    ${safeNotes ? `<p><strong>Notes:</strong> ${safeNotes}</p>` : ''}
                    <p><a href="${siteUrl}/admin/bookings/${data.id}">View booking →</a></p>
                  `,
                });
              }
            } catch (emailErr) {
              console.error('[Chat API createBooking] email notification failed:', emailErr);
            }
          }

          return {
            success: true,
            reference,
            booking_id: data.id,
            amount_due: amountDue,
            message: `Booking created! Reference: ${reference}. Status is pending — our team will contact ${guest_phone} within 24 hours to arrange GCash payment.`,
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
