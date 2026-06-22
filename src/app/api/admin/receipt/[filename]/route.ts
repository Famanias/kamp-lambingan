import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient, requireAdmin } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  context: { params: Promise<Record<string, string>> }
) {
  try {
    // 1. Enforce admin auth
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = await context.params;
  const filename = params.filename;

  // 2. Validate filename safety (no path traversal, alphanumeric/dashes/dots only)
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }

  // 3. Generate signed URL for private receipts bucket
  const supabase = getServiceClient();
  const path = `receipts/${filename}`;

  const { data, error } = await supabase.storage
    .from('receipts')
    .createSignedUrl(path, 60 * 15); // 15-minute signed URL

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
  }

  // 4. Redirect browser to the secure signed URL
  return NextResponse.redirect(data.signedUrl);
}
