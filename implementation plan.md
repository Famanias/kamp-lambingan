# Enhanced AI Booking System with Resend Email Verification and AI-Assisted Manual Payment

Implement a secure, multi-step email verification flow using Resend, enhance the AI booking assistant flow, integrate GCash QR payment instructions (with structured JSON in chat), support receipt upload inside the chat widget, and add "Reject Payment" action in the Admin Dashboard.

## User Review Required

> [!IMPORTANT]
> - We will use the existing `booking_verifications` table in Supabase.
> - We will add three API routes: `POST /api/booking/start`, `POST /api/booking/verify`, and `POST /api/booking/complete`.
> - The AI Assistant will transition from direct booking creation (`createBooking` tool) to a multi-step verification-first flow using three new tools: `startBookingVerification`, `verifyBookingCode`, and `completeBooking`.
> - GCash QR image configuration will be retrieved dynamically from site content (`content.gcashQrImage`).

## Open Questions

> [!NOTE]
> None at this time. All requirements map directly to the provided `D:\repos\kamp-lambingan\implementation plan.md` and database schemas.

## Proposed Changes

### Database Layer
No database changes are needed since `booking_verifications` is already present and `bookings` table structure supports the required status and payment columns.

---

### Backend API & Actions

#### [NEW] [start/route.ts](file:///d:/repos/kamp-lambingan/src/app/api/booking/start/route.ts)
Create the endpoint `POST /api/booking/start` to:
- Validate input guest details and dates.
- Check date capacity.
- Clean up expired verification sessions in `booking_verifications`.
- Throttle verification requests to 1 request per 60 seconds per email.
- Rate limit attempts by IP (max 10 sessions per hour).
- Generate a 6-digit cryptographically secure code.
- Save the temporary session to `booking_verifications` (expires in 10 minutes).
- Send the verification email using Resend.

#### [NEW] [verify/route.ts](file:///d:/repos/kamp-lambingan/src/app/api/booking/verify/route.ts)
Create the endpoint `POST /api/booking/verify` to:
- Look up the session by ID.
- Check expiration and number of attempts (max 5 attempts).
- Validate the input code.
- If correct, mark `verified = true` in the DB.
- If incorrect, increment attempts; if attempts reach 5, invalidate the session.

#### [NEW] [complete/route.ts](file:///d:/repos/kamp-lambingan/src/app/api/booking/complete/route.ts)
Create the endpoint `POST /api/booking/complete` to:
- Retrieve the verified session.
- Re-check date capacity.
- Create the booking using the `create_booking_safe` RPC in Supabase.
- Delete the verification session.
- Send confirmation email to guest and admin.
- Return references and amounts due.

#### [NEW] [upload-receipt/route.ts](file:///d:/repos/kamp-lambingan/src/app/api/booking/upload-receipt/route.ts)
Create the endpoint `POST /api/booking/upload-receipt` to:
- Receive a multipart form upload containing `bookingId` and `receipt` image file.
- Perform size/type validation on the server.
- Upload to Supabase Storage and update the booking record.

#### [MODIFY] [bookings.ts](file:///d:/repos/kamp-lambingan/src/actions/bookings.ts)
- Modify `updateBookingStatus` to support an optional `reason` parameter (e.g. `'payment_rejected'`).
- If payment is rejected, update status to `'cancelled'` and send a tailored email explaining that the uploaded proof of payment was rejected.

---

### AI Assistant & Chat API

#### [MODIFY] [route.ts](file:///d:/repos/kamp-lambingan/src/app/api/chat/route.ts)
- Remove `createBooking` tool.
- Add `startBookingVerification` tool (which calls the `/api/booking/start` logic or DB writes).
- Add `verifyBookingCode` tool (which calls the `/api/booking/verify` logic).
- Add `completeBooking` tool (which calls the `/api/booking/complete` logic).

#### [MODIFY] [knowledge-base.ts](file:///d:/repos/kamp-lambingan/src/lib/knowledge-base.ts)
- Update the system instructions for booking via chat.
- Guide the AI to collect details -> confirm -> start email verification -> request verification code -> verify -> confirm again -> complete booking -> return structured JSON payment instructions containing the QR code, booking reference, and amount due.

---

### Frontend Components

#### [MODIFY] [page.tsx](file:///d:/repos/kamp-lambingan/src/app/page.tsx)
- Pass `content` prop to `<ChatWidget />`.

#### [MODIFY] [ChatWidget.tsx](file:///d:/repos/kamp-lambingan/src/components/site/ChatWidget.tsx)
- Accept `content` prop.
- Add support for detecting and parsing structured JSON payment instructions from the AI message text.
- Render a premium Payment Card if JSON instructions are received.
- Add an interactive file upload input within the payment card allowing the guest to upload their receipt directly inside the chat.
- Implement file type/size validation and trigger the `/api/booking/upload-receipt` API.

#### [MODIFY] [BookingActions.tsx](file:///d:/repos/kamp-lambingan/src/components/admin/BookingActions.tsx)
- Add a "Reject Payment" button.
- Trigger `updateBookingStatus` with status `'cancelled'` and reason `'payment_rejected'` upon user confirmation.

## Verification Plan

### Automated Tests
- Build and compile check: `npm run build`

### Manual Verification
- Start a chat session, request a booking, and verify the verification email is sent.
- Enter incorrect codes to verify rate limits and max attempts.
- Enter the correct code to verify successful verification.
- Confirm booking creation and check that booking is added as `pending` in the DB.
- Verify that the chat displays the GCash QR code, amount due, and booking reference.
- Upload a payment receipt through the chat widget and check if it's successfully uploaded to Supabase storage.
- Log in to the Admin Dashboard, locate the booking, view the uploaded receipt, and test "Confirm Booking" and "Reject Payment" buttons, confirming they send the appropriate emails and update statuses.
