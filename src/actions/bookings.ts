'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

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

export async function createBooking(formData: FormData) {
  const supabase = await createClient();

  // Generate short human-friendly reference like KL-A3F7B2
  const reference = 'KL-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  // Extract fields from FormData
  const input: BookingInput = {
    guest_name: formData.get('name') as string,
    guest_email: formData.get('email') as string,
    guest_phone: formData.get('phone') as string,
    package_name: formData.get('packageName') as string,
    check_in: formData.get('checkIn') as string,
    check_out: formData.get('checkOut') as string,
    pax: parseInt(formData.get('pax') as string, 10) || 1,
    notes: (formData.get('notes') as string) || undefined,
    payment_type: ((formData.get('paymentType') as string) === 'downpayment' ? 'downpayment' : 'full'),
    amount_due: (formData.get('amountDue') as string) || undefined,
  };

  // Upload receipt first if present
  const receiptFile = formData.get('receipt') as File | null;
  if (receiptFile && receiptFile.size > 0) {
    // We'll upload after we have the booking ID
  }

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      guest_name: input.guest_name,
      guest_email: input.guest_email,
      guest_phone: input.guest_phone,
      package_name: input.package_name,
      check_in: input.check_in,
      check_out: input.check_out,
      pax: input.pax,
      notes: input.notes ?? null,
      status: 'pending',
      reference,
      payment_type: input.payment_type,
      amount_due: input.amount_due ?? null,
    })
    .select('id')
    .single();

  if (error) {
    return { success: false, error: error.message, id: null, reference: null };
  }

  // Upload receipt after insertion
  console.log('[createBooking] receiptFile:', receiptFile?.name, receiptFile?.size, receiptFile?.type);
  if (receiptFile && receiptFile.size > 0) {
    const receiptUrl = await uploadReceipt(data.id, receiptFile);
    console.log('[createBooking] receiptUrl result:', receiptUrl);
    if (receiptUrl) {
      const { error: updateErr } = await supabase.from('bookings').update({ receipt_url: receiptUrl }).eq('id', data.id);
      console.log('[createBooking] DB update error:', updateErr?.message ?? 'none');
      input.receipt_url = receiptUrl;
    }
  }

  // Send confirmation email if Resend is configured
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Kamp Lambingan <onboarding@resend.dev>',
        to: input.guest_email,
        subject: 'We received your booking request!',
        html: `
          <h2>Hi ${input.guest_name}! 🌿</h2>
          <p>We received your booking request for <strong>${input.package_name}</strong>.</p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:8px;margin:16px 0;">
            <p style="margin:0 0 4px 0;font-size:12px;color:#6b7280;">Your Booking Reference</p>
            <p style="margin:0;font-size:24px;font-weight:bold;letter-spacing:2px;color:#166534;">${reference}</p>
          </div>
          <p>Keep this reference handy — you can use it to check your booking status anytime at <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/my-bookings">${(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')}/my-bookings</a>.</p>
          <p><strong>Check-in:</strong> ${input.check_in}</p>
          <p><strong>Check-out:</strong> ${input.check_out}</p>
          <p><strong>Guests:</strong> ${input.pax}</p>
          <p><strong>Payment:</strong> ${input.payment_type === 'downpayment' ? `Downpayment (50%)` : 'Full Payment'}${input.amount_due ? ` — <strong>${input.amount_due}</strong>` : ''}</p>
          <p>Our team will <strong>text or call you</strong> on <strong>${input.guest_phone}</strong> within 24 hours to confirm your booking. Please keep your phone on!</p>
          <p>You can also check your booking status anytime at <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/my-bookings">${(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')}/my-bookings</a>.</p>
          <p>Questions? Message us on <a href="https://www.facebook.com/kamplambingan">Facebook</a>.</p>
          <p>— Kamp Lambingan Team</p>
        `,
      });

      // Also notify admin
      if (process.env.ADMIN_EMAIL) {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'Kamp Lambingan <onboarding@resend.dev>',
          to: process.env.ADMIN_EMAIL,
          subject: `New booking from ${input.guest_name}`,
          html: `
            <h2>New Booking Request</h2>
            <p><strong>Name:</strong> ${input.guest_name}</p>
            <p><strong>Email:</strong> ${input.guest_email}</p>
            <p><strong>Phone:</strong> ${input.guest_phone}</p>
            <p><strong>Package:</strong> ${input.package_name}</p>
            <p><strong>Check-in:</strong> ${input.check_in}</p>
            <p><strong>Check-out:</strong> ${input.check_out}</p>
            <p><strong>Guests:</strong> ${input.pax}</p>
            <p><strong>Payment:</strong> ${input.payment_type === 'downpayment' ? 'Downpayment (50%)' : 'Full Payment'}${input.amount_due ? ` — ${input.amount_due}` : ''}</p>
            ${input.notes ? `<p><strong>Notes:</strong> ${input.notes}</p>` : ''}
            <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/bookings/${data.id}">View booking →</a></p>
          `,
        });
      }
    } catch (emailErr) {
      console.error('Email send failed:', emailErr);
      // Don't fail the booking if email fails
    }
  }

  return { success: true, error: null, id: data.id, reference };
}

export async function getBookingByReference(reference: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bookings')
    .select('id, guest_name, package_name, check_in, check_out, pax, status, reference, created_at')
    .ilike('reference', reference.trim())
    .single();

  if (error) return { data: null, error: 'No booking found with that reference code.' };
  return { data, error: null };
}

export async function getBookingsByEmail(email: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bookings')
    .select('id, guest_name, package_name, check_in, check_out, pax, status, created_at')
    .eq('guest_email', email.toLowerCase().trim())
    .order('created_at', { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: data ?? [], error: null };
}

export async function getBookings(includeArchived = false) {
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
  if (error) return { data: [], error: error.message };
  return { data: data ?? [], error: null };
}

export async function archiveBooking(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('bookings')
    .update({ is_archived: true, archived_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/bookings');
  return { success: true };
}

export async function archiveBookings(ids: string[]) {
  if (!ids.length) return { success: true };
  const supabase = await createClient();
  const { error } = await supabase
    .from('bookings')
    .update({ is_archived: true, archived_at: new Date().toISOString() })
    .in('id', ids);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/bookings');
  return { success: true };
}

export async function archiveAllBookings() {
  const supabase = await createClient();
  const { error } = await supabase
    .from('bookings')
    .update({ is_archived: true, archived_at: new Date().toISOString() })
    .eq('is_archived', false);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/bookings');
  return { success: true };
}

export async function restoreBooking(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('bookings')
    .update({ is_archived: false, archived_at: null })
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/bookings');
  return { success: true };
}

export async function restoreBookings(ids: string[]) {
  if (!ids.length) return { success: true };
  const supabase = await createClient();
  const { error } = await supabase
    .from('bookings')
    .update({ is_archived: false, archived_at: null })
    .in('id', ids);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/bookings');
  return { success: true };
}

export async function restoreAllBookings() {
  const supabase = await createClient();
  const { error } = await supabase
    .from('bookings')
    .update({ is_archived: false, archived_at: null })
    .eq('is_archived', true);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/bookings');
  return { success: true };
}

export async function deleteAllArchived() {
  const supabase = await createClient();
  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('is_archived', true);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/bookings');
  return { success: true };
}

export async function deleteBookings(ids: string[]) {
  if (!ids.length) return { success: true };
  const supabase = await createClient();
  const { error } = await supabase
    .from('bookings')
    .delete()
    .in('id', ids);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/bookings');
  return { success: true };
}

export async function getArchiveRetentionDays(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'archive_retention_days')
    .single();
  return data ? parseInt(data.value, 10) || 7 : 7;
}

export async function setArchiveRetentionDays(days: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key: 'archive_retention_days', value: String(Math.max(1, days)) });
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/bookings');
  return { success: true };
}

export async function deleteBookingForever(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/bookings');
  return { success: true };
}

export async function getBooking(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function updateBookingStatus(id: string, status: 'confirmed' | 'cancelled') {
  const supabase = await createClient();
  const { error } = await supabase
    .from('bookings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  // Send guest notification email
  if (process.env.RESEND_API_KEY) {
    try {
      const { data: booking } = await supabase
        .from('bookings')
        .select('guest_name, guest_email, package_name, check_in, check_out')
        .eq('id', id)
        .single();

      if (booking) {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        if (status === 'confirmed') {
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'Kamp Lambingan <onboarding@resend.dev>',
            to: booking.guest_email,
            subject: '✅ Your booking is confirmed!',
            html: `
              <h2>Great news, ${booking.guest_name}! 🎉</h2>
              <p>Your booking for <strong>${booking.package_name}</strong> has been <strong>confirmed</strong>.</p>
              <p><strong>Check-in:</strong> ${booking.check_in}</p>
              <p><strong>Check-out:</strong> ${booking.check_out}</p>
              <p>We can't wait to welcome you to Kamp Lambingan! See you soon. 🌿</p>
              <p>Questions? Message us on <a href="https://www.facebook.com/kamplambingan">Facebook</a>.</p>
            `,
          });
        } else {
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'Kamp Lambingan <onboarding@resend.dev>',
            to: booking.guest_email,
            subject: 'Your booking has been cancelled',
            html: `
              <h2>Hi ${booking.guest_name},</h2>
              <p>Unfortunately, your booking for <strong>${booking.package_name}</strong> on ${booking.check_in} has been <strong>cancelled</strong>.</p>
              <p>If you have questions, please message us on <a href="https://www.facebook.com/kamplambingan">Facebook</a>.</p>
            `,
          });
        }
      }
    } catch (emailErr) {
      console.error('Email send failed:', emailErr);
    }
  }

  revalidatePath('/admin/bookings');
  revalidatePath(`/admin/bookings/${id}`);
  return { success: true };
}

export async function uploadReceipt(bookingId: string, file: File): Promise<string | null> {
  const supabase = await createClient();
  const ext = file.name.split('.').pop();
  const path = `receipts/${bookingId}.${ext}`;

  const { error } = await supabase.storage
    .from('receipts')
    .upload(path, file, { upsert: true });

  if (error) {
    console.error('[uploadReceipt] Storage upload failed:', error.message);
    return null;
  }

  const { data } = supabase.storage.from('receipts').getPublicUrl(path);
  console.log('[uploadReceipt] Uploaded successfully:', data.publicUrl);
  return data.publicUrl;
}
