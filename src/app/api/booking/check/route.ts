import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

const ipLimits = new Map<string, { count: number; resetAt: number }>();
const IP_LIMIT_MAX = 20;
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

    const { check_in, check_out, pax } = await req.json();

    if (!check_in || !check_out || !pax) {
      return NextResponse.json({ error: 'Missing check_in, check_out, or pax.' }, { status: 400 });
    }

    const supabase = getServiceClient();

    const { data, error } = await supabase.rpc('check_booking_availability', {
      p_check_in: check_in,
      p_check_out: check_out,
      p_pax: Number(pax)
    });

    if (error) {
      console.error('[API booking/check] RPC error:', error);
      return NextResponse.json({ error: 'Failed to check availability.' }, { status: 500 });
    }

    return NextResponse.json({ 
      available: data, 
      maxGuestsAllowed: data ? pax : 0
    });
  } catch (err: any) {
    console.error('[API booking/check] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
