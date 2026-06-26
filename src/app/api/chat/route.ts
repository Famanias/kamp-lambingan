import { createGroq } from '@ai-sdk/groq';
import { streamText, convertToModelMessages, UIMessage, tool, stepCountIs } from 'ai';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import { getContent } from '@/actions/content';
import { buildOptimizedPrompt } from '@/lib/knowledge-base';
import { getServiceClient } from '@/lib/supabase/server';
import type { SiteContent } from '@/lib/types';
import { getEncoding } from 'js-tiktoken';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// Allow streaming responses up to 120 seconds
export const maxDuration = 120;

// ─── Module-level knowledge base cache (5-minute TTL) ─────────────────────────────
let _cachedContent: SiteContent | null = null;
let _cacheExpiresAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getCachedContent(): Promise<SiteContent> {
  if (_cachedContent && Date.now() < _cacheExpiresAt) return _cachedContent;
  _cachedContent = await getContent();
  _cacheExpiresAt = Date.now() + CACHE_TTL_MS;
  return _cachedContent;
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

const getMessageText = (m: UIMessage) =>
  m.parts.filter((p) => p.type === 'text').map((p) => (p as any).text).join('');

// ─── Token Counting Helper ────────────────────────────────────────────────────
function countTokens(text: string): number {
  try {
    const enc = getEncoding('cl100k_base');
    return enc.encode(text).length;
  } catch (err) {
    return Math.ceil(text.length / 4);
  }
}

// ─── Chat Session Database Sync ────────────────────────────────────────────────
async function getOrCreateChatSession(sessionId: string) {
  const supabase = getServiceClient();
  const now = new Date();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 mins expiry

  // Cleanup expired sessions
  try {
    await supabase.from('chat_sessions').delete().lt('expires_at', now.toISOString());
  } catch (err) {
    console.error('[Chat Session Cleanup] Error:', err);
  }

  // Try retrieving existing session
  const { data: session, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('session_id', sessionId)
    .maybeSingle();

  if (session) {
    await supabase
      .from('chat_sessions')
      .update({ updated_at: now.toISOString(), expires_at: expiresAt })
      .eq('session_id', sessionId);
    return session;
  }

  // Create new session
  const newSession = {
    session_id: sessionId,
    state: {},
    conversation_summary: '',
    current_stage: 'general',
    expires_at: expiresAt,
  };

  const { data: created, error: createError } = await supabase
    .from('chat_sessions')
    .insert(newSession)
    .select('*')
    .single();

  if (createError) {
    console.error('[getOrCreateChatSession] Create error:', createError.message);
  }
  return created || newSession;
}

async function updateChatSession(chatSessionId: string, updates: { state?: any; current_stage?: string; conversation_summary?: string }) {
  const supabase = getServiceClient();
  const now = new Date();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  const { data: session } = await supabase
    .from('chat_sessions')
    .select('state')
    .eq('session_id', chatSessionId)
    .maybeSingle();

  const mergedState = {
    ...(session?.state || {}),
    ...(updates.state || {}),
  };

  const dbUpdates: any = {
    state: mergedState,
    updated_at: now.toISOString(),
    expires_at: expiresAt,
  };

  if (updates.current_stage) dbUpdates.current_stage = updates.current_stage;
  if (updates.conversation_summary !== undefined) dbUpdates.conversation_summary = updates.conversation_summary;

  await supabase
    .from('chat_sessions')
    .update(dbUpdates)
    .eq('session_id', chatSessionId);
}

// ─── Intent & Stage Aware Context Router ──────────────────────────────────────
function determineActiveModules(userMessage: string, currentStage: string): string[] {
  const query = userMessage.toLowerCase();
  const modules = new Set<string>(['booking']); // Always include booking workflow guidance

  // Stage-based modules
  if (currentStage === 'general' || currentStage === 'package_selection') {
    modules.add('general');
    modules.add('packages');
  } else if (currentStage === 'email_verification') {
    modules.add('booking');
  } else if (currentStage === 'booking_confirmation') {
    modules.add('booking');
  } else if (currentStage === 'completed') {
    modules.add('payment');
    modules.add('contact');
  }

  // Intent-based keywords matching
  if (query.includes('package') || query.includes('price') || query.includes('rate') || query.includes('cost') || query.includes('how much') || query.includes('fee')) {
    modules.add('packages');
  }
  if (query.includes('policy') || query.includes('rule') || query.includes('pet') || query.includes('bring') || query.includes('allowed') || query.includes('checkin') || query.includes('checkout') || query.includes('check-in') || query.includes('check-out') || query.includes('cancel')) {
    modules.add('policies');
  }
  if (query.includes('wifi') || query.includes('signal') || query.includes('food') || query.includes('cook') || query.includes('kitchen') || query.includes('pool') || query.includes('river') || query.includes('amenities') || query.includes('faq')) {
    modules.add('faqs');
  }
  if (query.includes('contact') || query.includes('phone') || query.includes('number') || query.includes('email') || query.includes('address') || query.includes('location') || query.includes('where') || query.includes('map') || query.includes('direction')) {
    modules.add('contact');
  }
  if (query.includes('pay') || query.includes('gcash') || query.includes('downpayment') || query.includes('deposit') || query.includes('transfer')) {
    modules.add('payment');
  }

  return Array.from(modules);
}

function buildConversationSummary(state: any, stage: string): string {
  if (!state || Object.keys(state).length === 0) return '';
  const parts: string[] = [];

  parts.push(`Conversation Stage: ${stage}`);
  if (state.package_name) parts.push(`Selected package: ${state.package_name}`);
  if (state.check_in && state.check_out) parts.push(`Dates: ${state.check_in} to ${state.check_out}`);
  if (state.pax) parts.push(`Guests: ${state.pax}`);
  if (state.guest_name) parts.push(`Guest Name: ${state.guest_name}`);
  if (state.guest_email) parts.push(`Guest Email: ${state.guest_email}`);
  if (state.guest_phone) parts.push(`Guest Phone: ${state.guest_phone}`);
  if (state.payment_type) parts.push(`Payment preference: ${state.payment_type}`);
  if (state.notes) parts.push(`Special notes: ${state.notes}`);
  if (state.verified) parts.push(`Email Verification Status: VERIFIED`);
  if (state.reference) parts.push(`Booking Reference: ${state.reference}`);

  return parts.join('\n');
}

// ─── API POST Route ───────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (isRateLimited(ip)) {
    return new Response(JSON.stringify({ error: 'Too many requests. Please wait a moment.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { messages, chatSessionId } = (await req.json()) as { messages: UIMessage[]; chatSessionId?: string };

  if (!chatSessionId) {
    return new Response(JSON.stringify({ error: 'Missing chatSessionId.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 1. Get or create persistent Supabase chat session
  const chatSession = await getOrCreateChatSession(chatSessionId);
  const currentStage = chatSession.current_stage || 'general';
  const currentState = chatSession.state || {};

  // 2. Classify latest message intent & dynamically route active modules
  const latestMessage = messages[messages.length - 1];
  const latestUserText = latestMessage ? getMessageText(latestMessage) : '';
  const activeModules = determineActiveModules(latestUserText, currentStage);

  // 3. Retrieve site content and build optimized system prompt
  const siteContent = await getCachedContent();
  const summaryStr = buildConversationSummary(currentState, currentStage);
  const systemPrompt = buildOptimizedPrompt(siteContent, currentState, summaryStr, activeModules);

  // 4. Conversation History Compression: Truncate to summary + last 6 messages
  const compressedHistory = messages.slice(-6);

  // ─── Token Logging (Phase 10 / token monitoring) ───────────────────────────
  const sysTokens = countTokens(systemPrompt);
  const summaryTokens = countTokens(summaryStr);
  const historyTokens = countTokens(JSON.stringify(compressedHistory));
  const userTokens = countTokens(latestUserText);
  const totalInputEstimated = sysTokens + summaryTokens + historyTokens + userTokens;

  console.log(`=== Groq LLM Token Monitoring ===
System Prompt Tokens: ${sysTokens}
Injected Summary Tokens: ${summaryTokens}
Compressed History Tokens: ${historyTokens}
User Message Tokens: ${userTokens}
Total Estimated Input Tokens: ${totalInputEstimated}
=================================`);

  const result = streamText({
    model: groq('llama-3.1-8b-instant'),
    system: systemPrompt,
    messages: await convertToModelMessages(compressedHistory),
    maxOutputTokens: 2048,
    temperature: 0.7,
    stopWhen: stepCountIs(5),
    onFinish: (res) => {
      console.log(`=== Groq Completion Usage ===
Prompt Tokens: ${res.usage.inputTokens}
Completion Tokens: ${res.usage.outputTokens}
Total Tokens: ${res.usage.totalTokens}
=============================`);
    },
    tools: {
      checkAvailability: tool({
        description:
          'Check guest capacity and availability for a date range. Availability is determined by remaining guest capacity, not by dates being completely booked. Call this when the user asks about availability for specific dates or before creating a booking.',
        inputSchema: z.object({
          check_in: z.string().describe('Check-in date in YYYY-MM-DD format'),
          check_out: z.string().describe('Check-out date in YYYY-MM-DD format'),
          pax: z.number().int().min(1).optional().describe('Number of guests requested'),
        }).passthrough(),
        execute: async ({ check_in, check_out, pax }) => {
          if (check_out <= check_in) {
            return { available: false, reason: 'Check-out must be after check-in.' };
          }
          const { getCapacityForDates } = await import('@/actions/bookings');
          const details = await getCapacityForDates(check_in, check_out);

          if (details.length === 0) {
            return { available: false, reason: 'Invalid date range.' };
          }

          const maxGuestsAllowed = details.reduce((min, d) => Math.min(min, d.remainingCapacity), Infinity);
          const maximumCapacity = details.reduce((min, d) => Math.min(min, d.maximumCapacity), Infinity);
          const bookedGuests = details.reduce((max, d) => Math.max(max, d.bookedGuests), 0);
          const isFullyBooked = details.some((d) => d.isFullyBooked);

          const requestedPax = pax ?? 1;
          const available = maxGuestsAllowed >= requestedPax;

          if (available) {
            // Update session state and transition stage to booking_information
            await updateChatSession(chatSessionId, {
              state: { check_in, check_out, pax: requestedPax },
              current_stage: 'booking_information',
            });
          }

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
        }).passthrough(),
        execute: async ({ reference }) => {
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

      startBookingVerification: tool({
        description:
          'Start the booking email verification process. Collects guest details, checks availability, creates a verification session, and sends a 6-digit verification code to the guest email. Call this once the guest details are collected and the guest confirms they want to proceed.',
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
        }).passthrough(),
        execute: async ({ guest_name, guest_email, guest_phone, package_name, check_in, check_out, pax, payment_type, notes }) => {
          const supabase = getServiceClient();
          const emailStr = guest_email.toLowerCase().trim();

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
            return { success: false, error: 'Please wait 60 seconds before requesting another verification code.' };
          }

          // 3. Check capacity
          const { getCapacityForDates } = await import('@/actions/bookings');
          const capacityDetails = await getCapacityForDates(check_in, check_out);
          if (capacityDetails.length === 0) {
            return { success: false, error: 'Invalid date range.' };
          }

          const maxGuestsAllowed = capacityDetails.reduce((min, d) => Math.min(min, d.remainingCapacity), Infinity);
          if (maxGuestsAllowed < pax) {
            return { success: false, error: `Not enough capacity. Only ${maxGuestsAllowed} spots left.` };
          }

          // 4. Generate 6-digit code
          const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
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
            console.error('[Chat API startBookingVerification] DB insert error:', dbError?.message);
            return { success: false, error: 'Failed to create booking verification session.' };
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
              console.error('[Chat API startBookingVerification] Resend email failed:', emailErr);
            }
          }

          // 7. Update chat session stage and booking state details
          await updateChatSession(chatSessionId, {
            state: {
              guest_name,
              guest_email: emailStr,
              guest_phone,
              package_name,
              check_in,
              check_out,
              pax,
              payment_type,
              notes,
              verification_session_id: newSession.id,
            },
            current_stage: 'email_verification',
          });

          return { success: true, sessionId: newSession.id };
        },
      }),

      verifyBookingCode: tool({
        description: 'Verify the 6-digit code sent to the guest email. Call this when the guest provides the code.',
        inputSchema: z.object({
          code: z.string().describe('The 6-digit verification code provided by the guest'),
        }).passthrough(),
        execute: async ({ code }) => {
          const supabase = getServiceClient();

          // Fetch verification session id from state
          const { data: sessionState } = await supabase
            .from('chat_sessions')
            .select('state')
            .eq('session_id', chatSessionId)
            .maybeSingle();

          const vSessionId = sessionState?.state?.verification_session_id;

          if (!vSessionId) {
            return { success: false, verified: false, error: 'Verification session not found. Please restart the booking process.' };
          }

          const { data: session, error: dbError } = await supabase
            .from('booking_verifications')
            .select('*')
            .eq('id', vSessionId)
            .maybeSingle();

          if (dbError || !session) {
            return { success: false, verified: false, error: 'Verification session not found.' };
          }

          const now = new Date();
          const expiresAt = new Date(session.expires_at);

          if (now > expiresAt) {
            return { success: false, verified: false, error: 'Verification session has expired. Please request a new code.' };
          }

          if (session.verification_attempts >= 5) {
            return { success: false, verified: false, error: 'Maximum attempts reached. This session is now invalid. Please request a new code.' };
          }

          if (session.verified) {
            return { success: true, verified: true, message: 'Email has already been verified for this session.' };
          }

          if (code.trim() === session.verification_code.trim()) {
            const { error: updateError } = await supabase
              .from('booking_verifications')
              .update({ verified: true })
              .eq('id', vSessionId);

            if (updateError) {
              console.error('[Chat API verifyBookingCode] DB update error:', updateError.message);
              return { success: false, verified: false, error: 'Failed to complete verification.' };
            }

            // Update state and transition stage to booking_confirmation
            await updateChatSession(chatSessionId, {
              state: { verified: true },
              current_stage: 'booking_confirmation',
            });

            return { success: true, verified: true, message: 'Email verified successfully.' };
          } else {
            const newAttempts = session.verification_attempts + 1;
            const shouldExpire = newAttempts >= 5;

            const updateData: any = { verification_attempts: newAttempts };
            if (shouldExpire) {
              updateData.expires_at = now.toISOString();
            }

            await supabase
              .from('booking_verifications')
              .update(updateData)
              .eq('id', vSessionId);

            const attemptsRemaining = Math.max(0, 5 - newAttempts);
            const errMsg = shouldExpire
              ? 'Incorrect verification code. Maximum attempts reached. This session is now invalid.'
              : `Incorrect verification code. ${attemptsRemaining} attempt(s) remaining.`;

            return { success: false, verified: false, error: errMsg, attemptsRemaining };
          }
        },
      }),

      completeBooking: tool({
        description: 'Complete the booking reservation after successful email verification and the user\'s final confirmation. Returns reference code and amount due.',
        inputSchema: z.object({}).passthrough(),
        execute: async () => {
          const supabase = getServiceClient();

          // Fetch verification session id from state
          const { data: sessionState } = await supabase
            .from('chat_sessions')
            .select('state')
            .eq('session_id', chatSessionId)
            .maybeSingle();

          const vSessionId = sessionState?.state?.verification_session_id;

          if (!vSessionId) {
            return { success: false, error: 'Booking session not found. Please restart the booking process.' };
          }

          // 1. Retrieve the verification session
          const { data: session, error: dbError } = await supabase
            .from('booking_verifications')
            .select('*')
            .eq('id', vSessionId)
            .maybeSingle();

          if (dbError || !session) {
            return { success: false, error: 'Verification session not found.' };
          }

          if (!session.verified) {
            return { success: false, error: 'Email address has not been verified yet.' };
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

          // 2. Final Capacity Check
          const { getCapacityForDates } = await import('@/actions/bookings');
          const capacityDetails = await getCapacityForDates(check_in, check_out);
          if (capacityDetails.length === 0) {
            return { success: false, error: 'Invalid date range.' };
          }

          const maxGuestsAllowed = capacityDetails.reduce((min, d) => Math.min(min, d.remainingCapacity), Infinity);
          if (maxGuestsAllowed < pax) {
            return { success: false, error: `Not enough capacity on the requested dates. Only ${maxGuestsAllowed} spots left.` };
          }

          // 3. Calculate amount due on the server
          const siteContent = await getCachedContent();
          const pkg = siteContent.packages.find(
            (p) => p.name.toLowerCase() === package_name.toLowerCase()
          );
          const priceStr = pkg?.price ?? '';
          const priceNum = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
          const amountDue = !isNaN(priceNum)
            ? `₱${(payment_type === 'downpayment' ? priceNum * 0.5 : priceNum).toLocaleString()}`
            : undefined;

          // 4. Generate Reference Code (CSPRNG)
          const reference = 'KL-' + randomBytes(4).toString('hex').toUpperCase();

          // 5. Insert Booking via RPC
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
            console.error('[Chat API completeBooking] RPC error:', rpcError.message);
            return { success: false, error: 'Failed to complete booking. Please try again.' };
          }

          const resultObj = rpcResult as { success: boolean; id?: string; error?: string };
          if (!resultObj.success) {
            return { success: false, error: resultObj.error || 'Failed to complete booking.' };
          }

          const bookingId = resultObj.id!;

          // 6. Delete the verification session since booking is successfully created
          await supabase
            .from('booking_verifications')
            .delete()
            .eq('id', vSessionId);

          // 7. Send confirmation emails via Resend
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

              // Guest confirmation email
              await resend.emails.send({
                from: `Kamp Lambingan <${fromEmail}>`,
                to: guest_email,
                subject: 'We received your booking request!',
                html: `<h2>Hi ${safeName}! 🌿</h2><p>We received your booking via our chat assistant for <strong>${safePackage}</strong>.</p><div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:8px;margin:16px 0;"><p style="margin:0 0 4px 0;font-size:12px;color:#6b7280;">Your Booking Reference</p><p style="margin:0;font-size:24px;font-weight:bold;letter-spacing:2px;color:#166534;">${reference}</p></div><p><strong>Check-in:</strong> ${check_in}</p><p><strong>Check-out:</strong> ${check_out}</p><p><strong>Guests:</strong> ${pax}</p><p><strong>Payment:</strong> ${payment_type === 'downpayment' ? `Downpayment (50%)` : 'Full Payment'}${safeAmountDue ? ` — <strong>${safeAmountDue}</strong>` : ''}</p><p><strong>Note:</strong> Payment via GCash is required to confirm your reservation. Please use the GCash QR code shown in our chat or on our website to complete the payment.</p><p>Check your booking status at <a href="${siteUrl}/my-bookings">/my-bookings</a>.</p><p>— Kamp Lambingan Team</p>`,
              });

              // Admin notification
              if (process.env.ADMIN_EMAIL) {
                await resend.emails.send({
                  from: `Campaign <${fromEmail}>`,
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
                    <p><a href="${siteUrl}/admin/bookings/${bookingId}">View booking →</a></p>
                  `,
                });
              }
            } catch (emailErr) {
              console.error('[Chat API completeBooking] email notification failed:', emailErr);
            }
          }

          // 8. Update session stage and final values
          await updateChatSession(chatSessionId, {
            state: {
              reference,
              booking_id: bookingId,
              amount_due: amountDue,
              booking_completed: true,
            },
            current_stage: 'completed',
          });

          return {
            success: true,
            reference,
            booking_id: bookingId,
            amount_due: amountDue,
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
