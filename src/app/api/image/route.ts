import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key so we can sign URLs from a private bucket.
// This route is server-side only — the key is never sent to the client.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get('path');
  if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 });

  const { data, error } = await supabase.storage
    .from('site-images')
    .createSignedUrl(path, 60 * 60); // 1-hour signed URL

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: error?.message ?? 'Not found' }, { status: 404 });
  }

  // Redirect to the signed URL — browser/CDN caches the image for the session
  return NextResponse.redirect(data.signedUrl);
}
