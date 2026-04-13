import { createGroq } from '@ai-sdk/groq';
import { streamText, convertToModelMessages, UIMessage, tool, stepCountIs } from 'ai';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import { getContent } from '@/actions/content';
import { buildKnowledgeBase } from '@/lib/knowledge-base';
import { createClient } from '@/lib/supabase/server';
import type { SiteContent } from '@/lib/types';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// ─── Module-level knowledge base cache (5-minute TTL) ─────────────────────────────
// Eliminates per-message DB queries. Refreshes automatically every 5 minutes.
// On Vercel, this cache is per Lambda instance (warm invocations benefit most).
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
// 20 messages per minute per IP. Per-instance only (sufficient for low traffic).
const ipRateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_COUNT = 20;
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
    model: groq('meta-llama/llama-4-scout-17b-16e-instruct'),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    maxOutputTokens: 2048,
    temperature: 0.7,
    stopWhen: stepCountIs(5),
    tools: {
      checkAvailability: tool({
        description:
          'Check whether a date range is available for booking. Call this before creating a booking or when the user asks about availability for specific dates.',
        inputSchema: z.object({
          check_in: z.string().describe('Check-in date in YYYY-MM-DD format'),
          check_out: z.string().describe('Check-out date in YYYY-MM-DD format'),
        }),
        execute: async ({ check_in, check_out }) => {
          if (check_out <= check_in) {
            return { available: false, reason: 'Check-out must be after check-in.' };
          }
          const supabase = await createClient();
          const { data: conflicts } = await supabase
            .from('bookings')
            .select('check_in, check_out')
            .neq('status', 'cancelled')
            .eq('is_archived', false)
            .lte('check_in', check_out)
            .gte('check_out', check_in)
            .limit(5);

          if (conflicts && conflicts.length > 0) {
            return {
              available: false,
              reason: 'Those dates overlap with an existing booking.',
              conflicts: conflicts.map((c) => ({ check_in: c.check_in, check_out: c.check_out })),
            };
          }
          return { available: true };
        },
      }),

      checkBookingStatus: tool({
        description:
          'Look up an existing booking by reference code to check its status. Use this when the user asks about their booking and provides a reference code (e.g. KL-A3F7B2).',
        inputSchema: z.object({
          reference: z.string().describe('The booking reference code, e.g. KL-A3F7B2'),
        }),
        execute: async ({ reference }) => {
          const supabase = await createClient();
          const { data, error } = await supabase
            .from('bookings')
            .select('reference, guest_name, package_name, check_in, check_out, pax, status, created_at')
            .ilike('reference', reference.trim())
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
          const supabase = await createClient();

          // Final conflict check
          const { data: conflicts } = await supabase
            .from('bookings')
            .select('id')
            .neq('status', 'cancelled')
            .eq('is_archived', false)
            .lte('check_in', check_out)
            .gte('check_out', check_in)
            .limit(1);

          if (conflicts && conflicts.length > 0) {
            return { success: false, error: 'Those dates are no longer available. Please choose different dates.' };
          }

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
          const reference = 'KL-' + randomBytes(3).toString('hex').toUpperCase();

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
            return { success: false, error: error.message };
          }

          // Send guest confirmation + admin notification emails
          if (process.env.RESEND_API_KEY) {
            try {
              const { Resend } = await import('resend');
              const resend = new Resend(process.env.RESEND_API_KEY);
              const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

              // Guest confirmation email
              await resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL || 'Kamp Lambingan <onboarding@resend.dev>',
                to: guest_email,
                subject: 'We received your booking request!',
                html: `<h2>Hi ${guest_name}! 🌿</h2><p>We received your booking via our chat assistant for <strong>${package_name}</strong>.</p><div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:8px;margin:16px 0;"><p style="margin:0 0 4px 0;font-size:12px;color:#6b7280;">Your Booking Reference</p><p style="margin:0;font-size:24px;font-weight:bold;letter-spacing:2px;color:#166534;">${reference}</p></div><p><strong>Check-in:</strong> ${check_in}</p><p><strong>Check-out:</strong> ${check_out}</p><p><strong>Guests:</strong> ${pax}</p><p><strong>Payment:</strong> ${payment_type === 'downpayment' ? `Downpayment (50%)` : 'Full Payment'}${amountDue ? ` — <strong>${amountDue}</strong>` : ''}</p><p><strong>Note:</strong> Payment via GCash is required to confirm your reservation. Our team will contact you on <strong>${guest_phone}</strong> within 24 hours with GCash payment details.</p><p>Check your booking status at <a href="${siteUrl}/my-bookings">/my-bookings</a>.</p><p>— Kamp Lambingan Team</p>`,
              });

              // Admin notification (previously missing for chat bookings)
              if (process.env.ADMIN_EMAIL) {
                await resend.emails.send({
                  from: process.env.RESEND_FROM_EMAIL || 'Kamp Lambingan <onboarding@resend.dev>',
                  to: process.env.ADMIN_EMAIL,
                  subject: `New booking (via chat) from ${guest_name}`,
                  html: `
                    <h2>New Booking Request (via Chat)</h2>
                    <p><strong>Name:</strong> ${guest_name}</p>
                    <p><strong>Email:</strong> ${guest_email}</p>
                    <p><strong>Phone:</strong> ${guest_phone}</p>
                    <p><strong>Package:</strong> ${package_name}</p>
                    <p><strong>Check-in:</strong> ${check_in}</p>
                    <p><strong>Check-out:</strong> ${check_out}</p>
                    <p><strong>Guests:</strong> ${pax}</p>
                    <p><strong>Payment:</strong> ${payment_type === 'downpayment' ? 'Downpayment (50%)' : 'Full Payment'}${amountDue ? ` — ${amountDue}` : ''}</p>
                    ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
                    <p><a href="${siteUrl}/admin/bookings/${data.id}">View booking →</a></p>
                  `,
                });
              }
            } catch (_) {
              // Don't fail booking if email fails
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
