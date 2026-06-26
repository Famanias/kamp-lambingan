import { NextResponse } from 'next/server';
import { uploadReceipt } from '@/actions/bookings';
import { getServiceClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const bookingId = formData.get('bookingId') as string;
    const file = formData.get('receipt') as File | null;

    if (!bookingId || !file) {
      return NextResponse.json(
        { error: 'Missing bookingId or receipt file.' },
        { status: 400 }
      );
    }

    // Call existing uploadReceipt action which handles size and MIME type checks
    const receiptUrl = await uploadReceipt(bookingId, file);

    if (!receiptUrl) {
      return NextResponse.json(
        { error: 'Failed to upload receipt. Please ensure it is a valid image (PNG, JPG, WebP) and under 5MB.' },
        { status: 400 }
      );
    }

    // Update the booking's receipt_url in the database
    const supabase = getServiceClient();
    const { error: updateErr } = await supabase
      .from('bookings')
      .update({ receipt_url: receiptUrl })
      .eq('id', bookingId);

    if (updateErr) {
      console.error('[API booking/upload-receipt] DB update error:', updateErr.message);
      return NextResponse.json(
        { error: 'Failed to link receipt to booking.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      receiptUrl,
    });
  } catch (err: any) {
    console.error('[API booking/upload-receipt] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
