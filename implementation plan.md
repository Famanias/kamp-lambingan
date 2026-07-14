# Implementation Plan: AI Payment Verification Module (Updated)

Implement an automated payment verification module inside the CMS that validates uploaded GCash receipts against booking information. It consumes the structured JSON returned by the Receipt OCR Service and determines whether a payment can be automatically verified or requires manual review.

## User Review Required

> [!IMPORTANT]
> - **Database Schema Migration**: The migrations change `bookings.amount_due` from `TEXT` to `NUMERIC(10,2)`. This requires redefining the `create_booking_safe` RPC. You will need to run the `payment-verifications.sql` migration script manually in your Supabase SQL Editor.
> - **Background Execution**: Verification is completely non-blocking (runs in the background using Next.js `after` API). The frontend shows verification progress in real-time.
> - **Environment Settings**: Add `RECEIPT_OCR_SERVICE_URL` and `RECEIPT_OCR_SERVICE_TIMEOUT_MS` in `.env`.

---

## Proposed Changes

### Database

#### [NEW] [payment-verifications.sql](file:///d:/repos/kamp-lambingan/payment-verifications.sql)
- Creates the `payment_verifications` table with columns for:
  - `verification_status` (`'pending'`, `'processing'`, `'verified'`, `'failed'`, `'manual_review'`)
  - `ocr_service_version`, `parser_version`
  - `retry_count` (supports up to 3 attempts)
  - Raw JSON and parsed payment fields
- Migrates `bookings.amount_due` to `NUMERIC(10,2)`.
- Updates `create_booking_safe` RPC parameters to accept `p_amount_due numeric`.
- Configures RLS policies for `payment_verifications` for admin access.
- Seeds default confidence thresholds (`ocr_confidence_threshold = 0.75`, `parser_confidence_threshold = 0.80`).

### Utilities & Helpers

#### [MODIFY] [package-helper.ts](file:///d:/repos/kamp-lambingan/src/lib/package-helper.ts)
- Adds a robust `formatCurrency(amount)` helper to format numeric values back to `₱X,XXX` string format for guest-facing views, preserving UI display parity.

### Server Actions

#### [NEW] [payment-verification.ts](file:///d:/repos/kamp-lambingan/src/actions/payment-verification.ts)
Implements:
- `verifyPayment(bookingId: string, isReprocess?: boolean)`:
  - Initiates background processing, sets status to `'processing'`.
  - Downloads receipt file from Supabase storage.
  - Calls external OCR service with a timeout.
  - Retries failed network/timeout attempts up to 3 times with exponential backoff.
  - Validates amount, checks uniqueness, compares confidence scores.
  - Updates booking status and sends confirmation email if verified.
  - Sets appropriate `verification_status` and booking `status_reason`.
- `reprocessReceiptAction(bookingId: string)`:
  - Synchronous admin action to trigger re-verification.

#### [MODIFY] [bookings.ts](file:///d:/repos/kamp-lambingan/src/actions/bookings.ts)
- Changes `amount_due` inputs and calculations to numeric (`number`).
- Updates `createBooking()` to trigger `verifyPayment(bookingId)` in the background using Next.js `after()` API (non-blocking).

### API Routes & Middleware

#### [MODIFY] [route.ts](file:///d:/repos/kamp-lambingan/src/app/api/booking/complete/route.ts)
- Adapts `complete` route pricing calculation to handle numeric parameters.
- Triggers `verifyPayment(bookingId)` in the background using `after()`.

#### [MODIFY] [route.ts](file:///d:/repos/kamp-lambingan/src/app/api/booking/upload-receipt/route.ts)
- Triggers `verifyPayment(bookingId)` in the background using `after()`.

### Admin UI

#### [MODIFY] [page.tsx](file:///d:/repos/kamp-lambingan/src/app/admin/bookings/%5Bid%5D/page.tsx)
- Queries the associated verification log for the booking.
- Renders a status card showing the current state (`Verifying Payment...`, `✅ Payment Verified`, or `⚠ Manual Review Required`).
- Renders detailed results: amount match check, duplicate detection, sender name, receiver number, transaction date, and confidence comparison.
- Adds a **"Reprocess Receipt"** button allowing manual override / reprocessing.

---

## Verification Plan

### Automated Tests
- Run `npm run build` to verify Next.js builds successfully.
- Check database query parsing after migrating the column.

### Manual Verification
- Upload GCash receipts and confirm they update status to `'processing'` and subsequently `'verified'` or `'manual_review'`.
- Verify that reprocessing a receipt updates the status log.
