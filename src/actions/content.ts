'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { SiteContent } from '@/lib/types';
import { DEFAULT_CONTENT } from '@/lib/defaults';

// Service role client — bypasses RLS for admin storage operations.
// Only used server-side; the key is never exposed to the browser.
function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function uploadImage(formData: FormData): Promise<{ url?: string; error?: string }> {
  const file = formData.get('file') as File | null;
  if (!file) return { error: 'No file provided' };

  const supabase = getServiceClient();
  const ext = file.name.split('.').pop();
  const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from('site-images')
    .upload(path, file, { upsert: false, contentType: file.type });

  if (error) return { error: error.message };

  // Store a stable proxy URL that generates a fresh signed URL on every request.
  // This keeps the bucket private — no public access needed.
  return { url: `/api/image?path=${encodeURIComponent(path)}` };
}

export async function getContent(): Promise<SiteContent> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('site_content')
      .select('data')
      .eq('id', 1)
      .single();

    if (!error && data?.data && Object.keys(data.data).length > 0) {
      return data.data as SiteContent;
    }
  } catch {
    // fall through to default
  }
  return DEFAULT_CONTENT;
}

export async function saveContent(content: SiteContent) {
  const supabase = await createClient();
  const { error } = await supabase.from('site_content').upsert({
    id: 1,
    data: content,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  return { success: true };
}
