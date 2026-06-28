# Implementation Plan: Automated Booking Status Email Notifications

Implement a centralized email notification system that automatically informs guests whenever the status of their reservation changes. Instead of requiring guests to repeatedly visit the website and check their booking using the reference number, the system will proactively notify them through email at each important stage of the booking lifecycle.

The notification system will use **Resend** and integrate directly with the existing booking workflow and Admin Dashboard.

---

# User Review Required

> [!IMPORTANT]
>
> * **Chat Booking:** Email verification via Resend has already been implemented for the AI chatbot. Every booking created through the chat originates from a verified email address, so no additional verification is required during the chat booking flow.
>
> * **Manual Booking (`/book`):** The standalone booking page will now adopt the same verification model. Users must verify their email address before they can proceed to the payment step and upload their payment receipt.
>
> * This creates a consistent rule across the application: **every reservation is associated with a verified email address.**
>
> * This implementation introduces a centralized **Booking Notification Service** responsible for sending all booking-related emails.
>
> * Notification sending should occur **after** the booking transaction succeeds.
>
> * Email delivery failures must never prevent booking updates from succeeding. Failures should only be logged.

---

# Manual Booking Flow Update

## Previous Flow

```text
1. Your Details

↓

2. Upload Receipt

↓

Booking Created
```

## New Flow

```text
1. Your Details

↓

Continue to Payment

↓

Email Verification Notice

↓

Verification Code Input

↓

Email Verified

↓

2. Upload Receipt

↓

Booking Created
```

The payment QR code and receipt upload interface should remain inaccessible until the email verification succeeds.

---

# Proposed Changes

## 1. Manual Booking Email Verification

### [MODIFY] `BookForm.tsx`

Extend the standalone booking wizard by introducing an email verification step between the booking details and payment.

Current steps:

```text
Step 1
Your Details

↓

Step 2
Upload Receipt
```

New steps:

```text
Step 1
Your Details

↓

Email Verification

↓

Step 2
Upload Receipt
```

---

### Email Verification Notice

After the user completes **Your Details** and clicks:

```text
Continue to Payment
```

display an intermediate verification screen instead of immediately showing the payment section.

Example message:

> Before continuing to payment, please verify your email address.
>
> This helps us ensure your booking confirmation and future booking updates are delivered successfully.

Buttons:

* Send Verification Code
* Back

---

### Verification Code Widget

After sending the email:

Display:

* 6-digit verification code input
* Verify button
* Resend Code button
* Countdown timer before resend
* Loading state
* Error handling
* Success state

Upon successful verification:

* Mark the booking session as verified.
* Automatically continue to the payment step.
* Display the QR code and receipt upload form.

The user should not need to press "Continue" again.

---

## 2. Backend APIs

Reuse the existing Resend verification infrastructure whenever possible.

If compatible, the standalone booking page should call the same verification endpoints used by the chatbot rather than maintaining duplicate implementations.

The verification endpoints should support:

* Sending verification codes.
* Validating verification codes.
* Expiration handling.
* Maximum attempts.
* Rate limiting.

---

## 3. Booking Notification Service

### [NEW] `src/lib/email/booking-notifications.ts`

Create a centralized notification service responsible for all booking-related emails.

Suggested API:

```ts
sendBookingReceived()

sendPaymentReceived()

sendBookingConfirmed()

sendPaymentRejected()

sendBookingCancelled()
```

All booking routes and server actions should use this service.

---

## 4. Booking Created Notification

### [MODIFY] `complete/route.ts`

After a booking is successfully created:

Automatically send:

### Booking Received

Contents:

* Guest name
* Booking reference
* Package
* Check-in
* Check-out
* Number of guests
* Amount due
* Payment option
* Reminder that the booking is pending review

Subject:

```
We've received your booking request!
```

---

## 5. Receipt Upload Notification

### [MODIFY] `upload-receipt/route.ts`

After a receipt uploads successfully:

Automatically send:

### Payment Received

Contents:

* Booking reference
* Confirmation that payment proof has been received.
* Notice that staff will review it shortly.

Subject:

```
We've received your payment receipt
```

---

## 6. Booking Confirmation Notification

### [MODIFY] `bookings.ts`

Whenever an administrator confirms a booking:

Automatically send:

### Booking Confirmed

Include:

* Booking reference
* Package
* Check-in
* Check-out
* Guest count
* Arrival reminders
* Resort contact information

Subject:

```
Your booking has been confirmed!
```

---

## 7. Payment Rejected Notification

### [MODIFY] `bookings.ts`

Whenever an administrator rejects a payment:

Automatically send:

### Payment Rejected

Include:

* Booking reference
* Rejection reason (if provided)
* Instructions for uploading a new payment receipt

Subject:

```
Your payment requires attention
```

---

## 8. Booking Cancelled Notification

### [MODIFY] `bookings.ts`

Whenever a booking is cancelled:

Automatically send:

### Booking Cancelled

Include:

* Booking reference
* Cancellation reason (if provided)
* Contact information for assistance

Subject:

```
Your booking has been cancelled
```

---

## 9. Email Logging

Log every notification attempt.

Successful example:

```
Booking: KL-240001
Email: Booking Confirmed
Recipient: guest@example.com
Status: Delivered
```

Failure example:

```
Booking: KL-240001
Booking updated successfully
Email delivery failed
Reason: SMTP timeout
```

Booking operations must never fail because an email notification could not be delivered.

---

# Verification Plan

## Automated

Run:

```bash
npm run build
```

Verify successful compilation.

---

## Manual

### Chat Booking

* Verify that chat bookings continue using the existing email verification flow.
* Confirm no additional verification occurs during booking.

### Manual Booking

* Complete Step 1.
* Click **Continue to Payment**.
* Verify the email verification notice appears.
* Receive the verification email.
* Enter incorrect and expired codes to verify validation.
* Enter the correct code and confirm the payment section becomes available.
* Upload a receipt and complete the booking.

### Booking Notifications

Verify that emails are automatically sent for:

* Booking Received
* Payment Received
* Booking Confirmed
* Payment Rejected
* Booking Cancelled

### Failure Handling

Simulate an email delivery failure.

Verify:

* Booking operations still succeed.
* The email failure is logged.
* Administrators receive no blocking errors.

---

# Expected Benefits

* Every booking now originates from a verified email address, regardless of whether it was created through the AI chatbot or the standalone booking page.
* Guests receive automatic updates throughout the reservation lifecycle without manually checking their booking status.
* Administrators no longer need to send manual status emails.
* The centralized notification service provides a reusable foundation for future features such as booking reminders, post-stay surveys, and promotional campaigns.
