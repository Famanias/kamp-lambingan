'use server';

import { revalidatePath } from 'next/cache';
import { createClient, requireAdmin, getServiceClient } from '@/lib/supabase/server';
import { SiteContent } from '@/lib/types';
import { DEFAULT_CONTENT } from '@/lib/defaults';
import crypto from 'crypto';

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadImage(formData: FormData): Promise<{ url?: string; error?: string }> {
  try {
    await requireAdmin();
  } catch (err: any) {
    return { error: err.message || 'Unauthorized' };
  }

  const file = formData.get('file') as File | null;
  if (!file) return { error: 'No file provided' };

  if (file.size > MAX_IMAGE_SIZE) {
    return { error: 'File size exceeds the 10MB limit.' };
  }

  const ext = ALLOWED_MIME_TYPES[file.type];
  if (!ext) {
    return { error: 'Invalid file type. Only JPG, PNG, and WEBP images are allowed.' };
  }

  const supabase = getServiceClient();
  const randomSuffix = crypto.randomBytes(8).toString('hex');
  const path = `uploads/${Date.now()}-${randomSuffix}.${ext}`;

  const { error } = await supabase.storage
    .from('site-images')
    .upload(path, file, { upsert: false, contentType: file.type });

  if (error) return { error: 'Failed to upload image. Please try again.' };

  // Store a stable proxy URL that generates a fresh signed URL on every request.
  // This keeps the bucket private — no public access needed.
  return { url: `/api/image?path=${encodeURIComponent(path)}` };
}

export async function listImages(): Promise<{ urls: string[]; error?: string }> {
  try {
    await requireAdmin();
    const supabase = getServiceClient();
    const { data, error } = await supabase.storage
      .from('site-images')
      .list('uploads', { limit: 500, sortBy: { column: 'created_at', order: 'desc' } });
    if (error) return { urls: [], error: 'Failed to list images.' };
    const urls = (data ?? [])
      .filter((f) => f.name && f.name !== '.emptyFolderPlaceholder')
      .map((f) => `/api/image?path=${encodeURIComponent(`uploads/${f.name}`)}`);
    return { urls };
  } catch (e: any) {
    return { urls: [], error: e.message || 'Unauthorized' };
  }
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
      const merged = { ...DEFAULT_CONTENT, ...(data.data as SiteContent) };
      if (Array.isArray(merged.packages)) {
        merged.packages = merged.packages.map((p) => {
          // Parse price to number
          let price = p.price as any;
          if (typeof price === 'string') {
            price = parseInt(price.replace(/[^\d]/g, ''), 10) || 0;
          } else if (typeof price !== 'number') {
            price = 0;
          }

          // Parse description
          const description = p.description || '';

          // Parse capacity
          let capacity = p.capacity;
          if (typeof capacity !== 'number' || isNaN(capacity) || capacity < 1) {
            const desc = description.toLowerCase();
            const match = desc.match(/up to (\d+)\s*pax/i);
            if (match) {
              capacity = parseInt(match[1], 10) || 2;
            } else if (p.name.toLowerCase().includes('couple') || (p.label || '').toLowerCase().includes('couple')) {
              capacity = 2;
            } else if (p.name.toLowerCase().includes('day tour')) {
              capacity = 30;
            } else if (p.name.toLowerCase().includes('hall') || p.name.toLowerCase().includes('pool party')) {
              capacity = 100;
            } else {
              capacity = 20; // default fallback
            }
          }

          // Parse maxStayDays
          let maxStayDays = p.maxStayDays;
          if (typeof maxStayDays !== 'number' || isNaN(maxStayDays) || maxStayDays < 1) {
            maxStayDays = p.allowsMultiDay ? 3 : 1;
          }

          return {
            ...p,
            price,
            description,
            capacity,
            maxStayDays,
            allowsMultiDay: maxStayDays > 1,
          };
        });
      }
      return merged as SiteContent;
    }
  } catch {
    // fall through to default
  }

  // Sanitize DEFAULT_CONTENT clone just in case
  const defaultClone = JSON.parse(JSON.stringify(DEFAULT_CONTENT));
  if (Array.isArray(defaultClone.packages)) {
    defaultClone.packages = defaultClone.packages.map((p: any) => ({
      ...p,
      capacity: p.capacity ?? 2,
      maxStayDays: p.maxStayDays ?? (p.allowsMultiDay ? 3 : 1),
      allowsMultiDay: (p.maxStayDays ?? (p.allowsMultiDay ? 3 : 1)) > 1
    }));
  }
  return defaultClone as SiteContent;
}

export async function saveContent(content: SiteContent) {
  try {
    await requireAdmin();
  } catch (err: any) {
    return { success: false, error: err.message || 'Unauthorized' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('site_content').upsert({
    id: 1,
    data: content,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { success: false, error: 'Failed to save site content. Please try again.' };
  }

  revalidatePath('/');
  return { success: true };
}

