'use server';

import { revalidatePath } from 'next/cache';
import { getServiceClient } from '@/lib/supabase/server';
import { sendBookingConfirmedEmail } from '@/lib/email/booking-notifications';

/**
 * Background Payment Verification Server Action.
 * Automatically processes GCash receipts via the Receipt OCR Service
 * and updates database status and notifications.
 */
export async function verifyPayment(bookingId: string, isReprocess = false) {
  console.log(`[verifyPayment] Starting payment verification for booking: ${bookingId} (isReprocess=${isReprocess})`);
  
  const supabase = getServiceClient();

  // 1. Retrieve the booking
  const { data: booking, error: bookingErr } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (bookingErr || !booking) {
    console.error(`[verifyPayment] Booking not found or error fetching booking:`, bookingErr);
    return { success: false, error: 'Booking not found.' };
  }

  // Skip verification if booking is already processed and this is not a manual reprocessing request
  if (!isReprocess && (booking.status === 'confirmed' || booking.status === 'cancelled')) {
    console.log(`[verifyPayment] Skipping verification. Booking status is already ${booking.status}.`);
    return { success: true, skipped: true };
  }

  // 2. Insert verification history row as 'processing'
  const { data: verificationRecord, error: insertErr } = await supabase
    .from('payment_verifications')
    .insert({
      booking_id: bookingId,
      provider: 'Unknown',
      verification_status: 'processing',
    })
    .select()
    .single();

  if (insertErr || !verificationRecord) {
    console.error(`[verifyPayment] Failed to insert processing verification record:`, insertErr);
    return { success: false, error: 'Database error creating verification record.' };
  }

  const verId = verificationRecord.id;

  const updateVerification = async (updates: any) => {
    await supabase
      .from('payment_verifications')
      .update(updates)
      .eq('id', verId);
  };

  const updateBookingReason = async (statusReason: string) => {
    await supabase
      .from('bookings')
      .update({
        status_reason: statusReason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);
    
    revalidatePath('/admin/bookings');
    revalidatePath(`/admin/bookings/${bookingId}`);
  };

  // 3. Download the receipt image
  if (!booking.receipt_url) {
    console.warn(`[verifyPayment] No receipt URL found on booking ${bookingId}`);
    await updateVerification({
      verification_status: 'manual_review',
      verification_reason: 'No receipt uploaded',
    });
    await updateBookingReason('Waiting for manual verification');
    return { success: false, error: 'No receipt uploaded.' };
  }

  let filename = '';
  try {
    const url = new URL(booking.receipt_url);
    filename = url.pathname.split('/').pop() || '';
  } catch {
    filename = booking.receipt_url.split('/').pop() || '';
  }

  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const isSupported = ['png', 'jpg', 'jpeg'].includes(ext);

  if (!isSupported) {
    console.warn(`[verifyPayment] Unsupported receipt format: .${ext}`);
    await updateVerification({
      verification_status: 'manual_review',
      verification_reason: `Unsupported receipt format: .${ext}`,
    });
    await updateBookingReason('Waiting for manual verification');
    return { success: false, error: 'Unsupported receipt format.' };
  }

  console.log(`[verifyPayment] Downloading receipt file: ${filename}`);
  const { data: fileBlob, error: downloadErr } = await supabase.storage
    .from('receipts')
    .download(`receipts/${filename}`);

  if (downloadErr || !fileBlob) {
    console.error(`[verifyPayment] Storage download failed:`, downloadErr);
    await updateVerification({
      verification_status: 'manual_review',
      verification_reason: 'Failed to download receipt image from storage',
    });
    await updateBookingReason('Waiting for manual verification');
    return { success: false, error: 'Failed to download receipt image.' };
  }

  // 4. Call Receipt OCR Service with timeout & retries
  const ocrUrl = process.env.RECEIPT_OCR_SERVICE_URL || 'http://localhost:8000/api/v1/ocr';
  const timeoutMs = parseInt(process.env.RECEIPT_OCR_SERVICE_TIMEOUT_MS || '10000', 10);
  
  let responseData: any = null;
  let retryCount = 0;
  const maxRetries = 2; // 3 total attempts
  let lastErrorMsg = '';

  while (retryCount <= maxRetries) {
    if (retryCount > 0) {
      console.log(`[verifyPayment] Retrying OCR connection in ${retryCount * 2} seconds...`);
      await new Promise(resolve => setTimeout(resolve, retryCount * 2000));
      await updateVerification({ retry_count: retryCount });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const formData = new FormData();
      formData.append('image', fileBlob, filename);

      const response = await fetch(ocrUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        responseData = await response.json();
        break; // break loop on success
      } else {
        let errorBody = `HTTP ${response.status}`;
        try {
          const errJson = await response.json();
          errorBody += `: ${errJson.message || errJson.detail || JSON.stringify(errJson)}`;
        } catch {}
        throw new Error(errorBody);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastErrorMsg = err.name === 'AbortError' ? 'OCR service request timed out' : (err.message || String(err));
      console.error(`[verifyPayment] Connection attempt ${retryCount + 1} failed:`, lastErrorMsg);
      retryCount++;
    }
  }

  if (!responseData) {
    console.error(`[verifyPayment] OCR service connection failed after ${maxRetries + 1} attempts.`);
    await updateVerification({
      verification_status: 'failed',
      verification_reason: `OCR service connection failed: ${lastErrorMsg}`,
    });
    await updateBookingReason('Waiting for manual verification');
    return { success: false, error: 'OCR service connection failed.' };
  }

  if (!responseData.success) {
    console.warn(`[verifyPayment] OCR service returned success=false:`, responseData.message);
    await updateVerification({
      verification_status: 'manual_review',
      verification_reason: responseData.message || 'OCR extraction failed',
      raw_ocr: responseData.ocr || null,
      parsed_payment: responseData.payment || null,
      ocr_service_version: 'v1',
      parser_version: responseData.parser?.version || null,
    });
    await updateBookingReason('Waiting for manual verification');
    return { success: false, error: 'OCR extraction failed.' };
  }

  // 5. Destructure OCR Results
  const {
    ocr: { confidence: ocrConfidence, text: rawText },
    payment: {
      provider,
      receipt_type: receiptType,
      amount,
      currency,
      sender_number: senderNumber,
      receiver_number: receiverNumber,
      sender_name: senderName,
      receiver_name: receiverName,
      reference_number: transactionReference,
      transaction_datetime: transactionDatetime,
    },
    parser: { version: parserVersion, confidence: parserConfidence },
    validation: { valid: isValid, errors: validationErrors },
  } = responseData;

  // 6. Get configured confidence thresholds
  const { data: ocrThresData } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'ocr_confidence_threshold')
    .maybeSingle();
  const ocrThreshold = ocrThresData ? parseFloat(ocrThresData.value) : 0.75;

  const { data: parserThresData } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'parser_confidence_threshold')
    .maybeSingle();
  const parserThreshold = parserThresData ? parseFloat(parserThresData.value) : 0.80;

  // 7. Perform verification checks
  let isDuplicate = false;
  if (transactionReference) {
    const { data: existingRef } = await supabase
      .from('payment_verifications')
      .select('id')
      .eq('transaction_reference', transactionReference)
      .eq('verification_status', 'verified')
      .maybeSingle();
    if (existingRef) {
      isDuplicate = true;
    }
  }

  const expectedAmount = Number(booking.amount_due);
  const amountMatches = expectedAmount === amount;

  let finalStatus: 'verified' | 'manual_review' = 'verified';
  let finalReason: string | null = null;

  if (isDuplicate) {
    finalStatus = 'manual_review';
    finalReason = 'Duplicate transaction reference';
  } else if (!amountMatches) {
    finalStatus = 'manual_review';
    finalReason = 'Amount mismatch';
  } else if (ocrConfidence !== null && ocrConfidence < ocrThreshold) {
    finalStatus = 'manual_review';
    finalReason = 'Low OCR confidence';
  } else if (parserConfidence !== null && parserConfidence < parserThreshold) {
    finalStatus = 'manual_review';
    finalReason = 'Low parser confidence';
  } else if (!isValid) {
    finalStatus = 'manual_review';
    finalReason = validationErrors?.join(', ') || 'Invalid receipt contents';
  }

  // To prevent unique constraint violation on transaction_reference for duplicate payments
  const dbTransactionReference = isDuplicate ? null : transactionReference;

  console.log(`[verifyPayment] Results for booking ${bookingId}: status=${finalStatus}, reason=${finalReason}`);

  // 8. Update verification record
  await updateVerification({
    provider: provider || 'Unknown',
    receipt_type: receiptType,
    amount,
    currency,
    sender_number: senderNumber,
    receiver_number: receiverNumber,
    sender_name: senderName,
    receiver_name: receiverName,
    transaction_datetime: transactionDatetime,
    transaction_reference: dbTransactionReference,
    ocr_confidence: ocrConfidence,
    parser_confidence: parserConfidence,
    verification_status: finalStatus,
    verification_reason: finalReason,
    raw_ocr: responseData.ocr,
    parsed_payment: responseData.payment,
    ocr_service_version: 'v1',
    parser_version: parserVersion,
    verified_at: finalStatus === 'verified' ? new Date().toISOString() : null,
  });

  // 9. Update booking & send emails
  if (finalStatus === 'verified') {
    const { error: bookingUpdateErr } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        status_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (bookingUpdateErr) {
      console.error(`[verifyPayment] Failed to update booking status to confirmed:`, bookingUpdateErr);
    } else {
      console.log(`[verifyPayment] Booking ${bookingId} successfully confirmed.`);
      try {
        await sendBookingConfirmedEmail({
          guestName: booking.guest_name,
          guestEmail: booking.guest_email,
          guestPhone: booking.guest_phone || '',
          packageName: booking.package_name,
          checkIn: booking.check_in,
          checkOut: booking.check_out,
          pax: booking.pax,
          paymentType: booking.payment_type === 'downpayment' ? 'downpayment' : 'full',
          reference: booking.reference,
          amountDue: booking.amount_due,
        });
        console.log(`[verifyPayment] Booking confirmation email sent to: ${booking.guest_email}`);
      } catch (emailErr) {
        console.error(`[verifyPayment] Failed to send confirmation email:`, emailErr);
      }
    }
  } else {
    // If verification failed/requires manual review, set booking's status_reason
    const bookingReason = finalReason || 'Waiting for manual verification';
    await updateBookingReason(bookingReason);
  }

  revalidatePath('/admin/bookings');
  revalidatePath(`/admin/bookings/${bookingId}`);

  return {
    success: true,
    verification_status: finalStatus,
    verification_reason: finalReason,
  };
}

/**
 * Admin action to manually reprocess payment verification for a booking.
 */
export async function reprocessReceiptAction(bookingId: string) {
  try {
    const result = await verifyPayment(bookingId, true);
    return { success: true, result };
  } catch (err: any) {
    console.error(`[reprocessReceiptAction] Error:`, err);
    return { success: false, error: err.message || String(err) };
  }
}
