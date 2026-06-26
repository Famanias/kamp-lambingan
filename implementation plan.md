# Hybrid AI Booking System (Form-Driven Architecture)

## Overview

Redesign the AI booking experience by moving structured booking data collection entirely to the frontend while retaining the AI assistant as a conversational guide and knowledge assistant.

Instead of collecting reservation details through multiple AI messages, the frontend will render interactive booking components inside the chat. The AI becomes responsible only for conversation, recommendations, explanations, and guiding the user through each step.

This dramatically reduces token usage, improves reliability, and simplifies backend state management.

---

# User Review Required

> [!IMPORTANT]
>
> * Booking information will no longer be collected conversationally by the AI.
> * The AI will trigger frontend booking components instead of asking for booking details.
> * Booking availability, validation, email verification, payment instructions, and receipt upload will all be handled through backend APIs and frontend UI components.
> * The AI will only receive the completed booking information after the booking form has been submitted.
> * The `chat_sessions` table will remain, but it will store only conversational context rather than booking state.

---

# Goals

## Primary Goals

* Reduce booking conversations from ~43,000 input tokens to under 3,000.
* Eliminate repetitive AI questions for structured booking data.
* Improve booking reliability.
* Reduce hallucinations.
* Simplify prompts.
* Improve overall user experience.

---

# Proposed User Flow

## 1. User starts conversation

Example

User:

> I'd like to make a reservation.

AI responds naturally:

> I'd be happy to help. Please complete the booking form below.

The frontend immediately renders a Booking Form Card.

---

## 2. Booking Form

The AI does not ask individual questions.

Instead the form collects:

* Guest name
* Email
* Phone number
* Package
* Check-in
* Check-out
* Number of guests
* Notes (optional)

The form performs client-side validation before submission.

---

## 3. Availability Check

When the user submits the form:

Frontend

↓

POST `/api/booking/check`

Backend

↓

Validate dates

↓

Check guest capacity

↓

Return result

Possible responses

Available

↓

Continue

Unavailable

↓

Return alternative dates

The AI is not involved.

---

## 4. Email Verification

If availability succeeds

Frontend

↓

POST `/api/booking/start`

Backend

↓

Generate verification code

↓

Store verification session

↓

Send email through Resend

Frontend displays

Verification Code Card

User enters the code directly.

No AI interaction required.

---

## 5. Verification

User submits verification code.

Frontend

↓

POST `/api/booking/verify`

Backend validates

If successful

↓

Booking Summary Card appears.

---

## 6. Booking Confirmation

Booking Summary

* Guest
* Package
* Dates
* Guests
* Total Amount
* Downpayment / Full Payment

User clicks

Confirm Booking

Frontend

↓

POST `/api/booking/complete`

Backend creates booking.

AI receives only:

Booking completed successfully.

Booking Reference:

KL-XXXX

The AI sends a friendly confirmation message.

---

## 7. Payment

Backend returns

* Booking Reference
* Amount Due
* Payment Type
* QR Image

Frontend renders

Payment Instruction Card

including

* QR Code
* Upload Receipt button

No AI formatting required.

---

## 8. Receipt Upload

User uploads receipt.

Frontend

↓

POST `/api/booking/upload-receipt`

Backend uploads to Supabase Storage.

Booking updated.

AI may simply respond:

> Thank you! Your receipt has been received and is awaiting administrator review.

---

# AI Responsibilities

The AI should only:

* Answer resort questions.
* Recommend packages.
* Explain policies.
* Help users navigate the booking process.
* Summarize completed bookings.
* Respond to unusual or free-form questions.

The AI should never:

* Ask for booking form fields.
* Track booking progress.
* Validate dates.
* Verify email codes.
* Check availability.
* Generate payment instructions.
* Handle receipt uploads.

---

# Backend Responsibilities

The backend becomes responsible for:

* Availability checking.
* Capacity validation.
* Booking validation.
* Email verification.
* Booking creation.
* Payment handling.
* Receipt uploads.
* Booking status updates.

All business rules are centralized.

---

# Frontend Components

## New Components

### BookingFormCard

Collects all booking information.

---

### VerificationCard

Allows entering the email verification code.

---

### BookingSummaryCard

Displays the completed reservation before confirmation.

---

### PaymentInstructionCard

Displays

* QR code
* Amount Due
* Booking Reference
* Upload Receipt button

---

### ReceiptUploadCard

Uploads proof of payment.

---

# Chat API

The chat endpoint no longer manages booking state.

Instead it only controls conversation.

The AI can request UI components.

Example tool outputs

```json
{
  "action": "showBookingForm"
}
```

```json
{
  "action": "showVerificationCard"
}
```

```json
{
  "action": "showPaymentCard"
}
```

The frontend renders the corresponding component.

---

# Database

Existing tables remain.

The `chat_sessions` table becomes much simpler.

Suggested contents

* session_id
* conversation_summary
* last_intent
* updated_at

Booking information remains in booking-related tables.

---

# Expected Token Usage

Current architecture

* AI collects booking fields
* AI tracks booking state
* AI generates payment JSON

Estimated

15,000–43,000 input tokens

Optimized architecture

* Booking form handles structured input
* Backend handles workflow
* AI only explains and guides

Estimated

1,500–3,000 input tokens

---

# Benefits

## User Experience

* Faster booking
* Fewer back-and-forth messages
* Better validation
* Immediate feedback

## Reliability

* No hallucinated booking details
* No missing required fields
* Deterministic workflow
* Stronger validation

## Performance

* Dramatically lower token usage
* Faster AI responses
* Reduced API costs

## Maintainability

* Business logic isolated in backend
* AI prompt greatly simplified
* Easier future feature development

---

# Verification Plan

## Automated

* Build the application (`npm run build`).
* Verify all booking APIs return expected results.
* Verify frontend components render correctly from AI actions.

## Manual

* Start a booking through chat.
* Confirm the booking form appears.
* Submit valid and invalid data.
* Verify availability checks.
* Complete email verification.
* Confirm booking creation.
* Upload a payment receipt.
* Verify the admin dashboard reflects the new booking and uploaded receipt.
* Measure total AI token usage for a complete booking flow and compare it with the previous implementation.
