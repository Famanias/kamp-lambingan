'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { createClient, getServiceClient, requireAdmin } from '@/lib/supabase/server';
import { collectBookedDates, expandDateRange } from '@/lib/booking-dates';
import { getContent } from './content';
import { getSelectedPackage, getNextDayString } from '@/lib/package-helper';
import {
  sendBookingReceivedEmail,
  sendBookingConfirmedEmail,
  sendBookingRejectedEmail,
  sendBookingCancelledEmail,
} from '@/lib/email/booking-notifications';
import crypto from 'crypto';

export interface BookingInput {
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  package_name: string;
  check_in: string;
  check_out: string;
  pax: number;
  notes?: string;
  receipt_url?: string;
  payment_type: 'full' | 'downpayment';
  amount_due?: string;
}

// In-memory rate limiting map
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(ip: string, action: string, limit: number, windowMs: number): boolean {
  const key = `${ip}:${action}`;
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }

  if (now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }

  record.count++;
  if (record.count > limit) {
    return true;
  }
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

const ALLOWED_RECEIPT_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};
const MAX_RECEIPT_SIZE = 5 * 1024 * 1024; // 5MB

export async function createBooking(formData: FormData) {
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  if (isRateLimited(ip, 'create_booking', 5, 10 * 60 * 1000)) {
    return { success: false, error: 'Too many booking attempts. Please try again in 10 minutes.', id: null, reference: null };
  }

  const supabase = getServiceClient();

  // Generate cryptographically secure reference code (CSPRNG)
  const reference = 'KL-' + crypto.randomBytes(4).toString('hex').toUpperCase();

  // Extract fields from FormData
  const input: BookingInput = {
    guest_name: (formData.get('name') as string || '').trim(),
    guest_email: (formData.get('email') as string || '').trim(),
    guest_phone: (formData.get('phone') as string || '').trim(),
    package_name: (formData.get('packageName') as string || '').trim(),
    check_in: formData.get('checkIn') as string,
    check_out: formData.get('checkOut') as string,
    pax: parseInt(formData.get('pax') as string, 10) || 1,
    notes: (formData.get('notes') as string) || undefined,
    payment_type: ((formData.get('paymentType') as string) === 'downpayment' ? 'downpayment' : 'full'),
  };

  const verificationSessionId = formData.get('verificationSessionId') as string | null;
  if (!verificationSessionId) {
    return { success: false, error: 'Email verification is required before completing your booking.', id: null, reference: null };
  }

  const { data: verificationSession, error: verificationError } = await supabase
    .from('booking_verifications')
    .select('*')
    .eq('id', verificationSessionId)
    .maybeSingle();

  if (verificationError || !verificationSession) {
    return { success: false, error: 'Email verification session not found. Please verify your email again.', id: null, reference: null };
  }

  if (!verificationSession.verified) {
    return { success: false, error: 'Email verification has not been completed. Please verify the code sent to your email.', id: null, reference: null };
  }

  if (verificationSession.booking_session?.guest_email?.toLowerCase().trim() !== input.guest_email.toLowerCase().trim()) {
    return { success: false, error: 'The verified email does not match the booking email. Please start verification again.', id: null, reference: null };
  }

  if (!input.guest_name || !input.guest_email || !input.guest_phone || !input.package_name) {
    return { success: false, error: 'All guest details and selected package are required.', id: null, reference: null };
  }

  if (!input.check_in || !input.check_out) {
    return { success: false, error: 'Check-in and check-out dates are required.', id: null, reference: null };
  }
  if (input.check_out <= input.check_in) {
    return { success: false, error: 'Check-out must be after check-in.', id: null, reference: null };
  }

  // Server-authoritative validation & price calculation (Never trust client input)
  try {
    const siteContent = await getContent();
    const selectedPkg = getSelectedPackage(input.package_name, siteContent.packages);
    if (!selectedPkg) {
      return { success: false, error: 'Selected package is invalid.', id: null, reference: null };
    }

    // Validate guest capacity
    if (input.pax > selectedPkg.capacity) {
      return { success: false, error: `Guest count (${input.pax}) exceeds the selected package capacity of ${selectedPkg.capacity}.`, id: null, reference: null };
    }
    if (input.pax < 1) {
      return { success: false, error: 'Guest count must be at least 1.', id: null, reference: null };
    }

    // Validate check-out date matching package rules
    const checkInDate = new Date(input.check_in + 'T00:00:00');
    const checkOutDate = new Date(input.check_out + 'T00:00:00');
    const diffTime = checkOutDate.getTime() - checkInDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return { success: false, error: 'Check-out must be after check-in.', id: null, reference: null };
    }
    if (diffDays > selectedPkg.maxStayDays) {
      return { success: false, error: `Stay duration exceeds the maximum stay limit of ${selectedPkg.maxStayDays} days for this package.`, id: null, reference: null };
    }
    if (selectedPkg.maxStayDays === 1 && diffDays !== 1) {
      return { success: false, error: `Single-night package requires exactly a 1-night stay.`, id: null, reference: null };
    }

    const priceNum = typeof selectedPkg.price === 'number'
      ? selectedPkg.price
      : (parseInt((selectedPkg.price as any).replace(/[^\d]/g, ''), 10) || 0);
    const amountDueNum = input.payment_type === 'full' ? priceNum : Math.ceil(priceNum / 2);
    input.amount_due = amountDueNum > 0 ? '₱' + amountDueNum.toLocaleString('en-PH') : '';
  } catch (err) {
    console.error('[createBooking] validation/pricing calculation failed:', err);
    return { success: false, error: 'Pricing/capacity validation failed.', id: null, reference: null };
  }

  // 1. Recalculate capacity / expire stale bookings
  await expireStaleBookings(supabase);

  // 2. Perform validation and insertion inside a concurrency-safe database function
  const { data: rpcResult, error: rpcError } = await supabase
    .rpc('create_booking_safe', {
      p_guest_name: input.guest_name,
      p_guest_email: input.guest_email,
      p_guest_phone: input.guest_phone,
      p_package_name: input.package_name,
      p_check_in: input.check_in,
      p_check_out: input.check_out,
      p_pax: input.pax,
      p_notes: input.notes ?? null,
      p_reference: reference,
      p_payment_type: input.payment_type,
      p_amount_due: input.amount_due ?? null,
    });

  if (rpcError) {
    console.error('[createBooking] RPC error:', rpcError.message);
    return { success: false, error: 'Failed to complete booking. Please try again.', id: null, reference: null };
  }

  const resultObj = rpcResult as { success: boolean; id?: string; error?: string };
  if (!resultObj.success) {
    return { success: false, error: resultObj.error || 'Failed to complete booking.', id: null, reference: null };
  }

  const bookingId = resultObj.id!;

  // Upload receipt after insertion
  const receiptFile = formData.get('receipt') as File | null;
  if (receiptFile && receiptFile.size > 0) {
    const receiptUrl = await uploadReceipt(bookingId, receiptFile);
    if (receiptUrl) {
      const serviceClient = getServiceClient();
      const { error: updateErr } = await serviceClient
        .from('bookings')
        .update({ receipt_url: receiptUrl })
        .eq('id', bookingId);

      if (updateErr) {
        console.error('[createBooking] DB update receipt URL error:', updateErr.message);
      }
      input.receipt_url = receiptUrl;
    }
  }

  // Send email notifications via centralized booking notification service
  try {
    await sendBookingReceivedEmail({
      guestName: input.guest_name,
      guestEmail: input.guest_email,
      guestPhone: input.guest_phone,
      packageName: input.package_name,
      checkIn: input.check_in,
      checkOut: input.check_out,
      pax: input.pax,
      paymentType: input.payment_type,
      amountDue: input.amount_due,
      reference,
      bookingId,
      notes: input.notes ?? null,
    });
  } catch (emailErr) {
    console.error('[createBooking] email notification failed:', emailErr);
  }

  return { success: true, error: null, id: bookingId, reference };
}

export async function getBookingByReference(reference: string) {
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  if (isRateLimited(ip, 'lookup_booking', 15, 10 * 60 * 1000)) {
    return { data: null, error: 'Too many lookup attempts. Please try again in 10 minutes.' };
  }

  const supabase = getServiceClient(); // service role to query since public select is disabled
  const { data, error } = await supabase
    .from('bookings')
    .select('id, guest_name, package_name, check_in, check_out, pax, status, reference, created_at, status_reason')
    .eq('reference', reference.trim().toUpperCase())
    .single();

  if (error) return { data: null, error: 'No booking found with that reference code.' };
  return { data, error: null };
}

export async function getBookings(includeArchived = false) {
  try {
    await requireAdmin();
  } catch (err: any) {
    return { data: [], error: err.message || 'Unauthorized' };
  }

  const supabase = await createClient();
  let query = supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });

  if (!includeArchived) {
    query = query.eq('is_archived', false);
  } else {
    query = query.eq('is_archived', true);
  }

  const { data, error } = await query;
  if (error) return { data: [], error: 'Failed to load bookings.' };
  return { data: data ?? [], error: null };
}

export async function archiveBooking(id: string) {
  try {
    await requireAdmin();
  } catch (err: any) {
    return { success: false, error: err.message || 'Unauthorized' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('bookings')
    .update({ is_archived: true, archived_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { success: false, error: 'Failed to archive booking.' };
  revalidatePath('/admin/bookings');
  return { success: true };
}

export async function archiveBookings(ids: string[]) {
  if (!ids.length) return { success: true };
  try {
    await requireAdmin();
  } catch (err: any) {
    return { success: false, error: err.message || 'Unauthorized' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('bookings')
    .update({ is_archived: true, archived_at: new Date().toISOString() })
    .in('id', ids);
  if (error) return { success: false, error: 'Failed to archive bookings.' };
  revalidatePath('/admin/bookings');
  return { success: true };
}

export async function archiveAllBookings() {
  try {
    await requireAdmin();
  } catch (err: any) {
    return { success: false, error: err.message || 'Unauthorized' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('bookings')
    .update({ is_archived: true, archived_at: new Date().toISOString() })
    .eq('is_archived', false);
  if (error) return { success: false, error: 'Failed to archive all bookings.' };
  revalidatePath('/admin/bookings');
  return { success: true };
}

export async function restoreBooking(id: string) {
  try {
    await requireAdmin();
  } catch (err: any) {
    return { success: false, error: err.message || 'Unauthorized' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('bookings')
    .update({ is_archived: false, archived_at: null })
    .eq('id', id);
  if (error) return { success: false, error: 'Failed to restore booking.' };
  revalidatePath('/admin/bookings');
  return { success: true };
}

export async function restoreBookings(ids: string[]) {
  if (!ids.length) return { success: true };
  try {
    await requireAdmin();
  } catch (err: any) {
    return { success: false, error: err.message || 'Unauthorized' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('bookings')
    .update({ is_archived: false, archived_at: null })
    .in('id', ids);
  if (error) return { success: false, error: 'Failed to restore bookings.' };
  revalidatePath('/admin/bookings');
  return { success: true };
}

export async function restoreAllBookings() {
  try {
    await requireAdmin();
  } catch (err: any) {
    return { success: false, error: err.message || 'Unauthorized' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('bookings')
    .update({ is_archived: false, archived_at: null })
    .eq('is_archived', true);
  if (error) return { success: false, error: 'Failed to restore all bookings.' };
  revalidatePath('/admin/bookings');
  return { success: true };
}

export async function deleteAllArchived() {
  try {
    await requireAdmin();
  } catch (err: any) {
    return { success: false, error: err.message || 'Unauthorized' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('is_archived', true);
  if (error) return { success: false, error: 'Failed to delete archived bookings.' };
  revalidatePath('/admin/bookings');
  return { success: true };
}

export async function deleteBookings(ids: string[]) {
  if (!ids.length) return { success: true };
  try {
    await requireAdmin();
  } catch (err: any) {
    return { success: false, error: err.message || 'Unauthorized' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('bookings')
    .delete()
    .in('id', ids);
  if (error) return { success: false, error: 'Failed to delete bookings.' };
  revalidatePath('/admin/bookings');
  return { success: true };
}

export async function getArchiveRetentionDays(): Promise<number> {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'archive_retention_days')
    .single();
  return data ? parseInt(data.value, 10) || 7 : 7;
}

export async function setArchiveRetentionDays(days: number) {
  try {
    await requireAdmin();
  } catch (err: any) {
    return { success: false, error: err.message || 'Unauthorized' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key: 'archive_retention_days', value: String(Math.max(1, days)) });
  if (error) return { success: false, error: 'Failed to update retention days.' };
  revalidatePath('/admin/bookings');
  return { success: true };
}

export async function deleteBookingForever(id: string) {
  try {
    await requireAdmin();
  } catch (err: any) {
    return { success: false, error: err.message || 'Unauthorized' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', id);
  if (error) return { success: false, error: 'Failed to delete booking.' };
  revalidatePath('/admin/bookings');
  return { success: true };
}

export async function getAllBookingsForAnalytics() {
  try {
    await requireAdmin();
  } catch (err: any) {
    return { data: [], error: err.message || 'Unauthorized' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bookings')
    .select('id, status, package_name, payment_type, amount_due, created_at, check_in')
    .order('created_at', { ascending: true });
  if (error) return { data: [], error: 'Failed to load analytics data.' };
  return { data: data ?? [], error: null };
}

export async function getFullyBookedDates() {
  const supabase = getServiceClient();
  await expireStaleBookings(supabase);

  // Query active bookings to find date range to scan
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('check_in, check_out')
    .neq('status', 'cancelled')
    .neq('status', 'expired')
    .eq('is_archived', false);

  if (error || !bookings) {
    return { data: [], error: 'Failed to load booked dates.' };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  let minDate = todayStr;
  let maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1); // 1 year from now default
  let maxDateStr = maxDate.toISOString().split('T')[0];

  bookings.forEach((b) => {
    if (b.check_in && b.check_in < minDate) minDate = b.check_in;
    if (b.check_out && b.check_out > maxDateStr) maxDateStr = b.check_out;
  });

  // Calculate capacity for all dates in this range
  const capacityInfo = await getCapacityForDates(minDate, maxDateStr);
  const fullyBookedDates = capacityInfo
    .filter((info) => info.isFullyBooked)
    .map((info) => info.date);

  return { data: fullyBookedDates, error: null };
}

export async function getBooking(id: string) {
  const supabase = getServiceClient(); // service role to query since public select is disabled
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return { data: null, error: 'Booking not found.' };
  return { data, error: null };
}

export async function updateBookingStatus(
  id: string,
  status: 'confirmed' | 'cancelled',
  reason?: 'payment_rejected'
) {
  try {
    await requireAdmin();
  } catch (err: any) {
    return { success: false, error: err.message || 'Unauthorized' };
  }

  const serviceClient = getServiceClient();
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
    status_reason: reason || null
  };
  const { error: updateError } = await serviceClient
    .from('bookings')
    .update(updateData)
    .eq('id', id);

  if (updateError) {
    console.error('[updateBookingStatus] database update failed:', updateError);
    return { success: false, error: 'Failed to update booking status.' };
  }

  // Send guest notification email through centralized booking email helpers
  try {
    const { data: booking, error: fetchError } = await serviceClient
      .from('bookings')
      .select('guest_name, guest_email, guest_phone, package_name, check_in, check_out, pax, payment_type, reference, amount_due')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('[updateBookingStatus] failed to fetch booking details for email:', fetchError);
    } else if (booking) {
      const payload = {
        guestName: booking.guest_name,
        guestEmail: booking.guest_email,
        guestPhone: booking.guest_phone ?? '',
        packageName: booking.package_name,
        checkIn: booking.check_in,
        checkOut: booking.check_out,
        pax: booking.pax,
        paymentType: booking.payment_type === 'downpayment' ? 'downpayment' : 'full',
        reference: booking.reference,
        amountDue: booking.amount_due,
      } as const;

      if (status === 'confirmed') {
        await sendBookingConfirmedEmail(payload);
      } else if (reason === 'payment_rejected') {
        await sendBookingRejectedEmail(payload);
      } else {
        await sendBookingCancelledEmail(payload);
      }
    }
  } catch (emailErr) {
    console.error('[updateBookingStatus] email notification failed:', emailErr);
  }

  revalidatePath('/admin/bookings');
  revalidatePath(`/admin/bookings/${id}`);
  return { success: true };
}

export async function uploadReceipt(bookingId: string, file: File): Promise<string | null> {
  // Validate size
  if (file.size > MAX_RECEIPT_SIZE) {
    console.error('[uploadReceipt] File size exceeds 5MB limit');
    return null;
  }

  // Validate type
  const ext = ALLOWED_RECEIPT_MIME_TYPES[file.type];
  if (!ext) {
    console.error('[uploadReceipt] Invalid MIME type:', file.type);
    return null;
  }

  // Use service role to write as RLS is restricted
  const supabase = getServiceClient();
  const path = `receipts/${bookingId}.${ext}`;

  const { error } = await supabase.storage
    .from('receipts')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) {
    console.error('[uploadReceipt] Storage upload failed:', error.message);
    return null;
  }

  // Return the secure admin receipt proxy URL instead of public URL
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return `${siteUrl}/api/admin/receipt/${bookingId}.${ext}`;
}

const PENDING_EXPIRATION_MS = 30 * 60 * 1000; // 30 minutes

async function expireStaleBookings(supabase: any) {
  try {
    const expirationTime = new Date(Date.now() - PENDING_EXPIRATION_MS).toISOString();
    await supabase
      .from('bookings')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('created_at', expirationTime);
  } catch (err) {
    console.error('[expireStaleBookings] failed:', err);
  }
}

export async function getCapacityForDates(checkIn: string, checkOut: string) {
  const supabase = getServiceClient();
  await expireStaleBookings(supabase);

  // Accommodation-style occupancy: check_in <= date < check_out
  const requestedDates = expandDateRange(checkIn, checkOut, false);

  if (requestedDates.length === 0) {
    return [];
  }

  // Fetch all custom capacities in the requested dates
  const { data: customCapacitiesData } = await supabase
    .from('date_capacities')
    .select('date, max_capacity')
    .in('date', requestedDates);

  const customCapacities = new Map<string, number>();
  customCapacitiesData?.forEach((c) => {
    customCapacities.set(c.date, c.max_capacity);
  });

  // Fetch overlapping bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select('check_in, check_out, pax, status, is_archived')
    .neq('status', 'cancelled')
    .neq('status', 'expired')
    .eq('is_archived', false)
    .lt('check_in', checkOut)
    .gt('check_out', checkIn);

  // Map each date to booked guests count
  const bookedGuestsMap = new Map<string, number>();
  bookings?.forEach((b) => {
    const dates = expandDateRange(b.check_in, b.check_out, false);
    dates.forEach((date) => {
      if (requestedDates.includes(date)) {
        bookedGuestsMap.set(date, (bookedGuestsMap.get(date) || 0) + b.pax);
      }
    });
  });

  // Build the result
  return requestedDates.map((date) => {
    const maximumCapacity = customCapacities.get(date) ?? 50;
    const bookedGuests = bookedGuestsMap.get(date) || 0;
    const remainingCapacity = Math.max(0, maximumCapacity - bookedGuests);
    const isFullyBooked = remainingCapacity <= 0;

    return {
      date,
      maximumCapacity,
      bookedGuests,
      remainingCapacity,
      isFullyBooked,
    };
  });
}

export async function getDateCapacities() {
  try {
    await requireAdmin();
  } catch (err: any) {
    return { data: [], error: err.message || 'Unauthorized' };
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('date_capacities')
    .select('*')
    .order('date', { ascending: true });

  if (error) return { data: [], error: 'Failed to load date capacities.' };
  return { data: data ?? [], error: null };
}

export async function setDateCapacity(date: string, maxCapacity: number) {
  try {
    await requireAdmin();
  } catch (err: any) {
    return { success: false, error: err.message || 'Unauthorized' };
  }

  const supabase = getServiceClient();
  const { error } = await supabase
    .from('date_capacities')
    .upsert({ date, max_capacity: maxCapacity }, { onConflict: 'date' });

  if (error) return { success: false, error: 'Failed to set capacity.' };
  revalidatePath('/admin/bookings');
  return { success: true };
}

export async function deleteDateCapacity(date: string) {
  try {
    await requireAdmin();
  } catch (err: any) {
    return { success: false, error: err.message || 'Unauthorized' };
  }

  const supabase = getServiceClient();
  const { error } = await supabase
    .from('date_capacities')
    .delete()
    .eq('date', date);

  if (error) return { success: false, error: 'Failed to delete capacity.' };
  revalidatePath('/admin/bookings');
  return { success: true };
}
