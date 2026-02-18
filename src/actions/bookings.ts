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
}

export async function createBooking(formData: FormData) {
  const supabase = await createClient();

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
    })
    .select('id')
    .single();

  if (error) {
    return { success: false, error: error.message, id: null };
  }

  // Upload receipt after insertion
  if (receiptFile && receiptFile.size > 0) {
    const receiptUrl = await uploadReceipt(data.id, receiptFile);
    if (receiptUrl) {
      await supabase.from('bookings').update({ receipt_url: receiptUrl }).eq('id', data.id);
      input.receipt_url = receiptUrl;
    }
  }

  // Send confirmation email if Resend is configured
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'Kamp Lambingan <noreply@kamplambingan.com>',
        to: input.guest_email,
        subject: 'We received your booking request!',
        html: `
          <h2>Hi ${input.guest_name}! 🌿</h2>
          <p>We received your booking request for <strong>${input.package_name}</strong>.</p>
          <p><strong>Check-in:</strong> ${input.check_in}</p>
          <p><strong>Check-out:</strong> ${input.check_out}</p>
          <p><strong>Guests:</strong> ${input.pax}</p>
          <p>Our team will review your payment receipt and confirm your booking shortly. We'll send you another email once confirmed.</p>
          <p>Questions? Message us on <a href="https://www.facebook.com/kamplambingan">Facebook</a>.</p>
          <p>— Kamp Lambingan Team</p>
        `,
      });

      // Also notify admin
      if (process.env.ADMIN_EMAIL) {
        await resend.emails.send({
          from: 'Kamp Lambingan Bookings <noreply@kamplambingan.com>',
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

  return { success: true, error: null, id: data.id };
}

export async function getBookings() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: data ?? [], error: null };
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
            from: 'Kamp Lambingan <noreply@kamplambingan.com>',
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
            from: 'Kamp Lambingan <noreply@kamplambingan.com>',
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

  if (error) return null;

  const { data } = supabase.storage.from('receipts').getPublicUrl(path);
  return data.publicUrl;
}
