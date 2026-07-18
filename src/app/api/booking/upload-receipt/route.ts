import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Payments are now processed securely via Stripe.' },
    { status: 410 }
  );
}
