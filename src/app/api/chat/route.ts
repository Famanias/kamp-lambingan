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
      showBookingForm: tool({
        description: 'Show the booking form card to the user so they can input dates, guests, and contact details. Call this when the user says they want to make a reservation, check availability, or start a booking.',
        inputSchema: z.object({
          action: z.string().optional().default('show').describe('The action to perform, defaults to show')
        }).passthrough(),
        execute: async () => {
          return {
            success: true,
            action: 'showBookingForm'
          };
        }
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
    },
  });

  return result.toUIMessageStreamResponse();
}
