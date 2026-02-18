'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { SiteContent } from '@/lib/types';
import { DEFAULT_CONTENT } from '@/lib/defaults';

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
